const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');
const { id, parseJson, locale } = require('../utils');
const { authRequired, adminRequired } = require('../middleware/auth');

const router = express.Router();

const j = (v) => JSON.stringify(v ?? null);

/* ---------- Users ---------- */
router.get('/users', authRequired, adminRequired, async (_req, res) => {
  try {
    let rows;
    try {
      [rows] = await pool.query(
        'SELECT id, email, display_name, display_name_ar, photo_url, phone, is_admin, disabled, created_at FROM users ORDER BY created_at DESC'
      );
    } catch {
      [rows] = await pool.query(
        'SELECT id, email, display_name, photo_url, phone, is_admin, disabled, created_at FROM users ORDER BY created_at DESC'
      );
    }
    res.json(
      rows.map((r) => ({
        id: r.id,
        uid: r.id,
        email: r.email,
        displayName: r.display_name,
        displayNameAr: r.display_name_ar || '',
        photoURL: r.photo_url || '',
        phone: r.phone,
        isAdmin: Boolean(r.is_admin),
        disabled: Boolean(r.disabled),
        createdAt: r.created_at,
      }))
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load users' });
  }
});

router.get('/users/:uid', authRequired, async (req, res) => {
  if (req.user.uid !== req.params.uid && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [
    req.params.uid,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  const r = rows[0];
  res.json({
    uid: r.id,
    email: r.email,
    displayName: r.display_name,
    displayNameAr: r.display_name_ar || '',
    photoURL: r.photo_url,
    phone: r.phone,
    isAdmin: Boolean(r.is_admin),
    disabled: Boolean(r.disabled),
  });
});

router.put('/users/:uid', authRequired, async (req, res) => {
  if (req.user.uid !== req.params.uid && !req.user.isAdmin) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const { displayName, displayNameAr, phone, photoURL } = req.body;
  const fields = [];
  const vals = [];
  if (displayName != null) {
    fields.push('display_name = ?');
    vals.push(String(displayName));
  }
  if (displayNameAr != null) {
    fields.push('display_name_ar = ?');
    vals.push(String(displayNameAr));
  }
  if (phone != null) {
    fields.push('phone = ?');
    vals.push(String(phone));
  }
  if (photoURL != null) {
    fields.push('photo_url = ?');
    vals.push(String(photoURL));
  }
  if (!fields.length) return res.json({ ok: true });
  vals.push(req.params.uid);
  try {
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, vals);
  } catch (err) {
    // retry without display_name_ar if column missing
    const safeFields = fields.filter((f) => !f.includes('display_name_ar'));
    if (safeFields.length === fields.length) throw err;
    const safeVals = [];
    if (displayName != null) safeVals.push(String(displayName));
    if (phone != null) safeVals.push(String(phone));
    if (photoURL != null) safeVals.push(String(photoURL));
    safeVals.push(req.params.uid);
    await pool.query(`UPDATE users SET ${safeFields.join(', ')} WHERE id = ?`, safeVals);
  }
  res.json({ ok: true });
});

/* ---------- Categories ---------- */
router.get('/categories', async (_req, res) => {
  const [cats] = await pool.query(
    'SELECT * FROM categories ORDER BY sort_order ASC, id ASC'
  );
  const [products] = await pool.query('SELECT * FROM products');
  const byCat = {};
  products.forEach((p) => {
    if (!byCat[p.category_id]) byCat[p.category_id] = [];
    byCat[p.category_id].push({
      id: p.id,
      name: parseJson(p.name_json, {}),
      description: parseJson(p.description_json, {}),
      price: Number(p.price),
      imageUrl: p.image_url || '',
    });
  });
  res.json(
    cats.map((c) => ({
      id: c.id,
      title: parseJson(c.title_json, {}),
      imageUrl: c.image_url || '',
      order: c.sort_order,
      items: byCat[c.id] || [],
    }))
  );
});

router.put('/categories/:id', authRequired, adminRequired, async (req, res) => {
  const title = locale(req.body.title);
  const imageUrl = String(req.body.imageUrl || '');
  const order = Number(req.body.order ?? 0);
  await pool.query(
    `INSERT INTO categories (id, title_json, image_url, sort_order)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE title_json=VALUES(title_json), image_url=VALUES(image_url), sort_order=VALUES(sort_order)`,
    [req.params.id, j(title), imageUrl, Number.isFinite(order) ? order : 0]
  );
  res.json({ ok: true });
});

router.delete('/categories/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM products WHERE category_id = ?', [req.params.id]);
  await pool.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Products ---------- */
router.put('/products/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const b = req.body || {};
    const productId = String(req.params.id || '').trim();
    if (!productId || productId === '[object Object]') {
      return res.status(400).json({ message: 'Invalid product id' });
    }
    const categoryId = String(b.categoryId || '').trim();
    if (!categoryId) {
      return res.status(400).json({ message: 'categoryId is required' });
    }
    const name = locale(b.name);
    if (!name.en) {
      return res.status(400).json({ message: 'Product name (en) is required' });
    }
    const price = Number(b.price);
    if (!Number.isFinite(price) || price < 0) {
      return res.status(400).json({ message: 'Invalid price' });
    }
    const imageUrl = String(b.imageUrl || '').trim();

    await pool.query(
      `INSERT INTO products (id, category_id, name_json, description_json, price, image_url)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE category_id=VALUES(category_id), name_json=VALUES(name_json),
         description_json=VALUES(description_json), price=VALUES(price), image_url=VALUES(image_url)`,
      [
        productId,
        categoryId,
        j(name),
        j(locale(b.description)),
        price,
        imageUrl,
      ]
    );
    res.json({ ok: true, id: productId });
  } catch (err) {
    console.error('[put-product]', err);
    res.status(500).json({ message: err.message || 'Failed to save product' });
  }
});

router.delete('/products/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM products WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Orders ---------- */
router.get('/orders', authRequired, async (req, res) => {
  let rows;
  if (req.user.isAdmin) {
    [rows] = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
  } else {
    [rows] = await pool.query(
      'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.uid]
    );
  }
  res.json(
    rows.map((o) => ({
      id: o.id,
      userId: o.user_id,
      userEmail: o.user_email,
      userName: o.user_name,
      items: parseJson(o.items_json, []),
      itemsCount: o.items_count,
      total: Number(o.total),
      shipping: parseJson(o.shipping_json, {}),
      paymentMethod: o.payment_method,
      paymentStatus: o.payment_status,
      status: o.status,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
    }))
  );
});

router.get('/orders/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM orders WHERE id = ?', [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  const o = rows[0];
  if (!req.user.isAdmin && o.user_id !== req.user.uid) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({
    id: o.id,
    userId: o.user_id,
    userEmail: o.user_email,
    userName: o.user_name,
    items: parseJson(o.items_json, []),
    itemsCount: o.items_count,
    total: Number(o.total),
    shipping: parseJson(o.shipping_json, {}),
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    status: o.status,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  });
});

router.post('/orders', authRequired, async (req, res) => {
  const b = req.body;
  const orderId = id('ord_');
  await pool.query(
    `INSERT INTO orders
     (id, user_id, user_email, user_name, items_json, items_count, total, shipping_json, payment_method, payment_status, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [
      orderId,
      req.user.uid,
      b.userEmail || req.user.email || '',
      b.userName || '',
      j(b.items || []),
      Number(b.itemsCount || (b.items || []).length || 0),
      Number(b.total || 0),
      j(b.shipping || {}),
      b.paymentMethod || 'cod',
      b.paymentStatus || 'pending',
    ]
  );
  res.status(201).json({ id: orderId });
});

router.patch('/orders/:id/status', authRequired, adminRequired, async (req, res) => {
  await pool.query('UPDATE orders SET status = ? WHERE id = ?', [
    req.body.status,
    req.params.id,
  ]);
  res.json({ ok: true });
});

/* ---------- Settings ---------- */
router.get('/settings/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT data_json FROM settings WHERE id = ?', [
    req.params.id,
  ]);
  if (!rows.length) return res.json({});
  res.json(parseJson(rows[0].data_json, {}));
});

router.put('/settings/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query(
    `INSERT INTO settings (id, data_json) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE data_json = VALUES(data_json)`,
    [req.params.id, j(req.body || {})]
  );
  res.json({ ok: true });
});

/* ---------- Contact ---------- */
router.post('/contact-messages', async (req, res) => {
  const b = req.body;
  const mid = id('msg_');
  await pool.query(
    `INSERT INTO contact_messages
     (id, name, email, phone, subject, message, status, custom_values_json)
     VALUES (?, ?, ?, ?, ?, ?, 'new', ?)`,
    [
      mid,
      b.name || '',
      b.email || '',
      b.phone || '',
      b.subject || '',
      b.message || '',
      j(b.customValues || []),
    ]
  );
  res.status(201).json({ id: mid });
});

router.get('/contact-messages', authRequired, adminRequired, async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM contact_messages ORDER BY created_at DESC'
  );
  res.json(
    rows.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      phone: m.phone,
      subject: m.subject,
      message: m.message,
      status: m.status,
      customValues: parseJson(m.custom_values_json, []),
      replyText: m.reply_text || '',
      repliedAt: m.replied_at,
      createdAt: m.created_at,
    }))
  );
});

router.patch('/contact-messages/:id', authRequired, adminRequired, async (req, res) => {
  const b = req.body;
  if (b.status) {
    await pool.query('UPDATE contact_messages SET status = ? WHERE id = ?', [
      b.status,
      req.params.id,
    ]);
  }
  if (b.replyText != null) {
    await pool.query(
      `UPDATE contact_messages SET reply_text = ?, status = 'replied', replied_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [b.replyText, req.params.id]
    );
  }
  res.json({ ok: true });
});

router.delete('/contact-messages/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM contact_messages WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Service categories ---------- */
router.get('/service-categories', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_categories ORDER BY sort_order ASC, id ASC'
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      title: parseJson(r.title_json, {}),
      order: r.sort_order,
    }))
  );
});

router.put('/service-categories/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query(
    `INSERT INTO service_categories (id, title_json, sort_order)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE title_json=VALUES(title_json), sort_order=VALUES(sort_order)`,
    [req.params.id, j(locale(req.body.title)), Number(req.body.order || 0)]
  );
  res.json({ ok: true });
});

router.delete('/service-categories/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM services WHERE category_id = ?', [req.params.id]);
  await pool.query('DELETE FROM service_categories WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Workflows ---------- */
router.get('/workflows', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM workflows ORDER BY sort_order ASC, id ASC'
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      name: parseJson(r.name_json, {}),
      stages: parseJson(r.stages_json, []),
      order: r.sort_order,
    }))
  );
});

router.get('/workflows/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM workflows WHERE id = ?', [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  const r = rows[0];
  res.json({
    id: r.id,
    name: parseJson(r.name_json, {}),
    stages: parseJson(r.stages_json, []),
    order: r.sort_order,
  });
});

router.put('/workflows/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query(
    `INSERT INTO workflows (id, name_json, stages_json, sort_order)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name_json=VALUES(name_json), stages_json=VALUES(stages_json), sort_order=VALUES(sort_order)`,
    [
      req.params.id,
      j(locale(req.body.name)),
      j(req.body.stages || []),
      Number(req.body.order || 0),
    ]
  );
  res.json({ ok: true });
});

router.delete('/workflows/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM workflows WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Services ---------- */
const mapService = (r) => ({
  id: r.id,
  categoryId: r.category_id,
  title: parseJson(r.title_json, {}),
  summary: parseJson(r.summary_json, {}),
  about: parseJson(r.about_json, {}),
  steps: parseJson(r.steps_json, {}),
  requirements: parseJson(r.requirements_json, {}),
  serviceType: parseJson(r.service_type_json, {}),
  fees: parseJson(r.fees_json, {}),
  duration: parseJson(r.duration_json, {}),
  output: parseJson(r.output_json, {}),
  availability: parseJson(r.availability_json, {}),
  formFields: parseJson(r.form_fields_json, []),
  workflowId: r.workflow_id || '',
  order: r.sort_order,
  enabled: Boolean(r.enabled),
});

router.get('/services', async (_req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM services ORDER BY sort_order ASC, id ASC'
  );
  res.json(rows.map(mapService));
});

router.get('/services/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM services WHERE id = ?', [
    req.params.id,
  ]);
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  res.json(mapService(rows[0]));
});

router.put('/services/:id', authRequired, adminRequired, async (req, res) => {
  const b = req.body;
  await pool.query(
    `INSERT INTO services (
      id, category_id, title_json, summary_json, about_json, steps_json, requirements_json,
      service_type_json, fees_json, duration_json, output_json, availability_json,
      form_fields_json, workflow_id, sort_order, enabled
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      category_id=VALUES(category_id), title_json=VALUES(title_json), summary_json=VALUES(summary_json),
      about_json=VALUES(about_json), steps_json=VALUES(steps_json), requirements_json=VALUES(requirements_json),
      service_type_json=VALUES(service_type_json), fees_json=VALUES(fees_json), duration_json=VALUES(duration_json),
      output_json=VALUES(output_json), availability_json=VALUES(availability_json),
      form_fields_json=VALUES(form_fields_json), workflow_id=VALUES(workflow_id),
      sort_order=VALUES(sort_order), enabled=VALUES(enabled)`,
    [
      req.params.id,
      b.categoryId || '',
      j(locale(b.title)),
      j(locale(b.summary)),
      j(locale(b.about)),
      j(locale(b.steps)),
      j(locale(b.requirements)),
      j(locale(b.serviceType)),
      j(locale(b.fees)),
      j(locale(b.duration)),
      j(locale(b.output)),
      j(locale(b.availability)),
      j(b.formFields || []),
      b.workflowId || '',
      Number(b.order || 0),
      b.enabled === false ? 0 : 1,
    ]
  );
  res.json({ ok: true });
});

router.delete('/services/:id', authRequired, adminRequired, async (req, res) => {
  await pool.query('DELETE FROM services WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

/* ---------- Service applications ---------- */
router.post('/service-applications', authRequired, async (req, res) => {
  const b = req.body;
  const appId = id('app_');
  await pool.query(
    `INSERT INTO service_applications
     (id, user_id, user_email, user_name, user_photo, service_id, service_title_json, values_json, status, workflow_id, current_stage_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      appId,
      req.user.uid,
      b.userEmail || req.user.email || '',
      b.userName || '',
      b.userPhoto || '',
      b.serviceId,
      j(b.serviceTitle || {}),
      j(b.values || {}),
      b.status || 'draft',
      b.workflowId || '',
      b.currentStageId || '',
    ]
  );
  res.status(201).json({ id: appId });
});

router.get('/service-applications/mine', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.uid]
  );
  res.json(
    rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      serviceId: r.service_id,
      serviceTitle: parseJson(r.service_title_json, {}),
      values: parseJson(r.values_json, {}),
      status: r.status,
      workflowId: r.workflow_id,
      currentStageId: r.current_stage_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      submittedAt: r.submitted_at,
    }))
  );
});

router.get('/service-applications/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  const r = rows[0];
  if (!req.user.isAdmin && r.user_id !== req.user.uid) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  res.json({
    id: r.id,
    userId: r.user_id,
    serviceId: r.service_id,
    serviceTitle: parseJson(r.service_title_json, {}),
    values: parseJson(r.values_json, {}),
    status: r.status,
    workflowId: r.workflow_id,
    currentStageId: r.current_stage_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    submittedAt: r.submitted_at,
  });
});

router.patch('/service-applications/:id', authRequired, async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM service_applications WHERE id = ?',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ message: 'Not found' });
  if (!req.user.isAdmin && rows[0].user_id !== req.user.uid) {
    return res.status(403).json({ message: 'Forbidden' });
  }
  const b = req.body;
  await pool.query(
    `UPDATE service_applications SET
      values_json = COALESCE(?, values_json),
      status = COALESCE(?, status),
      current_stage_id = COALESCE(?, current_stage_id),
      workflow_id = COALESCE(?, workflow_id),
      user_name = COALESCE(?, user_name),
      user_photo = COALESCE(?, user_photo),
      submitted_at = IF(? = 'submitted', CURRENT_TIMESTAMP, submitted_at)
     WHERE id = ?`,
    [
      b.values != null ? j(b.values) : null,
      b.status != null ? b.status : null,
      b.currentStageId != null ? b.currentStageId : null,
      b.workflowId != null ? b.workflowId : null,
      b.userName != null ? b.userName : null,
      b.userPhoto != null ? b.userPhoto : null,
      b.status || null,
      req.params.id,
    ]
  );
  res.json({ ok: true });
});


router.patch('/users/:uid/admin', authRequired, adminRequired, async (req, res) => {
  await pool.query('UPDATE users SET is_admin = ? WHERE id = ?', [
    req.body.isAdmin ? 1 : 0,
    req.params.uid,
  ]);
  res.json({ ok: true });
});

router.patch('/users/:uid/disabled', authRequired, adminRequired, async (req, res) => {
  await pool.query('UPDATE users SET disabled = ? WHERE id = ?', [
    req.body.disabled ? 1 : 0,
    req.params.uid,
  ]);
  res.json({ ok: true });
});

router.post('/users', authRequired, adminRequired, async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || 'ChangeMe123');
    const displayName = String(req.body.displayName || '').trim();
    const displayNameAr = String(req.body.displayNameAr || '').trim();
    const photoURL = String(req.body.photoURL || req.body.photo_url || '').trim();
    console.log('[create-user]', { email, displayName, hasPhoto: Boolean(photoURL), photoLen: photoURL.length });
    if (!email) return res.status(400).json({ message: 'Email required' });
    if (!password || password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    const [exists] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (exists.length) return res.status(409).json({ message: 'Email exists' });
    const userId = id('u_');
    const passwordHash = await bcrypt.hash(password, 10);

    try {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, display_name_ar, photo_url, is_admin, disabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email,
          passwordHash,
          displayName,
          displayNameAr,
          photoURL || null,
          req.body.isAdmin ? 1 : 0,
          req.body.disabled ? 1 : 0,
        ]
      );
    } catch (insertErr) {
      // Fallback if display_name_ar column not migrated yet
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, photo_url, is_admin, disabled)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          email,
          passwordHash,
          displayName,
          photoURL || null,
          req.body.isAdmin ? 1 : 0,
          req.body.disabled ? 1 : 0,
        ]
      );
    }

    const [rows] = await pool.query(
      `SELECT id, email, display_name, display_name_ar, photo_url, phone, is_admin, disabled, created_at
       FROM users WHERE id = ?`,
      [userId]
    );
    const r = rows[0];
    res.status(201).json({
      id: r.id,
      uid: r.id,
      email: r.email,
      displayName: r.display_name,
      displayNameAr: r.display_name_ar || '',
      photoURL: r.photo_url || '',
      phone: r.phone || '',
      isAdmin: Boolean(r.is_admin),
      disabled: Boolean(r.disabled),
      createdAt: r.created_at,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || 'Create user failed' });
  }
});

router.get('/stats', authRequired, adminRequired, async (_req, res) => {
  const [[u]] = await pool.query('SELECT COUNT(*) AS c FROM users');
  const [[o]] = await pool.query('SELECT COUNT(*) AS c FROM orders');
  res.json({ users: u.c, orders: o.c });
});

module.exports = router;
