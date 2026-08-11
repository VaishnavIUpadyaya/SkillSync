const mongoose = require('mongoose')

const SkillQuizSchema = new mongoose.Schema({
  skill: { type: String, required: true, unique: true, lowercase: true },
  questions: [{
    question: String,
    options: [String],
    correctIndex: Number,
    explanation: String
  }],
  refreshedAt: { type: Date, default: Date.now }
})

module.exports = mongoose.model('SkillQuiz', SkillQuizSchema)
