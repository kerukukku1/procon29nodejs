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
    white: "#FFFFFF",
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
    team: ""
  };

  // document.getElementById("startbutton").onclick = function() {
  //   var d = {
  //     turn: 3,
  //     span: 1000
  //   };
  //   socket.emit('gamestart', d);
  // };

  jblue.onclick = function() {
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
    $("#ConfirmModal").modal('hide');
    $("#WaitingModal").modal('show');
    setTimeout(function() {
      socket.emit("confirm", user_status);
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
        for(var key2 in players[String(key1)]){
          if(equalsObject(players[String(key1)][String(key2)],check)){
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
    })(d) && socket.emit('MapDataSync', d);
  }, false);

  socket.on('connect', function() {

    socket.on("init_MapState", function(data) {
      initCanvas(data);
    });

    socket.emit("join_to_room", {
      roomId: path,
      userId: userid,
      userName: username
    });

    socket.on('tmp_movePlayer', function(data) {
      if (!data.player) return;

      var coord = {
        x: data.status.x,
        y: data.status.y
      };

      c = (data.player.team == "red") ? colors.red : colors.blue;
      var group = data.status.group;
      //一回前の描画を消すための処理
      if (group == "A") {
        var tmp = (data.player.team == "red") ? move_players.red.A : move_players.blue.A;
        var tmp2 = (data.player.team == "red") ? players.red.A : players.blue.A;
        if (tmp.x >= 0 || tmp.y >= 0) {
          var flag = equalsObject(tmp, tmp2);
          paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "A" : "", flag ? "white" : "black");
        }
        if (data.player.team == "red") {
          move_players.red.A = coord;
        } else move_players.blue.A = coord;
      } else if (group == "B") {
        var tmp = (data.player.team == "red") ? move_players.red.B : move_players.blue.B;
        var tmp2 = (data.player.team == "red") ? players.red.B : players.blue.B;
        if (tmp.x >= 0 || tmp.y >= 0) {
          var flag = equalsObject(tmp, tmp2);
          paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "B" : "", flag ? "white" : "black");
        }
        if (data.player.team == "red") {
          move_players.red.B = coord;
        } else move_players.blue.B = coord;
      }
      // state[coord.y][coord.x].color = c;
      var nowx = coord.x;
      var nowy = coord.y;
      var dummy = {
        score: state[coord.y][coord.x].score,
        color: c
      };
      paintCell(nowx, nowy, dummy, (mytar == targets.A) ? "A*" : "B*", (user_status.team == "red") ? "#1AFF8C" : "#FFB31A");
      if (data.status.paintType == types.clear) {
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(coord.x * square_size, coord.y * square_size);
        ctx.lineTo((coord.x + 1) * square_size, (coord.y + 1) * square_size);
        ctx.lineTo((coord.x) * square_size, (coord.y + 1) * square_size);
        ctx.lineTo((coord.x + 1) * square_size, (coord.y) * square_size);
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
    });

    socket.on('modal_show', function(data) {
      if (user_status.team == "") return;
      $('#ConfirmModal').modal('show');
    });

    socket.on("reshake", function(data) {
      let time_offset = data.startTime - data.nowTime;
      //console.log("offset : ", time_offset);
      if (data.step == 1) $('#progress-timer').timer(10 + time_offset, 'Strategy Phase', 1);
      if (data.step == 2) {
        $('#turnlabel').empty().text('TURN ' + data.turn + " / " + turn).addClass('text-danger').wrap('<strong />');
        $('#progress-timer').timer(3 + time_offset, 'Declare Phase', 2);
      }
      if (data.step == 3) $('#progress-timer').timer(0 + time_offset, 'End Phase', 3);
    });

    socket.on('client_handshake', function(data) {
      //console.log("next : ", data.next);
      if (data.step == 1) {
        $('#progress-timer').timer(10, 'Strategy Phase', 1);
      } else if (data.step == 2) {
        $('#turnlabel').empty().text('TURN ' + data.turn + " / " + turn).addClass('text-danger').wrap('<strong />');
        if (data.turn >= turn) {
          socket.emit("handshake", {
            status: user_status,
            step: data.step + 1
          });
        } else {
          if (typeof data.next != "undefined") {
            // var method = (user_status.team == "red") ? data.method.red : data.method.blue;
            // data.next = getVerifyNextData(data.next, data.method);
            // console.log(data.next);
            // var tmp = mytar;
            // mytar = targets.NONE;
            var dummy = {
              A: types.draw,
              B: types.draw
            }
            // //現在地点のユーザラベル(A,B)を全て剥がす
            // paintPlayer(players.red, "", "", dummy, colors.red);
            // paintPlayer(players.blue, "", "", dummy, colors.blue);
            // mytar = tmp;
            // players = data.next;
            // //対応するようラベルを付け替え
            // paintPlayer(players.red, "A", "B", data.method.red, colors.red);
            // paintPlayer(players.blue, "A", "B", data.method.blue, colors.blue);
            // //次の動きを初期化
            // move_players = objectCopy(org_move_players);


            data.next = getVerifyNextData(data.next);
            var tmp = mytar;
            mytar = targets.NONE;
            //現在のプレイヤーラベルを同一色で剥がす
            paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "", "white");
            paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "", "white");
            paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "", "white");
            paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "", "white");
            //次のパネルをセット
            state[data.next.red.A.y][data.next.red.A.x].color = (data.method.red.A != types.clear) ? colors.red : colors.white;
            state[data.next.red.B.y][data.next.red.B.x].color = (data.method.red.B != types.clear) ? colors.red : colors.white;
            state[data.next.blue.A.y][data.next.blue.A.x].color = (data.method.blue.A != types.clear) ? colors.blue : colors.white;
            state[data.next.blue.B.y][data.next.blue.B.x].color = (data.method.blue.B != types.clear) ? colors.blue : colors.white;
            //次のパネルに移動
            mytar = tmp;
            //削除があった場合の対策
            if (data.method.red.A == types.clear) {
              paintCell(data.next.red.A.x, data.next.red.A.y, state[data.next.red.A.y][data.next.red.A.x], "", "black");
            }
            if (data.method.red.B == types.clear) {
              paintCell(data.next.red.B.x, data.next.red.B.y, state[data.next.red.B.y][data.next.red.B.x], "", "black");
            }
            if (data.method.blue.A == types.clear) {
              paintCell(data.next.blue.A.x, data.next.blue.A.y, state[data.next.blue.A.y][data.next.blue.A.x], "", "black");
            }
            if (data.method.blue.B == types.clear) {
              paintCell(data.next.blue.B.x, data.next.blue.B.y, state[data.next.blue.B.y][data.next.blue.B.x], "", "black");
            }
            players = getVerifyNextData2(data.next, data.method);
            paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "A", "white");
            paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "B", "white");
            paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "A", "white");
            paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "B", "white");
            move_players = objectCopy(org_move_players);
          }
          let ret = calcScore(state, w, h, colors);
          console.log("score : ", ret);
          $('#progress-timer').timer(3, 'Declare Phase', 2);
        }
      } else if (data.step == 3) {
        $('#progress-timer').timer(0, 'End Phase', 3);
      }
    });

    socket.on('client_gamestart', function(data) {
      //console.log(data);
      $("#WaitingModal").modal('hide');
      const team_red = Object.keys(data).filter((key) => {
        return data[key].team == "red";
      });
      const team_blu = Object.keys(data).filter((key) => {
        return data[key].team == "blue";
      });
      //console.log(data[team_red].userName, data[team_blu].userName);
      battleStart({
        red: data[team_red].userName,
        blue: data[team_blu].userName
      });
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
      //console.log(players);
      //全プレーヤーの位置を描画
      paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "A", "white");
      paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "B", "white");
      paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "A", "white");
      paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "B", "white");
    });

  });

  window.document.onkeydown = function() {
    if (event.key == "Shift") {
      //console.log(paintType);
      paintType = types.clear;
      //透過処理
      ctx.globalAlpha = 0.5;
    }
  };

  window.document.onkeyup = function() {
    if (event.key == "Shift") {
      //console.log("up");
      paintType = types.draw;
      ctx.globalAlpha = 1.0;
    }
  };

  function paintPlayer(data, textA, textB, c) {
    ctx.strokeStyle = "#757575";
    ctx.lineWidth = 0.5;
    paintCell(data.A.x, data.A.y, state[data.A.y][data.A.x], textA, "white");
    state[data.A.y][data.A.x].color = c;
    paintCell(data.B.x, data.B.y, state[data.B.y][data.B.x], textB, "white");
    state[data.B.y][data.B.x].color = c;
    // if (type.A == types.draw) {
    //   paintCell(data.A.x, data.A.y, state[data.A.y][data.A.x], textA, "white");
    //   state[data.A.y][data.A.x].color = c;
    // } else if (type.A == types.clear) {
    //   ctx.beginPath();
    //   ctx.clearRect(data.A.x * square_size, data.A.y * square_size, square_size, square_size);
    //   ctx.rect(data.A.x * square_size, data.A.y * square_size, square_size, square_size);
    //   ctx.stroke();
    //   state[data.A.y][data.A.x].color = colors.white;
    // }
    // if (type.B == types.draw) {
    //   paintCell(data.B.x, data.B.y, state[data.B.y][data.B.x], textB, "white");
    //   state[data.B.y][data.B.x].color = c;
    // } else if (type.B == types.clear) {
    //   ctx.beginPath();
    //   ctx.clearRect(data.B.x * square_size, data.B.y * square_size, square_size, square_size);
    //   ctx.rect(data.B.x * square_size, data.B.y * square_size, square_size, square_size);
    //   ctx.stroke();
    //   state[data.B.y][data.B.x].color = colors.white;
    // }
  }


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
    // console.log(method);
    // if (next.red.A.x == -1) {
    //   next.red.A = players.red.A;
    // }
    // if (next.red.B.x == -1) {
    //   next.red.B = players.red.B;
    // }
    // if (next.blue.A.x == -1) {
    //   next.blue.A = players.blue.A;
    // }
    // if (next.blue.B.x == -1) {
    //   next.blue.B = players.blue.B;
    // }
    if (method) {
      if (method.red.A == types.clear) next.red.A = players.red.A;
      if (method.red.B == types.clear) next.red.B = players.red.B;
      if (method.blue.A == types.clear) next.blue.A = players.blue.A;
      if (method.blue.B == types.clear) next.blue.B = players.blue.B;
    }
    return next;
  }

  function getVerifyNextData(next) {
    if (next.red.A.x == -1) next.red.A = players.red.A;
    if (next.red.B.x == -1) next.red.B = players.red.B;
    if (next.blue.A.x == -1) next.blue.A = players.blue.A;
    if (next.blue.B.x == -1) next.blue.B = players.blue.B;
    return next;
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
      paintType: paintType
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
      '<strong><font color="#03A9F4", size = "20">' + data.blue + '</font> vs. <font color = "#FF4081", size = "20">' + data.red + "</font></strong>";
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
      setTimeout(function() {
        //- $(".wrapper").css("display", "block");
        $(".wrapper").show();
        //- $(".wrapper").css("display", "block");
        //- $(".wrapper").stop().animate({opacity:'1'},800); //800ms かけて再表示
        $("#start_anime").hide();
        socket.emit("handshake", {
          status: user_status,
          step: 1
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
      if (step == 2) enableClick = true;
      // initialize elements
      this.append('<h4><strong>' + phase + ' : </strong><span></span> seconds left.</h4>');
      this.append('<div class="progress"></div>');
      this.children('.progress').append('<div class="progress-bar bg-info"></div>');
      this.find('.progress-bar').css({
        cssText: '-webkit-transition: none !important; transition: none !important;',
        width: '100%'
      });

      var countdown = (function(timeLeft) {
        var $header = this.children('h4');
        if (timeLeft <= 0) {
          $header.empty().text(phase + ' is Over. Next Step is ' + (5 + timeLeft) + ' sec. later').addClass('text-danger');
          this.find('div.progress-bar').css({
            width: '0%'
          });
          enableClick = false;
          if (timeLeft <= -5) {
            var sender = {
              status: user_status,
              step: step,
              maps: state
            };
            if (step == 1) {
              //next step
              sender.playerdata = getVerifyNextData(move_players);
              sender.step += 1;
            } else if (step == 2) {
              sender.playerdata = getVerifyNextData(move_players);
            } else if (step == 3) {
              return;
            }
            //console.log("playerdata : ", sender.playerdata);
            socket.emit("handshake", sender);
            return;
          } else {
            var id = setTimeout((function() {
              countdown(timeLeft - 1);
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
  function initCanvas(_data) {
    if (isInit) return;
    isInit = true;
    socket.emit('readfile', dir);
  }

  function paintCell(nowx, nowy, cell, player, textcolor) {
    //verify
    if (nowx < 0 || nowy < 0 || nowx >= w || nowy >= h) return;
    //canvasの一部分削除
    posx = nowx * square_size;
    posy = nowy * square_size;
    ctx.fillStyle = cell.color;
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

};
// //console.log(dir);
