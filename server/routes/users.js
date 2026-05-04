const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const Project = require('../models/project')
const Rating = require('../models/rating')
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
router.post('/bookmarks/:projectId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    const already = user.bookmarks.map(b => b.toString()).includes(req.params.projectId)
    if (already) {
      user.bookmarks = user.bookmarks.filter(b => b.toString() !== req.params.projectId)
    } else {
      user.bookmarks.push(req.params.projectId)
    }
    await user.save()
    res.json({ bookmarked: !already, bookmarks: user.bookmarks })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.get('/bookmarks/all', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'bookmarks',
      populate: { path: 'owner', select: 'name' }
    })
    res.json(user.bookmarks)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.put('/availability', auth, async (req, res) => {
  try {
    const { availableDates } = req.body
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { availableDates },
      { new: true }
    ).select('-password')
    res.json(user)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.get('/:id/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password')
    if (!user) return res.status(404).json({ msg: 'User not found' })

    const projects = await Project.find({
      $or: [{ members: req.params.id }, { owner: req.params.id }],
      status: { $in: ['open', 'in-progress', 'completed'] }
    }).populate('owner', 'name').select('title status owner members createdAt')

    const ratings = await Rating.find({ ratee: req.params.id })
      .populate('rater', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })

    res.json({ user, projects, ratings })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});



module.exports = router;