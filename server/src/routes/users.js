const express = require('express');
const { auth } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get online users for lobby
router.get('/online', auth, async (req, res) => {
  try {
    const onlineUsers = await User.findAll({
      where: { 
        isOnline: true,
        id: { [require('sequelize').Op.ne]: req.user.id }
      },
      attributes: ['id', 'username', 'gamesPlayed', 'wins', 'losses', 'ranking', 'isOnline'],
      order: [['ranking', 'DESC']]
    });

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

    const users = await User.findAll({
      where: {
        gamesPlayed: { [require('sequelize').Op.gte]: 5 }
      },
      attributes: ['id', 'username', 'gamesPlayed', 'wins', 'losses', 'ranking'],
      order: [['ranking', 'DESC']],
      offset: skip,
      limit: limit
    });

    const totalUsers = await User.count({
      where: {
        gamesPlayed: { [require('sequelize').Op.gte]: 5 }
      }
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
    const user = await User.findOne({ 
      where: { username },
      attributes: ['id', 'username', 'gamesPlayed', 'wins', 'losses', 'ranking', 'createdAt']
    });

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

    const users = await User.findAll({
      where: {
        username: { [require('sequelize').Op.iLike]: `%${query}%` },
        id: { [require('sequelize').Op.ne]: req.user.id },
        isOnline: true
      },
      attributes: ['id', 'username', 'gamesPlayed', 'wins', 'losses', 'ranking', 'isOnline'],
      limit: 10,
      order: ['username']
    });

    res.json({ users });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ message: 'Server error searching users' });
  }
});

// Update user's current map selection
router.put('/current-map', auth, async (req, res) => {
  try {
    const { mapId } = req.body;
    
    if (!mapId || typeof mapId !== 'string') {
      return res.status(400).json({ message: 'Valid map ID is required' });
    }

    // Validate map ID (basic validation - you could make this more strict)
    const validMapIds = [
      'classic', 
      'highlands', 
      'canyon', 
      'fortress', 
      'valley', 
      'crossroads', 
      'labyrinth', 
      'arctic',
      'mountain_ridge',
      'central_peaks',
      'valley_defense',
      'highland_stronghold',
      'twin_peaks',
      'test_water_setup' // Legacy test map
    ];
    if (!validMapIds.includes(mapId)) {
      return res.status(400).json({ message: 'Invalid map ID' });
    }

    await User.update(
      { currentMap: mapId },
      { where: { id: req.user.id } }
    );

    res.json({ success: true, currentMap: mapId });
  } catch (error) {
    console.error('Update current map error:', error);
    res.status(500).json({ message: 'Server error updating current map' });
  }
});

// Get user's current map selection
router.get('/me/current-map', auth, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: ['currentMap']
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ currentMap: user.currentMap || 'classic' });
  } catch (error) {
    console.error('Get current map error:', error);
    res.status(500).json({ message: 'Server error fetching current map' });
  }
});

module.exports = router;