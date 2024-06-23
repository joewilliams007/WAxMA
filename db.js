const mysql = require('mysql'); // Database connection
const config = require("./config").config;

const connection = mysql.createPool({
    host: config.databaseHost,
    user: config.databaseUser,
    password: config.databasePassword,
    database: config.databaseName,
    charset: 'utf8mb4',
    dateStrings: true
});

module.exports = connection;