const dx = [1, 1, 1, 0, -1, -1, -1, 0, 0];
const dy = [1, 0, -1, -1, -1, 0, 1, 1, 0];
window.onload = function() {
  var players = {
    red: {
      A: {
        x: -1,
        y: -1
      },
      B: {
        x: -1,
        y: -1
      }
    },
    blue: {
      A: {
        x: -1,
        y: -1
      },
      B: {
        x: -1,
        y: -1
      }
    }
  };
  var move_players = objectCopy(players);
  var org_move_players = objectCopy(players);
  var isConfirm = false;
  var socket = io.connect("http://localhost:8888/");
  var canvas = document.getElementById("myCanvas");
  var ctx = canvas.getContext("2d");
  var square_size = 50
  var w;
  var h;
  var pos;
  var turn;
  var now_turn = 0;
  var state = [];
  var isInit = false;
  var path = location.pathname;
  var enableClick = false;
  var colors = {
    red: "#FF4081",
    blue: "#03A9F4",
    white: "white",
    clearred: 'rgba(255, 64, 129, 0.5)',
    clearblue: 'rgba(3, 169, 244, 0.5)'
  };
  var targets = {
    A: 0,
    B: 1,
    NONE: -1
  };

  var mytar = targets.A;
  var types = {
    clear: 0,
    draw: 1
  };
  var paintType = types.draw;
  var jblue = document.getElementById("joinBlue");
  var jred = document.getElementById("joinRed");
  var confirm = document.getElementById("confirmButton");
  var user_status = {
    roomId: path,
    userId: userid,
    userName: username,
    team: "",
    thumbnail: thumbnail
  };

  // document.getElementById("startbutton").onclick = function() {
  //   var d = {
  //     turn: 3,
  //     span: 1000
  //   };
  //   socket.emit('gamestart', d);
  // };

  jblue.onclick = function() {
    if (isFinished) return;
    //console.log("blue click");
    if (jblue.textContent == "Cancel") {
      jblue.textContent = "Join Blue";
      user_status.team = "blue";
      socket.emit("Cancel", user_status);
      user_status.team = "";
      if (jred.textContent == "Join Red") jred.disabled = false;
    } else {
      user_status.team = "blue";
      user_status.position = {
        A: {
          x: -1,
          y: -1
        },
        B: {
          x: -1,
          y: -1
        }
      }
      socket.emit("Entry", user_status);
      jblue.textContent = "Cancel";
      jred.disabled = true;
    }
  };
  jred.onclick = function() {
    //console.log("red click");
    if (isFinished) return;
    if (jred.textContent == "Cancel") {
      jred.textContent = "Join Red";
      user_status.team = "red";
      socket.emit("Cancel", user_status);
      user_status.team = "";
      if (jblue.textContent == "Join Blue") jblue.disabled = false;
    } else {
      user_status.team = "red";
      user_status.position = {
        A: {
          x: -1,
          y: -1
        },
        B: {
          x: -1,
          y: -1
        }
      }
      socket.emit("Entry", user_status);
      jred.textContent = "Cancel";
      jblue.disabled = true;
    }
  };

  confirm.onclick = function() {
    isConfirm = true;
    $("#ConfirmModal").modal('hide');
    $("#WaitingModal").modal('show');
    setTimeout(function() {
      if ($('#WaitingModal').is(':visible')) {
        socket.emit("confirm", user_status);
      }
    }, 1500);
  };

  canvas.addEventListener("mousedown", function(event) {
    if (user_status.team == "") return;
    if (!enableClick) return;
    d = getData(event);
    //console.log(state[d.y][d.x].color);
    //自陣以外は入れない
    var check = {
      x: d.x,
      y: d.y
    };
    if (paintType == types.draw) {
      if (user_status.team == "red") {
        if (state[d.y][d.x].color == colors.blue) return;
      } else {
        if (state[d.y][d.x].color == colors.red) return;
      }
    } else if (paintType == types.clear) {
      //白なら削除する必要なし
      if (state[d.y][d.x].color == "white") return;
      for (var key1 in players) {
        for (var key2 in players[String(key1)]) {
          if (equalsObject(players[String(key1)][String(key2)], check)) {
            return false;
          }
        }
      }
    }
    var me = (user_status.team == "red") ? players.red : players.blue;
    if (equalsObject(check, me.A)) {
      mytar = targets.A;
      paintCell(me.A.x, me.A.y, state[me.A.y][me.A.x], "A", "white");
      paintCell(me.B.x, me.B.y, state[me.B.y][me.B.x], "B", "white");
      //console.log("TARGET : A");
    } else if (equalsObject(check, me.B)) {
      mytar = targets.B;
      paintCell(me.A.x, me.A.y, state[me.A.y][me.A.x], "A", "white");
      paintCell(me.B.x, me.B.y, state[me.B.y][me.B.x], "B", "white");
      //console.log("TARGET : B");
    }
    if (mytar == targets.NONE) return;
    var _check = getVerifyNextData(move_players).next
    if (equalsObject(_check[user_status.team][(mytar == targets.A) ? "B" : "A"], check)) {
      return;
    }
    (function(data) {
      // paintType != clearなら+1されて9近傍を見る
      for (var i = 0; i < 8 + paintType; i++) {
        var np = {
          x: data.x + dx[i],
          y: data.y + dy[i]
        };
        if (np.x >= w || np.y >= h || np.x < 0 || np.y < 0) continue;
        if (equalsObject(me.A, np)) {
          if (mytar != targets.A) continue;
          d.group = "A";
          return true;
        } else if (equalsObject(me.B, np)) {
          if (mytar != targets.B) continue;
          d.group = "B";
          return true;
        }
      }
      return false;
    })(d) && socket.emit('tmp_MapDataSync', d);
  }, false);

  socket.on('connect', function() {

    if (isFinished) {
      socket.emit("getGameHistory", path);
      jred.textContent = ">";
      jblue.textContent = "<";
    }
    initCanvas();
    socket.on('setGameHistory', function(data) {
      console.log(data);
      console.log(data.score.red);
      console.log(data.score.blue);
      var redtext = (data.score.red < data.score.blue) ? "LOSE" : (data.score.red > data.score.blue) ? "WIN" : "DRAW";
      var bluetext = (data.score.red < data.score.blue) ? "WIN" : (data.score.red > data.score.blue) ? "LOSE" : "DRAW";
      $('#redResult').empty().html("Score:" + data.score.red +
        '<br>' + `<img src="${data.redplayer.thumbnail}" class="thumbnail-lg"></img>` + redtext);
      $('#blueResult').empty().html("Score:" + data.score.blue +
        '<br>' + `<img src="${data.blueplayer.thumbnail}" class="thumbnail-lg"></img>` + bluetext);
    })

    socket.on('cancel_confirm', function(data) {
      isConfirm = false;
      console.log("Call CancelConfirm");
      if (data.team == user_status.team) {
        if (user_status.team == "red") {
          jred.onclick();
        } else if (user_status.team == "blue") {
          jblue.onclick();
        }
      }
      $('#ConfirmModal').modal('hide');
      $('#WaitingModal').modal('hide');
    });

    socket.on('tmp_movePlayer', function(data) {
      if (!data.player) return;
      var _paintflag = true;
      if (user_status.team != "") {
        // console.log(data.player.team);
      }
      // console.log(user_status.team);
      _paintflag = (user_status.team == data.player.team);
      var coord = {
        x: data.status.x,
        y: data.status.y
      };
      console.log(state[data.status.y][data.status.x].color);

      var group = data.status.group;
      //一回前の描画を消すための処理
      if (group == "A") {
        var tmp = (data.player.team == "red") ? move_players.red.A : move_players.blue.A;
        var tmp2 = (data.player.team == "red") ? players.red.A : players.blue.A;
        if (tmp.x >= 0 || tmp.y >= 0) {
          var flag = equalsObject(tmp, tmp2);
          _paintflag && paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "A" : "", flag ? "white" : "black");
        }
        if (data.player.team == "red") {
          move_players.red.A = coord;
        } else move_players.blue.A = coord;
      } else if (group == "B") {
        var tmp = (data.player.team == "red") ? move_players.red.B : move_players.blue.B;
        var tmp2 = (data.player.team == "red") ? players.red.B : players.blue.B;
        if (tmp.x >= 0 || tmp.y >= 0) {
          var flag = equalsObject(tmp, tmp2);
          _paintflag && paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "B" : "", flag ? "white" : "black");
        }
        if (data.player.team == "red") {
          move_players.red.B = coord;
        } else move_players.blue.B = coord;
      }
      // state[coord.y][coord.x].color = c;
      var nowx = coord.x;
      var nowy = coord.y;
      c = (data.player.team == "red") ? colors.red : colors.blue;
      var dummy = {
        score: state[nowy][nowx].score,
        color: c
      };
      var tmpcolor = state[nowy][nowx].color;
      _paintflag && paintCell(nowx, nowy, dummy, (mytar == targets.A) ? "A*" : "B*", (user_status.team == "red") ? "#1AFF8C" : "#FFB31A");
      if (data.status.paintType == types.clear && _paintflag) {
        if (state[nowy][nowx].color == colors.red) {
          paintCell(nowx, nowy, dummy, (mytar == targets.A) ? "A*" : "B*", "#1AFF8C", colors["clearred"])
        } else if (data.status.maps[nowy][nowx].color == colors.blue) {
          paintCell(nowx, nowy, dummy, (mytar == targets.A) ? "A*" : "B*", "#FFB31A", colors["clearblue"])
        }
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(nowx * square_size, nowy * square_size);
        ctx.lineTo((nowx + 1) * square_size, (nowy + 1) * square_size);
        ctx.lineTo((nowx) * square_size, (nowy + 1) * square_size);
        ctx.lineTo((nowx + 1) * square_size, (nowy) * square_size);
        ctx.stroke();
        ctx.strokeStyle = "#757575";
      }
    });

    socket.on('Someone_Entried', function(data) {
      if (data.team == "red") {
        if (user_status.team == "") jred.disabled = true;
        jred.textContent = "Team Red : " + data.userName;
        if (data.userId == user_status.userId) user_status.team = "red";
      } else {
        if (user_status.team == "") jblue.disabled = true;
        jblue.textContent = "Team Blue : " + data.userName;
        if (data.userId == user_status.userId) user_status.team = "blue";
      }
    });

    socket.on('Someone_Canceled', function(data) {
      if (data.team == "red") {
        if (user_status.team == "") jred.disabled = false;
        jred.textContent = "Join Red";
      } else {
        if (user_status.team == "") jblue.disabled = false;
        jblue.textContent = "Join Blue";
      }
      socket.emit("disconfirm", user_status);
    });

    socket.on('modal_show', function(data) {
      if (user_status.team == "") return;
      $('#ConfirmModal').modal('show');
    });

    socket.on("reshake", function(data) {
      var red_thumbnail, blue_thumbnail;
      for (p in data.player) {
        if (data.player[p].team == "red") red_thumbnail = data.player[p].thumbnail;
        else if (data.player[p].team == "blue") blue_thumbnail = data.player[p].thumbnail;
      }
      document.getElementById('playername').innerHTML =
        `<img src="${blue_thumbnail}" class="thumbnail-md"></img>　vs.　<img src="${red_thumbnail}" class="thumbnail-md"></img>`;
      if (data.quest.step == 1) {
        let time_offset = data.quest.startTime - data.quest.nowTime;
        $('#progress-timer').timer(strategy_time + time_offset, 'Strategy Phase', 1);
      } else if (data.step == 2) {
        let time_offset = data.quest.startTime - data.quest.nowTime;
        $('#turnlabel').empty().text('TURN ' + data.quest.turn + " / " + data.quest.maxturn).addClass('text-danger').wrap('<strong />');
        $('#progress-timer').timer(declare_time + time_offset, 'Declare Phase', 2);
      }
    });

    socket.on('client_handshake', function(data) {
      //console.log("next : ", data.next);
      if (data.step == 1) {
        $('#progress-timer').timer(strategy_time, 'Strategy Phase', 1);
        // $('#progress-timer').timer(3, 'Strategy Phase', 1);
      } else if (data.step == 2) {
        $('#turnlabel').empty().text('TURN ' + data.turn + " / " + data.maxturn).addClass('text-danger').wrap('<strong />');
        // if (data.turn > 1) {
        if (data.turn > data.maxturn) {
          socket.emit("handshake", {
            status: user_status,
            step: data.step + 1,
            maxturn: turn
          });
        } else {
          enableClick = true;
          $('#progress-timer').timer(declare_time, 'Declare Phase', 2);
        }
      } else if (data.step == 3) {
        //ゲーム終了時のレイアウトをここで表示
        socket.emit("endBattle", roomid);
        $('#GameShutdown').modal('show');
        $('#progress-timer').hide();
      }
    });

    socket.on('MapDataSync', function(data) {
      //初期化終わってなかったら再送要求
      if (!isInit) return;
      move_players = getVerifyNextData(move_players).next;
      if (typeof data.next != "undefined") {
        for (var team in move_players) {
          team = String(team);
          for (var agent in move_players[team]) {
            agent = String(agent);
            var flag = (state[move_players[team][agent].y][move_players[team][agent].x].color == colors.white);
            paintCell(move_players[team][agent].x, move_players[team][agent].y, state[move_players[team][agent].y][move_players[team][agent].x], "", flag ? "black" : "white");
          }
        }
        var dummy = {
          A: types.draw,
          B: types.draw
        }
        var _verifyCheck = getVerifyNextData(data.next);
        data.next = _verifyCheck.next;
        if (players.red.A.x == -1) {
          players = objectCopy(quest_manage_store[socket.data.roomId].currentPlayerPosition);
        }
        var tmp = mytar;
        mytar = targets.NONE;
        //現在のプレイヤーラベルを同一色で剥がす
        for (var team in players) {
          team = String(team);
          for (var agent in players[team]) {
            agent = String(agent);
            paintCell(players[team][agent].x, players[team][agent].y, state[players[team][agent].y][players[team][agent].x], "", "white");
            //削除でコンフリクトのときは無効
            if (_verifyCheck.flag[team][agent]) {
              data.method[team][agent] = types.draw;
            }
            //次のパネルをセット
            state[data.next[team][agent].y][data.next[team][agent].x].color = (data.method[team][agent] != types.clear) ? colors[team] : colors.white;
            //削除があった場合の対策
            if (data.method[team][agent] == types.clear) {
              state[data.next[team][agent].y][data.next[team][agent].x].color = colors.white;
              paintCell(data.next[team][agent].x, data.next[team][agent].y, state[data.next[team][agent].y][data.next[team][agent].x], "", "black");
            }
          }
        }
        //次のパネルに移動
        mytar = tmp;
        players = getVerifyNextData2(data.next, data.method);
        socket.emit("MapDataSync", {
          status: user_status,
          maps: state,
          currentPlayerPosition: players
        });
        for (var team in players) {
          team = String(team);
          for (var agent in players[team]) {
            agent = String(agent);
            paintCell(players[team][agent].x, players[team][agent].y, state[players[team][agent].y][players[team][agent].x], agent, "white");
          }
        }
        move_players = objectCopy(org_move_players);
      }
      var ret = calcScore(state, w, h, colors);
      if (user_status != "") socket.emit("SyncScoreData", ret);
      var diff = ret.blue - ret.red;
      var redpar = 50;
      var bluepar = 50;
      if (diff != 0) {
        var bias = 0;
        if (Math.min(ret.red, ret.blue) < 0) {
          bias = Math.abs(Math.min(ret.red, ret.blue));
        }
        var _red = ret.red + bias;
        var _blue = ret.blue + bias;
        var sum = _red + _blue;
        redpar = _red / sum;
        bluepar = _blue / sum;
      }
      $('#blueScore').empty().text(String(ret.blue) + "pt");
      $('#redScore').empty().text(String(ret.red) + "pt");
      $('#blueBar').width(bluepar * 100 + "%").attr('aria-valuenow', bluepar * 100);
      $('#redBar').width(redpar * 100 + "%").attr('aria-valuenow', redpar * 100);
    });

    socket.on('client_gamestart', function(data) {
      //console.log(data);
      isConfirm = false;
      $("#WaitingModal").modal('hide');
      const team_red = Object.keys(data).filter((key) => {
        return data[key].team == "red";
      });
      const team_blu = Object.keys(data).filter((key) => {
        return data[key].team == "blue";
      });
      //console.log(data[team_red].userName, data[team_blu].userName);
      battleStart({
        red: data[team_red].thumbnail,
        blue: data[team_blu].thumbnail
      });
    });

    socket.on('GameForceShutdown', function() {
      $("#GameForceShutdown").modal('show');
    });

    socket.on('filedata', function(data) {
      var arr = data.text.split('\n');
      // //console.log(arr);
      turn = parseInt(arr[0]);
      w = parseInt(arr[1]);
      h = parseInt(arr[2]);
      _w = w * square_size + 1.5;
      _h = h * square_size + 1;
      canvas.height = 2 * _h;
      canvas.width = 2 * _w;
      canvas.style.height = _h + 'px';
      canvas.style.width = _w + 'px';
      ctx.scale(2, 2);
      ctx.strokeStyle = "#757575"
      ctx.lineWidth = 0.5;
      ctx.translate(0.5, 0.5);
      ctx.textAlign = "center";
      //console.log("data:");
      //console.log(data.status);
      for (var i = 0; i < h; i++) {
        var row = arr[3 + i];
        var elems = row.split(' ');
        var _elems = [];
        for (var j = 0; j < w; j++) {
          var score = elems[j];
          _elems[j] = {
            score: parseInt(elems[j]),
            color: "white"
          };
        }
        state.push(_elems);
      }
      //bias
      i += 3;
      var npos;
      npos = arr[i].split(' ').map(e => parseInt(e));
      players.red.A = {
        x: npos[0],
        y: npos[1]
      };
      npos = arr[i + 1].split(' ').map(e => parseInt(e));
      players.red.B = {
        x: npos[0],
        y: npos[1]
      };
      npos = arr[i + 2].split(' ').map(e => parseInt(e));
      players.blue.A = {
        x: npos[0],
        y: npos[1]
      };
      npos = arr[i + 3].split(' ').map(e => parseInt(e));
      players.blue.B = {
        x: npos[0],
        y: npos[1]
      };
      if (data.status) {
        //console.log(data.status);
        tmp_state = $.extend({}, data.status.maps);
        tmp_players = $.extend({}, data.status.currentPlayerPosition);
        if (!isEmpty(tmp_state)) state = tmp_state;
        if (!isEmpty(tmp_players)) {
          players = tmp_players;
        }
      }
      for (var i = 0; i < h; i++) {
        for (var j = 0; j < w; j++) {
          paintCell(j, i, state[i][j], "", state[i][j].color != "white" ? "white" : "black");
        }
      }
      state[players.red.A.y][players.red.A.x].color = colors.red;
      state[players.red.B.y][players.red.B.x].color = colors.red;
      state[players.blue.A.y][players.blue.A.x].color = colors.blue;
      state[players.blue.B.y][players.blue.B.x].color = colors.blue;
      isInit = true;
      //console.log(players);
      //全プレーヤーの位置を描画
      paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "A", "white");
      paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "B", "white");
      paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "A", "white");
      paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "B", "white");
      //全処理が完了したのち、部屋へ入る。完了済みの場合は入らない
      if (!isFinished) socket.emit("join_to_room", {
        roomId: path,
        userId: userid,
        userName: username
      });
    });
  });

  window.document.onkeydown = function() {
    if (event.key == "Shift") {
      // console.log("down");
      paintType = types.clear;
    }
  };

  window.document.onkeyup = function() {
    if (event.key == "Shift") {
      // console.log("up");
      paintType = types.draw;
    }
  };

  function whoSquare(data) {
    var x = parseInt(data.x, 10);
    var y = parseInt(data.y, 10);
    var chx = parseInt(x / square_size, 10);
    var chy = parseInt(y / square_size, 10);
    return {
      x: chx,
      y: chy,
    }
  }

  function getVerifyNextData2(next, method) {
    if (method) {
      if (method.red.A == types.clear) next.red.A = players.red.A;
      if (method.red.B == types.clear) next.red.B = players.red.B;
      if (method.blue.A == types.clear) next.blue.A = players.blue.A;
      if (method.blue.B == types.clear) next.blue.B = players.blue.B;
    }
    return next;
  }

  function getVerifyNextData(next) {
    var flag = {
      red: {
        A: false,
        B: false
      },
      blue: {
        A: false,
        B: false
      }
    };
    if (next.red.A.x == -1) {
      next.red.A = players.red.A;
      flag.red.A = true;
    }
    if (next.red.B.x == -1) {
      next.red.B = players.red.B
      flag.red.B = true;
    };
    if (next.blue.A.x == -1) {
      next.blue.A = players.blue.A
      flag.blue.A = true;
    };
    if (next.blue.B.x == -1) {
      next.blue.B = players.blue.B
      flag.blue.B = true;
    };
    return {
      next: next,
      flag: flag
    };
  }

  function scrollX() {
    return document.documentElement.scrollLeft || document.body.scrollLeft;
  }

  function scrollY() {
    return document.documentElement.scrollTop || document.body.scrollTop;
  }

  function getData(event) {
    var bias = 0.5;
    var mouseX = event.clientX - $(canvas).position().left + scrollX() - bias;
    var mouseY = event.clientY - $(canvas).position().top + scrollY() - bias;
    var tmp = whoSquare({
      x: mouseX,
      y: mouseY
    });
    return {
      x: tmp.x,
      y: tmp.y,
      roomId: path,
      userId: userid,
      userName: username,
      team: user_status.team,
      maps: state,
      paintType: paintType,
      thumbnail: thumbnail
    };
  }

  function objectCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function equalsObject(obj1, obj2) {
    return JSON.stringify(obj1) == JSON.stringify(obj2);
  }

  function battleStart(data) {
    //initialize Bar
    document.getElementById('playername').innerHTML =
      `<img src="${data.blue}" class="thumbnail-lg"></img>　vs.　<img src="${data.red}" class="thumbnail-lg"></img>`;

    jQuery(function($) {
      // $("#progressBar").css({
      //   'width': '0%',
      //   'transition-duration': '0s',
      //   '-webkit-transition-duration': '0s',
      //   '-moz-transition-duration': '0s',
      //   '-o-transition-duration': '0s'
      // });
      $("#start_anime").show();
      $("#playername").show();
      new Vivus('start_anime').play();
      //- $(".anime").empty();
      //- $('<img src="http://smile-design.bz/tight/blog/anai/bicycle-gif.gif", id = "start"></img>').appendTo(".anime").hide().fadeIn(3000);
      $(".wrapper").hide()
      $(".wrapper").css({
        opacity: '0'
      }); //800ms かけて再表示
      setTimeout(function() {
        //- $(".wrapper").css("display", "block");
        $(".wrapper").show();
        //- $(".wrapper").css("display", "block");
        -
        $(".wrapper").stop().animate({
          opacity: '1'
        }, 800); //800ms かけて再表示
        $("#start_anime").hide();
        socket.emit("handshake", {
          status: user_status,
          current: players,
          step: 1,
          maxturn: turn
        });
      }, 4000);
    });
    $("#joinRed").prop('disabled', true);
    $("#joinBlue").prop('disabled', true);
  };
  /*
    Author : @ksugimori
    https://codepen.io/ksugimori/pen/ORvgVq
  */
  ;
  (function($) {
    $.fn.timer = function(totalTime, phase, step) {
      // reset timer
      clearTimeout(this.data('id_of_settimeout'));
      this.empty();
      // initialize elements
      this.append('<h4><strong>' + phase + ' : </strong><span></span> seconds left.</h4>');
      this.append('<div class="progress"></div>');
      this.children('.progress').append('<div class="progress-bar progress-bar-striped bg-info"></div>');
      this.find('.progress-bar').css({
        cssText: 'aria-valuenow="100";aria-valuemin="0";aria-valuemax="100";',
        width: '100%',
        role: 'progressbar'
      });
      var isSync = false;
      var countdown = (function(timeLeft) {
        if (step == 2) enableClick = true;
        var $header = this.children('h4');
        if (timeLeft <= 0) {
          $header.empty().text(phase + ' is Over. Next Step is ' + (move_time + timeLeft) + ' sec. later').addClass('text-danger');
          if (timeLeft == 0) {
            this.find('div.progress-bar').css({
              width: '0%'
            });
          } else {
            this.find('div.progress-bar').css({
              cssText: `-webkit-transition: width ${move_time-1}s ease;`,
              width: '100%'
            });
          }
          enableClick = false;
          var sender = {
            status: user_status,
            step: step,
            maps: state,
            maxturn: turn
          };
          sender.playerdata = getVerifyNextData(move_players).next;
          if (!isSync) {
            socket.emit("SyncQuestData", sender);
            isSync = true;
          }
          if (timeLeft <= -move_time) {
            if (step == 1) {
              //next step
              sender.step += 1;
            } else if (step == 2) {} else if (step == 3) {
              return;
            }
            socket.emit("handshake", sender);
            return;
          } else {
            var id = setTimeout((function() {
              requestAnimationFrame(function() {
                if (step == 2) enableClick = true;
                countdown(timeLeft - 1);
              });
            }), 1000);
          }
        } else {
          $header.children('span').text(timeLeft);

          var width = (timeLeft) * (100 / totalTime); // unit in '%'
          if (width < 20) { // less than 20 %
            this.find('div.progress-bar').removeClass('bg-info').addClass('bg-danger');
          } else if (width < 50) { // less than 50 % (and more than 20 %)
            this.find('div.progress-bar').removeClass('bg-info').addClass('bg-warning');
          }
          //- $progressBar.animate({
          //-   width:  width + '%'
          //- }, 1000, 'linear');
          this.find('div.progress-bar').css({
            cssText: 'aria-valuenow="' + width + '";aria-valuemin="0";aria-valuemax="100";',
            width: width + '%'
          });

          var id = setTimeout((function() {
            countdown(timeLeft - 1);
          }), 1000);
          this.data("id_of_settimeout", id);
        }
      }).bind(this);

      countdown(totalTime);
    };
  })(jQuery);

  //サーバにファイル要求を出してファイルを取得
  function initCanvas() {
    if (isInit) return;
    socket.emit('readfile', {
      filename: dir,
      roomId: path
    });
  }

  function paintCell(nowx, nowy, cell, player, textcolor, clearcolor) {
    //verify
    if (nowx < 0 || nowy < 0 || nowx >= w || nowy >= h) return;
    //canvasの一部分削除
    posx = nowx * square_size;
    posy = nowy * square_size;
    ctx.fillStyle = (!clearcolor) ? cell.color : clearcolor;
    ctx.font = "20px bold";
    ctx.beginPath();
    ctx.clearRect(posx, posy, square_size, square_size);
    ctx.fillRect(posx, posy, square_size, square_size);
    var offset = 0;
    if (user_status.team != "") {
      //console.log("player fill");
      var me = (user_status.team == "red") ? players.red : players.blue;
      var check1 = (mytar == targets.A) ? me.A : (mytar == targets.B) ? me.B : {};
      var check2 = {
        x: nowx,
        y: nowy
      };
      //console.log(check1);
      if (equalsObject(check1, check2)) {
        ctx.strokeStyle = (user_status.team == "red") ? "#1AFF8C" : (user_status.team == "blue") ? "#FFB31A" : "#757575";
        ctx.lineWidth = 3;
        offset = 1;
      }
    }
    ctx.rect(posx + offset, posy + offset, square_size - (offset * 2), square_size - (offset * 2));
    ctx.stroke();
    ctx.strokeStyle = "#757575";
    ctx.lineWidth = 0.5;
    ctx.fillStyle = textcolor;
    ctx.fillText(cell.score, posx + (square_size / 2), posy + (square_size / 2), 1000);
    ctx.font = "15px bold";
    ctx.fillText(player, posx + square_size - 10, posy + square_size - 5, 1000);
  }

  function isEmpty(obj) {
    return !Object.keys(obj).length;
  }
  $('#WaitingModal').on('hidden.bs.modal', function() {
    if (isConfirm) socket.emit("disconfirm", user_status);
    console.log("Waiting");
  });
  $('#ConfirmModal').on('hidden.bs.modal', function() {
    if (isConfirm) return;
    socket.emit("disconfirm", user_status);
    console.log("Confirm");
  });
  $('#GameForceShutdown').on('hidden.bs.modal', function() {
    window.location.reload();
  });
  $('#GameShutdown').on('hidden.bs.modal', function() {
    window.location.reload();
  });
};
// //console.log(dir);
