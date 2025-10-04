const User = require('./User');
const Game = require('./Game');
const Placement = require('./Placement');
const UserPlacement = require('./UserPlacement');

// Define associations after all models are loaded
User.belongsTo(Game, {
  foreignKey: 'currentGameId',
  as: 'currentGame'
});

Game.hasMany(User, {
  foreignKey: 'currentGameId',
  as: 'activePlayers'
});

// Placement associations
User.hasMany(Placement, {
  foreignKey: 'createdBy',
  as: 'createdPlacements'
});

Placement.belongsTo(User, {
  foreignKey: 'createdBy',
  as: 'creator'
});

// Many-to-many relationship between Users and Placements through UserPlacement
User.belongsToMany(Placement, {
  through: UserPlacement,
  foreignKey: 'userId',
  otherKey: 'placementId',
  as: 'favoritePlacements'
});

Placement.belongsToMany(User, {
  through: UserPlacement,
  foreignKey: 'placementId',
  otherKey: 'userId',
  as: 'favoriteUsers'
});

// Direct associations for UserPlacement
UserPlacement.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

UserPlacement.belongsTo(Placement, {
  foreignKey: 'placementId',
  as: 'placement'
});

module.exports = {
  User,
  Game,
  Placement,
  UserPlacement
};