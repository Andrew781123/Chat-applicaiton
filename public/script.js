// const socket = io();
const socket = io('/users/:id/:id');
const { userid } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const chatForm = document.querySelector('#chat-form');
const chatBox = document.querySelector('.chat-messages');
const username = document.querySelector('#username');
const typing = document.querySelector('#typing');
const status = document.querySelector('#status');

let receiverId;
let senderName;


socket.emit('userids', location.pathname);

socket.on('show-online', () => {
    status.textContent = 'Online'
});

socket.on('chatInfo', user => {
    senderName = user.sender;
    receiverId = user.receiverId,
    receiverName = user.receiver,
    document.querySelector('#user').textContent = receiverName;
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

//remove-typing
socket.on('remove-typing', () => {
    typing.classList.remove('show');
});   

socket.on('show-offline', lastSeen => {
    if(lastSeen == null) status.textContent = `last seen: never online before`;
    else status.textContent = `last seen: ${lastSeen}`;
});

//Sent message
chatForm.addEventListener('submit', e => {
    
    e.preventDefault();
    //no typing
    socket.emit('remove-typing');
    
    //Get message input form form
    const messageInput = e.target.elements.message.value;

    const sentMessage = {
        message: messageInput,
        receiverId: receiverId,
    };

    
    socket.emit('sentMessage', sentMessage);
    //clear message
    e.target.elements.message.value = '';
    e.target.elements.message.focus();
});

//typing
document.querySelector('#message').addEventListener('input', () => {
    socket.emit('typing', senderName);
});

socket.on('show-typing', senderName => {
    typing.textContent = `${senderName} is typing`;
    typing.classList.add('show');
});

socket.on('new message', message => {
    console.log(message);
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

