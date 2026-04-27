const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const auth = require('../middleware/auth');
const { matchUsersToProject } = require('../utils/matching');
const JoinRequest = require('../models/joinRequest')
const Rating = require('../models/rating')
router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const projects = await Project.find()  
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
    const { title, description, requiredSkills, teamSize, deadline, tags } = req.body;
    const project = await Project.create({
      title, description, requiredSkills, teamSize, deadline, tags,
      owner: req.user.id,
      members: [req.user.id]
    });
    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

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

    if (!isOwner && !isMember) {
      await Project.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } })
    }

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
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body
    const allowed = ['open', 'in-progress', 'completed']
    if (!allowed.includes(status))
      return res.status(400).json({ msg: 'Invalid status' })

    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ msg: 'Project not found' })
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only owner can change status' })

    project.status = status
    await project.save()
    res.json({ msg: 'Status updated', status: project.status })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.get('/:id/analytics', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ msg: 'Project not found' })
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only owner can view analytics' })

    const totalRequests = await JoinRequest.countDocuments({ project: req.params.id, type: { $in: ['request', null] } })
    const acceptedRequests = await JoinRequest.countDocuments({ project: req.params.id, type: { $in: ['request', null] }, status: 'accepted' })
    const rejectedRequests = await JoinRequest.countDocuments({ project: req.params.id, type: { $in: ['request', null] }, status: 'rejected' })
    const pendingRequests = await JoinRequest.countDocuments({ project: req.params.id, type: { $in: ['request', null] }, status: 'pending' })
    const totalInvites = await JoinRequest.countDocuments({ project: req.params.id, type: 'invite' })
    const acceptedInvites = await JoinRequest.countDocuments({ project: req.params.id, type: 'invite', status: 'accepted' })
    const ratings = await Rating.find({ project: req.params.id })
    const avgRating = ratings.length > 0 ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1) : null

    res.json({
      views: project.views,
      teamFill: `${project.members.length}/${project.teamSize}`,
      requests: { total: totalRequests, accepted: acceptedRequests, rejected: rejectedRequests, pending: pendingRequests },
      invites: { total: totalInvites, accepted: acceptedInvites },
      ratings: { count: ratings.length, avg: avgRating }
    })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
module.exports = router;