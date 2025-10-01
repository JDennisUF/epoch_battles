const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String,
      required: true
    },
    color: {
      type: String,
      enum: ['blue', 'red'],
      required: true
    },
    isReady: {
      type: Boolean,
      default: false
    }
  }],
  gameState: {
    board: {
      type: [[mongoose.Schema.Types.Mixed]], // 10x10 array of pieces
      default: () => Array(10).fill(null).map(() => Array(10).fill(null))
    },
    currentPlayer: {
      type: String,
      enum: ['blue', 'red'],
      default: 'blue'
    },
    turnNumber: {
      type: Number,
      default: 1
    },
    phase: {
      type: String,
      enum: ['setup', 'playing', 'finished'],
      default: 'setup'
    },
    winner: {
      type: String,
      enum: ['blue', 'red', 'draw'],
      default: null
    },
    lastMove: {
      from: {
        x: Number,
        y: Number
      },
      to: {
        x: Number,
        y: Number
      },
      result: String,
      capturedPiece: mongoose.Schema.Types.Mixed,
      timestamp: Date
    },
    moveHistory: [{
      from: {
        x: Number,
        y: Number
      },
      to: {
        x: Number,
        y: Number
      },
      player: String,
      piece: String,
      result: String,
      capturedPiece: mongoose.Schema.Types.Mixed,
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },
  status: {
    type: String,
    enum: ['waiting', 'setup', 'active', 'finished', 'abandoned'],
    default: 'waiting'
  },
  timeControl: {
    initialTime: {
      type: Number,
      default: 900000 // 15 minutes in milliseconds
    },
    increment: {
      type: Number,
      default: 10000 // 10 seconds per move
    },
    blueTimeLeft: {
      type: Number,
      default: 900000
    },
    redTimeLeft: {
      type: Number,
      default: 900000
    },
    lastMoveTime: Date
  },
  chatMessages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    username: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  finishedAt: Date
}, {
  timestamps: true
});

// Index for faster queries
gameSchema.index({ 'players.userId': 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });

// Method to get game state for a specific player
gameSchema.methods.getGameStateForPlayer = function(playerId) {
  const playerColor = this.players.find(p => p.userId.toString() === playerId.toString())?.color;
  
  if (!playerColor) {
    throw new Error('Player not found in game');
  }

  // Create a copy of the game state
  const gameState = {
    ...this.gameState.toObject(),
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

// Method to check if game is ready to start
gameSchema.methods.isReadyToStart = function() {
  return this.players.length === 2 && 
         this.players.every(player => player.isReady) &&
         this.status === 'setup';
};

// Method to get opponent of a player
gameSchema.methods.getOpponent = function(playerId) {
  return this.players.find(p => p.userId.toString() !== playerId.toString());
};

// Method to switch turns
gameSchema.methods.switchTurn = function() {
  this.gameState.currentPlayer = this.gameState.currentPlayer === 'blue' ? 'red' : 'blue';
  this.gameState.turnNumber += this.gameState.currentPlayer === 'blue' ? 1 : 0;
};

// Virtual for game duration
gameSchema.virtual('duration').get(function() {
  if (!this.finishedAt) return null;
  return this.finishedAt - this.createdAt;
});

// Ensure virtual fields are serialized
gameSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Game', gameSchema);