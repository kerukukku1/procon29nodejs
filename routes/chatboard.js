var express = require('express');
var moment = require('moment');
var connection = require('../mysqlConnection');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  var query = 'SELECT *, DATE_FORMAT(createdAt, \'%Y年%m月%d日 %k時%i分%s秒\') AS createdAt FROM board';
  connection.query(query, function(err, rows) {
    res.render('chatboard', {
       title: 'ChatBoard',
       boardList: rows
     });
  });
});

router.post('/', function(req, res, next) {
  var title = req.body.title;
  var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
  var query = 'insert into board (title, createdAt) values ("'
      + title + '", ' + '"' + createdAt + '")';
  console.log(query);
  connection.query(query, function(err, rows) {
    res.redirect('chatboard');
  });
  console.log(title);
  console.log(createdAt);
});

module.exports = router;
