const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function addMapDataColumn() {
  try {
    await sequelize.authenticate();
    console.log('🗄️ Connected to database');

    const dialect = sequelize.getDialect();
    console.log(`📊 Database dialect: ${dialect}`);

    // Check if column already exists
    let columnExists = false;
    
    if (dialect === 'sqlite') {
      const tableInfo = await sequelize.query(
        "PRAGMA table_info(games);",
        { type: QueryTypes.SELECT }
      );
      columnExists = tableInfo.some(col => col.name === 'mapData');
    } else if (dialect === 'postgres') {
      const result = await sequelize.query(
        `SELECT column_name 
         FROM information_schema.columns 
         WHERE table_name = 'games' AND column_name = 'mapData';`,
        { type: QueryTypes.SELECT }
      );
      columnExists = result.length > 0;
    }

    if (columnExists) {
      console.log('✅ mapData column already exists');
      return;
    }

    console.log('➕ Adding mapData column to games table...');

    if (dialect === 'sqlite') {
      await sequelize.query(
        'ALTER TABLE games ADD COLUMN mapData TEXT;'
      );
    } else if (dialect === 'postgres') {
      await sequelize.query(
        'ALTER TABLE games ADD COLUMN "mapData" JSONB;'
      );
    }

    console.log('✅ Successfully added mapData column');

  } catch (error) {
    console.error('❌ Error adding mapData column:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
if (require.main === module) {
  addMapDataColumn()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = addMapDataColumn;