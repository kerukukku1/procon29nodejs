const mongoose = require('mongoose');
var Schema = mongoose.Schema;
const CoordinateSchema = new Schema({
  x: Number,
  y: Number
});

const StatusSchema = new Schema({
  A: CoordinateSchema,
  B: CoordinateSchema,
  score: Number
});

const PlayerSchema = new Schema({
  userid: Number,
  displayName: String
});

const GameHistory = new Schema({
  questid: Number,
  redplayer: PlayerSchema,
  blueplayer: PlayerSchema,
  red: [StatusSchema],
  blue: [StatusSchema]
});

mongoose.connect('mongodb://localhost/test');
// module.exports = mongoose.model('Player', PlayerSchema);
var History = mongoose.model('History', GameHistory);
module.exports.History = History;
