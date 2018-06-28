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
  quest_id : Number,
  quest_name : String,
  createdAt: { type: Date, default: Date.now},
  author : String,
  filedata : String
});

mongoose.connect('mongodb://localhost/test');
// module.exports = mongoose.model('Player', PlayerSchema);
var History = mongoose.model('History', GameHistory);
var Quest = mongoose.model('Quest', QuestData);
module.exports.History = History;
module.exports.Quest = Quest;
