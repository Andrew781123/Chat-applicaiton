const io = require('./app');

const chat = io.of('/users/:id/:id');
chat.on('connection') {
    
}


module.exports = {
    socketioConfig
}
