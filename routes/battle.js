var express = require('express');
var router = express.Router();
var mongo = require("./module/mongodb_operate");
var Room = mongo.Room;
var Quest = mongo.Quest;
const mongoose = require("mongoose");

router.get('/:room_id', function(req, res, next) {
  if (!req.session.passport) {
    res.redirect('/');
  } else {
    var roomId = req.params.room_id;
    mongoose.connect('mongodb://localhost/test');
    Room.findOne({
      _id: roomId
    }, function(err, row1) {
      // console.log(row1);
      if (row1 != null) {
        Quest.findOne({
          _id: row1.org_quest_id
        }, function(err, row2) {
          res.render('battle', {
            roomId: roomId,
            questId: row1.org_quest_id,
            strategy_time: row1.strategy_time,
            move_time: row1.move_time,
            declare_time: row1.declare_time,
            isFinished: row1.isFinished,
            turn : row1.turn
          });
        });
        // console.log(row1);
      } else {
        res.render('error', {
          roomid_error: true
        });
      }
    });
  }
});

module.exports = router;
