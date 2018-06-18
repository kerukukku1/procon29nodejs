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
  var used = prep3D(21, 21, 3);
  for (var nowY = 0; nowY < mapHeight; nowY++) {
    for (var nowX = 0; nowX < mapWidth; nowX++) {
      for (var nowTeam = 1; nowTeam <= 2; nowTeam++) {
        if (used[nowY][nowX][nowTeam]) {
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
          if (used[nowP.y][nowP.x][nowTeam]) continue;
          if (mapData[nowP.y][nowP.x].color == ((nowTeam == 1) ? colordata.red : colordata.blue)) continue;
          used[nowP.y][nowP.x][nowTeam] = true;
          nowScore += Math.abs(mapData[nowP.y][nowP.x]);

          for (var i = 0; i < 4; i++) {
            var tx = nowP.x + dx4[i];
            var ty = nowP.y + dy4[i];
            if (tx < 0 || ty < 0 || tx >= mapWidth || ty >= mapHeight) {
              nowScore = 0;
              noneScoreFlag = true;
              continue;
            }

            if (mapData[nowP.y][nowP.x].color == ((nowTeam == 1) ? colordata.red : colordata.blue)) continue;
            if (used[tx][ty][nowTeam] == true) continue;
            que.push({
              x: tx,
              y: ty
            });
          }
        }
        if (noneScoreFlag) nowScore = 0;
        if (nowTeam == 1) {
          player1TerritoryScore += nowScore;
        } else if (nowTeam == 2) {
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
