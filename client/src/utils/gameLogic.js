// Map data and terrain data will be loaded dynamically from public/data/maps/

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
// Default GAME_CONFIG - will be overridden when map is loaded
export const GAME_CONFIG = {
  boardSize: { width: 10, height: 10 },
  setupRows: { home: [0, 1, 2, 3], away: [6, 7, 8, 9] },
  defaultTerrain: 'grassland',
  terrainOverrides: {}
};


export const getTerrainType = (x, y, mapData) => {
  console.log('🗺️ getTerrainType called:', { x, y, mapData: mapData ? { id: mapData.id, hasTerrainOverrides: !!mapData.terrainOverrides } : null });
  
  if (!mapData) {
    console.error('❌ getTerrainType called with no mapData');
    return 'error_no_mapdata';
  }
  
  // Use new terrain structure with defaultTerrain and terrainOverrides
  if (mapData.terrainOverrides) {
    for (const [terrainType, coordinates] of Object.entries(mapData.terrainOverrides)) {
      if (coordinates.some(coord => coord.x === x && coord.y === y)) {
        return terrainType;
      }
    }
    return mapData.defaultTerrain;
  }
  
  console.error('❌ mapData has no terrainOverrides:', mapData);
  return 'error_no_terrain_overrides';
};

export const isSetupRow = (y, side) => {
  return GAME_CONFIG.setupRows[side].includes(y);
};

export const getPieceSymbol = (piece) => {
  if (!piece) return null;
  if (piece.revealed || piece.side === 'own') {
    return PIECES[piece.type]?.symbol || '?';
  }
  return '🔹'; // Hidden piece symbol
};

export const getPieceColor = (piece, playerSide) => {
  if (!piece) return null;
  return piece.side === playerSide ? '#4ade80' : '#ef4444';
};

export const canMoveTo = (fromX, fromY, toX, toY, board, playerSide, mapData = null) => {
  const piece = board[fromY]?.[fromX];
  if (!piece || piece.side !== playerSide) return false;
  if (!piece.moveable) return false;

  // Use provided mapData or fall back to GAME_CONFIG
  const currentMapData = mapData || GAME_CONFIG;

  // Basic bounds check
  if (toX < 0 || toX >= (currentMapData.boardSize?.width || 10) || 
      toY < 0 || toY >= (currentMapData.boardSize?.height || 10)) return false;

  // Can't move to impassable terrain
  const terrainType = getTerrainType(toX, toY, currentMapData);
  if (!isTerrainPassable(terrainType)) return false;

  // Can't attack own pieces
  const target = board[toY]?.[toX];
  if (target && target.side === playerSide) return false;

  // Must move in straight line
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  if (dx > 0 && dy > 0) return false;

  // Distance check
  const distance = Math.max(dx, dy);
  const canMoveMultipleSpaces = piece.type === 'scout' || 
                                piece.class === 'scout' ||
                                (piece.special && (piece.special.includes('move multiple spaces') || 
                                                 piece.special.includes('Moves multiple spaces')));
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

// Count water tiles in player's setup area
// Load terrain data (this would normally be loaded asynchronously)
let terrainData = null;

export const loadTerrainData = async () => {
  if (!terrainData) {
    try {
      const response = await fetch('/data/maps/terrain/terrain.json');
      terrainData = await response.json();
    } catch (error) {
      console.error('Failed to load terrain data:', error);
      // Fallback terrain data
      terrainData = {
        terrainTypes: {
          grassland: { passable: true },
          dirt: { passable: true },
          water: { passable: false },
          mountain: { passable: true },
          sand: { passable: true }
        }
      };
    }
  }
  return terrainData;
};

// Check if terrain is passable
export const isTerrainPassable = (terrainType) => {
  if (!terrainData) {
    // Default to passable if terrain data not loaded yet
    return terrainType !== 'water';
  }
  const terrain = terrainData.terrainTypes[terrainType];
  return terrain ? terrain.passable : true;
};

// Count impassable terrain tiles in player's setup area
export const countImpassableTerrainInSetupArea = (mapData, side) => {
  if (!mapData || !mapData.setupRows) {
    return 0;
  }
  
  const setupRows = mapData.setupRows[side];
  if (!setupRows) return 0;
  
  let impassableCount = 0;
  
  // Check each position in the setup area
  for (const row of setupRows) {
    for (let col = 0; col < mapData.boardSize.width; col++) {
      const terrainType = getTerrainType(col, row, mapData);
      if (!isTerrainPassable(terrainType)) {
        impassableCount++;
      }
    }
  }
  
  return impassableCount;
};

// Legacy function for backward compatibility
export const countWaterTilesInSetupArea = (mapData, side) => {
  return countImpassableTerrainInSetupArea(mapData, side);
};

export const generateArmy = (side, armyData = null, mapData = null) => {
  const army = [];
  const piecesData = armyData?.pieces || PIECES;
  
  // Count impassable terrain tiles in setup area to reduce scouts
  const impassableTerrainInSetup = countImpassableTerrainInSetupArea(mapData, side);
  console.log(`🗺️ Impassable terrain tiles in ${side} setup area:`, impassableTerrainInSetup);
  
  Object.entries(piecesData).forEach(([pieceType, pieceInfo]) => {
    let count = pieceInfo.count;
    
    // Reduce scout count by number of impassable terrain tiles in setup area
    if (pieceType === 'scout' || (pieceInfo.class === 'scout')) {
      count = Math.max(0, count - impassableTerrainInSetup);
      console.log(`🔍 Reducing ${pieceType} count from ${pieceInfo.count} to ${count} due to ${impassableTerrainInSetup} impassable terrain tiles`);
    }
    
    for (let i = 0; i < count; i++) {
      army.push({
        id: `${side}_${pieceType}_${i}`,
        type: pieceType,
        side: side,
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
  
  console.log(`⚔️ Generated army for ${side}:`, army.length, 'pieces');
  return army;
};