const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const { connectDB, getDatabaseInfo } = require('./config/database');
const models = require('./models'); // Load models and associations
const authRoutes = require('./routes/auth');
const gameRoutes = require('./routes/games');
const userRoutes = require('./routes/users');
const placementRoutes = require('./routes/placements');
const socketHandler = require('./socket/socketHandler');

const app = express();
const server = http.createServer(app);

// Trust proxy for proper IP detection in development
if (process.env.NODE_ENV === 'development') {
  app.set('trust proxy', true);
}
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || "http://localhost:3000",
  credentials: true
}));

// Rate limiting - more permissive for development
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // Higher limit in development
  message: {
    error: 'Too many requests from this IP, please try again later.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000)
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  // Skip rate limiting for localhost in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      const clientIP = req.ip || req.connection.remoteAddress;
      return clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    }
    return false;
  }
});

// Separate, more restrictive rate limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 50, // Lower limit for auth
  message: {
    error: 'Too many authentication attempts, please try again later.',
    resetTime: new Date(Date.now() + 15 * 60 * 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip for localhost in development
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      const clientIP = req.ip || req.connection.remoteAddress;
      return clientIP === '127.0.0.1' || clientIP === '::1' || clientIP === '::ffff:127.0.0.1';
    }
    return false;
  }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Debug middleware for development
if (process.env.NODE_ENV === 'development') {
  app.use('/api/', (req, res, next) => {
    console.log(`🌐 ${req.method} ${req.path} from IP: ${req.ip || req.connection.remoteAddress}`);
    next();
  });
}

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Connect to the DB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/games', gameRoutes);
app.use('/api/users', userRoutes);
app.use('/api/placements', placementRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Development endpoint to reset rate limits
if (process.env.NODE_ENV === 'development') {
  app.post('/api/dev/reset-limits', (req, res) => {
    // Clear rate limit stores
    limiter.resetKey(req.ip);
    authLimiter.resetKey(req.ip);
    console.log(`🔄 Rate limits reset for IP: ${req.ip}`);
    res.json({ message: 'Rate limits reset', ip: req.ip });
  });
}

// Socket.IO connection handling
socketHandler(io);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 3001;

// Initialize database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    server.listen(PORT, () => {
      const dbInfo = getDatabaseInfo();
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🎮 Game server ready for connections`);
      console.log(`💾 Database: ${dbInfo.type} (${dbInfo.mode})`);
      
      if (dbInfo.type === 'SQLite') {
        console.log(`📄 Database file: ${dbInfo.location}`);
        console.log(`✅ Development mode - no quota usage`);
        console.log(`💡 Use 'npm run db:postgres' to switch to PostgreSQL`);
      } else {
        console.log(`⚠️  Production mode - using Supabase quota`);
        console.log(`💡 Use 'npm run db:sqlite' to switch to SQLite`);
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();