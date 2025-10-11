const { sequelize } = require('../config/database');

async function addPausedStatus() {
  try {
    console.log('Adding "paused" status to Game model...');
    
    // Add 'paused' to the ENUM type
    await sequelize.query(`
      ALTER TYPE "enum_Games_status" ADD VALUE 'paused';
    `);
    
    console.log('✅ Successfully added "paused" status to Game model');
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('✅ "paused" status already exists in Game model');
    } else {
      console.error('❌ Error adding paused status:', error.message);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  addPausedStatus().then(() => {
    console.log('Migration completed');
    process.exit(0);
  }).catch(error => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = addPausedStatus;