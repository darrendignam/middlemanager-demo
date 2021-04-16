var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var flash = require('connect-flash');
var passport = require('passport');
var mongoose = require('mongoose');

var app = express();

//use the dotenv file
require('dotenv').config();

//session stuff
var sess_obj = {
  name:"middlemanager.sid",
  cookie: { maxAge: ((4 * 24) * 60 * 60 * 1000) }, // 4 days
  secret: 'mark_LADDA_cat_yqj7425a',
  resave: true,
  saveUninitialized: true
};

var expressSession = require('express-session');
var RedisStore = require('connect-redis')(expressSession);
var redis = require("redis").createClient(process.env.REDISCLOUD_URL, { no_ready_check: true });
sess_obj.store = new RedisStore({ url: process.env.REDISCLOUD_URL, client: redis });
app.use(expressSession(sess_obj));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());

//shoukd now be able to check if we are in dev mode in Jade!!! :)
app.locals.env = Object.assign({}, process.env);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var Schema = mongoose.Schema;
mongoose.connect(process.env.MONGO_CONN_STRING);
require('./config/passport.js')(passport);

//This lets the Cart menu item reflect the number of quotes a user has. can manage the session and user quotes 
app.use(function(req, res, next) {
  //used to update the menu shopping cart //TODO: check for logged in with quotes here.
  //TODO: Could also add some smarts here to promt user to complete an order.
  if (!req.user && req.session && req.session.quotes) {
    res.locals.sumQuotes = req.session.quotes.length;
    next();
  } else if(req.user && req.session && req.session.quotes) {
    mongoose.model('LocalAccount').findByIdAndUpdate(req.user._id, { $push: { quotes: req.session.quotes } }, function (err, user) {
      if (err) {
        res.locals.sumQuotes = 0;
        next();
      } else {
        res.locals.sumQuotes = user.quotes.length;
        delete req.session.quotes;
        next();   
      }
    });
  }else if(req.user){
    mongoose.model('LocalAccount').findById(req.user._id, function (err, user) {
      if (err) {
        res.locals.sumQuotes = 0;
        next();
      } else {
        res.locals.sumQuotes = user.quotes.length;
        next();   
      }
    });
  }else{
    res.locals.sumQuotes = 0;
    next();
  }
});


app.use('/', require('./routes/index'));
app.use('/account', require('./routes/users'));
app.use('/site', require('./routes/sites'));
app.use('/shop', require('./routes/shop'));

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

module.exports = app;
