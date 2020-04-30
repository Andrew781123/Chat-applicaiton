const router = require('express').Router();
const chatMessage = require('../model/chat-message');
const checkAdmin  = require('../auth');

router.get('/chats', checkAdmin, async (req, res) => {
    try {
        const chatMessages = await chatMessage.find().populate('userSend userReceive');
        res.render('admin-chats', {
            chatMessages: chatMessages
        });
    } catch(err) {
        console.error(err);
    }
});

module.exports = router;