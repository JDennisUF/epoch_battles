# Epoch Battles

A strategic online board game inspired by Stratego where players command armies with hidden unit identities.

## Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB (local or cloud connection)

### Installation

1. **Clone and setup:**
```bash
cd epoch_battles
```

2. **Server setup:**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

3. **Client setup:**
```bash
cd ../client
npm install
```

### Running the Application

1. **Start MongoDB** (if running locally)

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

## Current Status

✅ **Phase 1 Complete - Core Infrastructure:**
- User authentication (register/login)
- WebSocket connections for real-time communication
- MongoDB database setup
- React frontend with routing
- Lobby system with online user display
- Game invitation system

🚧 **Next: Phase 2 - Game Logic:**
- Board state management
- Piece placement and movement
- Combat resolution system
- Turn management

## Features Implemented

- **Authentication:** JWT-based user system
- **Real-time Communication:** Socket.IO for live updates
- **Lobby System:** See online players and send invitations
- **Responsive UI:** Works on desktop and mobile
- **User Profiles:** Stats and game history tracking

## Architecture

- **Backend:** Node.js + Express + Socket.IO + MongoDB
- **Frontend:** React + styled-components + Socket.IO client
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JWT tokens with bcrypt password hashing

## Development

### Backend Commands
```bash
npm run dev     # Start development server
npm test        # Run tests
npm run lint    # Check code style
```

### Frontend Commands
```bash
npm start       # Start development server
npm test        # Run tests
npm run build   # Build for production
```

## Game Rules

Epoch Battles is inspired by Stratego with these core mechanics:

- **Hidden Identity:** Opponent can't see your piece types until combat
- **Strategic Combat:** Different units have different combat strengths
- **Objective:** Capture the opponent's flag to win
- **Special Units:** Scouts (move multiple spaces), Miners (defuse bombs), Spy (defeats Marshal)

See CLAUDE.md for complete game rules and development plan.

## Contributing

This project follows the development plan outlined in CLAUDE.md. Check the todo list and pick up tasks from the current phase.

## License

MIT License - see LICENSE file for details.