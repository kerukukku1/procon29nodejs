const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const CoordinateSchema = new Schema({
  x: Number,
  y: Number,
  paintType: Number
});

const StatusSchema = new Schema({
  A: CoordinateSchema,
  B: CoordinateSchema,
});

const ScoreSchema = new Schema({
  red: Number,
  blue: Number
})

const PlayerSchema = new Schema({
  userid: String,
  displayName: String,
  thumbnail: String
});

const GameHistory = new Schema({
  roomid: String,
  score: ScoreSchema,
  redplayer: PlayerSchema,
  blueplayer: PlayerSchema,
  red: [StatusSchema],
  blue: [StatusSchema]
});

const QuestData = new Schema({
  quest_name: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  author: String,
  filedata: {
    red: String,
    blue: String
  }
});

const RoomData = new Schema({
  room_name: String,
  comment: String,
  master: String,
  org_quest_id: String,
  strategy_time: Number,
  move_time: Number,
  declare_time: Number,
  turn: Number,
  isFinished: {
    type : Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  user_id: String
});

mongoose.connect('mongodb://localhost/test');
// module.exports = mongoose.model('Player', PlayerSchema);
var History = mongoose.model('History', GameHistory);
var Quest = mongoose.model('Quest', QuestData);
var Room = mongoose.model('Room', RoomData);
module.exports.History = History;
module.exports.Quest = Quest;
module.exports.Room = Room;
