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
  // console.log('🗺️ getTerrainType called:', { x, y, mapData: mapData ? { id: mapData.id, hasTerrainOverrides: !!mapData.terrainOverrides } : null });
  
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
  
  const isAttack = target !== null;

  // Must move in straight line
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  if (dx > 0 && dy > 0) return false;

  // Distance check - handle Charge attacks and Mobile movement separately
  const distance = Math.max(dx, dy);
  const movementRange = getMobileMovementRange(piece);
  const canMoveMultipleSpaces = movementRange > 1;
  const hasCharge = hasAbility(piece, 'charge');
  const hasSniper = hasAbility(piece, 'sniper');
  
  // Check distance limits based on action type
  if (isAttack && (hasCharge || hasSniper)) {
    // Charge or Sniper allows attacks up to 2 squares away
    if (distance > 2) return false;
  } else {
    // Normal movement/attack uses Mobile range (or 1 if no Mobile)
    if (distance > movementRange) return false;
  }

  // Check if destination is water and piece cannot fly
  const hasFlying = hasAbility(piece, 'flying');
  if (terrainType === 'water' && !hasFlying) return false;

  // Check path for multi-space movement or ranged attacks (Charge/Sniper)
  if ((canMoveMultipleSpaces && distance > 1) || (isAttack && (hasCharge || hasSniper) && distance > 1)) {
    const stepX = toX > fromX ? 1 : toX < fromX ? -1 : 0;
    const stepY = toY > fromY ? 1 : toY < fromY ? -1 : 0;
    
    for (let i = 1; i < distance; i++) {
      const checkX = fromX + stepX * i;
      const checkY = fromY + stepY * i;
      
      // Check if square is occupied
      const occupyingPiece = board[checkY]?.[checkX];
      if (occupyingPiece) {
        // Flying units can pass over allied units, but not enemy units
        if (hasFlying && occupyingPiece.side === playerSide) {
          // Flying unit can pass over allied unit, continue checking path
          continue;
        } else {
          // Non-flying unit or enemy unit blocks the path
          return false;
        }
      }
      
      // Check if path goes through water (only allowed with Flying or Sniper attacks)
      const pathTerrain = getTerrainType(checkX, checkY, currentMapData);
      if (pathTerrain === 'water' && !hasFlying && !(isAttack && hasSniper)) return false;
    }
  }

  // Mobile restriction: cannot attack after moving more than 1 space
  if (isAttack && distance > 1 && hasAbility(piece, 'mobile')) {
    return false;
  }

  return true;
};

// Count water tiles in player's setup area
// Load terrain data and abilities data (this would normally be loaded asynchronously)
let terrainData = null;
let abilitiesData = null;

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

export const loadAbilitiesData = async () => {
  if (!abilitiesData) {
    try {
      const response = await fetch('/data/abilities/abilities.json');
      abilitiesData = await response.json();
    } catch (error) {
      console.error('Failed to load abilities data:', error);
      // Fallback abilities data
      abilitiesData = {
        abilities: {
          mobile: {
            parameters: {
              spaces: { default: 2 }
            }
          }
        }
      };
    }
  }
  return abilitiesData;
};

// Check if piece has a specific ability
export const hasAbility = (piece, abilityName) => {
  if (!piece.abilities) return false;
  
  return piece.abilities.some(ability => {
    if (typeof ability === 'string') {
      return ability === abilityName;
    } else if (typeof ability === 'object') {
      return ability.id === abilityName;
    }
    return false;
  });
};

// Get number of Recon tokens for a piece
export const getReconTokens = (piece) => {
  if (!hasAbility(piece, 'recon')) {
    return 0;
  }
  
  // Find the Recon ability in the piece's abilities array
  const reconAbility = piece.abilities.find(ability => {
    if (typeof ability === 'object') {
      return ability.id === 'recon';
    }
    return ability === 'recon';
  });
  
  // If Recon ability has custom tokens parameter, use remaining tokens if available
  if (reconAbility && typeof reconAbility === 'object') {
    // Check for remaining tokens first (updated by server), then fall back to initial tokens
    if (reconAbility.remainingTokens !== undefined) {
      return reconAbility.remainingTokens;
    }
    if (reconAbility.tokens !== undefined) {
      return reconAbility.tokens;
    }
  }
  
  // Check for legacy remainingReconTokens property on the piece itself
  if (piece.remainingReconTokens !== undefined) {
    return piece.remainingReconTokens;
  }
  
  // Default Recon tokens from abilities.json
  if (abilitiesData && abilitiesData.abilities.recon) {
    return abilitiesData.abilities.recon.parameters.tokens.default;
  }
  
  // Final fallback
  return 2;
};

// Check if two positions are adjacent (orthogonally, not diagonally)
export const arePositionsAdjacent = (x1, y1, x2, y2) => {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  return (dx === 1 && dy === 0) || (dx === 0 && dy === 1);
};

// Get Mobile movement range for a piece
export const getMobileMovementRange = (piece) => {
  if (!hasAbility(piece, 'mobile')) {
    return 1; // Default movement
  }
  
  // Find the Mobile ability in the piece's abilities array
  const mobileAbility = piece.abilities.find(ability => {
    if (typeof ability === 'object') {
      return ability.id === 'mobile';
    }
    return ability === 'mobile';
  });
  
  // If Mobile ability has custom spaces parameter, use it
  if (mobileAbility && typeof mobileAbility === 'object' && mobileAbility.spaces) {
    return mobileAbility.spaces;
  }
  
  // Default Mobile movement from abilities.json
  if (abilitiesData && abilitiesData.abilities.mobile) {
    return abilitiesData.abilities.mobile.parameters.spaces.default;
  }
  
  // Final fallback
  return 2;
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
        abilities: pieceInfo.abilities || [], // Copy abilities from army data
        revealed: false
      });
    }
  });
  
  console.log(`⚔️ Generated army for ${side}:`, army.length, 'pieces');
  return army;
};

// Generate army with automatic ordered placement
export const generateArmyWithPlacement = (side, armyData = null, mapData = null) => {
  const army = generateArmy(side, armyData, mapData);
  
  // Get setup rows for this side
  const currentMapData = mapData || GAME_CONFIG;
  const setupRows = currentMapData.setupRows[side];
  if (!setupRows || setupRows.length === 0) {
    console.warn(`No setup rows found for side ${side}`);
    return army;
  }
  
  // Sort setup rows - for 'home' (bottom rows), go from bottom to top
  // for 'away' (top rows), go from top to bottom
  const sortedSetupRows = [...setupRows].sort((a, b) => {
    return side === 'home' ? b - a : a - b; // home: descending, away: ascending
  });
  
  // Get all valid placement positions, avoiding impassable terrain
  const validPositions = [];
  for (const row of sortedSetupRows) {
    for (let col = 0; col < currentMapData.boardSize.width; col++) {
      const terrainType = getTerrainType(col, row, currentMapData);
      if (isTerrainPassable(terrainType)) {
        validPositions.push({ x: col, y: row });
      }
    }
  }
  
  if (validPositions.length < army.length) {
    console.warn(`Not enough valid positions (${validPositions.length}) for army size (${army.length})`);
  }
  
  // Sort army pieces for ordered placement
  // 1. Flag first
  // 2. Then by rank (1 is strongest, 10 is weakest)
  // 3. Then bombs last
  const sortedArmy = [...army].sort((a, b) => {
    // Flag comes first
    if (a.type === 'flag') return -1;
    if (b.type === 'flag') return 1;
    
    // Bombs come last
    if (a.type === 'bomb') return 1;
    if (b.type === 'bomb') return -1;
    
    // Sort by rank (1 = strongest, 10 = weakest)
    if (a.rank !== b.rank) {
      // Handle null ranks (shouldn't happen with above logic)
      if (a.rank === null) return 1;
      if (b.rank === null) return -1;
      return a.rank - b.rank;
    }
    
    // Same rank - maintain original order
    return 0;
  });
  
  // Place pieces in order
  const placedArmy = sortedArmy.map((piece, index) => {
    if (index < validPositions.length) {
      return {
        ...piece,
        position: validPositions[index]
      };
    } else {
      // If we run out of positions, leave unplaced
      return { ...piece, position: null };
    }
  });
  
  console.log(`⚔️ Generated and placed army for ${side}:`, placedArmy.length, 'pieces');
  console.log(`📍 Placement order: Flag → Rank 1-10 → Bombs`);
  
  return placedArmy;
};