const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Game = sequelize.define('Game', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  players: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: []
  },
  gameState: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {
      board: Array(10).fill(null).map(() => Array(10).fill(null)),
      currentPlayer: 'blue',
      turnNumber: 1,
      phase: 'setup',
      winner: null,
      lastMove: null,
      moveHistory: []
    }
  },
  status: {
    type: DataTypes.ENUM('waiting', 'setup', 'active', 'finished', 'abandoned'),
    defaultValue: 'waiting'
  },
  timeControl: {
    type: DataTypes.JSONB,
    defaultValue: {
      initialTime: 900000, // 15 minutes
      increment: 10000,    // 10 seconds
      blueTimeLeft: 900000,
      redTimeLeft: 900000,
      lastMoveTime: null
    }
  },
  chatMessages: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  finishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'games',
  timestamps: true,
  indexes: [
    {
      fields: ['status']
    },
    {
      fields: ['createdAt']
    }
  ]
});

// Instance methods
Game.prototype.getGameStateForPlayer = function(playerId) {
  const playerColor = this.players.find(p => p.userId === playerId)?.color;
  
  if (!playerColor) {
    throw new Error('Player not found in game');
  }

  // Create a copy of the game state
  const gameState = {
    ...this.gameState,
    playerColor,
    opponentColor: playerColor === 'blue' ? 'red' : 'blue'
  };

  // Hide opponent pieces if game is in playing phase
  if (this.gameState.phase === 'playing') {
    gameState.board = this.gameState.board.map((row, y) =>
      row.map((piece, x) => {
        if (!piece) return null;
        
        // Show own pieces completely
        if (piece.color === playerColor) {
          return piece;
        }
        
        // Hide opponent piece types (only show color and position)
        return {
          color: piece.color,
          revealed: piece.revealed || false,
          type: piece.revealed ? piece.type : 'hidden'
        };
      })
    );
  }

  return gameState;
};

Game.prototype.isReadyToStart = function() {
  return this.players.length === 2 && 
         this.players.every(player => player.isReady) &&
         this.status === 'setup';
};

Game.prototype.getOpponent = function(playerId) {
  return this.players.find(p => p.userId !== playerId);
};

Game.prototype.switchTurn = function() {
  const newGameState = { ...this.gameState };
  newGameState.currentPlayer = newGameState.currentPlayer === 'blue' ? 'red' : 'blue';
  newGameState.turnNumber += newGameState.currentPlayer === 'blue' ? 1 : 0;
  this.gameState = newGameState;
};

module.exports = Game;