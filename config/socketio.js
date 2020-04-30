const socketio = require('socket.io');
const url = require('url');
const ChatMessage = require('../model/chat-message');
const User = require('../model/user');
const chatRoom = require('../model/room');

let userId;
let currentUserId;

function configSocketio(server) {
    const io = socketio(server);

    io.on('connection', socket => {
        console.log('new connection');
        //request id from url
        
         //response url from client
        socket.on('userids', async url => {
            const ids = getIdsFromUrl(url);
            userId = ids.userId;
            currentUserId = ids.currentUserId;

            const currentUser = await User.findById(currentUserId);

            //check if room exists
            const room = await chatRoom.findOne({users: {$all: [currentUserId, userId]}});
            if(room == null) {
                room = createNewRoom(roomName = '', currentUserId, userId);
            }

            //join room
            socket.join(room._id);
            
            //provide chat info to client
            socket.emit('chatInfo', {
                sender: currentUser,
                room: room
            });

            //get chat history from database
            const chatHistories = await ChatMessage.find({room: room._id}).populate('userSend').exec();
            //loop through only if there is chat history
            if(chatHistories.length > 0) {
                chatHistories.forEach(chatHistory => {
                    if(chatHistory.userSend.id == currentUserId) {
                        chatHistory.userSend.username = 'me'
                    } 
                });
                socket.emit('chatHistory', chatHistories);
            } 
            
        });

        //listen for message sent
        socket.on('sentMessage', async (sentMessage) => {
            const newMessage = await saveMessage(sentMessage);
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
            socket.broadcast.to(sentMessage.room._id).emit('sentMessage', newMessage);
        });

        //emit when client disconnects
        socket.on('disconnect', () => {
            io.emit('message', 'A user has left the chat');
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
    console.log('creating room');
    //determine group room 
    if(typeof userId == 'string') {
        try {
            const newRoom = await chatRoom.create({
                name: roomName,
                isGroup: false,
                users: [currentUserId, userId]
            });
            return newRoom;
            
        } catch(err) {
            return console.error(err);
        }
        
    } else {
        return console.log('it is group chat');
    }
}

async function saveMessage(message) {
    const message2 = await ChatMessage.create({
        userSend: message.senderId,
        room: message.room._id,
        message: message.message
    });
    const savedMessage = await ChatMessage.populate(message2, {path: 'userSend'});
    return savedMessage;
}


module.exports = configSocketio;
