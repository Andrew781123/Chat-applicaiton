const express = require('express');
const router = express.Router();
const passport = require('passport');

router.get('/login', (req, res) => {
    res.render('login');
});

router.get('/google', passport.authenticate('google', {
    //tell passport what we want to retrieve from the user's profile
    scope: ['profile'],
}));

//rediret route for google
//the middleware crabs user's profile info 
router.get('/google/redirect', passport.authenticate('google'), (req, res) => {
    if(req.user.isFirst) {
        res.render('form', {
            loggedInUser: req.user
        });
    } else {
        res.redirect('/');
    }
});

router.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/');
});

module.exports = router;