const socket = io();
const { userid } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const chatForm = document.querySelector('#chat-form');
const chatBox = document.querySelector('.chat-messages');
const username = document.querySelector('#username');

let senderId;
let senderName;
let room;


socket.emit('userids', location.pathname);


socket.on('chatInfo', user => {
    senderId = user.sender._id;
    senderName = user.sender.username;
    receiverName = user.receiver,
    room = user.room;
    // console.log(`sender: ${typeof senderId}, receiver: ${receiverId}`);
    document.querySelector('#user').textContent = user.receiverName;
});

//get formatedMessages from database
socket.on('chatHistory', chatHistories => {
    //output array of messages
    chatHistories.forEach(chatHistory => {
        outputMessage(chatHistory);
    });
});

socket.on('sentMessage', sentMessage => {
    outputMessage(sentMessage);
});

socket.on('myMessage', myMessage => {
    outputMessage(myMessage);
});

//Sent message
chatForm.addEventListener('submit', e => {
    
    e.preventDefault();
    //Get message input form form
    const messageInput = e.target.elements.message.value;

    const sentMessage = {
        message: messageInput,
        senderId: senderId,
        senderName: senderName,
        room: room
    };
    
    socket.emit('sentMessage', sentMessage);
    //clear message
    e.target.elements.message.value = '';
    e.target.elements.message.focus();
});

function outputMessage(sentMessage) {
    const div = document.createElement('div');
    div.classList.add('chat-message');
    if(sentMessage.userSend.username == 'me') {
        div.classList.add('my-message');
    }
    div.innerHTML = `<p class="username chat-message-content">${sentMessage.userSend.username}<span class="time">${sentMessage.formatedtime}</span></p><p class="chat-message-content">${sentMessage.message}</p>`
    document.querySelector('.chat-messages').appendChild(div);
    
    //scroll down
    chatBox.scrollTop = chatBox.scrollHeight;
}

