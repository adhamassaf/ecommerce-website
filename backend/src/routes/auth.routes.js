const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const { id } = require('../utils');
const { authRequired } = require('../middleware/auth');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    {
      uid: user.id,
      email: user.email,
      isAdmin: Boolean(user.is_admin),
    },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const publicUser = (row) => ({
  uid: row.id,
  email: row.email,
  displayName: row.display_name || '',
  displayNameAr: row.display_name_ar || '',
  photoURL: row.photo_url || '',
  phone: row.phone || '',
  isAdmin: Boolean(row.is_admin),
  disabled: Boolean(row.disabled),
});

router.post('/register', async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const displayName = String(req.body.displayName || '').trim();

    if (!email || password.length < 6) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [
      email,
    ]);
    if (exists.length) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const userId = id('u_');
    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      `INSERT INTO users (id, email, password_hash, display_name, is_admin)
       VALUES (?, ?, ?, ?, 0)`,
      [userId, email, passwordHash, displayName]
    );

    const user = {
      id: userId,
      email,
      display_name: displayName,
      photo_url: '',
      phone: '',
      is_admin: 0,
      disabled: 0,
    };
    const token = signToken(user);
    res.status(201).json({ token, user: publicUser(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Register failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();
    const password = String(req.body.password || '');
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [
      email,
    ]);
    if (!rows.length) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const row = rows[0];
    if (row.disabled) {
      return res.status(403).json({ message: 'Account disabled' });
    }
    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = signToken(row);
    res.json({ token, user: publicUser(row) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

router.get('/me', authRequired, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
      req.user.uid,
    ]);
    if (!rows.length) return res.status(404).json({ message: 'Not found' });
    if (rows[0].disabled) {
      return res.status(403).json({ message: 'Account disabled' });
    }
    res.json({ user: publicUser(rows[0]) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed' });
  }
});

module.exports = router;
