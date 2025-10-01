const Game = require('../models/Game');
const User = require('../models/User');

const gameEvents = (socket, io) => {
  // Handle game invitation
  socket.on('invite_player', async (data) => {
    const { targetUserId } = data;
    
    try {
      const targetUser = await User.findByPk(targetUserId);
      if (!targetUser || !targetUser.isOnline) {
        socket.emit('invite_error', { message: 'User not found or offline' });
        return;
      }

      const invitation = {
        from: {
          id: socket.user.id,
          username: socket.user.username
        },
        timestamp: new Date()
      };

      // Send invitation to target user
      io.to(`user_${targetUserId}`).emit('game_invitation', invitation);
      socket.emit('invitation_sent', { targetUsername: targetUser.username });
      
    } catch (error) {
      console.error('Invite error:', error);
      socket.emit('invite_error', { message: 'Failed to send invitation' });
    }
  });

  // Handle invitation response
  socket.on('invitation_response', async (data) => {
    const { accepted, fromUserId } = data;
    
    try {
      const fromUser = await User.findByPk(fromUserId);
      if (!fromUser || !fromUser.isOnline) {
        socket.emit('response_error', { message: 'Inviter is no longer online' });
        return;
      }

      if (accepted) {
        // Create new game
        const game = await Game.create({
          players: [
            {
              userId: fromUserId,
              username: fromUser.username,
              color: 'blue'
            },
            {
              userId: socket.user.id,
              username: socket.user.username,
              color: 'red'
            }
          ],
          status: 'setup'
        });

        // Update users' current game
        await User.update({ currentGameId: game.id }, { where: { id: fromUserId } });
        await User.update({ currentGameId: game.id }, { where: { id: socket.user.id } });

        // Notify both players
        const gameData = {
          gameId: game.id,
          players: game.players,
          gameState: game.gameState
        };

        io.to(`user_${fromUserId}`).emit('game_created', gameData);
        socket.emit('game_created', gameData);

        // Join both players to game room
        io.sockets.sockets.forEach((s) => {
          if (s.user && (s.user.id === fromUserId || s.user.id === socket.user.id)) {
            s.join(`game_${game.id}`);
          }
        });

      } else {
        // Declined invitation
        io.to(`user_${fromUserId}`).emit('invitation_declined', {
          from: socket.user.username
        });
      }
      
    } catch (error) {
      console.error('Invitation response error:', error);
      socket.emit('response_error', { message: 'Failed to process response' });
    }
  });

  // Handle joining existing game
  socket.on('join_game', async (data) => {
    const { gameId } = data;
    
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        socket.emit('join_error', { message: 'Game not found' });
        return;
      }

      // Check if user is a player in this game
      const isPlayer = game.players.some(p => p.userId === socket.user.id);
      if (!isPlayer) {
        socket.emit('join_error', { message: 'You are not a player in this game' });
        return;
      }

      socket.join(`game_${gameId}`);
      socket.emit('game_joined', {
        gameId: game.id,
        players: game.players,
        gameState: game.gameState
      });

    } catch (error) {
      console.error('Join game error:', error);
      socket.emit('join_error', { message: 'Failed to join game' });
    }
  });

  // Handle leaving game
  socket.on('leave_game', async (data) => {
    const { gameId } = data;
    socket.leave(`game_${gameId}`);
    socket.emit('game_left');
  });

  // Placeholder for future game move handling
  socket.on('game_move', async (data) => {
    // Will implement move validation and processing in Phase 2
    console.log('Game move received:', data);
    socket.emit('move_error', { message: 'Game moves not yet implemented' });
  });
};

module.exports = gameEvents;