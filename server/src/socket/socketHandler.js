const { socketAuth } = require('../middleware/auth');
const gameEvents = require('./gameEvents');
const User = require('../models/User');
const Game = require('../models/Game');

// Handle player disconnection from game
const handleGameDisconnection = async (gameId, userId, io) => {
  try {
    const game = await Game.findByPk(gameId);
    if (!game || game.status === 'finished') return;

    const player = game.players.find(p => p.userId === userId);
    if (!player) return;

    // Only preserve active games, not setup games
    if (game.gameState.phase === 'playing') {
      console.log(`🔄 Preserving game ${gameId} for player ${userId} disconnection`);
      
      // Mark player as disconnected but keep game alive
      const updatedPlayers = game.players.map(p => {
        if (p.userId === userId) {
          return { ...p, isConnected: false, disconnectedAt: new Date() };
        }
        return p;
      });

      await game.update({ 
        players: updatedPlayers,
        status: 'paused' // Add paused status for preserved games
      });

      // Notify remaining player about disconnection
      io.to(`game_${gameId}`).emit('player_disconnected', {
        userId: userId,
        username: player.username,
        gamePreserved: true,
        message: `${player.username} disconnected. Game paused for 5 minutes.`
      });

      // Set timeout to abandon game if player doesn't return
      setTimeout(async () => {
        try {
          const gameCheck = await Game.findByPk(gameId);
          if (gameCheck && gameCheck.status === 'paused') {
            const disconnectedPlayer = gameCheck.players.find(p => p.userId === userId);
            if (disconnectedPlayer && !disconnectedPlayer.isConnected) {
              console.log(`⏰ Game ${gameId} timeout reached, abandoning game`);
              
              // Mark game as abandoned and clear currentGameId for both players
              await gameCheck.update({ status: 'abandoned' });
              await User.update({ currentGameId: null }, { 
                where: { id: { [require('sequelize').Op.in]: gameCheck.players.map(p => p.userId) } }
              });

              // Notify remaining player
              io.to(`game_${gameId}`).emit('game_abandoned', {
                reason: 'Player did not reconnect within 5 minutes',
                winner: gameCheck.players.find(p => p.userId !== userId)?.userId
              });
            }
          }
        } catch (error) {
          console.error('Error in game abandonment timeout:', error);
        }
      }, 5 * 60 * 1000); // 5 minutes

    } else {
      // For setup games, end immediately
      console.log(`🚫 Ending setup game ${gameId} due to player disconnection`);
      await game.update({ status: 'abandoned' });
      await User.update({ currentGameId: null }, { 
        where: { id: { [require('sequelize').Op.in]: game.players.map(p => p.userId) } }
      });

      io.to(`game_${gameId}`).emit('game_abandoned', {
        reason: 'Player disconnected during setup',
        winner: null
      });
    }

  } catch (error) {
    console.error('Error handling game disconnection:', error);
  }
};

const socketHandler = (io) => {
  // Authentication middleware for sockets
  io.use(socketAuth);

  io.on('connection', async (socket) => {
    console.log(`🔌 User ${socket.user.username} connected`);

    // Update user online status
    await User.update({ isOnline: true }, { where: { id: socket.user.id } });

    // Join user to their personal room
    socket.join(`user_${socket.user.id}`);

    // Handle user joining lobby
    socket.on('join_lobby', () => {
      socket.join('lobby');
      socket.emit('lobby_joined');
      
      // Broadcast to lobby that user is online
      socket.to('lobby').emit('user_online', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });

    // Handle user leaving lobby
    socket.on('leave_lobby', () => {
      socket.leave('lobby');
      socket.to('lobby').emit('user_offline', {
        userId: socket.user.id,
        username: socket.user.username
      });
    });

    // Game-related events
    gameEvents(socket, io);

    // Handle chat messages
    socket.on('chat_message', (data) => {
      const { message, gameId } = data;
      
      if (!message || message.trim().length === 0) return;
      if (message.length > 500) return; // Message length limit

      const chatMessage = {
        id: Date.now(),
        userId: socket.user.id,
        username: socket.user.username,
        message: message.trim(),
        timestamp: new Date()
      };

      if (gameId) {
        // Game chat
        socket.to(`game_${gameId}`).emit('chat_message', chatMessage);
      } else {
        // Lobby chat
        socket.to('lobby').emit('chat_message', chatMessage);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`🔌 User ${socket.user.username} disconnected`);
      
      try {
        // Update user offline status
        await User.update({ isOnline: false }, { where: { id: socket.user.id } });

        // Notify lobby users
        socket.to('lobby').emit('user_offline', {
          userId: socket.user.id,
          username: socket.user.username
        });

        // Handle game disconnection if user was in a game
        if (socket.user.currentGameId) {
          await handleGameDisconnection(socket.user.currentGameId, socket.user.id, io);
        }
      } catch (error) {
        console.error('Error handling disconnect:', error);
      }
    });

    // Handle connection errors
    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
  });
};

module.exports = socketHandler;