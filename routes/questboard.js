var express = require('express');
var moment = require('moment');
const mongoose = require('mongoose');
var mongo = require('./module/mongodb_operate');
var Quest = mongo.Quest;
var router = express.Router();
/* GET home page. */
router.get('/', function(req, res, next) {
  mongoose.connect('mongodb://localhost/test');
  Quest.find({},function(err,rows){
    console.log(rows);
    res.render('questboard', {
       title: 'questboard',
       boardList: rows
     });
  });
});

module.exports = router;
