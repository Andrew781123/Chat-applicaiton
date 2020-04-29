const socketio = require('socket.io');
const url = require('url');
const ChatMessage = require('../model/chat-message');
const User = require('../model/user');

let userId;
let currentUserId;

let currentUserSocketId;

let users = [];


function configSocketio(server) {
    const io = socketio(server);
    const formatMessage = require('../utills/format-messages.js');

    io.on('connection', socket => {
        console.log('new connection');
        currentUserSocketId = socket.id
        //request id from url
        socket.emit('requestid', 'You joined the chatroom');

        //Welcome message for other users
        socket.broadcast.emit('message', 'A user has joined the chatroom');

        //response url from client
        socket.on('userids', async url => {
            const ids = getIdsFromUrl(url);
            userId = ids.userId;
            currentUserId = ids.currentUserId;

            const currentUser = await User.findById(currentUserId);
            const user = await User.findById(userId);

            socket.emit('user', {
                sender: currentUser,
                receiver: user
            });
            users[currentUser.username] = currentUserSocketId;

            //get chat history from database
            const chatHistories = await ChatMessage.find(
                {$or: [
                        {$and: [
                            {userSend: userId}, {userReceive: currentUserId}
                        ]}, 
                        {$and: [
                            {userSend: currentUserId}, {userReceive: userId}
                        ]}
                    ]
                }
            )
            .populate({path: 'userSend userReceive'})
            .exec();
            
            //format messages
            chatHistories.forEach(chatHistory => {
                if(chatHistory.userSend.id == currentUserId) {
                    chatHistory.userSend.username = 'me'
                } 
            });
            socket.emit('chatHistory', chatHistories);
        });

        //listen for message sent
        socket.on('sentMessage', async (sentMessage) => {
            console.log(`newMessage: ${sentMessage}`);
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
            const receiver = await User.findById(userId);
            const receiverId = users[receiver.username];
            
            //emit to sender
            socket.emit('myMessage', myMessage);
            
            socket.to(receiverId).emit('sentMessage', newMessage);
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

async function saveMessage(message) {
    const message2 = await ChatMessage.create({
        userSend: message.senderId,
        userReceive: message.receiverId,
        message: message.message
    });
    console.log(`before: ${message2}`);
    const newMessage = await ChatMessage.populate(message2, {path: 'userSend userReceive'});
    console.log(`populated: ${newMessage}`);
    return newMessage;
}


module.exports = configSocketio;
