const mongoose = require('mongoose');
const moment = require('moment');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    
    googleID: String,

    description: {
        type: String,
        unique: false
    },

    isFirst: {
        type: Boolean,
        default: true
    },

    role: {
        type: String,
    },
    
    lastSeen: {
        type: Date
    }
});

userSchema.virtual('formatedLastSeen').get(function() {
    if(this.lastSeen) {
        let currentTime = new Date();
        let displayTime = this.lastSeen;
        if (moment(this.lastSeen).utcOffset() == -0  && moment(this.currentTime).utcOffset() == -0){
            // for server
            currentTime = moment(this.currentTime).add(8, 'h')
            displayTime = moment(this.lastSeen).add(8, 'h')
        }
        const formatedCurrentTime = moment(currentTime).format('MMM D');
        let formatedLastSeen = moment(displayTime).format('MMM D');
        if(formatedCurrentTime === formatedLastSeen) {
            return `today, ${moment(displayTime).format('HH:mm')}`
        } else {
            return moment(displayTime).format('MMM D, HH:mm');
        }
    }
});

const User = mongoose.model('user', userSchema);

module.exports = User;

//googelID is used for identify whether user has been logged in with Google before