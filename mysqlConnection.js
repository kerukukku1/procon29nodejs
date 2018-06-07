var mysql = require('mysql');

var dbConfig = {
  host : '127.0.0.1',
  user: 'procon',
  password: '@Procon29',
  database: 'nodejs'
};

var connection = mysql.createConnection(dbConfig);

module.exports = connection;
