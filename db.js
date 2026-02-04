const mysql = require('mysql2');

// Configuração do Pool
// Preferimos usar a variável de ambiente MYSQL_URL do Railway
// Se não houver, usamos os dados que você passou
const pool = mysql.createPool(process.env.MYSQL_URL || {
  host: 'maglev.proxy.rlwy.net',
  user: 'root',
  password: 'gMDLeOTiQxbIrJNEAtcNaQZhFoOaTBPw',
  database: 'railway',
  port: 25198,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// Exporta como Promise para você usar o 'await' no app.js
module.exports = pool.promise();