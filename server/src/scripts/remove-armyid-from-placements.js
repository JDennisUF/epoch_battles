const { connectDB } = require('../config/database');
const { sequelize } = require('../config/database');

async function removeArmyIdFromPlacements() {
  try {
    await connectDB();
    console.log('Removing armyId from placements table...');

    // Check if armyId column exists
    const [results] = await sequelize.query("PRAGMA table_info(placements)");
    const hasArmyId = results.some(col => col.name === 'armyId');

    if (hasArmyId) {
      // SQLite doesn't support DROP COLUMN, so we need to recreate the table
      console.log('Creating new placements table without armyId...');
      
      // Create new table structure
      await sequelize.query(`
        CREATE TABLE placements_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          mapId VARCHAR(50) NOT NULL,
          placements TEXT NOT NULL,
          isGlobal BOOLEAN DEFAULT FALSE,
          createdBy INTEGER,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
        )
      `);

      // Copy data from old table (excluding armyId)
      await sequelize.query(`
        INSERT INTO placements_new (id, name, description, mapId, placements, isGlobal, createdBy, createdAt, updatedAt)
        SELECT id, name, description, mapId, placements, isGlobal, createdBy, createdAt, updatedAt
        FROM placements
      `);

      // Drop old table and rename new one
      await sequelize.query('DROP TABLE placements');
      await sequelize.query('ALTER TABLE placements_new RENAME TO placements');

      // Recreate indexes
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_placements_map ON placements(mapId)');
      await sequelize.query('CREATE INDEX IF NOT EXISTS idx_placements_global ON placements(isGlobal)');

      console.log('✅ Successfully removed armyId from placements table');
    } else {
      console.log('ℹ️  armyId column not found, table already updated');
    }

    console.log('🎉 Database migration complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

removeArmyIdFromPlacements();