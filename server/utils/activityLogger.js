const Activity = require('../models/activity');

exports.createActivity = async (data) => {
  try {
    // For "New Project", we don't want to spam if it's the same owner
    // For "Team Full", we only want one notification
    await Activity.create(data);
  } catch (err) {
    console.error('Failed to create activity:', err);
  }
};
