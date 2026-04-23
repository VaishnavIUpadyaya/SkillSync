const mongoose = require('mongoose');
const RatingSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  rater: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  ratee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  score: { type: Number, min: 1, max: 5 },
  comment: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Rating', RatingSchema);