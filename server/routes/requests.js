const express = require('express');
const router = express.Router();
const JoinRequest = require('../models/joinRequest');
const Project = require('../models/project');
const auth = require('../middleware/auth');
const sendMail = require('../utils/mailer')
const User = require('../models/user')
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

      const acceptedUser = await User.findById(userToAdd)
      const projectTitle = request.project.title

      if (request.type === 'invite') {
        const owner = await User.findById(request.project.owner)
        await sendMail(
          owner.email,
          `${acceptedUser.name} accepted your invite — ${projectTitle}`,
          `<div style="font-family:sans-serif;padding:24px;max-width:500px">
            <h2 style="color:#6c63ff">SkillSync</h2>
            <p>Hi ${owner.name},</p>
            <p><strong>${acceptedUser.name}</strong> has accepted your invite to join <strong>${projectTitle}</strong>.</p>
            <p style="color:#888;font-size:13px">Log in to SkillSync to see your updated team.</p>
          </div>`
        )
      } else {
        await sendMail(
          acceptedUser.email,
          `Your request was accepted — ${projectTitle}`,
          `<div style="font-family:sans-serif;padding:24px;max-width:500px">
            <h2 style="color:#6c63ff">SkillSync</h2>
            <p>Hi ${acceptedUser.name},</p>
            <p>Your request to join <strong>${projectTitle}</strong> has been <strong style="color:#22d3a5">accepted</strong>!</p>
            <p>You are now a member of the team.</p>
            <p style="color:#888;font-size:13px">Log in to SkillSync to connect with your teammates.</p>
          </div>`
        )
      }
    }

    if (status === 'rejected' && request.type !== 'invite') {
      const rejectedUser = await User.findById(request.sender)
      await sendMail(
        rejectedUser.email,
        `Update on your request — ${request.project.title}`,
        `<div style="font-family:sans-serif;padding:24px;max-width:500px">
          <h2 style="color:#6c63ff">SkillSync</h2>
          <p>Hi ${rejectedUser.name},</p>
          <p>Your request to join <strong>${request.project.title}</strong> was not accepted this time.</p>
          <p>Keep exploring other projects on SkillSync that match your skills.</p>
          <p style="color:#888;font-size:13px">Don't give up — the right team is out there!</p>
        </div>`
      )
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

    const existing = await JoinRequest.findOne({ 
      project: projectId, 
      $or: [
        { sender: req.user.id, invitee: userId },
        { invitee: userId, sender: req.user.id }
      ]
    })
    if (existing) return res.status(400).json({ msg: 'Already invited or requested' })

    const invite = await JoinRequest.create({
      project: projectId,
      sender: req.user.id,
      invitee: userId,
      type: 'invite',
      status: 'pending'
    })

    const invitedUser = await User.findById(userId)
    const owner = await User.findById(req.user.id)

    await sendMail(
      invitedUser.email,
      `You've been invited to join ${project.title}`,
      `<div style="font-family:sans-serif;padding:24px;max-width:500px">
        <h2 style="color:#6c63ff">SkillSync</h2>
        <p>Hi ${invitedUser.name},</p>
        <p><strong>${owner.name}</strong> has invited you to join their project <strong>${project.title}</strong>.</p>
        <p>Log in to SkillSync to accept or decline the invite.</p>
        <p style="color:#888;font-size:13px">This invite will remain open until you respond.</p>
      </div>`
    )

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
// Get invites SENT by current user
router.get('/invites/sent', auth, async (req, res) => {
  try {
    const sentInvites = await JoinRequest.find({
      sender: req.user.id,
      type: 'invite'
    })
      .populate('project', 'title description status')
      .populate('invitee', 'name')
      .sort({ createdAt: -1 })
    res.json(sentInvites)
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
router.get('/invited/:projectId', auth, async (req, res) => {
  try {
    const invites = await JoinRequest.find({
      project: req.params.projectId,
      type: 'invite',
      status: 'pending'
    }).select('invitee')

    res.json(invites.map(i => i.invitee.toString()))
  } catch (err) {
    res.status(500).json({ msg: err.message })
  }
})
module.exports = router;