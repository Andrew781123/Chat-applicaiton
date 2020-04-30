const mongoose = require('mongoose');
const moment = require('moment');

const chatMessageSchema = new mongoose.Schema({
    userSend: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    userReceive: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },

    room: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat-room',
        required: true
    },

    message: {
        type: String,
        required: true
    },

    time: {
        type: Date,
        default: () => new Date()
    }
}, {toObject: {virtuals: true}, toJSON: {virtuals: true}});

chatMessageSchema.virtual('formatedtime').get(function() {
    let displayTime = this.time;
    if (moment(this.time).utcOffset() == -0){
        // for server
        displayTime = moment(this.time).add(8, 'h')
    }
    return moment(displayTime).format('HH:mm');
});

const ChatMessage = mongoose.model('chat-message', chatMessageSchema);

module.exports = ChatMessage;