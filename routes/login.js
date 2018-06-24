var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', function(req, res, next) {
  if (req.session) {
    res.redirect('/');
  } else {
    res.render('login', {
      title: 'login'
    });
  }
});

router.post('/', function(req, res, next) {
  var email = req.body.email;
  var password = req.body.password;
  var query = 'SELECT * FROM users WHERE email = "' + email + '" AND password = "' + password + '" LIMIT 1';
  console.log(query);
  connection.query(query, function(err, rows) {
    var userId = rows.length ? rows[0].userid : false;
    if (userId) {
      req.session.user.id = userId;
      req.session.user.username = rows[0].username;
      res.redirect('/');
    } else {
      res.render('login', {
        title: 'login',
        isLogin : false,
        noUser: 'メールアドレスとパスワードが一致するユーザーはいません'
      });
    }
  });
});

module.exports = router;
