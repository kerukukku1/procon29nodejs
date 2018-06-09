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
  var socket = io.connect("http://localhost:8888/");
  var canvas = document.getElementById("myCanvas");
  var ctx = canvas.getContext("2d");
  var square_size = 50
  var w;
  var h;
  var pos;
  var state = [];
  let path = location.pathname;
  var colors = {
    red: "#FF4081",
    blue: "#03A9F4",
    white: "#FFFFFF"
  };
  var jblue = document.getElementById("joinBlue");
  var jred = document.getElementById("joinRed");
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
      var turn = parseInt(arr[0]);
      w = parseInt(arr[1]);
      h = parseInt(arr[2]);
      canvas.width = w * square_size + 1.5;
      canvas.height = h * square_size + 1;
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



  document.getElementById("startbutton").onclick = function() {
    var d = {
      turn: 3,
      span: 1000
    };
    socket.emit('gamestart', d);
  };
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

  canvas.addEventListener("mousedown", function(event) {
    if (user_status.team == "") return;
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
      if (group == "A") {
        var tmp = (data.player.team == "red") ? move_players.red.A : move_players.blue.A;
        var tmp2 = (data.player.team == "red") ? players.red.A : players.blue.A;
        console.log(tmp2, tmp);
        if (tmp.x >= 0 || tmp.y >= 0) {
          var flag = equalsObject(tmp, tmp2);
          paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "A" : "", flag ? "white" : "black");
        }
        if(data.player.team == "red"){
          move_players.red.A = coord;
        }else move_players.blue.A = coord;
      } else if (group == "B") {
        var tmp = (data.player.team == "red") ? move_players.red.B : move_players.blue.B;
        var tmp2 = (data.player.team == "red") ? players.red.B : players.blue.B;
        console.log(tmp2, tmp);
        var flag = equalsObject(tmp, tmp2);
        if (tmp.x >= 0 || tmp.y >= 0) {
          paintCell(tmp.x, tmp.y, state[tmp.y][tmp.x], flag ? "B" : "", flag ? "white" : "black");
        }
        if(data.player.team == "red"){
          move_players.red.B = coord;
        }else move_players.blue.B = coord;
      }
      // state[coord.y][coord.x].color = c;
      var nowx = coord.x;
      var nowy = coord.y;
      var dummy = {
        score: state[coord.y][coord.x].score,
        color: c
      };
      paintCell(nowx, nowy, dummy, "*", "white");
    });
    socket.on('Someone_Entried', function(data) {
      if (data.team == "red") {
        if (user_status.team == "") jred.disabled = true;
        jred.textContent = "Team Red : " + data.userName;
      } else {
        if (user_status.team == "") jblue.disabled = true;
        jblue.textContent = "Team Blue : " + data.userName;
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
  });

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
      maps: state
    };
  }

  function objectCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function equalsObject(obj1, obj2) {
    return JSON.stringify(obj1) == JSON.stringify(obj2);
  }
};
// console.log(dir);
