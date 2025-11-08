// db.js
require('dotenv').config();
const { Pool } = require('pg');

// Initialize a PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING, // Railway/PostgreSQL env var
  ssl: {
    rejectUnauthorized: false, // required for Railway or other hosted PG
  },
});

// Test connection once on startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => console.error('❌ Database connection error:', err.message));

// Export both .query() and .connect() for flexibility
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
