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
    const myProjects = await Project.find({ owner: req.user.id });
    const projectIds = myProjects.map(p => p._id);
   const requests = await JoinRequest.find({ project: { $in: projectIds }, status: 'pending' })
  .populate('sender', 'name email skills role rating')
  .populate('project', 'title')
  .sort({ createdAt: 1 })
    res.json(requests);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
router.put('/:id', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const request = await JoinRequest.findById(req.params.id).populate('project');
    if (request.project.owner.toString() !== req.user.id)
      return res.status(403).json({ msg: 'Not authorized' });
    request.status = status;
    await request.save();
    if (status === 'accepted') {
      await Project.findByIdAndUpdate(request.project._id, {
        $addToSet: { members: request.sender }
      });
    }
    res.json(request);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});
module.exports = router;