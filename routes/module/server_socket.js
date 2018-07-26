var http = require('http');
var fs = require('fs');
var extend = require('extend');
var moment = require('moment');
var connection = require('../../mysqlConnection');
var mongo = require('../module/mongodb_operate');
var Room = mongo.Room;
var History = mongo.History;
var Quest = mongo.Quest;
var debug = true;
var types = {
  clear: 0,
  draw: 1
};

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
var chatroom_user_store = {};
var quest_manage_store = {};
var timeout_store = {};
//接続確立時の処理
io.sockets.on('connection', function(socket) {
  //退出処理
  socket.on('disconnect', function() {
    if(debug)console.log("call disconnect socket")
    if (socket.chatdata && chatroom_user_store[socket.chatdata.userid]) {
      // chatroom_user_store[socket.chatdata.userid].comment = chatroom_user_store[socket.chatdata.userid].username + "さんが退出しました．";
      // chatroom_user_store[socket.chatdata.userid].label = "server";
      // io.sockets.in(socket.chatdata.path).emit('refresh_chat', chatroom_user_store[socket.chatdata.userid]);
      delete chatroom_user_store[socket.chatdata.userid];
      io.sockets.in(socket.chatdata.path).emit('join_user', chatroom_user_store);
    }
    if (!socket.data) return;
    var tmpteam = "";
    if (player_user_store[socket.data.userId]) {
      //ゲームがまだ開始されていない場合
      if (!playing_user_store[socket.data.roomId])
        socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", player_user_store[socket.data.userId]);
      tmpteam = player_user_store[socket.data.userId].team;
      delete player_user_store[socket.data.userId];
    }
    if (join_user_store[socket.data.userId]) {
      socket.leave(socket.data.roomId);
    }

    delete join_user_store[socket.data.userId];
    // if(debug)console.log(join_user_store);

    //退出時にプレイヤーが部屋に誰もいない場合その部屋のバトル情報を削除
    var cnt = 0;
    for (var key in playing_user_store[socket.data.roomId]) {
      if (!join_user_store[key]) {
        cnt++;
        if (tmpteam == "red") {
          quest_manage_store[socket.data.roomId].method["red"] = {
            A: types.draw,
            B: types.draw
          }
        } else if (tmpteam == "blue") {
          quest_manage_store[socket.data.roomId].method["blue"] = {
            A: types.draw,
            B: types.draw
          }
        }
      }
    }
    //二人とも退出している場合ゲーム情報をリセット
    if (cnt == 2) {
      io.sockets.in(socket.data.roomId).emit('GameForceShutdown');
      delete playing_user_store[socket.data.roomId];
      delete quest_manage_store[socket.data.roomId];
      delete tmp_moveplayer_store[socket.data.roomId]
      if (timeout_store[socket.data.roomId]) clearTimeout(timeout_store[socket.data.roomId]);
      delete timeout_store[socket.data.roomId]
    }
    delete socket.data;
  });

  socket.on("SyncScoreData", function(data) {
    if(debug)console.log("call SyncScoreData socket")
    quest_manage_store[socket.data.roomId].score = data;
  });

  socket.on("MapDataSync", function(data) {
    if(debug)console.log("call MapDataSync socket")
    if (data.status.team == "") return;
    if (!socket.data) return;
    quest_manage_store[socket.data.roomId].maps = data.maps;
    quest_manage_store[socket.data.roomId].currentPlayerPosition = extend({}, data.currentPlayerPosition);
    // tmp_moveplayer_store[socket.data.roomId] = extend({}, data.currentPlayerPosition);
  });

  socket.on("SyncQuestData", function(data) {
    if(debug)console.log("call SyncQuestData socket")
    //step2(設置フェーズ)においてのプレイヤーの情報
    if (data.status.team == "") return;
    if (!tmp_moveplayer_store[socket.data.roomId]) {
      tmp_moveplayer_store[socket.data.roomId] = data.playerdata;
    } else {
      try {
        if (data.playerdata) {
          if (data.status.team == "red" && !data.playerdata.red) {
            tmp_moveplayer_store[socket.data.roomId].red = data.playerdata.red;
          } else if (data.status.team == "blue" && !data.playerdata.blue) {
            tmp_moveplayer_store[socket.data.roomId].blue = data.playerdata.blue;
          }
          if(debug)console.log("playerdata : ", tmp_moveplayer_store[socket.data.roomId]);
          // if(debug)console.log("pld  : ", data.playerdata);
          if (quest_manage_store[socket.data.roomId]) {
            // quest_manage_store[socket.data.roomId].next = verifyConflict(tmp_moveplayer_store[socket.data.roomId]);
            quest_manage_store[socket.data.roomId].next = copyExtendsObject(tmp_moveplayer_store[socket.data.roomId]);
          }
          quest_manage_store[socket.data.roomId].maps = data.maps;
          quest_manage_store[socket.data.roomId].currentPlayerPosition = tmp_moveplayer_store[socket.data.roomId];
          if(debug)console.log("playerdata_2 : ", tmp_moveplayer_store[socket.data.roomId]);
          // quest_manage_store[socket.data.roomId].currentPlayerPosition = extend({}, getVerifyNextData(quest_manage_store[socket.data.roomId].next, quest_manage_store[socket.data.roomId].currentPlayerPosition));
          io.sockets.in(socket.data.roomId).emit("MapDataSync", quest_manage_store[socket.data.roomId]);
        }
        // quest_manage_store[socket.data.roomId].method = {
        //   red: {
        //     A: types.draw,
        //     B: types.draw
        //   },
        //   blue: {
        //     A: types.draw,
        //     B: types.draw
        //   }
        // }
      } catch (err) {
        if(debug)console.log(err.name + ': ' + err.message);
        return;
      }
    }
  });

  //盤面情報の一時的な同期
  socket.on("tmp_MapDataSync", function(data) {
    if(debug)console.log("call tmp_MapDataSync socket")
    // timeKeeper(3);
    if (!socket.data) return;
    if (join_user_store[data.userId]) {
      if (quest_manage_store[socket.data.roomId]) {
        // quest_manage_store[socket.data.roomId].maps = data.maps;
        //まだ押されてない場合
        if (!quest_manage_store[socket.data.roomId].method) {
          quest_manage_store[socket.data.roomId].method = {
            red: {
              A: types.draw,
              B: types.draw
            },
            blue: {
              A: types.draw,
              B: types.draw
            }
          };
        }
        if (data.team == "red") {
          if (data.group == "A") quest_manage_store[socket.data.roomId].method.red.A = data.paintType;
          if (data.group == "B") quest_manage_store[socket.data.roomId].method.red.B = data.paintType;
        } else {
          if (data.group == "A") quest_manage_store[socket.data.roomId].method.blue.A = data.paintType;
          if (data.group == "B") quest_manage_store[socket.data.roomId].method.blue.B = data.paintType;
        }
      }
      // if(debug)console.log(quest_manage_store[socket.data.roomId].method)
      io.sockets.in(join_user_store[data.userId].roomId).emit("tmp_movePlayer", {
        status: data,
        player: player_user_store[data.userId]
      });
    }
  });

  //バトルにエントリー
  socket.on("Entry", function(data) {
    if(debug)console.log("call Entry socket")
    if (!socket.data) return;
    //エントリー毎に承認をリセット
    confirm_room_store[socket.data.roomId] = 0;
    // if(debug)console.log("Entry " + data.userName + " RoomID : " + socket.data.roomId);
    //
    if (!player_user_store[socket.data.userId]) {
      player_user_store[socket.data.userId] = data;
      // if(debug)console.log("write");
    }
    socket.broadcast.to(socket.data.roomId).emit("Someone_Entried", data);
    // if(debug)console.log(player_user_store);
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
    if(debug)console.log("call Cancel socket")
    if (!socket.data) return;
    // if(debug)console.log("Entry Cancel " + data.userName + " RoomID : " + socket.data.roomId);
    delete player_user_store[socket.data.userId];
    socket.broadcast.to(socket.data.roomId).emit("Someone_Canceled", data);
    // if(debug)console.log(player_user_store);
  });

  //バトルルームに入った時の処理
  socket.on("join_to_room", function(data) {
    if(debug)console.log("call join_to_room socket")
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
      quest_manage_store[socket.data.roomId].nowTime = moment().unix();
      for (let i = 0; i < result2.length; i++) {
        player_user_store[result2[i]] = playing_user_store[socket.data.roomId][result2[i]]
        socket.emit("Someone_Entried", playing_user_store[socket.data.roomId][result2[i]]);
        // handshake_room_store[socket.data.roomId]++;
      }
      socket.emit("reshake", {
        quest: quest_manage_store[socket.data.roomId],
        player: playing_user_store[socket.data.roomId]
      });
    }
  });

  socket.on("disconfirm", function(data) {
    if (!socket.data) return;
    confirm_room_store[data.roomId] = 0;
    io.sockets.in(socket.data.roomId).emit("cancel_confirm", data);
  });

  socket.on("confirm", function(data) {
    if(debug)console.log("call comfirm socket")
    if (!socket.data) return;
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
      //ルーム情報が残る可能性があるので削除
      delete quest_manage_store[socket.data.roomId];
      //もし以前の情報が保持されている場合にも削除
      History.remove({
        roomid: socket.data.roomId
      }, function(err) {
        if (!err) if(debug)console.log("removed");
        if (err) if(debug)console.log("removed error : ", err);
      });
      io.sockets.in(socket.data.roomId).emit("client_gamestart", ret);
    };
  });

  socket.on("endBattle", function(data) {
    if(debug)console.log("call endBattle socket")
    Room.findOne({
      _id: data
    }, function(err, row) {
      Room.update({
        _id: data
      }, {
        $set: {
          isFinished: true
        }
      }, {
        upsert: true
      }, function(err) {
        if (err) {
          if(debug)console.log("Update Database Error");
        } else {
          delete playing_user_store[socket.data.roomId];
          delete player_user_store[socket.data.roomId];
          delete quest_manage_store[socket.data.roomId];
          delete turn_manage_store[socket.data.roomId];
          delete tmp_moveplayer_store[socket.data.roomId];
          // if(debug)console.log(rows);
        }
      });
    })
  });

  socket.on("getQuestData", function(data) {
    if(debug)console.log("call getQuestData socket")
    Quest.findOne({
      _id: data.id
    }, function(err, docs) {
      socket.emit("setQuestData", {
        docs: docs,
        status: quest_manage_store[data.path]
      });
    });
  });

  //ファイル読み込み -> クライアントにデータを投げる
  socket.on("readfile", function(data) {
    if(debug)console.log("call readFile socket")
    var dir = process.cwd() + '/questdata/' + data.filename;
    fs.readFile(dir, 'utf8', function(err, text) {
      // if(debug)console.log(text);
      // if(debug)console.log(err);
      var sender = {
        text: text,
        err: err
      };
      if (data.roomId != -1) sender.status = quest_manage_store[data.roomId];
      socket.emit("filedata", sender);
    });
  });

  socket.on('join_chatroom', function(data) {
    if(debug)console.log("call join_chatroom socket")
    socket.chatdata = data;
    socket.join(socket.chatdata.path);
    // pushMoveData();
    // data.label = "server";
    chatroom_user_store[data.userid] = data;
    io.sockets.in(socket.chatdata.path).emit('join_user', chatroom_user_store);
    // io.sockets.emit('refresh_chat', data);
  });

  socket.on('getGameHistory', function(roomId) {
    if(debug)console.log("call getGameHistory socket")
    History.find({
      roomid: roomId
    }, function(err, docs) {
      if (docs.length) {
        socket.emit("setGameHistory", docs[0]);
      }
    });
  });

  socket.on('send_chat', function(data) {
    if(debug)console.log("call send_chat socket")
    // if(debug)console.log("receive");
    io.sockets.emit('refresh_chat', data);
  });

  socket.on("handshake", function(data) {
    if(debug)console.log("call handshake socket")
    if (!socket.data) return;
    if (data.status.team == "") return;
    // if(debug)console.log("Handsheke : ");
    // if(debug)console.log("step : ", data.step);
    //正常にハンドシェイクが行われている場合巡回を停止
    if (timeout_store[socket.data.roomId]) clearTimeout(timeout_store[socket.data.roomId]);
    //クライアントとのハンドシェイク人数のカウント
    handshake_room_store[socket.data.roomId] += 1;
    //プレイ中のクエスト情報の保持
    if (!quest_manage_store[socket.data.roomId]) {
      quest_manage_store[socket.data.roomId] = {
        users: playing_user_store[socket.data.roomId],
        step: data.step,
        turn: -1,
        maxturn: data.maxturn,
        next: tmp_moveplayer_store[socket.data.roomId],
        method: {
          red: {
            A: types.draw,
            B: types.draw
          },
          blue: {
            A: types.draw,
            B: types.draw
          }
        }
      };
    } else {
      //逐次更新
      quest_manage_store[socket.data.roomId].step = data.step;
      quest_manage_store[socket.data.roomId].next = tmp_moveplayer_store[socket.data.roomId];
    }
    if(debug)console.log("playerdata_3 : ", tmp_moveplayer_store[socket.data.roomId]);
    // try {
    //   if (data.playerdata) {
    //     if (data.status.team == "red" && !data.playerdata.red) {
    //       tmp_moveplayer_store[socket.data.roomId].red = data.playerdata.red;
    //     } else if (data.status.team == "blue" && !data.playerdata.blue) {
    //       tmp_moveplayer_store[socket.data.roomId].blue = data.playerdata.blue;
    //     }
    //   }
    // } catch (err) {
    //   if(debug)console.log(err.name + ': ' + err.message);
    //   return;
    // }
    // if(debug)console.log(quest_manage_store[socket.data.roomId].turn);
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
      //ハンドシェイクの開始時間をメモ
      let now = moment().unix();
      quest_manage_store[socket.data.roomId].startTime = now;
      quest_manage_store[socket.data.roomId].nowTime = now;
      if (data.step == 1) {
        //prepare next turn count
        quest_manage_store[socket.data.roomId].currentPlayerPosition = data.current;
        quest_manage_store[socket.data.roomId].turn = 0;
        io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
      } else if (data.step == 2) {
        //extendを用いて複数階層の連想配列をコピー
        quest_manage_store[socket.data.roomId].maps = data.maps;
        quest_manage_store[socket.data.roomId].currentPlayerPosition = extend({}, tmp_moveplayer_store[socket.data.roomId]);
        // if(debug)console.log("next : ", quest_manage_store[socket.data.roomId].next);
        //データをmongodbに書き込み
        // if(debug)console.log("movement  : ", tmp_moveplayer_store[socket.data.roomId]);
        // if(debug)console.log(quest_manage_store[socket.data.roomId].method)
        pushMoveData(
          socket.data.roomId,
          copyExtendsObject(quest_manage_store[socket.data.roomId]),
          copyExtendsObject(tmp_moveplayer_store[socket.data.roomId]),
          copyExtendsObject(playing_user_store[socket.data.roomId])
        );
        quest_manage_store[socket.data.roomId].turn++;
        quest_manage_store[socket.data.roomId].method = {
          red: {
            A: types.draw,
            B: types.draw
          },
          blue: {
            A: types.draw,
            B: types.draw
          }
        }
        io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
        delete tmp_moveplayer_store[socket.data.roomId]
      } else if (data.step == 3) {
        io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
      }
    }
    //10秒ごとに巡回．停止されているかどうかの確認
    // timeout_store[socket.data.roomId] = setTimeout((function(now) {
    //   if(debug)console.log("Handshake is mistake!! reshake.");
    //   handshake_room_store[socket.data.roomId] = 0;
    //   io.sockets.in(socket.data.roomId).emit("client_handshake", quest_manage_store[socket.data.roomId]);
    // }).bind(null, data.step), (data.step == 1)?20000:10000);
  });

//   function verifyConflict(_player) {
//     for (var team in _player) {
//       team = String(team);
//       for (var agent in _player[team]) {
//         agent = String(agent);
//         var isConflict = false;
//         for (var _team in _player) {
//           _team = String(_team);
//           for (var _agent in _player[_team]) {
//             _agent = String(_agent);
//             if ((team == _team) && (agent == _agent)) continue;
//             if (_player[_team][_agent].x == -1) continue;
//             if (equalsObject(_player[team][agent], _player[_team][_agent])) {
//               _player[_team][_agent] = {
//                 x: -1,
//                 y: -1
//               };
//               quest_manage_store[socket.data.roomId].method[_team][_agent] = types.draw;
//               isConflict = true;
//             }
//           }
//         }
//         if (isConflict) {
//           quest_manage_store[socket.data.roomId].method[team][agent] = types.draw;
//           _player[team][agent] = {
//             x: -1,
//             y: -1
//           };
//         }
//       }
//     }
//     // if(debug)console.log(_player);
//     return _player;
//   }
});
/*
red.a == red.b, blue.a, blue.b
red.b == red.a, blue.a, blue.b
blue.a == blue.b, red.a, red.b
blue.b == blue.a, red.a, red.b
*/

function getVerifyNextData(next, players) {
  if (next.red.A.x == -1) {
    next.red.A = players.red.A;
  }
  if (next.red.B.x == -1) {
    next.red.B = players.red.B
  };
  if (next.blue.A.x == -1) {
    next.blue.A = players.blue.A
  };
  if (next.blue.B.x == -1) {
    next.blue.B = players.blue.B
  };
  return next
}

function equalsObject(obj1, obj2) {
  return JSON.stringify(obj1) == JSON.stringify(obj2);
}
/*
need : questid,
       position,
       userid,
       username,
       score,
       paintType

{ '1349374676':
  { roomId: '/battle/5',
    userId: '1349374676',
    userName: 'Mahito',
    team: 'blue',
    thumbnail: 'https://pbs.twimg.com/profile_images/917317706818265088/ZQn5Do5-_normal.jpg',
    position: { A: [Object], B: [Object] } },
 '935161301541691392':
  { roomId: '/battle/5',
    userId: '935161301541691392',
    userName: '皆無',
    team: 'red',
    thumbnail: 'https://pbs.twimg.com/profile_images/935161692836708352/-Q3Z98a6_normal.jpg',
    position: { A: [Object], B: [Object] } } }
*/

var updateMapScore = function(roomId, score) {
  History.update({
    roomid: roomId
  }, {
    $set: {
      score: score
    }
  }, {
    upsert: true
  }, function(err) {
    // if (!err) if(debug)console.log("score update");
  });
}

var pushMoveData = function(roomId, questdata, position, playerdata) {
  // if(debug)console.log(questdata);
  // if(debug)console.log(playerdata);

  History.find({
    roomid: roomId
  }, function(err, docs) {
    var history;
    var position_red = {
      A: {
        x: questdata.next.red.A.x,
        y: questdata.next.red.A.y,
        paintType: questdata.method.red.A
      },
      B: {
        x: questdata.next.red.B.x,
        y: questdata.next.red.B.y,
        paintType: questdata.method.red.B
      }
    };

    var position_blue = {
      A: {
        x: questdata.next.blue.A.x,
        y: questdata.next.blue.A.y,
        paintType: questdata.method.blue.A
      },
      B: {
        x: questdata.next.blue.B.x,
        y: questdata.next.blue.B.y,
        paintType: questdata.method.red.B
      }
    };
    // if(debug)console.log("red : ", position_red);
    // if(debug)console.log("blue : ", position_blue)
    if (docs.length) {
      // if(debug)console.log("find");
      docs[0].red.push(position_red);
      docs[0].blue.push(position_blue);
      if (questdata.turn+1 != docs[0].red.length){
        if(debug)console.log(questdata.turn);
        if(debug)console.log(docs[0].red.length);
        if(debug)console.log("RETURN!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        return;
      }
      history = docs[0];
      History.update({
        roomid: roomId
      }, {
        $set: {
          red: history.red,
          blue: history.blue
        }
      }, {
        upsert: true
      }, function(err) {
        if (!err) {
          updateMapScore(roomId, questdata.score);
          if(debug)console.log("upsert");
        } else {
          if(debug)console.log(err);
        }
      });
    } else {
      // if(debug)console.log("not find");
      history = new History({
        score: {
          red: 0,
          blue: 0
        }
      });
      for (var id in playerdata) {
        var add_player = {
          userid: playerdata[id].userId,
          displayName: playerdata[id].userName,
          thumbnail: playerdata[id].thumbnail
        }
        var head = playerdata[id].team;
        history[head + "player"] = add_player;
        history.roomid = roomId;
      }
      history.red = position_red;
      history.blue = position_blue;
      // if(debug)console.log(history);
      history.save(function(err) {
        if (!err) {
          updateMapScore(roomId, questdata.score);
          // if(debug)console.log("push");
        } else {
          if(debug)console.log(err);
        }
      })
    }
  });
  // History.update({
  //   questid: -1
  // }, history, {
  //   upsert: true
  // }, function(err) {
  //   if (!err) if(debug)console.log("saved");
  // });
}

function copyExtendsObject(obj) {
  return extend({}, obj);
}

function timeKeeper(depth, span) {
  if (depth == 0) return;
  setTimeout(function() {
    if(debug)console.log(depth);
    timeKeeper(depth - 1, span);
  }, span);
}
