const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  assigneeName: { type: String, default: '' },
  assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  skill: { type: String, default: '' },
  done: { type: Boolean, default: false },
  completedBy: { type: String, default: '' },
  completedAt: { type: Date, default: null }
})

const WeekSchema = new mongoose.Schema({
  week: { type: Number, required: true },
  title: { type: String, required: true },
  milestone: { type: String, default: '' },
  tasks: [TaskSchema]
})

const RoadmapSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true, unique: true },
  generatedAt: { type: Date, default: Date.now },
  weeks: [WeekSchema]
})

module.exports = mongoose.models.Roadmap || mongoose.model('Roadmap', RoadmapSchema)
