// config/seed-db.js
import { pool } from './db.js';

const PASSWORD_HASH = '$2b$10$h64ReyirqJmHbpiVB5rIR.RUOQHnCW0Q8AxexbMRSE/cwDF7Nhfmq';

// --- Drop tables ---
const dropTables = async () => {
  try {
    console.log('🧨 Dropping tables...');
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

// --- Create tables ---
const createTables = async () => {
  try {
    console.log('🧱 Creating tables...');
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

// --- Seed data ---
const insertSeedData = async () => {
  try {
    console.log('🌱 Inserting seed data...');

    // Users
    await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES
         ('Abai', 'abai@example.com', $1),
         ('John Doe', 'john@example.com', $1),
         ('PowerUser', 'power@example.com', $1);`,
      [PASSWORD_HASH]
    );

    // Grocery items
    await pool.query(`
      INSERT INTO grocery_items (user_id, item_name, quantity, notes)
      VALUES 
        (1, 'Milk', '2 Liters', 'Organic preferred'),
        (1, 'Bread', '1 Loaf', 'Whole grain'),
        (2, 'Eggs', '12 pcs', 'Free-range eggs'),
        (2, 'Apples', '6 pcs', 'Green apples');
    `);

    // Purchase history for users 1 and 2
    await pool.query(`
      INSERT INTO purchase_history (user_id, item_name)
      VALUES
        (1, 'Milk'),
        (1, 'Bread'),
        (2, 'Eggs'),
        (2, 'Apples');
    `);

    // Power user (user 3) purchase history
    await pool.query(`
      INSERT INTO purchase_history (user_id, item_name, purchased_on)
      VALUES
        (3, 'Milk', NOW() - INTERVAL '1 day'),
        (3, 'Bread', NOW() - INTERVAL '2 day'),
        (3, 'Eggs', NOW() - INTERVAL '3 day'),
        (3, 'Butter', NOW() - INTERVAL '4 day'),
        (3, 'Cheese', NOW() - INTERVAL '5 day'),
        (3, 'Apples', NOW() - INTERVAL '1 day'),
        (3, 'Bananas', NOW() - INTERVAL '2 day'),
        (3, 'Tomatoes', NOW() - INTERVAL '3 day'),
        (3, 'Onions', NOW() - INTERVAL '4 day'),
        (3, 'Chicken', NOW() - INTERVAL '5 day'),
        (3, 'Rice', NOW() - INTERVAL '1 day'),
        (3, 'Pasta', NOW() - INTERVAL '2 day'),
        (3, 'Coffee', NOW() - INTERVAL '3 day'),
        (3, 'Sugar', NOW() - INTERVAL '4 day'),
        (3, 'Juice', NOW() - INTERVAL '5 day');
    `);

    console.log('✅ Seed data inserted successfully.');
  } catch (err) {
    console.error('❌ Error inserting seed data:', err);
  }
};

// --- Setup runner ---
const setup = async () => {
  try {
    await dropTables();
    await createTables();
    await insertSeedData();
  } catch (err) {
    console.error('❌ Error during setup:', err);
  } finally {
    await pool.end();
    console.log('🏁 Database setup complete and connection closed.');
  }
};

setup();
