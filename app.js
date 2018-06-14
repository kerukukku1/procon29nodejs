var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

var indexRouter = require('./routes/index');
var registerRouter = require('./routes/register');
var usersRouter = require('./routes/users');
var battleRouter = require('./routes/battle');
var questboardRouter = require('./routes/questboard');
var loginRouter = require('./routes/login');
var logoutRouter = require('./routes/logout');

var app = express();
var socket = require('./routes/module/server_socket.js');
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'routes')));

app.use(session({
  secret: 'hef028hc2093hdroic9023y',
  resave: false,
  rolling: true,
  saveUninitialized: true,
  // three days
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 3
  }
}));

app.use(function(req, res, next){
  res.locals.usersession = req.session;
  next();
});

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/questboard', questboardRouter);
app.use('/battle', battleRouter);
app.use('/register', registerRouter);
app.use('/login', loginRouter);
app.use('/logout', logoutRouter);

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
