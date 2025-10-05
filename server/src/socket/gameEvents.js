const Game = require('../models/Game');
const User = require('../models/User');

const gameEvents = (socket, io) => {
  // Handle game invitation
  socket.on('invite_player', async (data) => {
    const { targetUserId, mapData } = data;
    
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
        mapData,
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
    const { accepted, fromUserId, mapData } = data;
    
    try {
      const fromUser = await User.findByPk(fromUserId);
      if (!fromUser || !fromUser.isOnline) {
        socket.emit('response_error', { message: 'Inviter is no longer online' });
        return;
      }

      if (accepted) {
        // Create new game with proper board using the selected map
        const gameLogic = require('../services/gameLogic');
        const initialBoard = gameLogic.createBoard(mapData);
        
        const game = await Game.create({
          players: [
            {
              userId: fromUserId,
              username: fromUser.username,
              side: 'home',
              isReady: false,
              piecesPlaced: false,
              army: null
            },
            {
              userId: socket.user.id,
              username: socket.user.username,
              side: 'away',
              isReady: false,
              piecesPlaced: false,
              army: null
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
          },
          mapData: mapData
        });

        // Update users' current game
        await User.update({ currentGameId: game.id }, { where: { id: fromUserId } });
        await User.update({ currentGameId: game.id }, { where: { id: socket.user.id } });

        // Notify both players with personalized game state
        const createGameDataForPlayer = (playerId) => ({
          id: game.id,
          players: game.players,
          gameState: game.getGameStateForPlayer(playerId),
          status: game.status,
          timeControl: game.timeControl,
          chatMessages: game.chatMessages,
          createdAt: game.createdAt,
          updatedAt: game.updatedAt
        });

        io.to(`user_${fromUserId}`).emit('game_created', createGameDataForPlayer(fromUserId));
        socket.emit('game_created', createGameDataForPlayer(socket.user.id));

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
        gameState: game.getGameStateForPlayer(socket.user.id),
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

  // Handle piece placement during game setup phase
  socket.on('place_pieces', async (data) => {
    const { gameId, placements, isRandom } = data;
    
    console.log('📦 Received place_pieces event:', {
      gameId,
      playerId: socket.user.id,
      playerUsername: socket.user.username,
      placementsCount: placements?.length,
      isRandom
    });
    
    try {
      const moveProcessor = require('../services/moveProcessor');
      const result = await moveProcessor.placePieces(gameId, socket.user.id, { placements, isRandom });
      
      console.log('📦 Piece placement result:', result);
      
      if (result.success) {
        // Notify both players of the piece placement
        const game = await Game.findByPk(gameId);
        game.players.forEach(player => {
          const playerSockets = [...io.sockets.sockets.values()].filter(s => s.user?.id === player.userId);
          playerSockets.forEach(playerSocket => {
            playerSocket.emit('pieces_placed', {
              playerId: socket.user.id,
              gameState: game.getGameStateForPlayer(player.userId)
            });
          });
        });
      } else {
        console.error('❌ Piece placement failed:', result.error);
        socket.emit('setup_error', { message: result.error });
      }
      
    } catch (error) {
      console.error('💥 Piece placement error:', error);
      socket.emit('setup_error', { message: 'Failed to place pieces' });
    }
  });

  // Handle setup confirmation
  socket.on('confirm_setup', async (data) => {
    const { gameId } = data;
    
    console.log('✅ Received confirm_setup event:', {
      gameId,
      playerId: socket.user.id,
      playerUsername: socket.user.username
    });
    
    try {
      const moveProcessor = require('../services/moveProcessor');
      const result = await moveProcessor.confirmSetup(gameId, socket.user.id);
      
      console.log('✅ Setup confirmation result:', result);
      
      if (result.success) {
        // Notify both players of the setup confirmation
        const game = await Game.findByPk(gameId);
        
        // Send personalized game state to each player
        game.players.forEach(player => {
          const playerSockets = [...io.sockets.sockets.values()].filter(s => s.user?.id === player.userId);
          playerSockets.forEach(playerSocket => {
            playerSocket.emit('setup_confirmed', {
              playerId: socket.user.id,
              players: game.players,
              gameState: game.getGameStateForPlayer(player.userId)
            });
          });
        });

        if (result.ready) {
          // Both players ready, game can start
          console.log('🎮 Both players ready, starting game');
          console.log('🎮 Game state being sent:', {
            phase: result.gameState.phase,
            currentPlayer: result.gameState.currentPlayer
          });
          
          // Send personalized game state to each player
          game.players.forEach(player => {
            const playerSockets = [...io.sockets.sockets.values()].filter(s => s.user?.id === player.userId);
            playerSockets.forEach(playerSocket => {
              playerSocket.emit('game_started', {
                gameState: game.getGameStateForPlayer(player.userId)
              });
            });
          });
        }
      } else {
        console.error('❌ Setup confirmation failed:', result.error);
        socket.emit('setup_error', { message: result.error });
      }
      
    } catch (error) {
      console.error('💥 Setup confirmation error:', error);
      socket.emit('setup_error', { message: 'Failed to confirm setup' });
    }
  });

  // Handle game moves during playing phase
  socket.on('game_move', async (data) => {
    const { gameId, fromX, fromY, toX, toY } = data;
    
    try {
      const moveProcessor = require('../services/moveProcessor');
      const result = await moveProcessor.processMove(gameId, socket.user.id, { fromX, fromY, toX, toY });
      
      if (result.success) {
        // Notify both players of the move with personalized game state
        const game = await Game.findByPk(gameId);
        game.players.forEach(player => {
          const playerSockets = [...io.sockets.sockets.values()].filter(s => s.user?.id === player.userId);
          playerSockets.forEach(playerSocket => {
            playerSocket.emit('move_made', {
              playerId: socket.user.id,
              moveResult: result.result,
              combatResult: result.result.combatResult,
              gameState: game.getGameStateForPlayer(player.userId)
            });
          });
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

  // Handle army selection
  socket.on('select_army', async (data) => {
    const { gameId, armyId } = data;
    
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        socket.emit('army_selection_error', { message: 'Game not found' });
        return;
      }

      // Check if user is a player in this game
      const playerIndex = game.players.findIndex(p => p.userId === socket.user.id);
      if (playerIndex === -1) {
        socket.emit('army_selection_error', { message: 'Player not in game' });
        return;
      }

      // Validate army selection
      const validArmies = ['fantasy', 'medieval', 'sci_fi', 'post_apocalyptic', 'tribal', 'undead_legion', 'alien_hive', 'roman_legion'];
      if (!validArmies.includes(armyId)) {
        socket.emit('army_selection_error', { message: 'Invalid army selection' });
        return;
      }

      // Update player's army selection
      const updatedPlayers = [...game.players];
      updatedPlayers[playerIndex] = {
        ...updatedPlayers[playerIndex],
        army: armyId
      };
      
      game.players = updatedPlayers;
      game.changed('players', true);
      await game.save();

      // Notify both players of the army selection
      io.to(`game_${gameId}`).emit('army_selected', {
        playerId: socket.user.id,
        armyId,
        players: game.players
      });

      console.log(`🎨 Player ${socket.user.username} selected ${armyId} army`);
      
    } catch (error) {
      console.error('Army selection error:', error);
      socket.emit('army_selection_error', { message: 'Failed to select army' });
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

      const player = game.players.find(p => p.userId === socket.user.id);
      const playerSide = player?.side;
      const armyId = player?.army || 'fantasy';
      
      if (!playerSide) {
        socket.emit('setup_error', { message: 'Player not in game' });
        return;
      }

      // Ensure we have valid map data, fallback to default if needed
      const mapDataToUse = game.mapData || null; // Let generateRandomPlacement handle the fallback
      const randomArmy = gameLogic.generateRandomPlacement(playerSide, armyId, mapDataToUse);
      
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