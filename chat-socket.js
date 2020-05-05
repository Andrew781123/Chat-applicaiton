const ChatMessage = require('./model/chat-message');
const User = require('./model/user');
const chatRoom = require('./model/room');
const { addUser, getUser, getUserById, getOtherUserIdsById, getUserByUsername, removeUser } = require('./utils/users');

let chat;
function configChatSocket(io) {
    chat = io.of('/users/:id/:id');
    chat.on('connection', socket => {
        console.log('new connection');
        
         //response url from client
        socket.on('userids', async url => {
            const { userId, currentUserId } = getIdsFromUrl(url);
    
            let currentUser;
            let user;
            let room;
            try {
                currentUser = await User.findById(currentUserId).select('username').exec();
                user = await User.findById(userId).select('username lastSeen').exec();
                //check if room exists
                room = await chatRoom.findOne({
                    users: {$all: [currentUserId, userId]}
                });
                
                if(room == null) {
                    room = await createNewRoom(roomName = '', currentUserId, userId);
                }
                
            } catch(err) {
                console.log(err);
            }
    
            const newUser = addUser(socket.id, currentUserId, currentUser.username, room); 
    
            //join room
            socket.join(newUser.room._id);
    
            //check if chatmate is online
            const chatmate = getUserByUsername(user.username);
            if(chatmate != null) {
                socket.emit('show-online');
            } else {
                socket.emit('show-offline', user.formatedLastSeen);
            }
    
            //show online status to all ONLINE rooms of the new user
            const onlineUserIds = getOtherUserIdsById(newUser.id);
            if(onlineUserIds.length > 0) {
                try {
                    const rooms = await chatRoom.find(
                        {$and: [
                            {users: {$elemMatch: {$eq: newUser.id}}}, 
                            {users: {$in: onlineUserIds}}
                        ]}
                    ).select('_id').exec();
                    rooms.forEach(room => {
                        socket.broadcast.to(room._id).emit('show-online');
                    });
                } catch(err) {
                    console.error(err);
                }
            }
            
           
            //provide chat info to client
            socket.emit('chatInfo', {
                sender: newUser.username,
                receiver: user.username,
                receiverId: userId,
            });
    
            //get chat history from database
            try {
                const chatHistories = await ChatMessage.find({room: newUser.room._id}).populate('userSend').exec();
    
                let unreadMessages = chatHistories.find(chatHistory => {
                    return chatHistory.isRead === false && chatHistory.userSend.username != newUser.username;
                });
    
                if(typeof unreadMessages != 'undefined') {
                    unreadMessages.isRead = true;
                    const readMessage = await unreadMessages.save();
                }
                //loop through only if there is chat history
                if(chatHistories.length > 0 && chatHistories != null) {
                    chatHistories.forEach(chatHistory => {
                        if(chatHistory.userSend._id == newUser.id) {
                            chatHistory.userSend.username = 'me'
                        } 
                    });
                    
                    socket.emit('chatHistory', chatHistories);
                } 
            } catch(err) {
                console.error(err);
            }
        });
    
        //listen for message sent
        socket.on('sentMessage', async (sentMessage) => {
            const currentUser = getUser(socket.id);
            const newMessage = await saveMessage(currentUser, sentMessage, socket);
            //get virtual
            const formatedtime = newMessage.formatedtime
            //set username.userSend to 'me' if he is the sender
            const myMessage = {
                userSend: {
                    username: 'me',
                },
                formatedtime: formatedtime,
                message: newMessage.message
            };
            
            //emit to sender
            socket.emit('myMessage', myMessage);
            //emit to clients in room
            socket.broadcast.to(currentUser.room._id).emit('sentMessage', newMessage);
        });
    
        //typing
        socket.on('typing', senderName => {
            const currentUser = getUser(socket.id);
    
            socket.broadcast.to(currentUser.room._id).emit('show-typing', senderName);
        });
    
        socket.on('remove-typing', () => {
            const currentUser = getUser(socket.id);
            socket.broadcast.to(currentUser.room._id).emit('remove-typing');
        });
    
        //emit when client disconnects
        socket.on('disconnect', async () => {
            const currentUser = getUser(socket.id);
            removeUser(socket.id);
            try {
                const rooms = await chatRoom.find({ users: {$in: [currentUser.id]}}).
                select('_id');
                const lastSeen = new Date();
                const userToUpdate = await User.findOneAndUpdate({_id: currentUser.id}, {lastSeen: lastSeen}, {new: true});
                rooms.forEach(room => {
                    socket.broadcast.to(room._id).emit('show-offline', userToUpdate.formatedLastSeen);
                });
            } catch(err) {
                console.error(err);
            }
        });
    });

    return {
        chat
    }
}   
    
function getIdsFromUrl(url) {
    const ids = {};

    const firstSlash = url.indexOf('/', 8);
    const secondSlash = url.indexOf('/', firstSlash+1);

    ids.userId = url.slice(firstSlash+1, secondSlash);
    ids.currentUserId = url.slice(secondSlash+1);
    return ids;
}

async function createNewRoom(roomName = '', currentUserId, userId) {
    //determine group room (if userId is an array, it is group room)
    if(typeof userId == 'string') {
        const newRoom = new chatRoom({
            name: roomName,
            isGroup: false,
            users: [currentUserId, userId]
        });
        try {
            const savedRoom = await newRoom.save();
            return savedRoom;
            
        } catch(err) {
            return console.error(err);
        }
        
    } else {
        return console.log('it is group chat');
    }
}

async function saveMessage(currentUser, message, socket) {
    const isInRoom = await checkInChatRoom(currentUser, message, socket);
    const newMessage = new ChatMessage({
        userSend: currentUser.id,
        userReceive: message.receiverId,
        room: currentUser.room._id,
        message: message.message
    });
    if(isInRoom) {
        newMessage.isRead = true
    } else {
        newMessage.isRead = false
    }
    const savedMessage = await newMessage.save();
    const populatedSavedMessage = await ChatMessage.populate(savedMessage, {path: 'userSend'});
    return populatedSavedMessage;
}

async function checkInChatRoom(currentUser, message, socket) {
    //check if receiver is online
    const receiver = getUserById(message.receiverId);
    if(typeof receiver == 'undefined') return false;

    //check if receiver is in room
    const room = currentUser.room;
    //cannot compare objects directly
    if(String(room._id) === String(receiver.room._id)) return true;
    else {
        // displayNotification();
        return false;
    }
}


module.exports = {
    configChatSocket,
    chat
}