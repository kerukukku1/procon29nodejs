var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/', function(req, res, next) {
  if (req.session.userid) {
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
  var query = 'SELECT userid FROM users WHERE email = "' + email + '" AND password = "' + password + '" LIMIT 1';
  console.log(query);
  connection.query(query, function(err, rows) {
    var userId = rows.length ? rows[0].userid : false;
    if (userId) {
      req.session.userid = userId;
      res.redirect('/');
    } else {
      res.render('login', {
        title: 'login',
        noUser: 'メールアドレスとパスワードが一致するユーザーはいません'
      });
    }
  });
});

module.exports = router;
