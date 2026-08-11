const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const Project = require('../models/project')
const Rating = require('../models/rating')
const multer = require('multer');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });
  next();
};

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').lean();
    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.put('/me', auth,
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }).withMessage('Name too long'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio max 500 characters'),
  body('role').optional().isLength({ max: 80 }).withMessage('Role max 80 characters'),
  body('skills').optional().isArray({ max: 30 }).withMessage('Skills must be an array, max 30 items'),
  validate,
  async (req, res) => {
  try {
    const { name, skills, role, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, skills, role, bio },
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
router.get('/search', auth, async (req, res) => {
  try {
    const { q = '', skill = '' } = req.query
    const regex = new RegExp(q.trim(), 'i')
    const skillRegex = new RegExp(skill.trim(), 'i')

    let query = {}
    if (q.trim() && skill.trim()) {
      query = {
        $and: [
          { name: regex },
          { 'skills.name': skillRegex }
        ]
      }
    } else if (q.trim()) {
      query = {
        $or: [
          { name: regex },
          { 'skills.name': regex }
        ]
      }
    } else if (skill.trim()) {
      query = { 'skills.name': skillRegex }
    } else {
      // No filter — return recent users (limit 20)
    }

    const users = await User.find(query)
      .select('name role skills profilePic rating ratingCount')
      .limit(30)
      .lean()

    res.json(users)
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

router.post('/upload-picture', auth, upload.single('profilePic'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: 'No file provided' });
    }

    const base64Data = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { profilePic: base64Data },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;