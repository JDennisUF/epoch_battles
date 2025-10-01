const { socketAuth } = require('../middleware/auth');
const gameEvents = require('./gameEvents');
const User = require('../models/User');

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
          socket.to(`game_${socket.user.currentGameId}`).emit('player_disconnected', {
            userId: socket.user.id,
            username: socket.user.username
          });
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