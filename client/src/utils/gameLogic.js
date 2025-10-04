import classicMap from '../data/maps/classic.json';

export const PIECES = {
  marshal: {
    id: "marshal",
    name: "Marshal",
    rank: 1,
    count: 1,
    moveable: true,
    canAttack: true,
    special: "Strongest unit, defeated only by Spy when attacked",
    symbol: "♔",
    description: "The highest ranking officer"
  },
  general: {
    id: "general", 
    name: "General",
    rank: 2,
    count: 1,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♕",
    description: "Second highest ranking officer"
  },
  colonel: {
    id: "colonel",
    name: "Colonel", 
    rank: 3,
    count: 2,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♖",
    description: "High ranking field officer"
  },
  major: {
    id: "major",
    name: "Major",
    rank: 4, 
    count: 3,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♗",
    description: "Field officer"
  },
  captain: {
    id: "captain",
    name: "Captain",
    rank: 5,
    count: 4,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♘",
    description: "Company commander"
  },
  lieutenant: {
    id: "lieutenant",
    name: "Lieutenant", 
    rank: 6,
    count: 4,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♙",
    description: "Junior officer"
  },
  sergeant: {
    id: "sergeant",
    name: "Sergeant",
    rank: 7,
    count: 4,
    moveable: true,
    canAttack: true,
    special: null,
    symbol: "♟",
    description: "Non-commissioned officer"
  },
  miner: {
    id: "miner",
    name: "Miner",
    rank: 8,
    count: 5,
    moveable: true,
    canAttack: true,
    special: "Only unit that can defuse bombs",
    symbol: "⛏",
    description: "Can defuse bombs safely"
  },
  scout: {
    id: "scout",
    name: "Scout",
    rank: 9,
    count: 8,
    moveable: true,
    canAttack: true,
    special: "Can move multiple spaces in a straight line",
    symbol: "👁",
    description: "Fast moving reconnaissance unit"
  },
  spy: {
    id: "spy",
    name: "Spy",
    rank: 10,
    count: 1,
    moveable: true,
    canAttack: true,
    special: "Defeats Marshal when attacking, weakest otherwise",
    symbol: "🕵",
    description: "Can defeat the Marshal when attacking"
  },
  flag: {
    id: "flag",
    name: "Flag",
    rank: null,
    count: 1,
    moveable: false,
    canAttack: false,
    special: "Must be captured to win",
    symbol: "🏴",
    description: "Capture this to win the game"
  },
  bomb: {
    id: "bomb",
    name: "Bomb",
    rank: null,
    count: 6,
    moveable: false,
    canAttack: false,
    special: "Destroys any attacking unit except Miners",
    symbol: "💣",
    description: "Immobile explosive device"
  }
};
export const GAME_CONFIG = classicMap;

export const isWaterSquare = (x, y) => {
  return GAME_CONFIG.waterSquares.some(square => square.x === x && square.y === y);
};

export const isSetupRow = (y, color) => {
  return GAME_CONFIG.setupRows[color].includes(y);
};

export const getPieceSymbol = (piece) => {
  if (!piece) return null;
  if (piece.revealed || piece.color === 'own') {
    return PIECES[piece.type]?.symbol || '?';
  }
  return '🔹'; // Hidden piece symbol
};

export const getPieceColor = (piece, playerColor) => {
  if (!piece) return null;
  return piece.color === playerColor ? '#4ade80' : '#ef4444';
};

export const canMoveTo = (fromX, fromY, toX, toY, board, playerColor) => {
  const piece = board[fromY]?.[fromX];
  if (!piece || piece.color !== playerColor) return false;
  if (!piece.moveable) return false;

  // Basic bounds check
  if (toX < 0 || toX >= 10 || toY < 0 || toY >= 10) return false;

  // Can't move to water
  if (isWaterSquare(toX, toY)) return false;

  // Can't attack own pieces
  const target = board[toY]?.[toX];
  if (target && target.color === playerColor) return false;

  // Must move in straight line
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  if (dx > 0 && dy > 0) return false;

  // Distance check
  const distance = Math.max(dx, dy);
  const canMoveMultipleSpaces = piece.type === 'scout' || 
                                (piece.special && piece.special.includes('move multiple spaces'));
  const maxDistance = canMoveMultipleSpaces ? 9 : 1;
  if (distance > maxDistance) return false;

  // For multi-space movers, check path is clear
  if (canMoveMultipleSpaces && distance > 1) {
    const stepX = toX > fromX ? 1 : toX < fromX ? -1 : 0;
    const stepY = toY > fromY ? 1 : toY < fromY ? -1 : 0;
    
    for (let i = 1; i < distance; i++) {
      const checkX = fromX + stepX * i;
      const checkY = fromY + stepY * i;
      if (board[checkY]?.[checkX]) return false;
    }
  }

  return true;
};

export const generateArmy = (color, armyData = null) => {
  const army = [];
  const piecesData = armyData?.pieces || PIECES;
  
  Object.entries(piecesData).forEach(([pieceType, pieceInfo]) => {
    for (let i = 0; i < pieceInfo.count; i++) {
      army.push({
        id: `${color}_${pieceType}_${i}`,
        type: pieceType,
        color: color,
        rank: pieceInfo.rank,
        name: pieceInfo.name,
        symbol: pieceInfo.symbol,
        moveable: pieceInfo.moveable,
        canAttack: pieceInfo.canAttack,
        special: pieceInfo.special,
        revealed: false
      });
    }
  });
  return army;
};