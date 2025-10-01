const express = require('express');
const { auth } = require('../middleware/auth');
const Game = require('../models/Game');

const router = express.Router();

// Get user's current game
router.get('/current', auth, async (req, res) => {
  try {
    if (!req.user.currentGameId) {
      return res.json({ game: null });
    }

    const game = await Game.findById(req.user.currentGameId);
    if (!game) {
      return res.json({ game: null });
    }

    res.json({ game });
  } catch (error) {
    console.error('Get current game error:', error);
    res.status(500).json({ message: 'Server error fetching current game' });
  }
});

// Get game by ID
router.get('/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findById(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user is a player in this game
    const isPlayer = game.players.some(p => p.userId.toString() === req.user._id.toString());
    if (!isPlayer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json({ game });
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

    const games = await Game.find({
      'players.userId': req.user._id,
      status: 'finished'
    })
    .sort({ finishedAt: -1 })
    .skip(skip)
    .limit(limit)
    .select('players gameState.winner status createdAt finishedAt');

    const totalGames = await Game.countDocuments({
      'players.userId': req.user._id,
      status: 'finished'
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

    const game = await Game.findById(req.user.currentGameId);
    if (!game || game.status === 'finished') {
      return res.status(400).json({ message: 'Game not found or already finished' });
    }

    // Determine winner (the other player)
    const playerColor = game.players.find(p => p.userId.toString() === req.user._id.toString())?.color;
    const winnerColor = playerColor === 'blue' ? 'red' : 'blue';
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