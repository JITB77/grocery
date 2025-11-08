require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ Database connection error:', err.message));

// ✅ Export an object with .query so db.query() works
module.exports = {
  query: (text, params) => pool.query(text, params),
};
