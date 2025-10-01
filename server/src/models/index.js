const User = require('./User');
const Game = require('./Game');

// Define associations after both models are loaded
User.belongsTo(Game, {
  foreignKey: 'currentGameId',
  as: 'currentGame'
});

Game.hasMany(User, {
  foreignKey: 'currentGameId',
  as: 'activePlayers'
});

module.exports = {
  User,
  Game
};