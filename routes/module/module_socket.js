var http = require('http');
var fs = require('fs');
const mongoose = require('mongoose');
const Cat = mongoose.model('Cat', {
  mapdata: [
    [Number]
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

//接続確立時の処理
io.sockets.on('connection', function(socket) {
  // この中でデータのやり取りを行う
  console.log('connected');
  socket.on("MapDataSync", function(data) {
    // console.log("start");
    // timeKeeper(3);
    socket.join(data.roomId);
    console.log(data);
    // socket.broadcast.emit("square", data);
    io.sockets.in(data.roomId).emit("movePlayer", data);
    const kitty = new Cat({
      mapdata: data.maps,
      roomid: data.roomId
    });
    kitty.save(function(err) {
      console.log('meow')
      if (err) throw err;
    });
  });

  socket.on("gamestart", function(data){
    timeKeeper(data.turn, data.span, data.turn);
  });

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

function timeKeeper(turn, span){
  if(turn == 0)return;
  setTimeout(function(){
    console.log(turn);
    timeKeeper(turn-1, span);
  },span);
}
