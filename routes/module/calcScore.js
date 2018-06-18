const dx4 = [1, 0, -1, 0];
const dy4 = [0, -1, 0, 1];
//スコアの計算
function calcScore(mapData, mapWidth, mapHeight, colordata) {
  var player1TileScore = 0;
  var player2TileScore = 0;
  var player1TerritoryScore = 0;
  var player2TerritoryScore = 0;

  //タイルスコアの計算
  for (var i = 0; i < mapHeight; i++) {
    for (var j = 0; j < mapWidth; j++) {
      if (mapData[i][j].color == colordata.red) {
        player1TileScore += mapData[i][j].score;
      } else if (mapData[i][j].color == colordata.blue) {
        player2TileScore += mapData[i][j].score;
      }
    }
  }

  //領域スコアの計算
  var used = {};
  for(var key in colordata){
    used[String(key)] = prep2D(21,21);
  }
  for (var nowY = 0; nowY < mapHeight; nowY++) {
    for (var nowX = 0; nowX < mapWidth; nowX++) {
      for(var nowTeam in colordata){
        nowTeam = String(nowTeam);
        if(nowTeam == "white")continue;
        if (used[nowTeam][nowY][nowX]) {
          continue;
        }
        var nowScore = 0;
        var noneScoreFlag = false;
        var que = new Queue();
        que.push({
          x: nowX,
          y: nowY
        });
        while (!que.empty()) {
          var nowP = que.front();
          que.pop();
          if (nowP.x < 0 || nowP.y < 0 || nowP.x >= mapWidth || nowP.y >= mapHeight) {
            nowScore = 0;
            noneScoreFlag = true;
            continue;
          }
          if (used[nowTeam][nowP.y][nowP.x]) continue;
          if (mapData[nowP.y][nowP.x].color == colordata[nowTeam]) continue;
          used[nowTeam][nowP.y][nowP.x] = true;
          nowScore += Math.abs(mapData[nowP.y][nowP.x].score);

          for (var i = 0; i < 4; i++) {
            var tx = nowP.x + dx4[i];
            var ty = nowP.y + dy4[i];
            if (tx < 0 || ty < 0 || tx >= mapWidth || ty >= mapHeight) {
              nowScore = 0;
              noneScoreFlag = true;
              continue;
            }

            if (mapData[nowP.y][nowP.x].color == colordata[nowTeam]) continue;
            if (used[nowTeam][ty][tx] == true) continue;
            que.push({
              x: tx,
              y: ty
            });
          }
        }
        if (noneScoreFlag) nowScore = 0;
        if (nowTeam == "red") {
          player1TerritoryScore += nowScore;
        } else if (nowTeam == "blue") {
          player2TerritoryScore += nowScore;
        }
      }
    }
  }
  return {
    red: player1TileScore + player1TerritoryScore,
    blue: player2TileScore + player2TerritoryScore
  }
}

function prep2D(x, y) {
  var a = [];
  for (var i = 0; i < x; i++) {
    a[i] = new Array(y);
  }
  return a;
}

function prep3D(x, y, z) {
  var a = [];
  for (var i = 0; i < x; i++) {
    a[i] = new Array(y);
    for (var j = 0; j < y; j++) {
      a[i][j] = new Array(z);
    }
  }
  return a;
}

function Queue() {
  this.data = [];
}
Queue.prototype.push = function(val) {
  this.data.push(val);
  return val;
}
Queue.prototype.pop = function() {
  return this.data.shift();
}
Queue.prototype.front = function() {
  return this.data[0];
}
Queue.prototype.size = function() {
  return this.data.length;
}
Queue.prototype.empty = function() {
  return this.data.length == 0;
}
