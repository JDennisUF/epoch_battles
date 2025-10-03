#!/usr/bin/env node
/**
 * Database Switching Utility
 * Helps switch between SQLite (development) and PostgreSQL (production)
 */

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../../.env');

function updateEnvFile(usePostgres) {
  try {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    if (usePostgres) {
      // Enable PostgreSQL
      envContent = envContent.replace(/# USE_POSTGRES=true/g, 'USE_POSTGRES=true');
      console.log('🐘 Switched to PostgreSQL/Supabase');
      console.log('⚠️  WARNING: This will use your Supabase quota!');
    } else {
      // Disable PostgreSQL (use SQLite)
      envContent = envContent.replace(/^USE_POSTGRES=true/gm, '# USE_POSTGRES=true');
      console.log('🗄️  Switched to SQLite (development)');
      console.log('✅ Safe for development - no quota usage');
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('📝 .env file updated');
    console.log('🔄 Restart your server to apply changes');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
    process.exit(1);
  }
}

function showStatus() {
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const usePostgres = /^USE_POSTGRES=true/m.test(envContent);
    
    console.log('📊 Current Database Configuration:');
    console.log('================================');
    
    if (usePostgres) {
      console.log('🐘 Database: PostgreSQL/Supabase');
      console.log('📍 Mode: Production/Remote');
      console.log('⚠️  Quota Usage: YES');
    } else {
      console.log('🗄️  Database: SQLite');
      console.log('📍 Mode: Development/Local');
      console.log('✅ Quota Usage: NO');
    }
    
    console.log('');
    console.log('Available commands:');
    console.log('  npm run db:sqlite    - Switch to SQLite');
    console.log('  npm run db:postgres  - Switch to PostgreSQL');
    console.log('  npm run db:status    - Show current status');
    
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    process.exit(1);
  }
}

// Parse command line arguments
const command = process.argv[2];

switch (command) {
  case 'sqlite':
    updateEnvFile(false);
    break;
  case 'postgres':
    updateEnvFile(true);
    break;
  case 'status':
  default:
    showStatus();
    break;
}