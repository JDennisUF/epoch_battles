# Rate Limiting Troubleshooting Guide

If you're seeing "429 Too Many Requests" errors, especially in Firefox, here are solutions:

## 🚨 Quick Fixes for Development

### 1. Automatic Reset (Easiest)
The server now automatically skips rate limiting for localhost in development mode.

### 2. Manual Reset Endpoint
```bash
curl -X POST http://localhost:3001/api/dev/reset-limits
```

### 3. Restart Server
```bash
# Kill any existing server
pkill -f "node.*server.js"

# Start fresh
npm run dev
```

## 🔍 Why This Happens

### Firefox Specific Issues
- Firefox may send additional preflight requests
- Extensions can trigger extra requests
- Developer tools may repeat requests

### Development Environment
- All requests from localhost appear to come from same IP
- Rate limits accumulate quickly during testing
- SQLite doesn't reset limits between server restarts

## ⚙️ Current Configuration

### Development Mode
- **General API:** 1000 requests per 15 minutes
- **Auth endpoints:** 50 requests per 15 minutes  
- **Localhost:** Rate limiting skipped automatically
- **Debug logging:** Shows IP and request info

### Production Mode  
- **General API:** 100 requests per 15 minutes
- **Auth endpoints:** 10 requests per 15 minutes
- **All IPs:** Rate limiting enforced

## 🛠️ Debugging Steps

### 1. Check Server Logs
Look for debug output showing your IP:
```
🌐 POST /auth/register from IP: ::1
```

### 2. Check Your IP
In browser console:
```javascript
fetch('/api/health').then(r => r.json()).then(console.log)
```

### 3. Reset Rate Limits
In browser console (development only):
```javascript
fetch('/api/dev/reset-limits', {method: 'POST'})
  .then(r => r.json())
  .then(console.log)
```

## 🔧 Manual Configuration

### Disable Rate Limiting (Temporary)
Edit `server/src/server.js` and comment out:
```javascript
// app.use('/api/', limiter);
// app.use('/api/auth/', authLimiter);
```

### Increase Limits
Edit the rate limit configuration in `server/src/server.js`:
```javascript
max: 9999, // Very high limit for testing
```

## 🚀 Browser-Specific Tips

### Firefox
- Disable extensions temporarily
- Clear site data (F12 > Storage > Clear All)
- Try private/incognito mode

### Chrome  
- Clear site data (F12 > Application > Storage > Clear)
- Check Network tab for duplicate requests

### Safari
- Clear website data in Preferences
- Disable extensions

## 📊 Rate Limit Headers

The server now returns helpful headers:
- `RateLimit-Limit`: Maximum requests allowed
- `RateLimit-Remaining`: Requests left in window
- `RateLimit-Reset`: When the window resets

Check these in browser developer tools (Network tab).

## 🔄 If Nothing Works

1. **Restart everything:**
   ```bash
   # Kill server
   pkill -f "node.*server.js"
   
   # Clear SQLite database (resets everything)
   rm server/database.sqlite
   
   # Start fresh
   npm run dev
   ```

2. **Use a different browser temporarily**

3. **Use a different network/IP (mobile hotspot)**

4. **Check if it's a real issue:**
   - Try registering with different usernames/emails
   - Check for actual server errors vs rate limiting
   - Test the happy path: register → login → create game

## 💡 Prevention

- Don't spam requests during development
- Use the browser's Network tab to monitor requests
- Clear browser data when switching between features
- Restart server periodically during heavy development