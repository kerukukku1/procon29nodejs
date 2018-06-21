var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/:room_id', function(req, res, next) {
  if (!req.session.userid) {
    res.redirect('/');
  } else {
    var roomId = req.params.room_id;
    if (isNaN(roomId)) {
      res.render('error', {
        roomid_error: true
      });
    }
    var query = 'SELECT * FROM room_table WHERE room_id = ' + roomId;
    console.log(query);
    connection.query(query, function(err, room) {
      if (!err && room.length) {
        var query2 = 'SELECT * FROM quest_board WHERE quest_id = ' + room[0].org_quest_id;
        console.log(query2);
        console.log(room);
        connection.query(query2, function(err2, battle) {
          if (!err2 && battle.length) {
            res.render('battle', {
              title: battle[0].quest_name,
              filedir: battle[0].filedir,
              roomId: roomId,
              strategy_time: room[0].strategy_time,
              move_time: room[0].move_time,
              declare_time: room[0].declare_time
            });
          } else {
            res.render('error', {
              roomid_error: true
            });
          }
        });
      } else {
        res.render('error', {
          roomid_error: true
        });
      }
    });
  }
});

module.exports = router;
