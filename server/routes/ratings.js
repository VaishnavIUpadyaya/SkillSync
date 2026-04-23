const express = require('express');
const router = express.Router();
const Rating = require('../models/rating');
const User = require('../models/user');
const auth = require('../middleware/auth');
router.post('/', auth, async (req, res) => {
  try {
    const { rateeId, projectId, score, comment } = req.body;
    const rating = await Rating.create({
      project: projectId, rater: req.user.id,
      ratee: rateeId, score, comment
    });
    const all = await Rating.find({ ratee: rateeId });
    const avg = all.reduce((s, r) => s + r.score, 0) / all.length;
    await User.findByIdAndUpdate(rateeId, { rating: avg.toFixed(1), ratingCount: all.length });
    res.json(rating);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.get('/:userId', auth, async (req, res) => {
  try {
    const ratings = await Rating.find({ ratee: req.params.userId })
      .populate('rater', 'name')
      .populate('project', 'title');
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;