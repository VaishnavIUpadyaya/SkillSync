const Activity = require('../models/activity');

exports.createActivity = async (data) => {
  try {
    await Activity.create(data);
  } catch (err) {
    console.error('Failed to create activity:', err);
  }
};
