const chat = require('./chat-socket');

function configIndexSocket(io) {
    const index = io.of('/');
    index.on('connection', socket => {
        console.log('connected by sb');
        chat.broadcast.emit('new-message', 'new-message');
    });

    return {
        index
    }
}

module.exports = configIndexSocket;
