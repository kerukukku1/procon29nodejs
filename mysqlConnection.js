var mysql = require('mysql');

var dbConfig = {
  host : '127.0.0.1',
  user: 'root',
  password: 'x98tfggdhxr6',
  database: 'nodejs'
};

var connection = mysql.createConnection(dbConfig);

module.exports = connection;
