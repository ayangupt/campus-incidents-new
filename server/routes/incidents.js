const express = require('express');
const router = express.Router();
const Incident = require('../models/Incident');
const auth = require('../middleware/auth');

// POST /api/incidents — public, submit new incident
router.post('/', async (req, res) => {
  try {
    const incident = new Incident(req.body);
    await incident.save();
    res.status(201).json({ message: 'Incident reported successfully', incident });
  } catch (err) {
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ message: 'Validation error', errors: messages });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/incidents — admin only, list all incidents
router.get('/', auth, async (req, res) => {
  try {
    const incidents = await Incident.find().sort({ createdAt: -1 });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PATCH /api/incidents/:id — admin only, update incident status
router.patch('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['New', 'In Progress', 'Resolved'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    const incident = await Incident.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!incident) {
      return res.status(404).json({ message: 'Incident not found' });
    }
    res.json(incident);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
