var express = require('express');
var router = express.Router();
var connection = require('../mysqlConnection');

router.get('/:room_id', function(req, res, next) {
  console.log(req.session);
  if(!req.session)return;
  var roomId = req.params.room_id;
  if (isNaN(roomId)) {
    res.render('error', {
      roomid_error: true
    });
  }
  var query = `SELECT *, DATE_FORMAT(createdAt, \'%Y年%m月%d日 %k時%i分%s秒\') AS createdAt FROM room_table WHERE org_quest_id = ${roomId}`;
  var query2 = `SELECT *, DATE_FORMAT(createdAt, \'%Y年%m月%d日 %k時%i分%s秒\') AS createdAt FROM quest_board where quest_id = ${roomId}`;
  connection.query(query2, function(err, rows) {
    filedir = rows[0].filedir
  });
  connection.query(query, function(err, rows) {
    res.render('rooms', {
      room_id: roomId,
      roomList: rows,
      filedir: filedir
    });
  });
});

router.post('/:room_id', function(req, res, next) {
  if(!req.session.passport)return;
  console.log(req.body);
  console.log(req.session.passport);
  var roomId = req.params.room_id;
  console.log("roomid: " + roomId);
  const query = `
  INSERT INTO room_table
             (room_name,
              comment,
              master,
              user_id,
              org_quest_id,
              strategy_time,
              move_time,
              declare_time,
              createdAt)
  VALUES    ('${req.body.room_name}',
             '${req.body.comment}',
             '${req.session.passport.user.username}',
             '${req.session.passport.user.id}',
             '${roomId}',
             '${req.body.strategy_time}',
             '${req.body.move_time}',
             '${req.body.declare_time}',
             now())
  `;
  console.log(query);
  connection.query(query, function(err, rows) {
    res.redirect('/rooms/' + String(roomId));
  });
});

module.exports = router;
