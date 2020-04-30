const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
    name: {
        type: String,
    },

    isGroup: {
        type: Boolean,
        required: true 
    },

    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    }]
});

const chatRoom = mongoose.model('chat-room', chatRoomSchema);

module.exports = chatRoom;

