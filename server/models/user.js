const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  skills: [{ name: String, proficiency: Number }],
  role: { type: String, default: '' },
  available: { type: Boolean, default: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Project' }],
  createdAt: { type: Date, default: Date.now }
});

UserSchema.index({ available: 1 });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);