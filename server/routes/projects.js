const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const auth = require('../middleware/auth');
const { matchUsersToProject } = require('../utils/matching');

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const projects = await Project.find({ status: 'open' })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
    res.json(projects)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.post('/', auth, async (req, res) => {
  try {
    const { title, description, requiredSkills, teamSize } = req.body;
    const project = await Project.create({
      title, description, requiredSkills, teamSize,
      owner: req.user.id,
      members: [req.user.id]
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// ← MOVED UP: must be before /:id
router.get('/:id/matches', auth, async (req, res) => {
  try {
    const matches = await matchUsersToProject(req.params.id)
    res.json(matches)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')

    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.map(m => m.toString()).includes(req.user.id)
    const isOwner = project.owner._id.toString() === req.user.id

    const memberFields = (isMember || isOwner) ? 'name email skills role rating' : 'name skills role rating'

    const populatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', memberFields)

    res.json(populatedProject)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });
    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only owner can remove members' })

    if (req.params.userId === req.user.id)
      return res.status(400).json({ msg: 'Owner cannot remove themselves' })

    project.members = project.members.filter(m => m.toString() !== req.params.userId)
    await project.save()

    res.json({ msg: 'Member removed successfully' })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router;