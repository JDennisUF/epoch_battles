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
      currentPlayer: 'home',
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
      homeTimeLeft: 900000,
      awayTimeLeft: 900000,
      lastMoveTime: null
    }
  },
  mapData: {
    type: DataTypes.JSONB,
    allowNull: true,
    defaultValue: null
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

  // Use the game's stored map data, fallback to default if not set
  const gameLogic = require('../services/gameLogic');
  let mapData = this.mapData || gameLogic.mapData;
  
  // Handle case where mapData is stored as string (SQLite JSONB issue)
  if (typeof mapData === 'string') {
    try {
      mapData = JSON.parse(mapData);
    } catch (error) {
      console.error('Failed to parse mapData JSON string:', error);
      mapData = gameLogic.mapData;
    }
  }
  
  // Create a copy of the game state
  const gameState = {
    ...this.gameState,
    playerColor,
    opponentColor: playerColor === 'home' ? 'away' : 'home',
    mapData: mapData
  };

  // Add army information for both players
  const opponent = this.players.find(p => p.userId !== playerId);
  gameState.opponentArmy = opponent?.army || null;

  // Filter board state based on game phase
  if (this.gameState.phase === 'playing') {
    gameState.board = this.gameState.board.map((row, y) =>
      row.map((piece, x) => {
        if (!piece) return null;
        
        // Filter out water terrain pieces - they should be handled as terrain on client
        if (piece.type === 'water' && piece.passable === false) {
          return null;
        }
        
        // Show own pieces completely
        if (piece.color === playerColor) {
          return piece;
        }
        
        // Hide opponent piece types (only show color and position)
        if (piece.revealed) {
          // If revealed, show all piece information
          return piece;
        } else {
          // If hidden, only show basic info
          return {
            color: piece.color,
            revealed: false,
            type: 'hidden'
          };
        }
      })
    );
  } else {
    // For setup and other phases, just filter out water pieces
    gameState.board = this.gameState.board.map((row, y) =>
      row.map((piece, x) => {
        if (!piece) return null;
        
        // Filter out water terrain pieces - they should be handled as terrain on client
        if (piece.type === 'water' && piece.passable === false) {
          return null;
        }
        
        return piece;
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
  newGameState.currentPlayer = newGameState.currentPlayer === 'home' ? 'away' : 'home';
  newGameState.turnNumber += newGameState.currentPlayer === 'home' ? 1 : 0;
  this.gameState = newGameState;
};

module.exports = Game;