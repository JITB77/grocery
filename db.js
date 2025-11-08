// db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err.message));

module.exports = pool; // 👈 Export the pool directly
