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


// Get user's finished game history
router.get('/history/finished/:page?', auth, async (req, res) => {
  try {
    console.log('Fetching finished games for user:', req.user.id);
    
    const page = parseInt(req.params.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const whereClause = {
      status: 'finished',
      [Op.or]: [
        {
          players: {
            [Op.contains]: [{ userId: req.user.id }]
          }
        },
        // Fallback for SQLite compatibility
        {
          players: {
            [Op.like]: `%"userId":${req.user.id}%`
          }
        }
      ]
    };

    // Get all finished games and filter in JavaScript for better reliability
    const allFinishedGames = await Game.findAll({
      where: { status: 'finished' },
      order: [['finishedAt', 'DESC']],
      attributes: ['id', 'players', 'gameState', 'status', 'createdAt', 'finishedAt', 'mapData']
    });

    // Filter games where user is a player
    const userFinishedGames = allFinishedGames.filter(game => {
      return game.players.some(p => p.userId === req.user.id);
    });

    // Apply pagination
    const totalGames = userFinishedGames.length;
    const paginatedGames = userFinishedGames.slice(skip, skip + limit);

    console.log(`Found ${paginatedGames.length} finished games for user ${req.user.id} (total: ${totalGames})`);
    console.log('Finished game details:', paginatedGames.map(g => ({ 
      id: g.id, 
      status: g.status, 
      players: g.players.map(p => p.username),
      hasMapData: !!g.mapData,
      finishedAt: g.finishedAt 
    })));
    
    res.json({
      games: paginatedGames || [],
      pagination: {
        current: page,
        total: Math.ceil(totalGames / limit),
        hasNext: page < Math.ceil(totalGames / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Get finished game history error:', error);
    console.error('Error details:', error.message);
    
    // Return empty result instead of error for better UX
    res.json({
      games: [],
      pagination: {
        current: 1,
        total: 0,
        hasNext: false,
        hasPrev: false
      }
    });
  }
});

// Get user's active games
router.get('/history/active', auth, async (req, res) => {
  try {
    console.log('Fetching active games for user:', req.user.id);
    
    // First, check if user has a current game via currentGameId
    const freshUser = await require('../models/User').findByPk(req.user.id);
    const userGames = [];
    
    if (freshUser && freshUser.currentGameId) {
      console.log('User has current game ID:', freshUser.currentGameId);
      const currentGame = await Game.findByPk(freshUser.currentGameId);
      if (currentGame && ['waiting', 'setup', 'active', 'paused'].includes(currentGame.status)) {
        console.log('Adding current game:', currentGame.id, 'status:', currentGame.status);
        userGames.push(currentGame);
      }
    }
    
    // Then find all games where this user is a player
    const allGames = await Game.findAll({
      where: {
        status: {
          [Op.in]: ['waiting', 'setup', 'active', 'paused']
        }
      },
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'players', 'gameState', 'status', 'createdAt', 'updatedAt', 'mapData']
    });

    // Filter games in JavaScript to handle JSON queries more reliably
    const playerGames = allGames.filter(game => {
      const isPlayer = game.players.some(p => p.userId === req.user.id);
      const alreadyIncluded = userGames.some(existing => existing.id === game.id);
      return isPlayer && !alreadyIncluded;
    });
    
    // Combine and deduplicate
    const allUserGames = [...userGames, ...playerGames];
    
    // Process each game to include proper gameState with mapData for the requesting user
    const processedGames = allUserGames.map(game => ({
      id: game.id,
      players: game.players,
      gameState: game.getGameStateForPlayer(req.user.id),
      status: game.status,
      timeControl: game.timeControl,
      chatMessages: game.chatMessages,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    }));
    
    console.log(`Found ${processedGames.length} active games for user ${req.user.id}`);
    console.log('Game details:', processedGames.map(g => ({ 
      id: g.id, 
      status: g.status, 
      players: g.players.map(p => p.username),
      hasMapData: !!g.gameState.mapData 
    })));
    
    res.json({ games: processedGames || [] });
  } catch (error) {
    console.error('Get active games error:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Return empty array instead of error for better UX
    res.json({ games: [] });
  }
});

// Get detailed game information for finished games
router.get('/details/:gameId', auth, async (req, res) => {
  try {
    const { gameId } = req.params;
    const game = await Game.findByPk(gameId);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }

    // Check if user was a player in this game
    const isPlayer = game.players.some(p => p.userId === req.user.id);
    if (!isPlayer) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Only allow viewing details of finished games
    if (game.status !== 'finished') {
      return res.status(400).json({ message: 'Game details only available for finished games' });
    }

    // Return full game data including move history for replay
    const gameDetails = {
      id: game.id,
      players: game.players,
      gameState: game.gameState,
      status: game.status,
      mapData: game.mapData,
      createdAt: game.createdAt,
      finishedAt: game.finishedAt,
      moveHistory: game.gameState.moveHistory || []
    };

    res.json({ game: gameDetails });
  } catch (error) {
    console.error('Get game details error:', error);
    res.status(500).json({ message: 'Server error fetching game details' });
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
    const playerSide = game.players.find(p => p.userId === req.user.id)?.side;
    const winnerSide = playerSide === 'home' ? 'away' : 'home';
    const winner = game.players.find(p => p.side === winnerSide);

    // Update game state
    game.status = 'finished';
    game.gameState.phase = 'finished';
    game.gameState.winner = winnerSide;
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

// Rejoin a paused game
router.post('/rejoin', auth, async (req, res) => {
  try {
    // Find a paused game where this user is a player but disconnected
    const game = await Game.findOne({
      where: {
        status: 'paused',
        players: {
          [Op.contains]: [{ userId: req.user.id, isConnected: false }]
        }
      }
    });

    if (!game) {
      return res.status(404).json({ message: 'No rejoinable game found' });
    }

    console.log(`🔄 Player ${req.user.id} rejoining game ${game.id}`);

    // Mark player as connected and update game status
    const updatedPlayers = game.players.map(p => {
      if (p.userId === req.user.id) {
        return { 
          ...p, 
          isConnected: true, 
          disconnectedAt: null,
          reconnectedAt: new Date()
        };
      }
      return p;
    });

    // Resume game to active status
    await game.update({ 
      players: updatedPlayers,
      status: 'active'
    });

    // Update user's current game
    await require('../models/User').update(
      { currentGameId: game.id }, 
      { where: { id: req.user.id } }
    );

    // Notify other player about reconnection
    const io = req.app.get('io');
    if (io) {
      io.to(`game_${game.id}`).emit('player_reconnected', {
        userId: req.user.id,
        username: req.user.username,
        message: `${req.user.username} has reconnected. Game resumed!`
      });
    }

    // Return the game data
    const gameResponse = {
      id: game.id,
      players: updatedPlayers,
      gameState: game.getGameStateForPlayer(req.user.id),
      status: 'active',
      timeControl: game.timeControl,
      chatMessages: game.chatMessages,
      createdAt: game.createdAt,
      updatedAt: game.updatedAt
    };

    res.json({ 
      game: gameResponse,
      message: 'Successfully rejoined game'
    });

  } catch (error) {
    console.error('Rejoin game error:', error);
    res.status(500).json({ message: 'Server error rejoining game' });
  }
});

// Check if user has a rejoinable game
router.get('/rejoinable', auth, async (req, res) => {
  try {
    console.log('Checking rejoinable games for user:', req.user.id);
    
    // Use a more robust query approach
    const games = await Game.findAll({
      where: {
        status: 'paused'
      }
    });

    // Filter games in JavaScript to handle JSON queries more reliably
    const rejoinableGame = games.find(game => {
      const player = game.players.find(p => p.userId === req.user.id && p.isConnected === false);
      return player !== undefined;
    });

    if (!rejoinableGame) {
      console.log('No rejoinable game found for user:', req.user.id);
      return res.json({ hasRejoinableGame: false });
    }

    const player = rejoinableGame.players.find(p => p.userId === req.user.id);
    const disconnectedAt = new Date(player.disconnectedAt);
    const timeLeft = Math.max(0, 5 * 60 * 1000 - (Date.now() - disconnectedAt.getTime()));

    console.log(`Found rejoinable game ${rejoinableGame.id} for user ${req.user.id}, time left: ${timeLeft}ms`);

    res.json({ 
      hasRejoinableGame: true,
      gameId: rejoinableGame.id,
      opponent: rejoinableGame.players.find(p => p.userId !== req.user.id)?.username,
      timeLeftMs: timeLeft,
      disconnectedAt: disconnectedAt
    });

  } catch (error) {
    console.error('Check rejoinable game error:', error);
    console.error('Error details:', error.message);
    
    // Return no rejoinable game instead of error for better UX
    res.json({ hasRejoinableGame: false });
  }
});

// Get game by ID (must be last due to parametric route)
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

module.exports = router;