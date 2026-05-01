const express = require('express');
const router = express.Router();
const Activity = require('../models/activity');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
  try {
    const activities = await Activity.find()
      .populate('user', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
