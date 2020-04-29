const socket = io();
const { userid } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const chatForm = document.querySelector('#chat-form');
const chatBox = document.querySelector('.chat-messages');
const username = document.querySelector('#username');

let senderId;
let receiverId;

socket.on('requestid', message => {
    socket.emit('userids', location.pathname);
});

socket.on('user', user => {
    senderId = user.sender._id;
    receiverId = user.receiver._id;
    // console.log(`sender: ${typeof senderId}, receiver: ${receiverId}`);
    document.querySelector('#user').textContent = user.receiver.username
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
        receiverId: receiverId
    };
    // sentMessage.message = messageInput;
    // sentMessage.senderId = senderId;
    // sentMessage.receiverId = receiverId;
    // console.log(`client sentMessage: ${sentMessage}`);
    //sent message to server
    socket.emit('sentMessage', sentMessage);
    //clear message
    e.target.elements.message.value = '';
    e.target.elements.message.focus();
});

function outputMessage(sentMessage) {
    // console.log(sentMessage);
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

