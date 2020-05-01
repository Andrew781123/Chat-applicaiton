const socketio = require('socket.io');
const url = require('url');
const ChatMessage = require('../model/chat-message');
const User = require('../model/user');
const chatRoom = require('../model/room');
const { addUser, getUser, getUserByUsername, removeUser } = require('../utils/users');

function configSocketio(server) {
    const io = socketio(server);

    io.on('connection', socket => {
        console.log('new connection');
        
         //response url from client
        socket.on('userids', async url => {
            const { userId, currentUserId } = getIdsFromUrl(url);

            
            const currentUser = await User.findById(currentUserId).select('username').exec();
            const user = await User.findById(userId).select('username').exec();

            

            //check if room exists
            let room = await chatRoom.findOne({
                users: {$all: [currentUserId, userId]}
            });
            if(room == null) {
                room = await createNewRoom(roomName = '', currentUserId, userId);
            }
            
            const newUser = addUser(socket.id, currentUserId, currentUser.username, room); 

            //join room
            socket.join(newUser.room._id);

            //check if chatmate is online
            const chatmate = getUserByUsername(user.username);
            if(chatmate != null) {
                socket.emit('show-online');
            } else {
                socket.emit('show-offline');
            }

            //show online status to all rooms of the new user
            const rooms = await chatRoom.find({ users: {$in: [newUser.id]}}).select('_id');
            rooms.forEach(room => {
                socket.broadcast.to(room._id).emit('show-online');
            });
            
            //provide chat info to client
            socket.emit('chatInfo', {
                sender: newUser.username,
                receiver: user.username,
                receiverId: userId,
            });

            //get chat history from database
            const chatHistories = await ChatMessage.find({room: newUser.room._id}).populate('userSend').exec();
            //loop through only if there is chat history
            if(chatHistories.length > 0 && chatHistories != null) {
                chatHistories.forEach(chatHistory => {
                    if(chatHistory.userSend._id == newUser.id) {
                        chatHistory.userSend.username = 'me'
                    } 
                });
                socket.emit('chatHistory', chatHistories);
            } 
            
        });

        //listen for message sent
        socket.on('sentMessage', async (sentMessage) => {
            const currentUser = getUser(socket.id);
            const newMessage = await saveMessage(currentUser, sentMessage);
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

        socket.on('remove-typing', room => {
            const currentUser = getUser(socket.id);
            socket.broadcast.to(currentUser.room._id).emit('remove-typing');
        });

        //emit when client disconnects
        socket.on('disconnect', async () => {
            const currentUser = getUser(socket.id);
            removeUser(socket.id);
            const rooms = await chatRoom.find({ users: {$in: [currentUser.id]}}).select('_id');
            rooms.forEach(room => {
                socket.broadcast.to(room._id).emit('show-offline');
            });
        });
    });
}


function getIdsFromUrl(url) {
    const ids = {};
    
    const firstSlash = url.indexOf('/', 8);
    const secondSlash = url.indexOf('/', firstSlash+1);
    
    ids.userId = url.slice(firstSlash+1, secondSlash);
    ids.currentUserId = url.slice(secondSlash+1)
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
            console.log('err here');
            return console.error(err);
        }
        
    } else {
        return console.log('it is group chat');
    }
}

async function saveMessage(currentUser, message) {
    const message2 = await ChatMessage.create({
        userSend: currentUser.id,
        userReceive: message.receiverId,
        room: currentUser.room._id,
        message: message.message
    });
    const savedMessage = await ChatMessage.populate(message2, {path: 'userSend'});
    return savedMessage;
}


module.exports = configSocketio;
