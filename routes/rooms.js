var express = require('express');
var router = express.Router();
var mongo = require("./module/mongodb_operate");
var Room = mongo.Room;
var Quest = mongo.Quest;
const mongoose = require("mongoose");

router.get('/:room_id', function(req, res, next) {
  console.log(req.session);
  if (!req.session) return;
  var roomId = req.params.room_id;
  console.log(roomId);
  mongoose.connect('mongodb://localhost/test');
  Quest.findOne({
    _id: roomId
  }, function(err, rows1) {
    if (rows1 != null) {
      Room.find({}, function(err, rows2) {
        res.render('rooms', {
          room_id: roomId,
          roomList: rows2,
        });
      });
    } else {
      res.render('error', {
        roomid_error: true
      });
    }
  });
});

router.post('/:room_id', function(req, res, next) {
  if (!req.session) return;
  if (!req.session.passport) return;
  console.log(req.body);
  console.log(req.session.passport);
  var roomId = req.params.room_id;
  roomdata = new Room();
  roomdata.room_name = req.body.room_name
  roomdata.comment = req.body.comment
  roomdata.master = req.session.passport.user.username
  roomdata.org_quest_id = roomId;
  roomdata.strategy_time = req.body.strategy_time
  roomdata.move_time = req.body.move_time
  roomdata.declare_time = req.body.declare_time
  roomdata.turn = req.body.turn
  roomdata.isFinished = req.body.isFinished
  roomdata.user_id = req.session.passport.user.id
  roomdata.save(function(err){
    if (!err){
      console.log("room made");
      res.redirect('/rooms/' + String(roomId));
    }
  });
});

module.exports = router;
