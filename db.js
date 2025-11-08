// db.js
require('dotenv').config();
const { Pool } = require('pg');

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.CONNECTION_STRING,
  ssl: {
    rejectUnauthorized: false, // needed for Railway and other hosted PG
  },
});

// Test the connection once on startup
pool.connect()
  .then(client => {
    console.log('✅ Connected to PostgreSQL database');
    client.release();
  })
  .catch(err => console.error('❌ Database connection error:', err.message));

// ✅ Export both .query() and .connect() for flexible use
module.exports = {
  query: (text, params) => pool.query(text, params),
  connect: () => pool.connect(),
};
