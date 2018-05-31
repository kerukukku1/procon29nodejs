var express = require('express');
var moment = require('moment');
var connection = require('../mysqlConnection');
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('chatboard', { title: 'ChatBoard' });
});

router.post('/', function(req, res, next) {
  var title = req.body.title;
  var createdAt = moment().format('YYYY-MM-DD HH:mm:ss');
  console.log(title);
  console.log(createdAt);
});

module.exports = router;
