var socket = io.connect("http://localhost:8888/");
var canvas = document.getElementById("myCanvas");
// console.log(dir);
var ctx = canvas.getContext("2d");
var square_size = 50
var w = square_size * 16;
var h = w;
var pos;
var state = [];

//サーバにファイル要求を出してファイルを取得
socket.on('connect', function() {
  socket.emit('readfile', dir);
  socket.on('filedata', function(data){
    console.log(data.text);
  });
});
canvas.width = w;
canvas.height = h;
ctx.strokeStyle = "#757575"
ctx.lineWidth = 0.5;
ctx.translate(0.5, 0.5);
ctx.textAlign = "center";
var colors = ["#FF4081", "#03A9F4"];
for (var i = 0; i < 16; i++) {
  var objs = [];
  for (var j = 0; j < 16; j++) {
    var rnd = Math.random() * 10;
    var score = parseInt(Math.random() * 33 - 16, 10);
    var obj = {
      color: (rnd < 5 ? 0 : 1),
      score : score
    };
    objs[j] = obj;
    ctx.fillStyle = colors[obj.color]
    var nowx = j * square_size;
    var nowy = i * square_size;
    ctx.font = "20px bold";
    ctx.fillRect(nowx, nowy, square_size, square_size);
    ctx.rect(nowx, nowy, square_size, square_size);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText(score, nowx+(square_size/2), nowy+(square_size/2), 1000);
  }
  state.push(objs);
}


canvas.addEventListener("mousedown", function(event) {
  pos = getPos(event);
  console.log(pos);
  socket.emit('square', pos);
}, false);
socket.on('connect', function() {
  console.log("CLIENT");
  socket.on('square', function(data) {
    console.log("on draw : " + data);
    var coord = whoSquare(data);
    var c = (state[coord.y][coord.x].color+1)%2;
    state[coord.y][coord.x].color = c;
    ctx.fillStyle = colors[c];
    var nowx = coord.x*square_size;
    var nowy = coord.y*square_size;
    var score = state[coord.y][coord.x].score;
    ctx.fillRect(nowx, nowy, square_size, square_size);
    ctx.rect(nowx, nowy, square_size, square_size);
    console.log(nowx, nowy);
    ctx.stroke();
    ctx.fillStyle = "white";
    ctx.fillText(score, nowx+(square_size/2), nowy+(square_size/2), 1000);
  });
});

function whoSquare(data){
  var x = parseInt(data.x, 10);
  var y = parseInt(data.y, 10);
  var chx = parseInt(x / square_size, 10);
  var chy = parseInt(y / square_size, 10);
  return {
    x : chx,
    y : chy,
  }
}

function scrollX() {
  return document.documentElement.scrollLeft || document.body.scrollLeft;
}

function scrollY() {
  return document.documentElement.scrollTop || document.body.scrollTop;
}

function getPos(event) {
  var mouseX = event.clientX - $(canvas).position().left + scrollX();
  var mouseY = event.clientY - $(canvas).position().top + scrollY();
  return {
    x: mouseX - 0.5,
    y: mouseY - 0.5
  };
}
