const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requiredSkills: [{ name: String, proficiency: Number }],
  teamSize: { type: Number, default: 4 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'open' },
  tags: [{ type: String }],
  deadline: { type: Date, default: null },
  githubRepo: { type: String, default: '' },
  resources: [{
    title: { type: String, required: true },
    url: { type: String, required: true },
    category: { type: String, default: 'General' },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
  }],
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
})
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ owner: 1 })
ProjectSchema.index({ createdAt: -1 })
ProjectSchema.index({ members: 1 })
module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);