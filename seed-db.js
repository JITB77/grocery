// config/seed-db.js
import { pool } from './db.js';


const dropTables = async () => {
  try {
    console.log('Dropping tables...');
    const query = `
      DROP TABLE IF EXISTS recommendations CASCADE;
      DROP TABLE IF EXISTS purchase_history CASCADE;
      DROP TABLE IF EXISTS grocery_items CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `;
    await pool.query(query);
    console.log('✅ Tables dropped successfully.');
  } catch (err) {
    console.error('❌ Error dropping tables:', err);
  }
};

const createTables = async () => {
  try {
    console.log('Creating tables...');
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS grocery_items (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        quantity VARCHAR(50),
        notes VARCHAR(255),
        is_bought BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS purchase_history (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        purchased_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS recommendations (
        id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_name VARCHAR(100) NOT NULL,
        score INT DEFAULT 0,
        generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('✅ Tables created successfully.');
  } catch (err) {
    console.error('❌ Error creating tables:', err);
  }
};


const setup = async () => {
  try {
    await dropTables();
    await createTables();
  } catch (err) {
    console.error('❌ Error during setup:', err);
  } finally {
    await pool.end();
    console.log('Database setup complete and connection closed.');
  }
};

setup();
