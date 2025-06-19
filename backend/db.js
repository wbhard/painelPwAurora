import mysql from 'mysql2';

const pool = mysql.createPool({
  host: '192.168.0.105',
  user: 'root',
  password: 'root',
  database: 'pw',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306
});

export default pool.promise();
