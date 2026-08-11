const express = require('express');
const router = express.Router();
const Project = require('../models/project');
const User = require('../models/user');
const auth = require('../middleware/auth');
const { matchUsersToProject, getProjectRecommendations, getTeamCoverage, getPerSkillCoverage } = require('../utils/matching');
const JoinRequest = require('../models/joinRequest')
const Rating = require('../models/rating')
const { createActivity } = require('../utils/activityLogger');
const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ msg: errors.array()[0].msg });
  next();
};

router.get('/', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = 10
    const projects = await Project.find()  
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
    res.json(projects)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/recommendations', auth, async (req, res) => {
  try {
    const [currentUser, projects] = await Promise.all([
      User.findById(req.user.id).select('skills').lean(),
      Project.find({ status: 'open' })
        .populate('owner', 'name')
        .populate('members', '_id')
        .sort({ createdAt: -1 })
        .limit(50)
        .lean()
    ])

    if (!currentUser) return res.status(404).json({ msg: 'User not found' })

    const recommendations = getProjectRecommendations(
      currentUser,
      projects,
      { threshold: 0.6, limit: 3 }
    )

    res.json(recommendations)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/:id/matches', auth, async (req, res) => {
  try {
    const skill = req.query.skill || null
    const matches = await matchUsersToProject(req.params.id, skill)
    res.json(matches)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members', 'name email skills role rating profilePic')

    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.some(m => (m._id || m).toString() === req.user.id)
    const isOwner = (project.owner._id || project.owner).toString() === req.user.id

    if (!isOwner && !isMember) {
      Project.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } }).exec()
    }

    let result = project.toObject()
    if (isOwner) {
      try {
        const coverage = getTeamCoverage(result)
        const details = getPerSkillCoverage(result)
        result.teamCoverage = { score: coverage, pct: Math.round(coverage * 100), details }
      } catch (e) {
        result.teamCoverage = { score: 0, pct: 0, details: [] }
      }
    }

    res.json(result)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.post('/', auth,
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 120 }).withMessage('Title max 120 characters'),
  body('description').trim().notEmpty().withMessage('Description is required').isLength({ max: 2000 }).withMessage('Description max 2000 characters'),
  body('teamSize').optional().isInt({ min: 2, max: 20 }).withMessage('Team size must be between 2 and 20'),
  body('githubRepo').optional({ checkFalsy: true }).isURL().withMessage('GitHub repo must be a valid URL'),
  body('tags').optional().isArray({ max: 6 }).withMessage('Max 6 tags'),
  body('requiredSkills').optional().isArray({ max: 15 }).withMessage('Max 15 required skills'),
  validate,
  async (req, res) => {
  try {
    const { title, description, requiredSkills, teamSize, deadline, tags, githubRepo } = req.body;
    const project = await Project.create({
      title, description, requiredSkills, teamSize, deadline, tags,
      githubRepo: githubRepo || '',
      owner: req.user.id,
      members: [req.user.id]
    });

    await createActivity({
      type: 'NEW_PROJECT',
      user: req.user.id,
      project: project._id
    });

    res.json(project);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

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
router.delete('/:id/leave', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    if (project.owner.toString() === req.user.id)
      return res.status(400).json({ msg: 'Owner cannot leave. Delete the project instead.' })

    const isMember = project.members.map(m => m.toString()).includes(req.user.id)
    if (!isMember) return res.status(400).json({ msg: 'You are not a member of this project' })

    project.members = project.members.filter(m => m.toString() !== req.user.id)
    await project.save()

    res.json({ msg: 'You have left the project' })
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

    if (status === 'completed') {
      await createActivity({
        type: 'PROJECT_COMPLETED',
        user: req.user.id,
        project: project._id
      });
    }

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

router.post('/:id/resources', auth,
  body('title').trim().notEmpty().withMessage('Resource title required').isLength({ max: 80 }),
  body('url').isURL().withMessage('Valid URL required'),
  validate,
  async (req, res) => {
    try {
      const { title, url, category = 'General' } = req.body
      const project = await Project.findById(req.params.id)
      if (!project) return res.status(404).json({ msg: 'Project not found' })

      const isMember = project.members.some(m => m.toString() === req.user.id)
      const isOwner = project.owner.toString() === req.user.id
      if (!isMember && !isOwner) {
        return res.status(403).json({ msg: 'Only team members can add project resources' })
      }

      project.resources.push({
        title,
        url,
        category,
        addedBy: req.user.id
      })

      await project.save()
      const updated = await Project.findById(req.params.id)
        .populate('resources.addedBy', 'name')
      res.json(updated.resources)
    } catch (err) {
      res.status(500).json({ msg: err.message })
    }
  }
)

router.delete('/:id/resources/:resourceId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
    if (!project) return res.status(404).json({ msg: 'Project not found' })

    const isMember = project.members.some(m => m.toString() === req.user.id)
    const isOwner = project.owner.toString() === req.user.id
    if (!isMember && !isOwner) {
      return res.status(403).json({ msg: 'Only team members can manage resources' })
    }

    project.resources = project.resources.filter(r => r._id.toString() !== req.params.resourceId)
    await project.save()
    res.json(project.resources)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

module.exports = router;