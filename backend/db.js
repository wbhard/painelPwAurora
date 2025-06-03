const mysql = require('mysql2');

const pool = mysql.createPool({
  host: '192.168.0.112', // IP do servidor VirtualBox
  user: 'root',          // Usuário do MariaDB
  password: 'root', // Senha correta do MariaDB
  database: 'pw',        // Nome do banco (Perfect World)
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306             // Porta padrão do MySQL/MariaDB
});

module.exports = pool.promise();
