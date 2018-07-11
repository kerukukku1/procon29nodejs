var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var registerRouter = require('./routes/register');
var usersRouter = require('./routes/users');
var roomsRouter = require('./routes/rooms');
var battleRouter = require('./routes/battle');
var questboardRouter = require('./routes/questboard');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');

var passport = require('passport');
var TwitterStrategy = require('passport-twitter').Strategy;

var TWITTER_CONSUMER_KEY = "8feNkbYD6nadzvj8aBo8dCnhN";
var TWITTER_CONSUMER_SECRET = "uBPiKYLeMCl7j4IXeSTccHtI39eWeEfKiNAtP4KEMoxZ67S1dg";

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

passport.use(new TwitterStrategy({
        consumerKey: TWITTER_CONSUMER_KEY,
        consumerSecret: TWITTER_CONSUMER_SECRET,
        callbackURL: "http://127.0.0.1:3000/oauth/callback/" //Twitterログイン後、遷移するURL
    },
    function (token, tokenSecret, profile, done) {
        console.log(token, tokenSecret, profile);
        process.nextTick(function () {
            return done(null, profile);
        });
    }
));

var app = express();
var oauthRouter = require('./routes/oauth');
var socket = require('./routes/module/server_socket.js');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'routes')));

app.use(passport.initialize());
app.use(session({
  secret: 'hef028hc2093hdroic9023y',
  resave: false,
  rolling: true,
  saveUninitialized: false,
  // three days
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 3
  }
}));

app.use(function(req, res, next){
  res.locals.usersession = req.session.passport;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/questboard', questboardRouter);
app.use('/battle', battleRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);
app.use('/rooms', roomsRouter);
app.use('/oauth', oauthRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});
require('events').EventEmitter.prototype._maxListeners = 0;

module.exports = app;
