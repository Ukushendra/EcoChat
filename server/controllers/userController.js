const User = require('../models/User');
const FriendRequest = require('../models/FriendRequest');
const { uploadImage } = require('../utils/cloudinary');

// Helper to format username (ensures starts with @ and lowercase)
const formatUsername = (username) => {
  if (!username) return '';
  let formatted = username.trim().toLowerCase();
  if (!formatted.startsWith('@')) {
    formatted = '@' + formatted;
  }
  return formatted;
};

// Onboarding: Claim unique username
const onboardUser = async (req, res) => {
  const { username, name, about } = req.body;

  if (!username || !name) {
    return res.status(400).json({ success: false, message: 'Username and Name are required' });
  }

  const formattedUsername = formatUsername(username);

  // Validate username format (only alphanumeric and underscore, e.g. @john_doe)
  const usernameRegex = /^@[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(formattedUsername)) {
    return res.status(400).json({
      success: false,
      message: 'Username must start with @ and be 3-20 characters long (letters, numbers, underscore only)',
    });
  }

  try {
    // Check if username is already claimed
    const existingUser = await User.findOne({ username: formattedUsername });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Username is already taken' });
    }

    // Update current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.username = formattedUsername;
    user.name = name.trim();
    if (about) user.about = about.trim();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Onboarding completed successfully',
      user,
    });
  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({ success: false, message: 'Server error during onboarding' });
  }
};

// Check username availability
const checkUsernameAvailability = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ success: false, message: 'Username query parameter is required' });
  }

  const formattedUsername = formatUsername(username);

  try {
    const user = await User.findOne({ username: formattedUsername });
    res.status(200).json({
      success: true,
      available: !user,
      formattedUsername,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error checking username' });
  }
};

// Update user profile details
const updateProfile = async (req, res) => {
  const { name, username, about, removeAvatar } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name.trim();
    if (about !== undefined) user.about = about.trim();

    if (username) {
      const formattedUsername = formatUsername(username);

      if (formattedUsername !== user.username) {
        // Validate format
        const usernameRegex = /^@[a-zA-Z0-9_]{3,20}$/;
        if (!usernameRegex.test(formattedUsername)) {
          return res.status(400).json({
            success: false,
            message: 'Username must start with @ and be 3-20 characters long (alphanumeric & underscores)',
          });
        }

        // Check availability
        const existingUser = await User.findOne({ username: formattedUsername });
        if (existingUser) {
          return res.status(400).json({ success: false, message: 'Username is already taken' });
        }
        user.username = formattedUsername;
      }
    }

    // Handle avatar file upload or removal
    if (removeAvatar === 'true' || removeAvatar === true) {
      user.profilePicture = '';
    } else if (req.file) {
      const imageUrl = await uploadImage(req.file.path);
      user.profilePicture = imageUrl;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: 'Server error updating profile' });
  }
};

// Search users by username
const searchUsers = async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(200).json({ success: true, users: [] });
  }

  const query = username.trim().toLowerCase();
  // Ensure search terms are matched appropriately (with or without @)
  const searchQuery = query.startsWith('@') ? query : '@' + query;

  try {
    // Exact or prefix match using regex
    const matches = await User.find({
      username: { $regex: '^' + searchQuery, $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude self
    })
      .select('name username profilePicture about onlineStatus lastSeen')
      .limit(10);

    // For each matched user, find if a relationship (FriendRequest) exists
    const usersWithStatus = await Promise.all(
      matches.map(async (match) => {
        // Look up request
        const request = await FriendRequest.findOne({
          $or: [
            { sender: req.user._id, receiver: match._id },
            { sender: match._id, receiver: req.user._id },
          ],
        });

        let relationshipStatus = 'none'; // none, pending_sent, pending_received, accepted, blocked_sent, blocked_received

        if (request) {
          if (request.status === 'accepted') {
            relationshipStatus = 'accepted';
          } else if (request.status === 'blocked') {
            if (request.sender.toString() === req.user._id.toString()) {
              relationshipStatus = 'blocked_sent'; // We blocked them
            } else {
              relationshipStatus = 'blocked_received'; // They blocked us
            }
          } else if (request.status === 'pending') {
            if (request.sender.toString() === req.user._id.toString()) {
              relationshipStatus = 'pending_sent'; // We requested them
            } else {
              relationshipStatus = 'pending_received'; // They requested us
            }
          } else if (request.status === 'rejected') {
            // If rejected, allow request again
            relationshipStatus = 'none';
          }
        }

        return {
          ...match.toObject(),
          relationshipStatus,
        };
      })
    );

    res.status(200).json({
      success: true,
      users: usersWithStatus,
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Server error searching users' });
  }
};

// Get stats (Number of friends/chats, date joined)
const getUserStats = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count accepted friend requests
    const friendsCount = await FriendRequest.countDocuments({
      $or: [{ sender: userId }, { receiver: userId }],
      status: 'accepted',
    });

    res.status(200).json({
      success: true,
      friendsCount,
      joinedAt: req.user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error fetching stats' });
  }
};

module.exports = {
  onboardUser,
  checkUsernameAvailability,
  updateProfile,
  searchUsers,
  getUserStats,
};
