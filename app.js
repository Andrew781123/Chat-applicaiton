if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const express = require('express');
const app = express();
const expressLayouts = require('express-ejs-layouts');
const passport = require('passport');
const passportConfig = require('./config/passport_setup');
const cookieSession = require('cookie-session');
const bodyParser = require('body-parser');
const methodOverride = require('method-override')

const http = require('http');
const server = http.createServer(app);

const socketioConfig = require('./config/socketio');

socketioConfig(server);

const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
});

mongoose.connection
    .once('open', () => console.log('connected to database'))
    .on('error', () => console.log('cannot connect to database'));

app.set('view engine', 'ejs');
app.set('layout', 'layouts/layout');

app.use(expressLayouts);
app.use(express.static('public'));

app.use(cookieSession({
    maxAge: 24*3600*1000,
    //encrypt the cookie
    keys: [process.env.COOKIE_KEY]
}));
app.use(passport.initialize());
app.use(passport.session());

app.use(bodyParser.urlencoded({limit: '10mb', extended: false}));
app.use(methodOverride('_method'));

app.use((req, res, next) => {
    res.locals.loggedInUser = req.user;
    next();
});

const authRouter = require('./routes/auth');
const profileRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
app.use('/auth', authRouter);
app.use('/users', profileRouter);
app.use('/admin', adminRouter);


app.get('/', (req, res) => {
    res.render('index');
});


server.listen(process.env.PORT || 3000, () => console.log(`server running on port 3000`));