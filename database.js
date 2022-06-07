const mysql = require("mysql2");
const conn = mysql
  .createPool({
    host: process.env.DB_HOST ?? "localhost",
    // port: process.env.DB_PORT ?? 8000,
    user: process.env.DB_USER ?? "root",
    password: process.env.DB_PASS ?? "password",
    database: process.env.DB_DATABASE ?? "login_register",
    connectionLimit: 10
  })
  .promise();

module.exports = conn;
