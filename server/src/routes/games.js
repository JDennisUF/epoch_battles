const express = require('express');
const { Op } = require('sequelize');
const { auth } = require('../middleware/auth');
const Game = require('../models/Game');

const router = express.Router();

// Get user's current game
router.get('/current', auth, async (req, res) => {
  try {
    console.log('Getting current game for user:', req.user.id, 'currentGameId:', req.user.currentGameId);
    
    // Refresh user data to get latest currentGameId
    const freshUser = await require('../models/User').findByPk(req.user.id);
    if (!freshUser || !freshUser.currentGameId) {
      console.log('No current game found for user');
      return res.json({ game: null });
    }

    const game = await Game.findByPk(freshUser.currentGameId);
    if (!game) {
      console.log('Game not found with ID:', freshUser.currentGameId);
      return res.json({ game: null });
    }

    console.log('Found game:', game.id, 'status:', game.status);
    
    // Return the game with personalized game state
    const gameResponse = {
      id: game.id,
      players: game.players,
      gameState: game.getGameStateForPlayer(req.user.id),
      status: game.status,
      timeControl: game.timeControl,
      chatMessages: game.chatMessages,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };
    
    console.log('🗺️ Returning game with mapData:', {
      hasMapData: !!gameResponse.gameState.mapData,
      mapDataId: gameResponse.gameState.mapData?.id,
      mapDataName: gameResponse.gameState.mapData?.name
    });
    
    res.json({ game: gameResponse });
  } catch (error) {
    console.error('Get current game error:', error);
    res.status(500).json({ message: 'Server error fetching current game' });
  }
});

// Get game by ID
router.get('/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findByPk(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is a player in this game
    const isPlayer = game.players.some(p => p.userId === req.user.id);
    if (!isPlayer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Return the game with personalized game state
    const gameResponse = {
      id: game.id,
      players: game.players,
      gameState: game.getGameStateForPlayer(req.user.id),
      status: game.status,
      timeControl: game.timeControl,
      chatMessages: game.chatMessages,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };
    
    console.log('🗺️ Returning game by ID with mapData:', {
      hasMapData: !!gameResponse.gameState.mapData,
      mapDataId: gameResponse.gameState.mapData?.id,
      mapDataName: gameResponse.gameState.mapData?.name
    });

    res.json({ game: gameResponse });
  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({ message: 'Server error fetching game' });
  }
});

// Get user's game history
router.get('/history/:page?', auth, async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const games = await Game.findAll({
      where: {
        status: 'finished',
        players: {
          [Op.contains]: [{ userId: req.user.id }]
        }
      },
      order: [['finishedAt', 'DESC']],
      offset: skip,
      limit: limit,
      attributes: ['id', 'players', 'gameState', 'status', 'createdAt', 'finishedAt']
    });

    const totalGames = await Game.count({
      where: {
        status: 'finished',
        players: {
          [Op.contains]: [{ userId: req.user.id }]
        }
      }
    });

    res.json({
      games,
      pagination: {
        current: page,
        total: Math.ceil(totalGames / limit),
        hasNext: page < Math.ceil(totalGames / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get game history error:', error);
    res.status(500).json({ message: 'Server error fetching game history' });
  }
});

// Forfeit current game
router.post('/forfeit', auth, async (req, res) => {
  try {
    if (!req.user.currentGameId) {
      return res.status(400).json({ message: 'No active game found' });
    }

    const game = await Game.findByPk(req.user.currentGameId);
    if (!game || game.status === 'finished') {
      return res.status(400).json({ message: 'Game not found or already finished' });
    }

    // Determine winner (the other player)
    const playerColor = game.players.find(p => p.userId === req.user.id)?.color;
    const winnerColor = playerColor === 'home' ? 'away' : 'home';
    const winner = game.players.find(p => p.color === winnerColor);

    // Update game state
    game.status = 'finished';
    game.gameState.phase = 'finished';
    game.gameState.winner = winnerColor;
    game.finishedAt = new Date();
    
    await game.save();

    // Update user stats and clear current game
    // This will be implemented when we add stats tracking

    res.json({ message: 'Game forfeited successfully' });
  } catch (error) {
    console.error('Forfeit game error:', error);
    res.status(500).json({ message: 'Server error forfeiting game' });
  }
});

module.exports = router;