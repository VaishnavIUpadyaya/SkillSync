const express = require('express')
const router = express.Router()
const Endorsement = require('../models/Endorsement')
const auth = require('../middleware/auth')

router.post('/', auth, async (req, res) => {
  try {
    const { endorseeId, skill } = req.body
    if (endorseeId === req.user.id)
      return res.status(400).json({ msg: 'Cannot endorse yourself' })
    const existing = await Endorsement.findOne({ endorser: req.user.id, endorsee: endorseeId, skill })
    if (existing) return res.status(400).json({ msg: 'Already endorsed this skill' })
    const endorsement = await Endorsement.create({ endorser: req.user.id, endorsee: endorseeId, skill })
    res.json(endorsement)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/:userId', auth, async (req, res) => {
  try {
    const endorsements = await Endorsement.find({ endorsee: req.params.userId })
      .populate('endorser', 'name')
    const grouped = {}
    endorsements.forEach(e => {
      if (!grouped[e.skill]) grouped[e.skill] = []
      grouped[e.skill].push(e.endorser.name)
    })
    res.json(grouped)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/check/:endorseeId/:skill', auth, async (req, res) => {
  try {
    const existing = await Endorsement.findOne({
      endorser: req.user.id,
      endorsee: req.params.endorseeId,
      skill: req.params.skill
    })
    res.json({ endorsed: !!existing })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router