const gameLogic = require('./gameLogic');
const Game = require('../models/Game');
const User = require('../models/User');

class MoveProcessor {
  async processMove(gameId, playerId, moveData) {
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        return { success: false, error: 'Game not found' };
      }

      // Validate it's the player's turn
      const playerColor = game.players.find(p => p.userId === playerId)?.color;
      if (!playerColor) {
        return { success: false, error: 'Player not in game' };
      }

      if (game.gameState.currentPlayer !== playerColor) {
        return { success: false, error: 'Not your turn' };
      }

      if (game.gameState.phase !== 'playing') {
        return { success: false, error: 'Game not in playing phase' };
      }

      const { fromX, fromY, toX, toY } = moveData;
      const board = game.gameState.board;

      // Validate the move
      const moveValidation = gameLogic.validateMove(board, fromX, fromY, toX, toY, playerColor);
      if (!moveValidation.valid) {
        return { success: false, error: moveValidation.reason };
      }

      // Process the move
      const moveResult = await this.executeMove(game, fromX, fromY, toX, toY, playerColor);
      
      // Save the updated game state
      await game.save();

      return {
        success: true,
        result: moveResult,
        gameState: game.gameState
      };

    } catch (error) {
      console.error('Move processing error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async executeMove(game, fromX, fromY, toX, toY, playerColor) {
    const board = game.gameState.board;
    const movingPiece = board[fromY][fromX];
    const targetPiece = board[toY][toX];

    let moveResult = {
      type: 'move',
      from: { x: fromX, y: fromY },
      to: { x: toX, y: toY },
      piece: movingPiece,
      timestamp: new Date()
    };

    if (targetPiece) {
      // Combat!
      const combatResult = gameLogic.resolveCombat(movingPiece, targetPiece);
      moveResult.type = 'attack';
      moveResult.combat = combatResult;

      // Reveal both pieces
      movingPiece.revealed = true;
      targetPiece.revealed = true;

      if (combatResult.result === 'attacker_wins') {
        // Attacker wins, moves to target square
        board[toY][toX] = movingPiece;
        board[fromY][fromX] = null;

      } else if (combatResult.result === 'defender_wins') {
        // Defender wins, attacker is destroyed
        board[fromY][fromX] = null;

      } else if (combatResult.result === 'both_destroyed') {
        // Both pieces destroyed
        board[toY][toX] = null;
        board[fromY][fromX] = null;
      }

    } else {
      // Simple move
      board[toY][toX] = movingPiece;
      board[fromY][fromX] = null;
    }

    // Update piece position
    if (board[toY][toX] === movingPiece) {
      movingPiece.position = { x: toX, y: toY };
    }

    // Check for flag capture first
    if (game.gameState.phase === 'playing' && targetPiece) {
      // Check if a flag was captured in this move
      const flagCaptured = this.isFlagPiece(targetPiece) && combatResult.result === 'attacker_wins';
      if (flagCaptured) {
        game.gameState.phase = 'finished';
        game.gameState.winner = playerColor;
        game.status = 'finished';
        game.finishedAt = new Date();
        
        moveResult.gameWon = true;
        moveResult.winner = playerColor;
        moveResult.winReason = 'flag_captured';
      }
    }

    // Check for other win conditions (if game not already won)
    if (game.gameState.phase === 'playing') {
      // Check if the opponent has lost (no flag or no movable pieces)
      const opponentColor = playerColor === 'home' ? 'away' : 'home';
      const winCheck = gameLogic.checkWinCondition(board, opponentColor);
      if (winCheck.gameOver) {
        game.gameState.phase = 'finished';
        game.gameState.winner = playerColor; // The player who made the move wins
        game.status = 'finished';
        game.finishedAt = new Date();
        
        moveResult.gameWon = true;
        moveResult.winner = playerColor;
        moveResult.winReason = winCheck.reason;
      }
    }

    // Add move to history
    game.gameState.moveHistory.push(moveResult);
    game.gameState.lastMove = moveResult;

    // Switch turns (if game not finished)
    if (game.gameState.phase === 'playing') {
      game.gameState.currentPlayer = playerColor === 'home' ? 'away' : 'home';
      game.gameState.turnNumber += playerColor === 'away' ? 1 : 0;
    }

    // Update game state
    game.gameState.board = board;
    game.changed('gameState', true);

    return moveResult;
  }

  async processSetup(gameId, playerId, setupData) {
    console.log('🔧 ProcessSetup called:', { gameId, playerId, setupData });
    
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        console.log('❌ Game not found:', gameId);
        return { success: false, error: 'Game not found' };
      }

      const playerColor = game.players.find(p => p.userId === playerId)?.color;
      console.log('🎨 Player color:', playerColor, 'for user:', playerId);
      
      if (!playerColor) {
        return { success: false, error: 'Player not in game' };
      }

      console.log('🎮 Game phase:', game.gameState.phase);
      if (game.gameState.phase !== 'setup') {
        return { success: false, error: 'Game not in setup phase' };
      }

      // Process piece placements
      const { placements, isRandom } = setupData;
      let army;

      // Get player's selected army
      const player = game.players.find(p => p.userId === playerId);
      const armyId = player?.army || 'default';
      
      console.log('🎯 Setup processing:', {
        playerId,
        playerColor,
        armyId,
        isRandom,
        placementsCount: placements?.length
      });

      if (isRandom) {
        army = gameLogic.generateRandomPlacement(playerColor, armyId);
      } else {
        army = this.validatePlacements(placements, playerColor, armyId);
        if (!army.valid) {
          console.error('❌ Validation failed:', army.error);
          return { success: false, error: army.error };
        }
        army = army.pieces;
      }

      // Place pieces on board
      const board = game.gameState.board;
      army.forEach(piece => {
        board[piece.position.y][piece.position.x] = piece;
      });

      // Mark player as ready by creating a new players array
      const updatedPlayers = game.players.map(p => 
        p.userId === playerId ? { ...p, isReady: true } : p
      );
      game.players = updatedPlayers;

      // Check if both players are ready
      const allPlayersReady = updatedPlayers.every(p => p.isReady);
      if (allPlayersReady) {
        game.gameState.phase = 'playing';
        game.status = 'active';
      }

      game.gameState.board = board;
      game.changed('gameState', true);
      game.changed('players', true);
      await game.save();

      return {
        success: true,
        gameState: game.gameState,
        ready: allPlayersReady
      };

    } catch (error) {
      console.error('Setup processing error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async placePieces(gameId, playerId, setupData) {
    console.log('🔧 PlacePieces called:', { gameId, playerId, setupData });
    
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        console.log('❌ Game not found:', gameId);
        return { success: false, error: 'Game not found' };
      }

      const playerColor = game.players.find(p => p.userId === playerId)?.color;
      console.log('🎨 Player color:', playerColor, 'for user:', playerId);
      
      if (!playerColor) {
        return { success: false, error: 'Player not in game' };
      }

      console.log('🎮 Game phase:', game.gameState.phase);
      if (game.gameState.phase !== 'setup') {
        return { success: false, error: 'Game not in setup phase' };
      }

      // Process piece placements
      const { placements, isRandom } = setupData;
      let army;

      // Get player's selected army
      const player = game.players.find(p => p.userId === playerId);
      const armyId = player?.army || 'default';
      
      console.log('🎯 Piece placement processing:', {
        playerId,
        playerColor,
        armyId,
        isRandom,
        placementsCount: placements?.length
      });

      // If isRandom is true OR placements is empty, use random placement
      if (isRandom || !placements || placements.length === 0) {
        army = gameLogic.generateRandomPlacement(playerColor, armyId);
      } else {
        army = this.validatePlacements(placements, playerColor, armyId);
        if (!army.valid) {
          console.error('❌ Validation failed:', army.error);
          return { success: false, error: army.error };
        }
        army = army.pieces;
      }

      // Place pieces on board
      const board = game.gameState.board;
      army.forEach(piece => {
        board[piece.position.y][piece.position.x] = piece;
      });

      // Mark player as having placed pieces by creating a new players array
      const updatedPlayers = game.players.map(p => 
        p.userId === playerId ? { ...p, piecesPlaced: true } : p
      );
      game.players = updatedPlayers;

      game.gameState.board = board;
      game.changed('gameState', true);
      game.changed('players', true);
      await game.save();

      return {
        success: true,
        gameState: game.gameState
      };

    } catch (error) {
      console.error('Piece placement error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  async confirmSetup(gameId, playerId) {
    console.log('✅ ConfirmSetup called:', { gameId, playerId });
    
    try {
      const game = await Game.findByPk(gameId);
      if (!game) {
        console.log('❌ Game not found:', gameId);
        return { success: false, error: 'Game not found' };
      }

      const playerColor = game.players.find(p => p.userId === playerId)?.color;
      console.log('🎨 Player color:', playerColor, 'for user:', playerId);
      
      if (!playerColor) {
        return { success: false, error: 'Player not in game' };
      }

      console.log('🎮 Game phase:', game.gameState.phase);
      if (game.gameState.phase !== 'setup') {
        return { success: false, error: 'Game not in setup phase' };
      }

      // Check if player has placed pieces
      const player = game.players.find(p => p.userId === playerId);
      if (!player.piecesPlaced) {
        return { success: false, error: 'Must place pieces before confirming setup' };
      }

      // Mark player as ready by creating a new players array
      const updatedPlayers = game.players.map(p => 
        p.userId === playerId ? { ...p, isReady: true } : p
      );
      game.players = updatedPlayers;

      // Check if both players are ready
      const allPlayersReady = updatedPlayers.every(p => p.isReady);
      if (allPlayersReady) {
        game.gameState.phase = 'playing';
        game.status = 'active';
      }

      game.changed('players', true);
      if (allPlayersReady) {
        game.changed('gameState', true);
      }
      await game.save();

      return {
        success: true,
        gameState: game.gameState,
        ready: allPlayersReady
      };

    } catch (error) {
      console.error('Setup confirmation error:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  validatePlacements(placements, color, armyId = 'default') {
    if (!placements || placements.length !== 40) {
      return { valid: false, error: 'Must place exactly 40 pieces' };
    }

    const armyData = gameLogic.loadArmyData(armyId);
    const expectedCounts = {};
    Object.entries(armyData.pieces).forEach(([type, info]) => {
      expectedCounts[type] = info.count;
    });
    
    console.log('📊 Validating army:', armyId, 'Expected pieces:', expectedCounts);

    const actualCounts = {};
    placements.forEach(placement => {
      actualCounts[placement.type] = (actualCounts[placement.type] || 0) + 1;
    });
    
    console.log('📊 Received pieces:', actualCounts);

    // Validate piece counts
    for (const [type, expectedCount] of Object.entries(expectedCounts)) {
      if (actualCounts[type] !== expectedCount) {
        return { 
          valid: false, 
          error: `Invalid count for ${type}: expected ${expectedCount}, got ${actualCounts[type] || 0}` 
        };
      }
    }

    // Convert placements to pieces
    const pieces = placements.map((placement, index) => {
      const pieceInfo = armyData.pieces[placement.type];
      return {
        id: `${color}_${placement.type}_${index}`,
        type: placement.type,
        color: color,
        rank: pieceInfo.rank,
        name: pieceInfo.name,
        symbol: pieceInfo.symbol,
        moveable: pieceInfo.moveable,
        canAttack: pieceInfo.canAttack,
        special: pieceInfo.special,
        revealed: false,
        position: { x: placement.x, y: placement.y }
      };
    });

    return { valid: true, pieces };
  }

  // Helper method to check if a piece is a flag
  isFlagPiece(piece) {
    return piece.type === 'flag' || 
           (piece.special && piece.special.includes('Must be captured to win'));
  }
}

module.exports = new MoveProcessor();