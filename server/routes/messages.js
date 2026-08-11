const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Message = require('../models/Message');
const User = require('../models/user');
const Project = require('../models/project');

// Fetch project room chat history
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ msg: 'Project not found' });

    // Verify user is owner or member
    const isOwner = project.owner.toString() === req.user.id;
    const isMember = project.members.some(m => m.toString() === req.user.id);
    if (!isOwner && !isMember) {
      return res.status(403).json({ msg: 'Access denied: Must be project member' });
    }

    const messages = await Message.find({ roomType: 'project', project: projectId })
      .populate('sender', 'name profilePic role')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Fetch 1-on-1 Direct Messages history
router.get('/dm/:recipientId', auth, async (req, res) => {
  try {
    const { recipientId } = req.params;
    const currentUserId = req.user.id;

    const messages = await Message.find({
      roomType: 'dm',
      $or: [
        { sender: currentUserId, recipient: recipientId },
        { sender: recipientId, recipient: currentUserId }
      ]
    })
      .populate('sender', 'name profilePic role')
      .populate('recipient', 'name profilePic role')
      .sort({ createdAt: 1 })
      .limit(100);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Fetch list of active DM conversations
router.get('/conversations', auth, async (req, res) => {
  try {
    const currentUserId = req.user.id;

    const dms = await Message.find({
      roomType: 'dm',
      $or: [{ sender: currentUserId }, { recipient: currentUserId }]
    }).sort({ createdAt: -1 });

    const userIds = new Set();
    dms.forEach(msg => {
      const otherId = msg.sender.toString() === currentUserId ? msg.recipient?.toString() : msg.sender.toString();
      if (otherId) userIds.add(otherId);
    });

    const users = await User.find({ _id: { $in: Array.from(userIds) } }).select('name profilePic role email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

module.exports = router;
