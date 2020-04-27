const socket = io();
const { userid } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

const chatForm = document.querySelector('#chat-form');
const chatBox = document.querySelector('.chat-messages');
const username = document.querySelector('#username');

socket.on('requestid', message => {
    socket.emit('userids', location.pathname);
});

socket.on('user', user => {
    console.log(`user = ${user.username}`);
    document.querySelector('#user').textContent = user.username
});

//get formatedMessages from database
socket.on('chatHistory', chatHistories => {
    console.log(chatHistories);
    //output array of messages
    chatHistories.forEach(chatHistory => {
        outputMessage(chatHistory);
    });
});

socket.on('sentMessage', sentMessage => {
    outputMessage(sentMessage);
});

socket.on('myMessage', myMessage => {
    console.log(myMessage);
    outputMessage(myMessage);
});

//Sent message
chatForm.addEventListener('submit', e => {
    e.preventDefault();
    //Get message input form form
    const sentMessage = e.target.elements.message.value;
    //sent message to server
    socket.emit('sentMessage', sentMessage);
    //clear message
    e.target.elements.message.value = '';
    e.target.elements.message.focus();
});

function outputMessage(sentMessage) {
    console.log(sentMessage);
    const div = document.createElement('div');
    div.classList.add('chat-message');
    div.innerHTML = `<p class="username">${sentMessage.userSend.username}<span> ${sentMessage.formatedtime}</span>
    </p><p>${sentMessage.message}</p>`
    document.querySelector('.chat-messages').appendChild(div);
    
    //scroll down
    chatBox.scrollTop = chatBox.scrollHeight;
}

