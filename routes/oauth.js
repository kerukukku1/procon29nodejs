var express = require('express');
var router = express.Router();
var passport = require('passport');
const mongoose = require('mongoose');

const User = mongoose.model('User', {
  userId: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true
  },
  twitterId: {
    type: String,
    required: true
  },
  rate: {
    type: Number,
    min: 0,
    default: 1500
  },
  created: {
    type: Date,
    default: Date.now
  },
  updated: {
    type: Date,
    default: Date.now
  }
});

var proxy = require('httpx-proxy-agent-config');

proxy.install({
 http_proxy: 'http://172.24.2.60:15080',
 https_proxy: 'http://172.24.2.60:15080',
 // example for passportjs Google OAuth2 + Google+
 // whitelist: ['www.google.com','accounts.google.com', '173.194.66.95', '74.125.192.95', '209.85.201.95', 'www.googleapis.com']
 blacklist: ['localhost']
});

// /oauthにアクセスした時
router.get('/', passport.authenticate('twitter'), function(req, res, next) {});

// /oauth/callbackにアクセスした時（Twitterログイン後）
router.get('/callback', passport.authenticate('twitter', {
  failureRedirect: '/login'
}), function(req, res) {
  mongoose.connect('mongodb://localhost/test');
  User.find({
    userId: req.session.passport.user.id
  }, function(err, docs) {
    console.log(docs.length);
    if (docs.length) {
      for (var doc in docs) {

      }
    } else {
      var user = new User({
        userId: req.session.passport.user.id,
        displayName: req.session.passport.user.displayName,
        twitterId: req.session.passport.user.username
      });
      user.save(function(err) {
        if (err) {
          console.log(err);
        }
      });
    }
  });
  res.redirect('/'); //indexへリダイレクトさせる
});

module.exports = router;
