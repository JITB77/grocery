// config/database.js
require('dotenv').config();
const { Pool } = require('pg');

// create a connection pool using Railway connection string
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

module.exports = pool;