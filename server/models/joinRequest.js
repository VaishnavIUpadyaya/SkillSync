const mongoose = require('mongoose');
const JoinRequestSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  invitee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, default: 'pending' },
  type: { type: String, default: 'request' },
  createdAt: { type: Date, default: Date.now }
})
JoinRequestSchema.index({ project: 1, sender: 1 })
JoinRequestSchema.index({ createdAt: 1 })
module.exports = mongoose.models.JoinRequest || mongoose.model('JoinRequest', JoinRequestSchema);