const express = require('express')
const router = express.Router()
const Rating = require('../models/Rating')
const User = require('../models/User')
const Project = require('../models/project')
const auth = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  try {
    const { rateeId, projectId, score, comment } = req.body

    const project = await Project.findById(projectId)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.map(m => m.toString()).includes(req.user.id)
    if (!isMember) return res.status(403).json({ msg: 'Only members can rate' })

    if (rateeId === req.user.id)
      return res.status(400).json({ msg: 'Cannot rate yourself' })

    const rateeInProject = project.members.map(m => m.toString()).includes(rateeId)
    if (!rateeInProject) return res.status(400).json({ msg: 'User is not in this project' })

    const existing = await Rating.findOne({ project: projectId, rater: req.user.id, ratee: rateeId })
    if (existing) return res.status(400).json({ msg: 'Already rated this person' })

    const rating = await Rating.create({
      project: projectId,
      rater: req.user.id,
      ratee: rateeId,
      score,
      comment
    })

    const all = await Rating.find({ ratee: rateeId })
    const avg = all.reduce((s, r) => s + r.score, 0) / all.length
    await User.findByIdAndUpdate(rateeId, {
      rating: parseFloat(avg.toFixed(1)),
      ratingCount: all.length
    })

    res.json(rating)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/:userId', auth, async (req, res) => {
  try {
    const ratings = await Rating.find({ ratee: req.params.userId })
      .populate('rater', 'name')
      .populate('project', 'title')
      .sort({ createdAt: -1 })
    res.json(ratings)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/check/:projectId/:rateeId', auth, async (req, res) => {
  try {
    const existing = await Rating.findOne({
      project: req.params.projectId,
      rater: req.user.id,
      ratee: req.params.rateeId
    })
    res.json({ rated: !!existing })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router