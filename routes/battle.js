var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/:room_id', function(req, res, next) {
  var roomId = req.params.room_id;
  var query = 'SELECT * FROM board WHERE board_id = ' + roomId;
  connection.query(query, function(err, board) {
    res.render('battle', {
      title: board[0].title,
      board: board[0]
    });
  });
});

module.exports = router;
