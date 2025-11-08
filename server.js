// server.js
const express = require('express');
const path = require('path');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;



const app = express();
const PORT = 3000;


// Static files (serve /public/index.html, style.css, etc.)
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get("/", (req, res) => {
  res.redirect("/login.html");
});


// ---------- Health check ----------
const db = require('./db'); // import your connection

app.get('/api/test-db', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({ connected: true, time: result.rows[0].now });
  } catch (err) {
    console.error('Database test failed:', err);
    res.status(500).json({ connected: false, error: err.message });
  }
});

// ---------- Read grocery items for a user (PENDING ONLY) ----------
app.get('/api/items/:userId', async (req, res) => {
  try {
    console.log('>> GET /api/items', req.params);
    const result = await db.query(
  `SELECT id, item_name, quantity, notes, is_bought, created_at
   FROM grocery_items
   WHERE user_id = $1
     AND (is_bought IS NULL OR is_bought = FALSE)
     AND (notes IS NULL OR notes <> 'Quick buy')
   ORDER BY created_at DESC`,
  [req.params.userId]
);
res.json(result.rows);

    res.json(rows);
  } catch (err) {
    console.error('GET /api/items/:userId error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});


// ---------- Recommendations: Co-purchased items by frequency ----------
app.get('/api/recommendations/:userId', async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) return res.status(400).json({ error: 'Invalid user ID' });

  try {
    console.log(`📊 Generating co-purchase recommendations for user ${userId}`);

    const result = await db.query(
  `
  WITH recent_items AS (
    SELECT DISTINCT item_name
    FROM purchase_history
    WHERE user_id = $1
      AND purchased_on >= NOW() - INTERVAL '7 days'
  ),
  related_users AS (
    SELECT DISTINCT ph.user_id
    FROM purchase_history ph
    JOIN recent_items ri ON ph.item_name = ri.item_name
    WHERE ph.user_id <> $1
  ),
  co_purchases AS (
    SELECT ph2.item_name
    FROM purchase_history ph1
    JOIN purchase_history ph2
      ON ph1.user_id = ph2.user_id
      AND DATE(ph1.purchased_on) = DATE(ph2.purchased_on)
    WHERE ph1.item_name IN (SELECT item_name FROM recent_items)
      AND ph1.user_id IN (SELECT user_id FROM related_users)
      AND ph2.item_name NOT IN (SELECT item_name FROM recent_items)
  )
  SELECT item_name, COUNT(*) AS freq
  FROM co_purchases
  GROUP BY item_name
  ORDER BY freq DESC
  LIMIT 5;
  `,
  [userId]
);

res.json(result.rows);


    console.log('✅ Recommendations generated:', rows);
    res.json(rows);
  } catch (err) {
    console.error('❌ Recommendation error:', err.message, err.sqlMessage);
    res.status(500).json({ error: err.message || 'Failed to generate recommendations' });
  }
});



// ---------- Read purchase history for a user ----------
app.get('/api/history/:userId', async (req, res) => {
  try {
    console.log('>> GET /api/history', req.params);
    const result = await db.query(
  `SELECT item_name, purchased_on
   FROM purchase_history
   WHERE user_id = $1
   ORDER BY purchased_on DESC`,
  [req.params.userId]
);
res.json(result.rows);

    res.json(rows);
  } catch (err) {
    console.error('GET /api/history/:userId error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// ---------- LOGIN ----------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    console.log('Login attempt:', email);

    // Fetch user with hashed password
    const result = await db.query(
  'SELECT id, name, password_hash FROM users WHERE email = $1',
  [email]
);

if (result.rows.length === 0) {
  console.log('Invalid credentials: no such user');
  return res.status(401).json({ error: 'Invalid email or password' });
}

const user = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      console.log('Invalid credentials: wrong password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Login success for', user.name);
    res.json({ id: user.id, name: user.name });
  } catch (err) {
    console.error('POST /api/login error:', err);
    res.status(500).json({ error: 'Database error during login', detail: err.message });
  }
});

// ---------- Add a new grocery item (pending) ----------
app.post('/api/items', async (req, res) => {
  console.log('>> POST /api/items', req.body);
  const { user_id, item_name, quantity, notes } = req.body || {};
  const name = (item_name || '').trim();

  if (!user_id || !name) {
    return res.status(400).json({ error: 'user_id and item_name are required' });
  }

  try {
    const result = await db.query(
  `INSERT INTO grocery_items (user_id, item_name, quantity, notes)
   VALUES ($1, $2, $3, $4)
   RETURNING id`,
  [user_id, name, quantity || null, (notes && notes.trim()) || null]
);
res.json({ message: 'Item added successfully', id: result.rows[0].id });

  } catch (err) {
    console.error('POST /api/items error:', err);
    res.status(500).json({ error: err.message || 'Database error' });
  }
});


// ------------- Register a new user --------------- //
app.post('/api/register', async (req, res) => {
  const { name, email, password } = req.body || {};

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    // Check if user already exists
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert new user and return ID
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [name, email, password_hash]
    );

    res.json({ message: 'User registered successfully', id: result.rows[0].id });
  } catch (err) {
    console.error('POST /api/register error:', err);
    res.status(500).json({
      error: 'Database error during registration',
      detail: err.message
    });
  }
});


// ---------- Create a purchase history record (Quick Buy mirror) ----------
app.post('/api/history', async (req, res) => {
  console.log('>> POST /api/history', req.body);

  const { user_id, item_name } = req.body || {};
  const name = (item_name || '').trim();

  // 🧩 Validate input
  if (!user_id || !name) {
    return res.status(400).json({ error: 'user_id and item_name are required' });
  }

  try {
    // 🧠 Ensure the user exists first (avoid foreign key violation)
    const userCheck = await db.query(`SELECT id FROM users WHERE id = $1`, [user_id]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: `User ${user_id} does not exist` });
    }

    // 📝 Insert the purchase into purchase_history
    const result = await db.query(
      `INSERT INTO purchase_history (user_id, item_name)
       VALUES ($1, $2)
       RETURNING id`,
      [user_id, name]
    );

    // ✅ Send back a confirmation
    res.json({
      message: 'Purchase recorded successfully',
      id: result.rows[0].id
    });

  } catch (err) {
    console.error('POST /api/history error:', err);
    res.status(500).json({
      error: err.message || 'Database error while recording purchase'
    });
  }
});




/// ---------- Delete a grocery item ----------
app.delete('/api/items/:id', async (req, res) => {
  const idRaw = req.params.id;
  const userIdRaw = req.query.userId;
  console.log('DELETE /api/items/:id called with', { idRaw, userIdRaw });

  const id = Number(idRaw);
  const userId = Number(userIdRaw);

  // 🧩 Input validation
  if (!id || !userId) {
    console.error('Delete validation failed', { id, userId });
    return res.status(400).json({
      ok: false,
      error: 'Both id (param) and userId (query) are required'
    });
  }

  try {
    // 🗑️ Perform the delete using PostgreSQL placeholders
    const result = await db.query(
      'DELETE FROM grocery_items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    console.log('DELETE result:', result.rowCount);

    // 🚫 If no rows were deleted, the item doesn’t exist or doesn’t belong to the user
    if (result.rowCount === 0) {
      return res.status(404).json({
        ok: false,
        error: 'Item not found (wrong id or userId)'
      });
    }

    // ✅ Successful deletion
    res.json({ ok: true, message: 'Item deleted successfully' });

  } catch (err) {
    console.error('DELETE /api/items/:id error:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Database error while deleting item'
    });
  }
});


// ---------- Mark item complete: move from grocery_items -> purchase_history ----------
app.post('/api/items/:id/complete', async (req, res) => {
  const id = Number(req.params.id);
  const userId = Number(req.body?.user_id ?? req.query?.userId);

  // 🧩 Input validation
  if (!Number.isInteger(id) || !Number.isInteger(userId) || id <= 0 || userId <= 0) {
    return res.status(400).json({
      ok: false,
      error: 'Invalid or missing item id / userId'
    });
  }

  const client = await db.connect(); // PostgreSQL client connection

  try {
    await client.query('BEGIN'); // start transaction
    console.log(`Processing complete request for user ${userId}, item ${id}`);

    // ✅ Check if user exists
    const userCheck = await client.query(`SELECT id FROM users WHERE id = $1`, [userId]);
    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, error: `User ${userId} does not exist` });
    }

    // ✅ Fetch the item
    const itemRes = await client.query(
      `SELECT item_name FROM grocery_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (itemRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Item not found for this user' });
    }

    const { item_name } = itemRes.rows[0];

    // ✅ Insert into purchase_history
    await client.query(
      `INSERT INTO purchase_history (user_id, item_name)
       VALUES ($1, $2)`,
      [userId, item_name]
    );

    // ✅ Delete from grocery_items
    const deleteRes = await client.query(
      `DELETE FROM grocery_items WHERE id = $1 AND user_id = $2`,
      [id, userId]
    );

    if (deleteRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, error: 'Delete failed: item disappeared' });
    }

    await client.query('COMMIT'); // finalize transaction

    console.log(`✅ Item ${id} completed for user ${userId}`);
    res.json({ ok: true, message: 'Item completed and moved to history' });

  } catch (err) {
    await client.query('ROLLBACK'); // undo if error
    console.error('POST /api/items/:id/complete error:', err);
    res.status(500).json({
      ok: false,
      error: err.message || 'Database error during item completion'
    });
  } finally {
    client.release(); // always release client back to pool
  }
});




// ---------- Start ----------
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
