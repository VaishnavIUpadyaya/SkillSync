const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['PROJECT_COMPLETED', 'ENDORSEMENT', 'TEAM_FULL', 'NEW_PROJECT'],
    required: true
  },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Primary actor
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  skill: { type: String }, // For endorsements
  count: { type: Number }, // e.g., "by 3 people"
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Activity || mongoose.model('Activity', ActivitySchema);
