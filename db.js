const mysql = require('mysql2');

// O Railway preenche a variável process.env.MYSQL_URL automaticamente quando conectamos os serviços
const pool = mysql.createPool(process.env.MYSQL_URL || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'darcraker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool.promise();