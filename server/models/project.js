const mongoose = require('mongoose');
const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  requiredSkills: [{ name: String, proficiency: Number }],
  teamSize: { type: Number, default: 4 },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
});
ProjectSchema.index({ status: 1 })
ProjectSchema.index({ owner: 1 })
module.exports = mongoose.model('Project', ProjectSchema);