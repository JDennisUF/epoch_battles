# Epoch Battles - Project Plan

## Game Overview
Epoch Battles is a 2-player online strategy board game inspired by Stratego. Players command armies with hidden unit identities, engaging in tactical combat where opponents cannot see unit types until battle occurs. The game features turn-based gameplay with a central server managing all game logic and state.

## Core Game Mechanics

### Board & Setup
- 10x10 grid battlefield with water obstacles in center
- Each player has 40 pieces: 1 Flag, 6 Bombs, 1 Spy, 1 Marshal, and various ranked units
- Players place pieces on their side of the board (4 rows each)
- Unit identities remain hidden from opponent until combat

### Unit Types & Combat System
```
Rank 1: Marshal (1) - Strongest unit, defeated only by Spy
Rank 2: General (1) - Second strongest
Rank 3: Colonel (2)
Rank 4: Major (3)
Rank 5: Captain (4)
Rank 6: Lieutenant (4)
Rank 7: Sergeant (4)
Rank 8: Miner (5) - Only unit that can defuse bombs
Rank 9: Scout (8) - Can move multiple spaces
Rank 10: Spy (1) - Defeats Marshal when attacking
Special: Flag (1) - Capture to win
Special: Bomb (6) - Immobile, destroys attacking units except Miners
```

### Win Conditions
1. Capture opponent's flag
2. Opponent cannot make any legal moves
3. Opponent disconnects/forfeits

## Technical Architecture

### Backend (Node.js + Express)
```
├── server/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── gameController.js
│   │   │   └── matchmakingController.js
│   │   ├── models/
│   │   │   ├── User.js
│   │   │   ├── Game.js
│   │   │   └── GameState.js
│   │   ├── services/
│   │   │   ├── gameLogic.js
│   │   │   ├── combatResolver.js
│   │   │   └── moveValidator.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   └── rateLimiter.js
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── games.js
│   │   │   └── users.js
│   │   ├── socket/
│   │   │   ├── gameEvents.js
│   │   │   └── socketHandler.js
│   │   └── server.js
│   ├── package.json
│   └── .env
```

### Frontend (React + Socket.IO Client)
```
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── GameBoard/
│   │   │   │   ├── GameBoard.jsx
│   │   │   │   ├── GameSquare.jsx
│   │   │   │   └── GamePiece.jsx
│   │   │   ├── UI/
│   │   │   │   ├── Header.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   └── ChatBox.jsx
│   │   │   └── Auth/
│   │   │       ├── Login.jsx
│   │   │       └── Register.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── Game.jsx
│   │   │   └── Profile.jsx
│   │   ├── hooks/
│   │   │   ├── useSocket.js
│   │   │   ├── useGame.js
│   │   │   └── useAuth.js
│   │   ├── utils/
│   │   │   ├── gameLogic.js
│   │   │   └── constants.js
│   │   └── App.jsx
│   ├── package.json
│   └── public/
```

### Database Schema (MongoDB)

#### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  stats: {
    gamesPlayed: Number,
    wins: Number,
    losses: Number,
    ranking: Number
  },
  createdAt: Date,
  lastActive: Date
}
```

#### Games Collection
```javascript
{
  _id: ObjectId,
  players: [
    {
      userId: ObjectId,
      username: String,
      color: String // 'blue' or 'red'
    }
  ],
  gameState: {
    board: Array[10][10], // 2D array of pieces
    currentPlayer: String,
    turnNumber: Number,
    phase: String, // 'setup', 'playing', 'finished'
    winner: String,
    lastMove: {
      from: {x: Number, y: Number},
      to: {x: Number, y: Number},
      result: String,
      timestamp: Date
    }
  },
  status: String, // 'waiting', 'active', 'finished', 'abandoned'
  createdAt: Date,
  finishedAt: Date
}
```

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Set up Node.js server with Express
- Implement user authentication (JWT)
- Create MongoDB database connection
- Basic WebSocket setup with Socket.IO
- User registration/login system

### Phase 2: Game Logic (Week 3-4)
- Implement board state management
- Create piece movement validation
- Build combat resolution system
- Add game state persistence
- Implement turn management

### Phase 3: Frontend Development (Week 5-6)
- Create React app with game board UI
- Implement piece placement interface, include random placements for speed
- Add real-time game updates via WebSocket
- Build lobby and matchmaking interface
- Add responsive design for mobile/desktop

### Phase 4: Advanced Features (Week 7-8)
- Chat functionality
- Game statistics and analytics

### Phase 5: Testing & Deployment (Week 9-10)
- Unit tests for game logic
- Integration tests for API endpoints
- Load testing for concurrent games
- Deploy to production (Docker + cloud hosting)
- Monitoring and logging setup

## Key Technical Considerations

### Real-time Communication
- Use Socket.IO for bidirectional communication
- Implement room-based event handling
- Handle connection drops gracefully
- Validate all moves server-side to prevent cheating

### Security
- Never send opponent's hidden unit data to client
- Validate all moves server-side
- Rate limiting for API endpoints
- Secure WebSocket connections

### Performance
- Optimize database queries with indexing
- Implement connection pooling
- Cache frequently accessed game data
- Minimize client-server message size

### Scalability Considerations
- Stateless server design for horizontal scaling
- Redis for session management across servers
- Message queuing for high-traffic scenarios
- CDN for static assets

## Development Tools & Commands

### Backend Development
```bash
# Start development server
npm run dev

# Run tests
npm test

# Database migrations
npm run migrate

# Linting
npm run lint
```

### Frontend Development
```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Type checking (if using TypeScript)
npm run typecheck
```

### Docker Setup
```bash
# Build and run full stack
docker-compose up --build

# Run tests in containers
docker-compose run --rm server npm test
docker-compose run --rm client npm test
```

## Success Metrics
- Support 100+ concurrent games
- Sub-200ms move response time
- 99.9% uptime
- Mobile-responsive interface
- Intuitive game setup (< 2 minutes from lobby to game start)

## Future Enhancements
- AI opponents with different difficulty levels
- Tournament system with brackets
- Custom board layouts and variants
- Mobile app (React Native)
- Social features (friends, clans)
- Seasonal rankings and rewards