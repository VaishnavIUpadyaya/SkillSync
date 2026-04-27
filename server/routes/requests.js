const express = require('express');
const router = express.Router();
const JoinRequest = require('../models/joinRequest');
const Project = require('../models/project');
const auth = require('../middleware/auth');
router.post('/', auth, async (req, res) => {
  try {
    const { projectId } = req.body;
    const existing = await JoinRequest.findOne({ project: projectId, sender: req.user.id });
    if (existing) return res.status(400).json({ msg: 'Request already sent' });
    const request = await JoinRequest.create({ project: projectId, sender: req.user.id });
    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.get('/mine', auth, async (req, res) => {
  try {
    const myProjects = await Project.find({ owner: req.user.id })
    const projectIds = myProjects.map(p => p._id)
    const requests = await JoinRequest.find({ 
      project: { $in: projectIds }, 
      status: 'pending',
      type: { $in: ['request', null] }  
    })
      .populate('sender', 'name email skills role rating')
      .populate('project', 'title')
      .sort({ createdAt: 1 })
    res.json(requests)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body
    const request = await JoinRequest.findById(req.params.id).populate('project')
    if (!request) return res.status(404).json({ msg: 'Request not found' })

    const isOwnerAction = (request.type === 'request' || !request.type) && 
      request.project.owner.toString() === req.user.id
    const isInvitedAction = request.type === 'invite' && 
      request.invitee?.toString() === req.user.id

    if (!isOwnerAction && !isInvitedAction)
      return res.status(403).json({ msg: 'Not authorized' })

    request.status = status
    await request.save()

    if (status === 'accepted') {
      const userToAdd = request.type === 'invite' ? request.invitee : request.sender
      await Project.findByIdAndUpdate(request.project._id, {
        $addToSet: { members: userToAdd }
      })
    }

    res.json(request)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.post('/invite', auth, async (req, res) => {
  try {
    const { projectId, userId } = req.body
    const project = await Project.findById(projectId)
    if (!project) return res.status(404).json({ msg: 'Project not found' })
    if (project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Only owner can invite' })

    const existing = await JoinRequest.findOne({ project: projectId, sender: req.user.id, invitee: userId })
    if (existing) return res.status(400).json({ msg: 'Already invited or requested' })

    const invite = await JoinRequest.create({
      project: projectId,
      sender: req.user.id,  
      invitee: userId,       
      type: 'invite',
      status: 'pending'
    })
    res.json(invite)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})

router.get('/invites', auth, async (req, res) => {
  try {
    const invites = await JoinRequest.find({
      invitee: req.user.id,
      type: 'invite',
      status: 'pending'
    })
      .populate('project', 'title description')
      .populate('sender', 'name')
      .sort({ createdAt: -1 })
    res.json(invites)
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
router.get('/notifications/count', auth, async (req, res) => {
  try {
    const myProjects = await Project.find({ owner: req.user.id })
    const projectIds = myProjects.map(p => p._id)
    const pendingRequests = await JoinRequest.countDocuments({
      project: { $in: projectIds },
      type: 'request',
      status: 'pending'
    })

    const pendingInvites = await JoinRequest.countDocuments({
      invitee: req.user.id,
      type: 'invite',
      status: 'pending'
    })

    res.json({ requests: pendingRequests, invites: pendingInvites, total: pendingRequests + pendingInvites })
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
module.exports = router;