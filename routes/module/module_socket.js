var http = require('http');
var fs = require('fs');

const mongoose = require('mongoose');
const Cat = mongoose.model('Cat', {
  mapdata: [
    [{
      position: Number,
      color: String
    }]
  ],
  roomid: {
    type: Number
  }
});
mongoose.connect('mongodb://localhost/test');

//サーバインスタンス作成
var server = http.createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end('server connected');
});
var io = require('socket.io').listen(server);

server.listen(8888); //8888番ポートで起動
var join_user_store = {};
var player_user_store = {};
var confirm_room_store = {};
//接続確立時の処理
io.sockets.on('connection', function(socket) {
  //退出処理
  socket.on('disconnect', function() {
    if (player_user_store[socket.data.userId]) {
      socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", player_user_store[socket.data.userId]);
      delete player_user_store[socket.data.userId];
    }
    if (join_user_store[socket.data.userId]) {
      socket.leave(socket.data.roomId);
    }
    delete join_user_store[socket.data.userId];
    console.log(join_user_store);
  });

  //盤面情報の同期
  socket.on("MapDataSync", function(data) {
    // timeKeeper(3);
    io.sockets.in(join_user_store[data.userId].roomId).emit("tmp_movePlayer", {
      status: data,
      player: player_user_store[data.userId]
    });
    const kitty = new Cat({
      mapdata: data.maps,
      roomId: data.roomId
    });
    kitty.save(function(err) {
      console.log('meow')
      if (err) throw err;
    });
  });

  //バトルにエントリー
  socket.on("Entry", function(data) {
    //エントリー毎に承認をリセット
    confirm_room_store[socket.data.roomId] = 0;
    console.log("Entry " + data.userName + " RoomID : " + socket.data.roomId);
    if (!player_user_store[socket.data.userId]) {
      player_user_store[socket.data.userId] = data;
      console.log("write");
    }
    socket.broadcast.to(socket.data.roomId).emit("Someone_Entried", data);
    console.log(player_user_store);
    const result = Object.keys(player_user_store).filter((key) => {
      return player_user_store[key].roomId === socket.data.roomId
    });
    //roomに2人揃った場合
    if (result.length == 2) {
      io.sockets.in(socket.data.roomId).emit("modal_show", result);
    }
  });

  //エントリーをキャンセル
  socket.on("Cancel", function(data) {
    console.log("Entry Cancel " + data.userName + " RoomID : " + socket.data.roomId);
    delete player_user_store[socket.data.userId];
    socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", data);
    console.log(player_user_store);
  });

  //バトルルームに入った時の処理
  socket.on("join_to_room", function(data) {
    socket.data = data;
    join_user_store[socket.data.userId] = data;
    socket.join(socket.data.roomId);
    // console.log(join_user_store);
    console.log(socket.data.roomId);
    console.log(join_user_store);
    const result = Object.keys(player_user_store).filter((key) => {
      return player_user_store[key].roomId === socket.data.roomId
    });
    for (let i = 0; i < result.length; i++) {
      socket.emit("Someone_Entried", player_user_store[result[i]]);
    }
    console.log(result);
  });

  //ゲーム開始
  socket.on("gamestart", function(data) {
    timeKeeper(data.turn, data.span, data.turn);
  });

  socket.on("confirm", function(data) {
    confirm_room_store[data.roomId] += 1;
    if (confirm_room_store[data.roomId] == 2) {
      io.sockets.in(socket.data.roomId).emit("client_gamestart",
        Object.keys(player_user_store).filter((key) => {
          return player_user_store[key].roomId === socket.data.roomId
        })
      );
    };
  });

  //ファイル読み込み -> クライアントにデータを投げる
  socket.on("readfile", function(data) {
    var dir = process.cwd() + '/questdata/' + data;
    console.log(process.cwd() + '/questdata/' + data);
    fs.readFile(dir, 'utf8', function(err, text) {
      console.log(text);
      console.log(err);
      socket.emit("filedata", {
        text: text,
        err: err
      });
    });
  });
});

function timeKeeper(turn, span) {
  if (turn == 0) return;
  setTimeout(function() {
    console.log(turn);
    timeKeeper(turn - 1, span);
  }, span);
}
