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
  displayName: String
});

const GameHistory = new Schema({
  roomid: String,
  score: ScoreSchema,
  redplayer: PlayerSchema,
  blueplayer: PlayerSchema,
  red: [StatusSchema],
  blue: [StatusSchema]
});

mongoose.connect('mongodb://localhost/test');
// module.exports = mongoose.model('Player', PlayerSchema);
var History = mongoose.model('History', GameHistory);
module.exports.History = History;
