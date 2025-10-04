const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const UserPlacement = sequelize.define('UserPlacement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  placementId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'placements',
      key: 'id'
    }
  },
  isFavorite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'user_placements',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      unique: true,
      fields: ['userId', 'placementId']
    }
  ]
});

module.exports = UserPlacement;