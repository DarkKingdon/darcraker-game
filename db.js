const mysql = require('mysql2');

// Configuração do Pool
const pool = mysql.createPool(process.env.MYSQL_URL || {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'darcraker',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true, // Ajuda a manter a conexão ativa no Railway
  keepAliveInitialDelay: 10000
});

// Exporta como Promise para você usar o 'await' no app.js
module.exports = pool.promise();