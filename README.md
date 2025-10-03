# Epoch Battles

A strategic online board game inspired by Stratego where players command armies with hidden unit identities. Choose from multiple themed armies and engage in tactical combat on customizable battlefields.

## 🎮 Game Features

- **Multiple Army Themes:** Fantasy, Medieval, Sci-Fi, Post-Apocalyptic, and Classic
- **Home vs Away System:** Inviter becomes "Home" team, responder becomes "Away" team  
- **Real-time Multiplayer:** Live gameplay with WebSocket connections
- **Hidden Information:** Units remain hidden until combat reveals them
- **Strategic Depth:** Each army has unique themed units with identical gameplay mechanics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL (local or cloud connection)
- Git

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd epoch_battles
```

2. **Server setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your database credentials and JWT secret
```

3. **Client setup:**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start PostgreSQL** (if running locally)

2. **Start the server:**
```bash
cd server
npm run dev
```
Server runs on http://localhost:3001

3. **Start the client (in a new terminal):**
```bash
cd client
npm start
```
Client runs on http://localhost:3000

## 📋 Current Status

✅ **Phase 1 Complete - Core Infrastructure:**
- User authentication (register/login with JWT)
- PostgreSQL database with Sequelize ORM
- WebSocket connections for real-time communication
- React frontend with routing and styled-components

✅ **Phase 2 Complete - Game Logic:**
- Complete game board implementation
- Piece placement and movement validation
- Combat resolution system with special units
- Turn management and game state persistence
- Multiple army themes with unique graphics

✅ **Phase 3 Complete - Frontend Development:**
- Interactive game board with drag-and-drop
- Real-time game updates via WebSocket
- Lobby system with player invitations
- Responsive design for mobile and desktop
- Army selection and piece setup interface

🚧 **Current: Phase 4 - Advanced Features:**
- Game statistics and analytics
- Enhanced UI/UX improvements
- Performance optimizations

## 🎯 Features Implemented

### Core Gameplay
- **Army Themes:** 5 different themed armies (Fantasy, Medieval, Sci-Fi, Post-Apocalyptic, Classic)
- **Game Mechanics:** Complete Stratego-inspired gameplay with hidden units
- **Combat System:** Rank-based combat with special unit interactions
- **Win Conditions:** Flag capture, opponent elimination, or forfeit

### Multiplayer System
- **Real-time Communication:** Socket.IO for instant game updates
- **Invitation System:** Send/receive game invitations in lobby
- **Home/Away Teams:** Inviter becomes Home team, responder becomes Away team
- **Game State Management:** Server-side validation and persistence

### User Interface
- **Interactive Board:** Click-to-move gameplay with visual feedback
- **Army Selection:** Choose from themed armies with unique graphics
- **Setup Phase:** Manual or random piece placement
- **Game History:** Track completed games and statistics

## 🏗 Architecture

- **Backend:** Node.js + Express + Socket.IO + PostgreSQL + Sequelize
- **Frontend:** React + styled-components + Socket.IO client
- **Database:** PostgreSQL with Sequelize ORM
- **Authentication:** JWT tokens with bcrypt password hashing
- **Real-time:** Socket.IO for bidirectional communication

## 🎨 Army Themes

Each army contains 40 pieces with identical gameplay mechanics but unique theming:

- **Fantasy:** Dragons, wizards, and magical creatures
- **Medieval:** Kings, knights, and castle warfare
- **Sci-Fi:** AI overlords, mechs, and futuristic tech
- **Post-Apocalyptic:** Wasteland survivors and jury-rigged vehicles
- **Classic:** Traditional military ranks (Stratego style)

## 🛠 Development

### Backend Commands
```bash
npm run dev     # Start development server with hot reload
npm test        # Run test suite
npm run lint    # Check code style
```

### Frontend Commands
```bash
npm start       # Start development server
npm test        # Run tests
npm run build   # Build for production
npm run typecheck # Type checking (if using TypeScript)
```

### Database Commands
```bash
npm run migrate    # Run database migrations
npm run seed       # Seed initial data
```

## 📚 Game Rules

Epoch Battles follows Stratego-inspired mechanics:

### Basic Rules
- **Hidden Identity:** Opponent can't see your unit types until combat
- **Turn-based:** Home team moves first, then alternating turns
- **Movement:** Most units move one space, Scouts can move multiple spaces
- **Combat:** Lower rank number defeats higher rank number

### Special Units
- **Flag/Relic/Banner:** Must be captured to win (immobile)
- **Scout units:** Can move multiple spaces in straight lines
- **Miner units:** Only units that can safely attack bomb units
- **Spy/Assassin/Thief:** Weakest unit that can defeat the strongest when attacking
- **Bomb units:** Immobile traps that destroy attacking units (except miners)

### Win Conditions
1. Capture opponent's flag
2. Opponent cannot make any legal moves
3. Opponent disconnects or forfeits

## 📁 Project Structure

```
epoch_battles/
├── server/              # Backend Node.js application
│   ├── src/
│   │   ├── models/      # Database models
│   │   ├── routes/      # API endpoints
│   │   ├── services/    # Game logic and business rules
│   │   ├── socket/      # WebSocket event handlers
│   │   └── data/        # Game data (armies, maps)
│   └── package.json
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── utils/       # Utility functions
│   │   └── data/        # Game data and assets
│   │       ├── armies/  # Army definitions and images
│   │       └── maps/    # Map definitions
│   └── package.json
├── CLAUDE.md           # Detailed project plan and specifications
└── README.md          # This file
```

## 🤝 Contributing

This project follows the development plan outlined in CLAUDE.md. 

### Getting Started
1. Check the project status in CLAUDE.md
2. Look for open issues or todo items
3. Follow the coding standards and patterns established
4. Submit pull requests with clear descriptions

### Code Style
- Follow existing patterns and conventions
- Use meaningful variable and function names
- Add comments for complex game logic
- Ensure all tests pass before submitting

## 📄 License

MIT License - see LICENSE file for details.

---

For detailed technical specifications, game mechanics, and development roadmap, see [CLAUDE.md](./CLAUDE.md).