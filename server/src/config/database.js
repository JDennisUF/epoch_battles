const { Sequelize } = require('sequelize');
const path = require('path');

let sequelize;

// Determine database configuration based on environment
if (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRES === 'true') {
  // Production: Use PostgreSQL/Supabase
  const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL or SUPABASE_DB_URL environment variable is required for production');
    process.exit(1);
  }

  sequelize = new Sequelize(connectionString, {
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
  
  console.log('🔧 Database: PostgreSQL/Supabase (Production Mode)');
  
} else {
  // Development: Use SQLite
  const dbPath = process.env.SQLITE_PATH || path.join(__dirname, '../../database.sqlite');
  
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  });
  
  console.log(`🔧 Database: SQLite (Development Mode) - ${dbPath}`);
}

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    
    if (process.env.NODE_ENV === 'production' || process.env.USE_POSTGRES === 'true') {
      console.log('🐘 PostgreSQL Connected successfully');
    } else {
      console.log('🗄️  SQLite Connected successfully');
    }

    // Sync database in development
    if (process.env.NODE_ENV !== 'production') {
      const dialect = sequelize.getDialect();
      
      try {
        if (dialect === 'sqlite') {
          // For SQLite, be more careful about syncing
          await sequelize.sync({ force: false });
        } else {
          // For PostgreSQL, use alter: true for development
          await sequelize.sync({ alter: true });
        }
        console.log('📊 Database synced');
      } catch (syncError) {
        if (dialect === 'sqlite' && syncError.message.includes('already exists')) {
          // SQLite index conflicts are often harmless in development
          console.log('📊 Database tables already exist (SQLite)');
        } else {
          throw syncError;
        }
      }
    } else {
      // In production, just check connection without syncing
      console.log('📊 Database connection verified (production mode)');
    }

  } catch (error) {
    console.error('Database connection failed:', error.message);
    console.error('💡 Tip: In development, SQLite will be created automatically. In production, ensure your DATABASE_URL is correct.');
    process.exit(1);
  }
};

// Helper function to check current database type
const getDatabaseType = () => {
  return sequelize.getDialect();
};

// Helper function to get database info
const getDatabaseInfo = () => {
  const dialect = sequelize.getDialect();
  if (dialect === 'sqlite') {
    return {
      type: 'SQLite',
      location: sequelize.options.storage,
      mode: 'Development'
    };
  } else {
    return {
      type: 'PostgreSQL',
      location: 'Remote (Supabase/Cloud)',
      mode: 'Production'
    };
  }
};

module.exports = { 
  sequelize, 
  connectDB, 
  getDatabaseType, 
  getDatabaseInfo 
};