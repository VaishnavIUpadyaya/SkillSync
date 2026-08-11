const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true, select: false },
  profilePic: { type: String, default: null },
skills: [{ 
  name: String, 
  proficiency: Number,
  verified: { type: Boolean, default: false },
  verifiedAt: { type: Date, default: null },
  verificationCooldownUntil: { type: Date, default: null }
}],
  role: { type: String, default: '' },
  bio: { type: String, default: '' },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  createdAt: { type: Date, default: Date.now }
})
UserSchema.index({ 'skills.name': 1 })
module.exports = mongoose.model('User', UserSchema)