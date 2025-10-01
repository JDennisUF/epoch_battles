const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get online users for lobby
router.get('/online', auth, async (req, res) => {
  try {
    const onlineUsers = await User.find({ 
      isOnline: true,
      _id: { $ne: req.user._id } // Exclude current user
    })
    .select('username stats isOnline')
    .sort({ 'stats.ranking': -1 });

    res.json({ users: onlineUsers });
  } catch (error) {
    console.error('Get online users error:', error);
    res.status(500).json({ message: 'Server error fetching online users' });
  }
});

// Get leaderboard
router.get('/leaderboard/:page?', async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const users = await User.find({
      'stats.gamesPlayed': { $gte: 5 } // Only show users with at least 5 games
    })
    .select('username stats')
    .sort({ 'stats.ranking': -1 })
    .skip(skip)
    .limit(limit);

    const totalUsers = await User.countDocuments({
      'stats.gamesPlayed': { $gte: 5 }
    });

    res.json({
      users,
      pagination: {
        current: page,
        total: Math.ceil(totalUsers / limit),
        hasNext: page < Math.ceil(totalUsers / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ message: 'Server error fetching leaderboard' });
  }
});

// Get user profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const user = await User.findOne({ username })
      .select('username stats createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user: user.getPublicProfile() });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ message: 'Server error fetching user profile' });
  }
});

// Search users by username (for invitations)
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    
    if (query.length < 2) {
      return res.status(400).json({ message: 'Search query must be at least 2 characters' });
    }

    const users = await User.find({
      username: { $regex: query, $options: 'i' },
      _id: { $ne: req.user._id }, // Exclude current user
      isOnline: true
    })
    .select('username stats isOnline')
    .limit(10)
    .sort('username');

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

module.exports = router;