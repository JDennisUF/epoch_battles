const { Sequelize } = require('sequelize');

// Use environment variable for database connection
const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required');
  process.exit(1);
}

const sequelize = new Sequelize(connectionString, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('🐘 PostgreSQL Connected successfully');

    // Sync database in development
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log('📊 Database synced');
    }

  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };