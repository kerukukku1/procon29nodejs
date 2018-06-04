var socket = io.connect("http://localhost:8888/");
var canvas = document.getElementById("myCanvas");
// console.log(dir);
var ctx = canvas.getContext("2d");
var square_size = 50
var w;
var h;
var pos;
var state = [];
var colors = ["#FF4081", "#03A9F4", "#FFFFFF"];
initCanvas();
//サーバにファイル要求を出してファイルを取得
function initCanvas() {
  socket.emit('readfile', dir);
  socket.on('filedata', function(data) {
    var arr = data.text.split('\n');
    console.log(arr);
    var turn = parseInt(arr[0]);
    w = parseInt(arr[1]);
    h = parseInt(arr[2]);
    canvas.width = w * square_size+1.5;
    canvas.height = h * square_size+1;
    ctx.strokeStyle = "#757575"
    ctx.lineWidth = 0.5;
    ctx.translate(0.5, 0.5);
    ctx.textAlign = "center";
    var i;
    for (i = 0; i < h; i++) {
      var row = arr[3 + i];
      var elems = row.split(' ');
      for (var j = 0; j < w; j++) {
        var score = elems[j];
        paintCell(j*square_size, i*square_size, score, colors[2], "");
      }
      state.push(elems);
    }
    //bias
    i+=3;
    var npos;
    npos = arr[i].split(' ').map(e => parseInt(e));
    paintCell(npos[0]*square_size, npos[1]*square_size, state[npos[1]][npos[0]], colors[0], "A");
    npos = arr[i+1].split(' ').map(e => parseInt(e));
    paintCell(npos[0]*square_size, npos[1]*square_size, state[npos[1]][npos[0]], colors[0], "B");
    npos = arr[i+2].split(' ').map(e => parseInt(e));
    paintCell(npos[0]*square_size, npos[1]*square_size, state[npos[1]][npos[0]], colors[1], "A");
    npos = arr[i+3].split(' ').map(e => parseInt(e));
    paintCell(npos[0]*square_size, npos[1]*square_size, state[npos[1]][npos[0]], colors[1], "B");
  });
}

function paintCell(posx, posy, score, c, player){
  ctx.fillStyle = c;
  ctx.font = "20px bold";
  ctx.fillRect(posx, posy, square_size, square_size);
  ctx.rect(posx, posy, square_size, square_size);
  ctx.stroke();
  ctx.fillStyle = "#333333";
  ctx.fillText(score, posx + (square_size / 2), posy + (square_size / 2), 1000);
  ctx.fillStyle = "#333333";
  ctx.font = "15px bold";
  ctx.fillText(player, posx + square_size - 10, posy + square_size - 5, 1000);
}

canvas.addEventListener("mousedown", function(event) {
  d = getData(event);
  console.log(d);
  socket.emit('movePlayer', d);
}, false);
socket.on('connect', function() {
  console.log("CLIENT");
  socket.on('movePlayer', function(data) {
    console.log("on draw : " + data.roomId);
    var coord = whoSquare(data);
    var c = (state[coord.y][coord.x].color + 1) % 2;
    state[coord.y][coord.x].color = c;
    ctx.fillStyle = colors[c];
    var nowx = coord.x * square_size;
    var nowy = coord.y * square_size;
    var score = state[coord.y][coord.x].score;
    ctx.fillRect(nowx, nowy, square_size, square_size);
    ctx.rect(nowx, nowy, square_size, square_size);
    console.log(nowx, nowy);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText(score, nowx + (square_size / 2), nowy + (square_size / 2), 1000);
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
  var mouseX = event.clientX - $(canvas).position().left + scrollX();
  var mouseY = event.clientY - $(canvas).position().top + scrollY();
  return {
    x: mouseX - 0.5,
    y: mouseY - 0.5,
    roomId: roomid,
    userId: userid
  };
}
