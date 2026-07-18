const Notification = require('../models/Notification');

// Get notifications for logged-in user
const getNotifications = async (req, res) => {
  const userId = req.user._id;

  try {
    const notifications = await Notification.find({ recipient: userId })
      .populate('sender', 'name username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      notifications,
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching notifications' });
  }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
  const userId = req.user._id;

  try {
    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notifications' });
  }
};

// Mark specific notification as read
const markOneAsRead = async (req, res) => {
  const { notificationId } = req.params;
  const userId = req.user._id;

  try {
    const notification = await Notification.findOne({ _id: notificationId, recipient: userId });
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      notification,
    });
  } catch (error) {
    console.error('Mark notification read error:', error);
    res.status(500).json({ success: false, message: 'Server error updating notification' });
  }
};

module.exports = {
  getNotifications,
  markAllAsRead,
  markOneAsRead,
};
