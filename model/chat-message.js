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

    message: {
        type: String,
        required: true
    },

    time: {
        type: Date,
        default: () => new Date().toLocaleString('zh-HK')
    }
}, {toObject: {virtuals: true}, toJSON: {virtuals: true}});

chatMessageSchema.virtual('formatedtime').get(function() {
    return moment(this.time).format('HH:mm');
});

const ChatMessage = mongoose.model('chat-message', chatMessageSchema);

module.exports = ChatMessage;