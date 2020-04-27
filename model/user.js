const mongoose = require('mongoose');

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
    } 
});

const User = mongoose.model('user', userSchema);

module.exports = User;

//googelID is used for identify whether user has been logged in with Google before