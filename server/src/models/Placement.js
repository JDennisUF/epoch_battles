const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Placement = sequelize.define('Placement', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  mapId: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  placements: {
    type: DataTypes.TEXT,
    allowNull: false,
    get() {
      const rawValue = this.getDataValue('placements');
      return rawValue ? JSON.parse(rawValue) : [];
    },
    set(value) {
      this.setDataValue('placements', JSON.stringify(value));
    }
  },
  isGlobal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'placements',
  timestamps: true,
  indexes: [
    {
      fields: ['mapId']
    },
    {
      fields: ['isGlobal']
    },
    {
      fields: ['createdBy']
    }
  ]
});

module.exports = Placement;