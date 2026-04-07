const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db');

const VALID_CATEGORIES = ['IT', 'Facility', 'Security', 'Other'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
const SORTABLE_COLUMNS = [
  'id', 'name', 'email', 'date', 'location',
  'category', 'priority', 'status', 'created_at', 'updated_at',
];

// POST / — Create a new incident
router.post('/', async (req, res) => {
  try {
    const { name, email, date, location, category, priority, description } = req.body;

    const missing = [];
    if (!name) missing.push('name');
    if (!email) missing.push('email');
    if (!date) missing.push('date');
    if (!location) missing.push('location');
    if (!category) missing.push('category');
    if (!priority) missing.push('priority');
    if (!description) missing.push('description');

    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    if (!VALID_PRIORITIES.includes(priority)) {
      return res.status(400).json({ error: `Invalid priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const db = await getDb();

    db.run(
      `INSERT INTO incidents (name, email, date, location, category, priority, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, email, date, location, category, priority, description]
    );

    // Retrieve the newly created incident before saving to preserve last_insert_rowid
    const idResult = db.exec('SELECT last_insert_rowid() as id');
    const newId = idResult[0].values[0][0];
    const stmt = db.prepare('SELECT * FROM incidents WHERE id = ?');
    stmt.bind([newId]);
    stmt.step();
    const incident = stmt.getAsObject();
    stmt.free();

    saveDb();

    return res.status(201).json(incident);
  } catch (err) {
    console.error('Error creating incident:', err);
    return res.status(500).json({ error: 'Failed to create incident' });
  }
});

// GET / — List incidents with optional filtering and sorting
router.get('/', async (req, res) => {
  try {
    const { sort, order, status, category } = req.query;

    let sql = 'SELECT * FROM incidents WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    if (category) {
      sql += ' AND category = ?';
      params.push(category);
    }

    // Validate and apply sorting
    const sortColumn = sort && SORTABLE_COLUMNS.includes(sort) ? sort : 'created_at';
    const sortOrder = order && order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const db = await getDb();
    const stmt = db.prepare(sql);
    stmt.bind(params);

    const incidents = [];
    while (stmt.step()) {
      incidents.push(stmt.getAsObject());
    }
    stmt.free();

    return res.json(incidents);
  } catch (err) {
    console.error('Error listing incidents:', err);
    return res.status(500).json({ error: 'Failed to list incidents' });
  }
});

module.exports = router;
