# Database Configuration Guide

Epoch Battles supports both SQLite (development) and PostgreSQL/Supabase (production) databases with easy switching between them.

## 🔧 Current Setup

### Development Mode (Default)
- **Database:** SQLite 
- **Location:** `server/database.sqlite`
- **Quota Usage:** None (local file)
- **Performance:** Fast for development
- **Perfect for:** Local development, testing, avoiding quota burns

### Production Mode
- **Database:** PostgreSQL (Supabase)
- **Location:** Remote cloud database
- **Quota Usage:** Yes (counts against Supabase limits)
- **Performance:** Cloud-based, scalable
- **Perfect for:** Production deployment, shared team development

## 🚀 Quick Commands

```bash
# Check current database status
npm run db:status

# Switch to SQLite (development - no quota usage)
npm run db:sqlite

# Switch to PostgreSQL (production - uses quota)
npm run db:postgres

# Start server
npm run dev
```

## 📊 Database Status

Check which database you're currently using:

```bash
npm run db:status
```

Example output:
```
📊 Current Database Configuration:
================================
🗄️  Database: SQLite
📍 Mode: Development/Local
✅ Quota Usage: NO
```

## 🔄 Switching Databases

### Switch to SQLite (Safe for Development)
```bash
npm run db:sqlite
```
- Creates `database.sqlite` file locally
- No internet connection required
- Zero quota usage
- Perfect for iterating quickly

### Switch to PostgreSQL (Production Testing)
```bash
npm run db:postgres
```
- Connects to Supabase
- **⚠️ WARNING:** Uses your Supabase quota
- Use sparingly during development
- Required for production deployment

## 🛠️ Manual Configuration

You can also manually edit the `.env` file:

```bash
# Use SQLite (default in development)
# USE_POSTGRES=true

# Use PostgreSQL/Supabase
USE_POSTGRES=true
```

## 📁 Files and Locations

- **SQLite Database:** `server/database.sqlite`
- **Configuration:** `server/src/config/database.js`
- **Environment:** `server/.env`
- **Switch Script:** `server/src/scripts/db-switch.js`

## 🔍 Troubleshooting

### SQLite Issues
- Database file is created automatically
- Located at `server/database.sqlite`
- Delete file to reset: `rm server/database.sqlite`

### PostgreSQL Issues
- Check `.env` file has correct `DATABASE_URL`
- Verify Supabase credentials
- Ensure `USE_POSTGRES=true` is uncommented

### Index Conflicts
If you see "index already exists" errors with SQLite:
```bash
rm server/database.sqlite
npm run dev
```

## 🚀 Production Deployment

For production deployment:
1. Set `NODE_ENV=production`
2. Set `USE_POSTGRES=true` (or remove it - production defaults to PostgreSQL)
3. Ensure `DATABASE_URL` points to your production database
4. Database sync will be disabled (production safety)

## 💡 Best Practices

### During Development
- Use SQLite by default (`npm run db:sqlite`)
- Only switch to PostgreSQL when testing production features
- Reset SQLite database when needed: `rm server/database.sqlite`

### Before Production
- Test with PostgreSQL occasionally (`npm run db:postgres`)
- Verify all features work with both databases
- Check migration scripts work with production database

### Quota Management
- Always switch back to SQLite after PostgreSQL testing
- Monitor your Supabase usage in their dashboard
- Use PostgreSQL mode sparingly during development

## 🔧 Advanced Configuration

### Custom SQLite Path
Set a custom database location in `.env`:
```bash
SQLITE_PATH=./custom/path/database.sqlite
```

### Environment Variables
```bash
NODE_ENV=development          # development/production
USE_POSTGRES=true            # Force PostgreSQL in development
DATABASE_URL=postgresql://... # Supabase connection string
SQLITE_PATH=./database.sqlite # Custom SQLite path (optional)
```