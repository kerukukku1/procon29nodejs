var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/:room_id', function(req, res, next) {
  var roomId = req.params.room_id;
  var query = 'SELECT * FROM quest_board WHERE quest_id = ' + roomId;
  connection.query(query, function(err, board) {
    res.render('battle', {
      title: board[0].quest_name,
      filedir: board[0].filedir
    });
  });
});

module.exports = router;
