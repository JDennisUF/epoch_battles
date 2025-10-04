const { Sequelize } = require('sequelize');
const path = require('path');

// Database configuration
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: console.log
});

async function createPlacementTables() {
  try {
    console.log('Creating placement tables...');

    // Create placements table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS placements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        armyId VARCHAR(50) NOT NULL,
        mapId VARCHAR(50) NOT NULL,
        placements TEXT NOT NULL,
        isGlobal BOOLEAN DEFAULT FALSE,
        createdBy INTEGER,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Create user_placements mapping table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_placements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        placementId INTEGER NOT NULL,
        isFavorite BOOLEAN DEFAULT FALSE,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (placementId) REFERENCES placements(id) ON DELETE CASCADE,
        UNIQUE(userId, placementId)
      )
    `);

    // Create indexes for better performance
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_placements_army_map ON placements(armyId, mapId)
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_placements_global ON placements(isGlobal)
    `);
    
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_placements_user ON user_placements(userId)
    `);

    console.log('✅ Placement tables created successfully');
    
    // Insert some default global placements
    console.log('📦 Adding default placements...');
    
    // Example default placement for fantasy army on classic map
    const defaultFantasyClassic = JSON.stringify([
      { type: 'dragon_lord', x: 4, y: 0 },
      { type: 'archmage', x: 5, y: 0 },
      { type: 'paladin', x: 3, y: 0 }, { type: 'paladin', x: 6, y: 0 },
      { type: 'knight', x: 2, y: 0 }, { type: 'knight', x: 7, y: 0 }, { type: 'knight', x: 1, y: 0 },
      { type: 'ranger', x: 8, y: 0 }, { type: 'ranger', x: 9, y: 0 }, { type: 'ranger', x: 0, y: 0 }, { type: 'ranger', x: 1, y: 1 },
      { type: 'apprentice', x: 2, y: 1 }, { type: 'apprentice', x: 3, y: 1 }, { type: 'apprentice', x: 6, y: 1 }, { type: 'apprentice', x: 7, y: 1 },
      { type: 'warrior', x: 4, y: 1 }, { type: 'warrior', x: 5, y: 1 }, { type: 'warrior', x: 8, y: 1 }, { type: 'warrior', x: 9, y: 1 },
      { type: 'dwarf_miner', x: 0, y: 1 }, { type: 'dwarf_miner', x: 0, y: 2 }, { type: 'dwarf_miner', x: 1, y: 2 }, { type: 'dwarf_miner', x: 2, y: 2 }, { type: 'dwarf_miner', x: 3, y: 2 },
      { type: 'scout_hawk', x: 4, y: 2 }, { type: 'scout_hawk', x: 5, y: 2 }, { type: 'scout_hawk', x: 6, y: 2 }, { type: 'scout_hawk', x: 7, y: 2 }, { type: 'scout_hawk', x: 8, y: 2 }, { type: 'scout_hawk', x: 9, y: 2 }, { type: 'scout_hawk', x: 0, y: 3 }, { type: 'scout_hawk', x: 1, y: 3 },
      { type: 'thief', x: 2, y: 3 },
      { type: 'sacred_relic', x: 3, y: 3 },
      { type: 'cursed_rune', x: 4, y: 3 }, { type: 'cursed_rune', x: 5, y: 3 }, { type: 'cursed_rune', x: 6, y: 3 }, { type: 'cursed_rune', x: 7, y: 3 }, { type: 'cursed_rune', x: 8, y: 3 }, { type: 'cursed_rune', x: 9, y: 3 }
    ]);

    await sequelize.query(`
      INSERT OR IGNORE INTO placements (name, description, armyId, mapId, placements, isGlobal, createdBy)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        'Classic Defensive Setup',
        'Defensive formation with strong units in the back and scouts in front',
        'fantasy',
        'classic',
        defaultFantasyClassic,
        true,
        null
      ]
    });

    console.log('✅ Default placements added');
    
  } catch (error) {
    console.error('❌ Error creating placement tables:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
createPlacementTables()
  .then(() => {
    console.log('🎉 Placement system setup complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });