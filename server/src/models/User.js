const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      len: [3, 20],
      is: /^[a-zA-Z0-9_]+$/
    }
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 255]
    }
  },
  gamesPlayed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  wins: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  losses: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  ranking: {
    type: DataTypes.INTEGER,
    defaultValue: 1000
  },
  isOnline: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  currentGameId: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'Games',
      key: 'id'
    }
  }
}, {
  tableName: 'users',
  timestamps: true,
  indexes: [
    {
      fields: ['username']
    },
    {
      fields: ['email']
    },
    {
      fields: ['ranking']
    }
  ]
});

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.passwordHash) {
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('passwordHash')) {
    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(user.passwordHash, salt);
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

User.prototype.getPublicProfile = function() {
  return {
    id: this.id,
    username: this.username,
    stats: {
      gamesPlayed: this.gamesPlayed,
      wins: this.wins,
      losses: this.losses,
      ranking: this.ranking,
      winRate: this.gamesPlayed > 0 ? ((this.wins / this.gamesPlayed) * 100).toFixed(1) : 0
    },
    isOnline: this.isOnline,
    createdAt: this.createdAt
  };
};

module.exports = User;