var express = require('express');
var router = express.Router();
var moment = require('moment');
var connection = require('../mysqlConnection');

router.get('/', function(req, res, next) {
  res.render('register', {
    title: 'Register'
  });
});

router.post('/', function(req, res, next) {
  var userName = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
  var emailExistsQuery = 'SELECT * FROM users WHERE email = "' + email + '" LIMIT 1';
  var registerQuery = 'INSERT INTO users (username, email, password, createdAt) VALUES ("' +
    userName + '", ' + '"' + email + '", ' + '"' + password + '", ' + '"' + createdAt + '")';
  // console.log(registerQuery);
  connection.query(emailExistsQuery, function(err, email) {
    var emailExists = email.length;
    if (emailExists) {
      res.render('register', {
        title: '新規会員登録',
        emailExists: '既に登録されているメールアドレスです'
      });
    } else {
      connection.query(registerQuery, function(err, rows) {
        res.redirect('/login');
      });
    }
  });
});

module.exports = router;
