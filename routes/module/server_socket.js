var http = require('http');
var fs = require('fs');
var extend = require('extend');

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

process.on('uncaughtException', function(err) {
  console.log(err);
});

//サーバインスタンス作成
var server = http.createServer(function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.end('server connected');
});
var io = require('socket.io').listen(server);

server.listen(8888); //8888番ポートで起動

//入場者IDの保持
var join_user_store = {};
//エントリーしたユーザの保持
var player_user_store = {};
//承認を押したユーザのカウント 2で次の実行に進む
var confirm_room_store = {};
//ハンドシェイク中のユーザが応答した数 2で次の実行に進む
var handshake_room_store = {};
//ゲームをプレイ中のユーザ
var playing_user_store = {};
//プレイヤーが動かした一時的な座標
var tmp_moveplayer_store = {};
//何ターン目
var turn_manage_store = {};
var quest_manage_store = {};
var timeout_store = {};
//接続確立時の処理
io.sockets.on('connection', function(socket) {
  //退出処理
  socket.on('disconnect', function() {
    if (!socket.data) return;
    if (player_user_store[socket.data.userId]) {
      //ゲームがまだ開始されていない場合
      if (!playing_user_store[socket.data.roomId])
        socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", player_user_store[socket.data.userId]);
      delete player_user_store[socket.data.userId];
    }
    if (join_user_store[socket.data.userId]) {
      socket.leave(socket.data.roomId);
    }

    delete join_user_store[socket.data.userId];
    // console.log(join_user_store);

    //退出時にプレイヤーが部屋に誰もいない場合その部屋のバトル情報を削除
    var cnt = 0;
    for (var key in playing_user_store[socket.data.roomId]) {
      if (!join_user_store[key] ||
        (join_user_store[key].roomId != socket.data.roomId)) {
        cnt++;
      }
    }
    //二人とも退出している場合ゲーム情報をリセット
    if (cnt == 2) {
      delete playing_user_store[socket.data.roomId];
      delete quest_manage_store[socket.data.roomId];
      delete tmp_moveplayer_store[socket.data.roomId]
      if(timeout_store[socket.data.roomId])clearTimeout(timeout_store[socket.data.roomId]);
      delete timeout_store[socket.data.roomId]
    }
  });

  //盤面情報の同期
  socket.on("MapDataSync", function(data) {
    // timeKeeper(3);
    if(!socket.data)return;
    if (join_user_store[data.userId]) {
      io.sockets.in(join_user_store[data.userId].roomId).emit("tmp_movePlayer", {
        status: data,
        player: player_user_store[data.userId]
      });
      // const kitty = new Cat({
      //   mapdata: data.maps,
      //   roomId: data.roomId
      // });
      // kitty.save(function(err) {
      //   console.log('meow')
      //   if (err) throw err;
      // });
    }
  });

  //バトルにエントリー
  socket.on("Entry", function(data) {
    if(!socket.data)return;
    //エントリー毎に承認をリセット
    confirm_room_store[socket.data.roomId] = 0;
    // console.log("Entry " + data.userName + " RoomID : " + socket.data.roomId);
    //
    if (!player_user_store[socket.data.userId]) {
      player_user_store[socket.data.userId] = data;
      // console.log("write");
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
    if(!socket.data)return;
    // console.log("Entry Cancel " + data.userName + " RoomID : " + socket.data.roomId);
    delete player_user_store[socket.data.userId];
    socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", data);
    // console.log(player_user_store);
  });

  //バトルルームに入った時の処理
  socket.on("join_to_room", function(data) {
    socket.data = data;
    join_user_store[socket.data.userId] = data;
    socket.join(socket.data.roomId);

    //他プレイヤーが入室した場合に参加済ユーザをボタンにセット
    const result1 = Object.keys(player_user_store).filter((key) => {
      return player_user_store[key].roomId === socket.data.roomId
    });
    for (let i = 0; i < result1.length; i++) {
      socket.emit("Someone_Entried", player_user_store[result1[i]]);
    }

    //もしゲームが進行していた場合
    if (playing_user_store[socket.data.roomId]) {
      const result2 = Object.keys(playing_user_store[socket.data.roomId]).filter((key) => {
        return playing_user_store[socket.data.roomId][key].userId === socket.data.userId
      });
      //自分が対戦中ユーザだった場合
      for (let i = 0; i < result2.length; i++) {
        player_user_store[result2[i]] = playing_user_store[socket.data.roomId][result2[i]]
        socket.emit("Someone_Entried", playing_user_store[socket.data.roomId][result2[i]]);
        handshake_room_store[socket.data.roomId]++;
      }
    }
    //クライアントに盤面を渡す
    socket.emit("init_MapState", quest_manage_store[socket.data.roomId]);
  });

  socket.on("confirm", function(data) {
    if(!socket.data)return;
    confirm_room_store[data.roomId] += 1;
    //双方が承認した場合
    if (confirm_room_store[data.roomId] == 2) {
      const result = Object.keys(player_user_store).filter((key) => {
        return player_user_store[key].roomId === socket.data.roomId
      });
      var ret = {};
      for (let i = 0; i < result.length; i++) {
        ret[result[i]] = player_user_store[result[i]];
      }
      //initialize
      handshake_room_store[socket.data.roomId] = 0;
      playing_user_store[socket.data.roomId] = ret;
      io.sockets.in(socket.data.roomId).emit("client_gamestart", ret);
    };
  });

  //ファイル読み込み -> クライアントにデータを投げる
  socket.on("readfile", function(data) {
    var dir = process.cwd() + '/questdata/' + data;
    // console.log(process.cwd() + '/questdata/' + data);
    fs.readFile(dir, 'utf8', function(err, text) {
      // console.log(text);
      // console.log(err);
      socket.emit("filedata", {
        text: text,
        err: err
      });
    });
  });

  socket.on("handshake", function(data) {
    if(!socket.data)return;
    if (data.status.team == "") return;
    console.log("Handsheke : ");
    console.log(data.step);
    //正常にハンドシェイクが行われている場合巡回を停止
    if(timeout_store[socket.data.roomId])clearTimeout(timeout_store[socket.data.roomId]);
    //クライアントとのハンドシェイク人数のカウント
    handshake_room_store[socket.data.roomId] += 1;
    //step2(設置フェーズ)においてのプレイヤーの情報
    if (typeof tmp_moveplayer_store[socket.data.roomId] == "undefined") {
      tmp_moveplayer_store[socket.data.roomId] = data.playerdata;
    } else {
      try {
        console.log(tmp_moveplayer_store[socket.data.roomId]);
        console.log("playerdata : ", data.playerdata);
        if (data.playerdata) {
          if (data.status.team == "red" && !data.playerdata.red) {
            tmp_moveplayer_store[socket.data.roomId].red = data.playerdata.red;
          } else if (data.status.team == "blue" && !data.playerdata.blue) {
            tmp_moveplayer_store[socket.data.roomId].blue = data.playerdata.blue;
          }
        }
      } catch (err) {
        console.log(err.name + ': ' + err.message);
        return;
      }
    }

    //プレイ中のクエスト情報の保持
    if (!quest_manage_store[socket.data.roomId]) {
      quest_manage_store[socket.data.roomId] = {
        users: playing_user_store[socket.data.roomId],
        step: data.step,
        turn: -1,
        next: tmp_moveplayer_store[socket.data.roomId],
      };
    }else{
      //逐次更新
      quest_manage_store[socket.data.roomId].step = data.step;
      quest_manage_store[socket.data.roomId].next = tmp_moveplayer_store[socket.data.roomId];
    }
    console.log(quest_manage_store[socket.data.roomId].turn);
    //参加しているプレイヤーの人数で次のフェーズへ移行するかの閾値を決める
    const result = Object.keys(player_user_store).filter((key) => {
      return player_user_store[key].roomId === socket.data.roomId
    });
    var threshold = 0;
    for (var i = 0; i < result.length; i++) {
      if (join_user_store[result[i]].roomId == socket.data.roomId) threshold++;
    }
    if (threshold > 0 && handshake_room_store[socket.data.roomId] == threshold) {
      //prepare next handshake
      handshake_room_store[socket.data.roomId] = 0;
      if (data.step == 1) {
        //prepare next turn count
        quest_manage_store[socket.data.roomId].turn = 0;
        io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
      } else if (data.step == 2) {
        quest_manage_store[socket.data.roomId].turn++;
        //extendを用いて複数階層の連想配列をコピー
        quest_manage_store[socket.data.roomId].maps = data.maps;
        quest_manage_store[socket.data.roomId].currentPlayerPosition = extend({},tmp_moveplayer_store[socket.data.roomId]);
        io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
        delete tmp_moveplayer_store[socket.data.roomId]
      } else if (data.step == 3) {
        //nothing
      }
    }
    //10秒ごとに巡回．停止されているかどうかの確認
    timeout_store[socket.data.roomId] = setTimeout((function(now) {
      console.log("Handshake is mistake!! reshake.");
      handshake_room_store[socket.data.roomId] = 0;
      io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
    }).bind(null, data.step), (data.step == 1)?20000:10000);
  });
});

function timeKeeper(depth, span) {
  if (depth == 0) return;
  setTimeout(function() {
    console.log(depth);
    timeKeeper(depth - 1, span);
  }, span);
}
