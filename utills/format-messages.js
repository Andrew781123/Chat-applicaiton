const moment = require('moment');

function formatMessages(message) {
    return {
        username: message.username,
        message: message.message,
        time: moment().format('kk:mm')
    }
}
module.exports = formatMessages;