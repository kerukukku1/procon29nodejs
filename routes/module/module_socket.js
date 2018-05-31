var http = require('http');
var fs = require('fs');
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
  socket.on("square", function(data) {
    console.log(data);
    socket.broadcast.emit("square", data);
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
