const { connectDB } = require('../config/database');
const { sequelize } = require('../config/database');

async function updateDefaultPlacements() {
  try {
    await connectDB();
    console.log('Updating default placements...');

    // Remove old placement data that had armyId
    await sequelize.query('DELETE FROM placements WHERE isGlobal = 1');

    // Add new generic placement data (works with all armies since they follow same Stratego rules)
    await sequelize.query(`
      INSERT OR IGNORE INTO placements (name, description, mapId, placements, isGlobal, createdBy)
      VALUES (
        'Defensive Setup', 
        'Strong defensive formation with flag protected in the back corner', 
        'classic', 
        '[
          {"type":"flag","x":0,"y":3},
          {"type":"bomb","x":1,"y":3},
          {"type":"bomb","x":0,"y":2},
          {"type":"bomb","x":2,"y":3},
          {"type":"bomb","x":3,"y":3},
          {"type":"bomb","x":4,"y":3},
          {"type":"bomb","x":5,"y":3},
          {"type":"marshal","x":9,"y":0},
          {"type":"general","x":8,"y":0},
          {"type":"colonel","x":7,"y":0},
          {"type":"colonel","x":6,"y":0},
          {"type":"major","x":5,"y":0},
          {"type":"major","x":4,"y":0},
          {"type":"major","x":3,"y":0},
          {"type":"captain","x":2,"y":0},
          {"type":"captain","x":1,"y":0},
          {"type":"captain","x":0,"y":0},
          {"type":"captain","x":9,"y":1},
          {"type":"lieutenant","x":8,"y":1},
          {"type":"lieutenant","x":7,"y":1},
          {"type":"lieutenant","x":6,"y":1},
          {"type":"lieutenant","x":5,"y":1},
          {"type":"sergeant","x":4,"y":1},
          {"type":"sergeant","x":3,"y":1},
          {"type":"sergeant","x":2,"y":1},
          {"type":"sergeant","x":1,"y":1},
          {"type":"miner","x":0,"y":1},
          {"type":"miner","x":9,"y":2},
          {"type":"miner","x":8,"y":2},
          {"type":"miner","x":7,"y":2},
          {"type":"miner","x":6,"y":2},
          {"type":"scout","x":5,"y":2},
          {"type":"scout","x":4,"y":2},
          {"type":"scout","x":3,"y":2},
          {"type":"scout","x":2,"y":2},
          {"type":"scout","x":1,"y":2},
          {"type":"scout","x":9,"y":3},
          {"type":"scout","x":8,"y":3},
          {"type":"scout","x":7,"y":3},
          {"type":"spy","x":6,"y":3}
        ]', 
        1, 
        NULL
      )
    `);

    await sequelize.query(`
      INSERT OR IGNORE INTO placements (name, description, mapId, placements, isGlobal, createdBy)
      VALUES (
        'Aggressive Setup', 
        'Offensive formation with strong units in front for early attacks', 
        'classic', 
        '[
          {"type":"flag","x":0,"y":3},
          {"type":"bomb","x":1,"y":3},
          {"type":"bomb","x":2,"y":3},
          {"type":"bomb","x":3,"y":3},
          {"type":"bomb","x":4,"y":3},
          {"type":"bomb","x":5,"y":3},
          {"type":"marshal","x":4,"y":0},
          {"type":"general","x":5,"y":0},
          {"type":"colonel","x":3,"y":0},
          {"type":"colonel","x":6,"y":0},
          {"type":"major","x":2,"y":0},
          {"type":"major","x":7,"y":0},
          {"type":"major","x":1,"y":0},
          {"type":"captain","x":8,"y":0},
          {"type":"captain","x":0,"y":0},
          {"type":"captain","x":9,"y":0},
          {"type":"captain","x":4,"y":1},
          {"type":"lieutenant","x":5,"y":1},
          {"type":"lieutenant","x":3,"y":1},
          {"type":"lieutenant","x":6,"y":1},
          {"type":"lieutenant","x":2,"y":1},
          {"type":"sergeant","x":7,"y":1},
          {"type":"sergeant","x":1,"y":1},
          {"type":"sergeant","x":8,"y":1},
          {"type":"sergeant","x":0,"y":1},
          {"type":"miner","x":9,"y":1},
          {"type":"miner","x":4,"y":2},
          {"type":"miner","x":5,"y":2},
          {"type":"miner","x":3,"y":2},
          {"type":"miner","x":6,"y":2},
          {"type":"scout","x":2,"y":2},
          {"type":"scout","x":7,"y":2},
          {"type":"scout","x":1,"y":2},
          {"type":"scout","x":8,"y":2},
          {"type":"scout","x":0,"y":2},
          {"type":"scout","x":9,"y":2},
          {"type":"scout","x":9,"y":3},
          {"type":"scout","x":8,"y":3},
          {"type":"spy","x":6,"y":3}
        ]', 
        1, 
        NULL
      )
    `);

    console.log('✅ Default placements updated successfully');
    console.log('🎉 Placement system ready!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update default placements:', error);
    process.exit(1);
  }
}

updateDefaultPlacements();