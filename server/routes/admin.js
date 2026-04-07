const express = require('express');
const router = express.Router();
const { getDb, saveDb } = require('../db');

const validTokens = new Set();

const VALID_STATUSES = ['Open', 'In Progress', 'Resolved'];
const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

// POST /login — Authenticate admin
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const token = 'admin-token-' + Date.now();
    validTokens.add(token);

    return res.json({ token });
  } catch (err) {
    console.error('Error during login:', err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

// Auth middleware — verify Bearer token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }

  const token = authHeader.split(' ')[1];

  if (!validTokens.has(token)) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  next();
}

// PATCH /incidents/:id — Update incident (protected)
router.patch('/incidents/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_priority } = req.body;

    if (!status && !admin_priority) {
      return res.status(400).json({ error: 'At least one of status or admin_priority is required' });
    }

    if (status && !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    if (admin_priority && !VALID_PRIORITIES.includes(admin_priority)) {
      return res.status(400).json({ error: `Invalid admin_priority. Must be one of: ${VALID_PRIORITIES.join(', ')}` });
    }

    const db = await getDb();

    // Check if incident exists
    const checkStmt = db.prepare('SELECT id FROM incidents WHERE id = ?');
    checkStmt.bind([Number(id)]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ error: 'Incident not found' });
    }
    checkStmt.free();

    // Build dynamic update query
    const fields = [];
    const params = [];

    if (status) {
      fields.push('status = ?');
      params.push(status);
    }

    if (admin_priority) {
      fields.push('admin_priority = ?');
      params.push(admin_priority);
    }

    fields.push("updated_at = datetime('now')");
    params.push(Number(id));

    db.run(
      `UPDATE incidents SET ${fields.join(', ')} WHERE id = ?`,
      params
    );
    saveDb();

    // Return updated incident
    const stmt = db.prepare('SELECT * FROM incidents WHERE id = ?');
    stmt.bind([Number(id)]);
    stmt.step();
    const incident = stmt.getAsObject();
    stmt.free();

    return res.json(incident);
  } catch (err) {
    console.error('Error updating incident:', err);
    return res.status(500).json({ error: 'Failed to update incident' });
  }
});

module.exports = router;
