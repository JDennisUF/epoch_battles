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
        // Create new game with proper board
        const gameLogic = require('../services/gameLogic');
        const initialBoard = gameLogic.createBoard();
        
        const game = await Game.create({
          players: [
            {
              userId: fromUserId,
              username: fromUser.username,
              color: 'home',
              isReady: false
            },
            {
              userId: socket.user.id,
              username: socket.user.username,
              color: 'away',
              isReady: false
            }
          ],
          status: 'setup',
          gameState: {
            board: initialBoard,
            currentPlayer: 'home',
            turnNumber: 1,
            phase: 'setup',
            winner: null,
            lastMove: null,
            moveHistory: []
          }
        });

        // Update users' current game
        await User.update({ currentGameId: game.id }, { where: { id: fromUserId } });
        await User.update({ currentGameId: game.id }, { where: { id: socket.user.id } });

        // Notify both players
        const gameData = {
          id: game.id,
          players: game.players,
          gameState: game.gameState,
          status: game.status,
          timeControl: game.timeControl,
          chatMessages: game.chatMessages,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt
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
        id: game.id,
        players: game.players,
        gameState: game.gameState,
        status: game.status,
        timeControl: game.timeControl,
        chatMessages: game.chatMessages,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt
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

  // Handle piece setup during game setup phase
  socket.on('setup_pieces', async (data) => {
    const { gameId, placements, isRandom } = data;
    
    console.log('📦 Received setup_pieces event:', {
      gameId,
      playerId: socket.user.id,
      playerUsername: socket.user.username,
      placementsCount: placements?.length,
      isRandom
    });
    
    try {
      const moveProcessor = require('../services/moveProcessor');
      const result = await moveProcessor.processSetup(gameId, socket.user.id, { placements, isRandom });
      
      console.log('📦 Setup processing result:', result);
      
      if (result.success) {
        // Notify both players of the setup
        io.to(`game_${gameId}`).emit('setup_updated', {
          playerId: socket.user.id,
          ready: result.ready,
          gameState: result.gameState
        });

        if (result.ready) {
          // Both players ready, game can start
          console.log('🎮 Both players ready, starting game');
          console.log('🎮 Game state being sent:', {
            phase: result.gameState.phase,
            currentPlayer: result.gameState.currentPlayer
          });
          
          // Debug: Check who's in the room
          const room = io.sockets.adapter.rooms.get(`game_${gameId}`);
          console.log('🏠 Sockets in game room:', room ? room.size : 0);
          if (room) {
            room.forEach(socketId => {
              const socket = io.sockets.sockets.get(socketId);
              console.log('👤 Socket in room:', socket?.user?.username || 'unknown');
            });
          }
          
          io.to(`game_${gameId}`).emit('game_started', {
            gameState: result.gameState
          });
        }
      } else {
        console.error('❌ Setup processing failed:', result.error);
        socket.emit('setup_error', { message: result.error });
      }
      
    } catch (error) {
      console.error('💥 Setup error:', error);
      socket.emit('setup_error', { message: 'Failed to process setup' });
    }
  });

  // Handle game moves during playing phase
  socket.on('game_move', async (data) => {
    const { gameId, fromX, fromY, toX, toY } = data;
    
    try {
      const moveProcessor = require('../services/moveProcessor');
      const result = await moveProcessor.processMove(gameId, socket.user.id, { fromX, fromY, toX, toY });
      
      if (result.success) {
        // Notify both players of the move
        io.to(`game_${gameId}`).emit('move_made', {
          playerId: socket.user.id,
          moveResult: result.result,
          gameState: result.gameState
        });

        if (result.result.gameWon) {
          // Game finished, update player stats
          // TODO: Implement stats update
          io.to(`game_${gameId}`).emit('game_finished', {
            winner: result.result.winner,
            reason: result.result.winReason || 'flag_captured'
          });
        }
      } else {
        socket.emit('move_error', { message: result.error });
      }
      
    } catch (error) {
      console.error('Move error:', error);
      socket.emit('move_error', { message: 'Failed to process move' });
    }
  });

  // Handle random setup request
  socket.on('random_setup', async (data) => {
    const { gameId } = data;
    
    try {
      const gameLogic = require('../services/gameLogic');
      const game = await Game.findByPk(gameId);
      
      if (!game) {
        socket.emit('setup_error', { message: 'Game not found' });
        return;
      }

      const playerColor = game.players.find(p => p.userId === socket.user.id)?.color;
      if (!playerColor) {
        socket.emit('setup_error', { message: 'Player not in game' });
        return;
      }

      const randomArmy = gameLogic.generateRandomPlacement(playerColor);
      
      socket.emit('random_placement', {
        pieces: randomArmy
      });
      
    } catch (error) {
      console.error('Random setup error:', error);
      socket.emit('setup_error', { message: 'Failed to generate random setup' });
    }
  });
};

module.exports = gameEvents;