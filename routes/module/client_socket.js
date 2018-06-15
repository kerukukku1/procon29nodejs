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
  var path = location.pathname;
  var enableClick = false;
  var colors = {
    red: "#FF4081",
    blue: "#03A9F4",
    white: "#FFFFFF",
  };
  var types = {
    draw: 1,
    clear: 2
  }
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
  initCanvas();
  //サーバにファイル要求を出してファイルを取得
  function initCanvas() {
    socket.emit('readfile', dir);
    socket.on('filedata', function(data) {
      var arr = data.text.split('\n');
      // console.log(arr);
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
      var i;
      for (i = 0; i < h; i++) {
        var row = arr[3 + i];
        var elems = row.split(' ');
        var _elems = [];
        for (var j = 0; j < w; j++) {
          var score = elems[j];
          _elems[j] = {
            score: parseInt(elems[j]),
            color: "white"
          };
          paintCell(j, i, _elems[j], "", "black");
        }
        state.push(_elems);
      }
      //bias
      i += 3;
      var npos;
      npos = arr[i].split(' ').map(e => parseInt(e));
      state[npos[1]][npos[0]].color = colors.red;
      players.red.A = {
        x: npos[0],
        y: npos[1]
      };
      paintCell(npos[0], npos[1], state[npos[1]][npos[0]], "A", "white");
      npos = arr[i + 1].split(' ').map(e => parseInt(e));
      state[npos[1]][npos[0]].color = colors.red;
      players.red.B = {
        x: npos[0],
        y: npos[1]
      };
      paintCell(npos[0], npos[1], state[npos[1]][npos[0]], "B", "white");
      npos = arr[i + 2].split(' ').map(e => parseInt(e));
      state[npos[1]][npos[0]].color = colors.blue;
      players.blue.A = {
        x: npos[0],
        y: npos[1]
      };
      paintCell(npos[0], npos[1], state[npos[1]][npos[0]], "A", "white");
      npos = arr[i + 3].split(' ').map(e => parseInt(e));
      state[npos[1]][npos[0]].color = colors.blue;
      players.blue.B = {
        x: npos[0],
        y: npos[1]
      };
      paintCell(npos[0], npos[1], state[npos[1]][npos[0]], "B", "white");
    });
  }

  function paintCell(nowx, nowy, cell, player, textcolor) {
    //verify
    if (nowx < 0 || nowy < 0 || nowx >= w || nowy >= h) return;
    //canvasの一部分削除
    ctx.clearRect(nowx*square_size, nowy*square_size, square_size, square_size);
    posx = nowx * square_size;
    posy = nowy * square_size;
    ctx.fillStyle = cell.color;
    ctx.font = "20px bold";
    ctx.fillRect(posx, posy, square_size, square_size);
    ctx.rect(posx, posy, square_size, square_size);
    ctx.stroke();
    ctx.fillStyle = textcolor;
    ctx.fillText(cell.score, posx + (square_size / 2), posy + (square_size / 2), 1000);
    ctx.font = "15px bold";
    ctx.fillText(player, posx + square_size - 10, posy + square_size - 5, 1000);
  }

  // document.getElementById("startbutton").onclick = function() {
  //   var d = {
  //     turn: 3,
  //     span: 1000
  //   };
  //   socket.emit('gamestart', d);
  // };

  jblue.onclick = function() {
    console.log("blue click");
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
    console.log("red click");
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
    (function(data) {
      var me = (user_status.team == "red") ? players.red : players.blue;
      for (var i = 0; i < 9; i++) {
        var np = {
          x: data.x + dx[i],
          y: data.y + dy[i]
        };
        if (np.x >= w || np.y >= h || np.x < 0 || np.y < 0) continue;
        if (equalsObject(me.A, np)) {
          d.group = "A";
          return true;
        } else if (equalsObject(me.B, np)) {
          d.group = "B";
          return true;
        }
      }
      return false;
    })(d) && socket.emit('MapDataSync', d);
  }, false);

  socket.on('connect', function() {
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
        console.log(tmp2, tmp);
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
        console.log(tmp2, tmp);
        var flag = equalsObject(tmp, tmp2);
        if (tmp.x >= 0 || tmp.y >= 0) {
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
      paintCell(nowx, nowy, dummy, "*", "white");
      if (data.status.paintType == types.clear) {
        console.log("STROKE LINE");
        ctx.strokeStyle = "black";
        ctx.beginPath();
        ctx.moveTo(nowx*square_size, nowy*square_size);
        ctx.lineTo((nowx+1)*square_size, (nowy+1)*square_size);
        ctx.closePath();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo((nowx+1)*square_size, nowy*square_size);
        ctx.lineTo(nowx*square_size, (nowy+1)*square_size);
        ctx.closePath();
        ctx.stroke();
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

    socket.on('client_handshake', function(data) {
      //プレーヤーでない場合にはハンドシェイクを行わない
      console.log(data);
      console.log(turn);
      console.log("next : ", data.next);
      if (data.step == 1) {
        $('#progress-timer').timer(10, 'Strategy Phase', 1);
        console.log("phase1 end");
      } else if (data.step == 2) {
        $('#turnlabel').empty().text('TURN ' + data.turn + " / " + turn).addClass('text-danger').wrap('<strong />');
        if (data.turn >= turn) {
          socket.emit("handshake", {
            status: user_status,
            step: data.step + 1
          });
        } else {
          if (typeof data.next != "undefined") {
            console.log(data.next);
            data.next = getVerifyNextData(data.next);
            paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "", "white");
            paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "", "white");
            paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "", "white");
            paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "", "white");
            state[data.next.red.A.y][data.next.red.A.x].color = colors.red;
            state[data.next.red.B.y][data.next.red.B.x].color = colors.red;
            state[data.next.blue.A.y][data.next.blue.A.x].color = colors.blue;
            state[data.next.blue.B.y][data.next.blue.B.x].color = colors.blue;
            players = data.next;
            paintCell(players.red.A.x, players.red.A.y, state[players.red.A.y][players.red.A.x], "A", "white");
            paintCell(players.red.B.x, players.red.B.y, state[players.red.B.y][players.red.B.x], "B", "white");
            paintCell(players.blue.A.x, players.blue.A.y, state[players.blue.A.y][players.blue.A.x], "A", "white");
            paintCell(players.blue.B.x, players.blue.B.y, state[players.blue.B.y][players.blue.B.x], "B", "white");
            move_players = objectCopy(org_move_players);
          }
          $('#progress-timer').timer(3, 'Declare Phase', 2);
        }
      } else if (data.step == 3) {
        $('#progress-timer').timer(10, 'End Phase', 3);
      }
    });

    socket.on('client_gamestart', function(data) {
      console.log(data);
      $("#WaitingModal").modal('hide');
      const team_red = Object.keys(data).filter((key) => {
        return data[key].team == "red";
      });
      const team_blu = Object.keys(data).filter((key) => {
        return data[key].team == "blue";
      });
      console.log(data[team_red].userName, data[team_blu].userName);
      battleStart({
        red: data[team_red].userName,
        blue: data[team_blu].userName
      });
    });
  });

  window.document.onkeydown = function() {
    if (event.key == "Shift") {
      console.log(paintType);
      paintType = types.clear;
      //透過処理
      ctx.globalAlpha = 0.5;
    }
  };

  window.document.onkeyup = function() {
    if (event.key == "Shift") {
      console.log("up");
      paintType = types.draw;
      ctx.globalAlpha = 1.0;
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
              step: step
            };
            if (step == 1) {
              //next step
              sender.playerdata = move_players;
              sender.step += 1;
            } else if (step == 2) {
              sender.playerdata = move_players;
            } else if (step == 3) {
              return;
            }
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
};
// console.log(dir);
