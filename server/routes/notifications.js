const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const { sendRealtimeNotification } = require('../socket');

// Fetch user notifications and unread count
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name profilePic')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      read: false
    });

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { $set: { read: true } }
    );
    res.json({ msg: 'All notifications marked as read' });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Mark single as read
router.put('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { $set: { read: true } },
      { new: true }
    );
    if (!notification) return res.status(404).json({ msg: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

// Helper exported to trigger notifications from other routes
async function createAndSendNotification({ recipient, sender, type, title, message, link }) {
  try {
    if (!recipient || !sender || recipient.toString() === sender.toString()) return;

    const notif = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      link: link || ''
    });

    const populatedNotif = await Notification.findById(notif._id).populate('sender', 'name profilePic');

    sendRealtimeNotification(recipient, populatedNotif);
    return populatedNotif;
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}

module.exports = router;
module.exports.createAndSendNotification = createAndSendNotification;
