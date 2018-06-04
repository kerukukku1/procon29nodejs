var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/:room_id', function(req, res, next) {
  var roomId = req.params.room_id;
  if(isNaN(roomId)){
    res.render('error', {
      roomid_error : true
    });
  }
  var query = 'SELECT * FROM quest_board WHERE quest_id = ' + roomId;
  console.log(query);
  connection.query(query, function(err, board) {
    if(!err && board.length){
      res.render('battle', {
        title: board[0].quest_name,
        filedir: board[0].filedir,
        roomId: roomId
      });
    }else{
      res.render('error', {
        roomid_error : true
      });
    }
  });
});

module.exports = router;
