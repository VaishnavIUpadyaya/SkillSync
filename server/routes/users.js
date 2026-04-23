const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.put('/me', auth, async (req, res) => {
  try {
    const { name, skills, role, available } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, skills, role, available },
      { new: true }
    ).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;