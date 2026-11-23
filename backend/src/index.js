require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const pool = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const apiRoutes = require('./routes/api.routes');

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true, db: true });
  } catch (err) {
    res.status(500).json({ ok: false, db: false, error: err.message });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

async function ensureAdmin() {
  try {
    const [rows] = await pool.query(
      "SELECT id FROM users WHERE email = 'admin@crwn.local' LIMIT 1"
    );
    if (!rows.length) {
      const hash = await bcrypt.hash('Admin@123', 10);
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, is_admin)
         VALUES ('admin-root', 'admin@crwn.local', ?, 'Admin', 1)`,
        [hash]
      );
      console.log('Seeded admin@crwn.local / Admin@123');
    }
  } catch (err) {
    console.warn('Admin seed skipped:', err.message);
  }
}

const port = Number(process.env.PORT || 5000);
app.listen(port, async () => {
  console.log(`API running on http://localhost:${port}`);
  await ensureAdmin();
});
