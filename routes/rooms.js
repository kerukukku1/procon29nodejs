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
    res.render('rooms', {
      roomId: roomId
    });
  }
});

router.post('/:room_id', function(req, res, next) {
  console.log("POST!!!");
  console.log(req.body);
  console.log(req.session.userid);
  console.log(req.session.username);
  var roomId = req.params.room_id;
  res.redirect('/rooms/'+String(roomId));
});

module.exports = router;
