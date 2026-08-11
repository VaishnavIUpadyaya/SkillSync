const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  roomType: { type: String, enum: ['project', 'dm'], required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

MessageSchema.index({ project: 1, createdAt: 1 });
MessageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

module.exports = mongoose.model('Message', MessageSchema);
