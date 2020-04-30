const router = require('express').Router();
const User = require('../model/user');
const ChatMessage = require('../model/chat-message');

router.get('/', checkAuthenticated, getUsers, async (req, res) => {
    res.render('user', {
        users: res.users
    });
});

router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('username description').exec();
        const {username, description} = user;
        res.render('form', {
            username: username,
            description: description
        });
    } catch(err) {
        console.log(err);
        res.redirect('/');
    }
});

router.put('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        user.username = req.body.username;
        user.description= req.body.description;

        await user.save();
        res.redirect('/users');
    } catch {
        res.redirect('/');
    }
    
});

router.get('/chat/:id/:currentUserid', checkAuthenticated, getUserid, (req, res) => {
    res.sendFile(__dirname + '/chat.html');
});

router.get('/chat/delete', async (req, res) => {
    await ChatMessage.deleteMany();
    res.redirect('/');
});

function checkAuthenticated(req, res, next) {
    if(req.user == null) {
        return res.redirect('/auth/login');
    }
    next();
}

async function getUsers(req, res, next) {
    try {
        const users = await User.find({_id: {$ne: req.user.id}});
        res.users = users;
        next();
    } catch(err) {
        console.log(err);
    }
}

function getUserid(req, res, next) {
    res.locals.userid = req.params.id
    next();
}

module.exports = router;