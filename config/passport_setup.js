const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../model/user');

passport.use(new GoogleStrategy({
    callbackURL: '/auth/google/redirect',
    clientID: process.env.clientID,
    clientSecret: process.env.clientSecret
}, async (accessToken, refreshTocken, profile, done) => {
    //this callback function is called after getting profile info from Google
    
    //check if user has signned in before
    const user = await isUserExists(profile);
    if(user) {
        user.isFirst = false,
        await user.save();
        done(null, user);
    } else {
        const newUser = await createUser(profile);
        done(null, newUser);
    }
})
);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

async function isUserExists(profile) {
    try {
        const user = await User.findOne({googleID: profile.id});
        return user;
    } catch(err) {
        console.log(err);
    }
}

async function createUser(profile) {
    try {
        const newUser = await User.create({
            username: profile.displayName,
            googleID: profile.id,
            description: ' description'
        });
        return newUser;
    } catch(err) {
        console.log(err);
    }
}

//accessToken - permission to access user's profile, eg gmail
//refreshToken - refresh the accessToken since accessToken will expire
//profile - profile info from Google