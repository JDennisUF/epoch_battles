const express = require('express');
const { auth } = require('../middleware/auth');
const { Placement, UserPlacement, User } = require('../models');
const { Op } = require('sequelize');
const gameLogic = require('../services/gameLogic');

const router = express.Router();

// Helper function to get expected piece count for a map
async function getExpectedPieceCount(mapId, armyId = 'default') {
  try {
    // Load map data
    const fs = require('fs');
    const path = require('path');
    const mapPath = path.join(__dirname, `../../../client/public/data/maps/${mapId}.json`);
    
    if (!fs.existsSync(mapPath)) {
      console.warn(`Map file not found: ${mapPath}`);
      return 40; // Default to 40 pieces
    }
    
    const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
    
    // Generate a sample army to get the expected count
    const sampleArmy = gameLogic.generateArmy('home', armyId, mapData);
    return sampleArmy.length;
  } catch (error) {
    console.error('Error calculating expected piece count:', error);
    return 40; // Default to 40 pieces on error
  }
}

// Get placements for specific map
router.get('/map/:mapId', auth, async (req, res) => {
  try {
    const { mapId } = req.params;
    const userId = req.user.id;

    // Get global placements
    const globalPlacements = await Placement.findAll({
      where: {
        mapId,
        isGlobal: true
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Get user's own placements
    const userPlacements = await Placement.findAll({
      where: {
        mapId,
        createdBy: userId,
        isGlobal: false
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ],
      order: [['name', 'ASC']]
    });

    // Get user's favorite placements (including favorites of global placements)
    const favoritePlacements = await Placement.findAll({
      where: {
        mapId
      },
      include: [
        {
          model: User,
          as: 'favoriteUsers',
          where: { id: userId },
          through: { attributes: ['isFavorite'] },
          required: true
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      global: globalPlacements,
      user: userPlacements,
      favorites: favoritePlacements
    });

  } catch (error) {
    console.error('Get placements error:', error);
    res.status(500).json({ message: 'Server error fetching placements' });
  }
});

// Create new placement
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, mapId, placements, isGlobal = false } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || !mapId || !placements || !Array.isArray(placements)) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Get expected piece count for this map
    const expectedPieceCount = await getExpectedPieceCount(mapId);
    
    // Validate placements array
    if (placements.length !== expectedPieceCount) {
      return res.status(400).json({ 
        message: `Placement must contain exactly ${expectedPieceCount} pieces (found ${placements.length})` 
      });
    }

    // Create placement
    const placement = await Placement.create({
      name,
      description,
      mapId,
      placements,
      isGlobal,
      createdBy: userId
    });

    // Automatically add to user's favorites
    await UserPlacement.create({
      userId,
      placementId: placement.id,
      isFavorite: true
    });

    // Fetch the created placement with creator info
    const createdPlacement = await Placement.findByPk(placement.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });

    res.status(201).json(createdPlacement);

  } catch (error) {
    console.error('Create placement error:', error);
    res.status(500).json({ message: 'Server error creating placement' });
  }
});

// Add/remove placement from user's favorites
router.post('/:placementId/favorite', auth, async (req, res) => {
  try {
    const { placementId } = req.params;
    const userId = req.user.id;

    // Check if placement exists
    const placement = await Placement.findByPk(placementId);
    if (!placement) {
      return res.status(404).json({ message: 'Placement not found' });
    }

    // Check if already favorited
    const existingFavorite = await UserPlacement.findOne({
      where: { userId, placementId }
    });

    if (existingFavorite) {
      // Toggle favorite status
      existingFavorite.isFavorite = !existingFavorite.isFavorite;
      await existingFavorite.save();
      
      res.json({ 
        favorited: existingFavorite.isFavorite,
        message: existingFavorite.isFavorite ? 'Added to favorites' : 'Removed from favorites'
      });
    } else {
      // Create new favorite
      await UserPlacement.create({
        userId,
        placementId,
        isFavorite: true
      });
      
      res.json({ 
        favorited: true,
        message: 'Added to favorites'
      });
    }

  } catch (error) {
    console.error('Favorite placement error:', error);
    res.status(500).json({ message: 'Server error updating favorite' });
  }
});

// Delete placement (only own placements)
router.delete('/:placementId', auth, async (req, res) => {
  try {
    const { placementId } = req.params;
    const userId = req.user.id;

    const placement = await Placement.findOne({
      where: {
        id: placementId,
        createdBy: userId,
        isGlobal: false // Only allow deleting non-global placements
      }
    });

    if (!placement) {
      return res.status(404).json({ message: 'Placement not found or not authorized' });
    }

    await placement.destroy();
    res.json({ message: 'Placement deleted successfully' });

  } catch (error) {
    console.error('Delete placement error:', error);
    res.status(500).json({ message: 'Server error deleting placement' });
  }
});

// Update placement (only own placements)
router.put('/:placementId', auth, async (req, res) => {
  try {
    const { placementId } = req.params;
    const { name, description, placements } = req.body;
    const userId = req.user.id;

    const placement = await Placement.findOne({
      where: {
        id: placementId,
        createdBy: userId,
        isGlobal: false // Only allow updating non-global placements
      }
    });

    if (!placement) {
      return res.status(404).json({ message: 'Placement not found or not authorized' });
    }

    // Validate placements if provided
    if (placements) {
      if (!Array.isArray(placements)) {
        return res.status(400).json({ message: 'Placements must be an array' });
      }
      
      const expectedPieceCount = await getExpectedPieceCount(placement.mapId);
      if (placements.length !== expectedPieceCount) {
        return res.status(400).json({ 
          message: `Placement must contain exactly ${expectedPieceCount} pieces (found ${placements.length})` 
        });
      }
    }

    // Update placement
    await placement.update({
      name: name || placement.name,
      description: description !== undefined ? description : placement.description,
      placements: placements || placement.placements
    });

    // Fetch updated placement with creator info
    const updatedPlacement = await Placement.findByPk(placement.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'username']
        }
      ]
    });

    res.json(updatedPlacement);

  } catch (error) {
    console.error('Update placement error:', error);
    res.status(500).json({ message: 'Server error updating placement' });
  }
});

module.exports = router;