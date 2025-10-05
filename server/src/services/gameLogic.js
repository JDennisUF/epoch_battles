const fs = require('fs');
const path = require('path');

// Load game data from JSON files
const fantasyArmy = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/armies/fantasy/fantasy.json'), 'utf8'));
const classicMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/maps/classic.json'), 'utf8'));
const combatData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/combat.json'), 'utf8'));
const terrainData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/maps/terrain/terrain.json'), 'utf8'));

class GameLogic {
  constructor() {
    this.pieces = fantasyArmy.pieces;
    this.mapData = classicMap;
    this.combatRules = combatData.combatRules;
    this.movementRules = combatData.movementRules;
    this.gamePhases = combatData.gamePhases;
    this.terrainTypes = terrainData.terrainTypes;
  }


  // Load army data by ID
  loadArmyData(armyId) {
    const baseArmyPath = path.join(__dirname, '../../../client/public/data/armies');
    const armyPath = path.join(baseArmyPath, `${armyId}/${armyId}.json`);
    
    try {
      const armyData = JSON.parse(fs.readFileSync(armyPath, 'utf8'));
      return armyData;
    } catch (error) {
      throw new Error(`Failed to load army data for '${armyId}': ${error.message}. Expected file: ${armyPath}`);
    }
  }

  // Get terrain type at specific coordinates
  getTerrainType(x, y, mapData = null) {
    const currentMapData = this.isValidMapData(mapData) ? mapData : this.mapData;
    
    if (!currentMapData || !currentMapData.terrainOverrides) {
      return currentMapData?.defaultTerrain || 'grassland';
    }
    
    // Check terrain overrides first
    for (const [terrainType, coordinates] of Object.entries(currentMapData.terrainOverrides)) {
      if (coordinates.some(coord => coord.x === x && coord.y === y)) {
        return terrainType;
      }
    }
    
    // Return default terrain if no override found
    return currentMapData.defaultTerrain || 'grassland';
  }

  // Check if terrain is passable (can place units on it)
  isTerrainPassable(terrainType) {
    const terrain = this.terrainTypes[terrainType];
    return terrain ? terrain.passable : true; // Default to passable if terrain type not found
  }

  // Count impassable terrain tiles in player's setup area
  countImpassableTerrainInSetupArea(side, mapData = null) {
    const currentMapData = this.isValidMapData(mapData) ? mapData : this.mapData;
    
    if (!currentMapData || !currentMapData.setupRows) {
      return 0;
    }
    
    const setupRows = currentMapData.setupRows[side];
    if (!setupRows) return 0;
    
    let impassableCount = 0;
    
    // Check each position in the setup area
    for (const row of setupRows) {
      for (let col = 0; col < currentMapData.boardSize.width; col++) {
        const terrainType = this.getTerrainType(col, row, currentMapData);
        if (!this.isTerrainPassable(terrainType)) {
          impassableCount++;
        }
      }
    }
    
    return impassableCount;
  }

  // Legacy function for backward compatibility - now calls the new function
  countWaterTilesInSetupArea(side, mapData = null) {
    return this.countImpassableTerrainInSetupArea(side, mapData);
  }

  // Generate starting army for a player
  generateArmy(side, armyId = 'fantasy', mapData = null) {
    if (!armyId) {
      throw new Error('Army ID is required');
    }
    
    const armyData = this.loadArmyData(armyId);
    const army = [];
    
    // Count impassable terrain tiles in setup area to reduce scouts
    const impassableTerrainInSetup = this.countImpassableTerrainInSetupArea(side, mapData);
    console.log(`🗺️ Impassable terrain tiles in ${side} setup area:`, impassableTerrainInSetup);
    
    Object.entries(armyData.pieces).forEach(([pieceType, pieceInfo]) => {
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
          class: pieceInfo.class,
          revealed: false,
          position: null // Will be set during setup
        });
      }
    });

    console.log(`⚔️ Generated army for ${side}:`, army.length, 'pieces');
    return army;
  }

  // Create empty board with water squares
  createBoard(mapData = null) {
    const currentMapData = this.isValidMapData(mapData) ? mapData : this.mapData;
    const board = Array(currentMapData.boardSize.height)
      .fill(null)
      .map(() => Array(currentMapData.boardSize.width).fill(null));

    // Don't put anything on water squares - they should be handled as terrain on client side
    // Water squares remain null on the board, terrain is handled by the client
    // The water validation is done in validateMove method instead

    return board;
  }

  // Validate piece placement during setup
  validatePlacement(board, piece, x, y, side, mapData = null) {
    // Use provided map data if valid, otherwise fall back to default
    let currentMapData;
    
    if (this.isValidMapData(mapData)) {
      currentMapData = mapData;
    } else {
      currentMapData = this.mapData;
    }
    
    // Final safety check
    if (!this.isValidMapData(currentMapData)) {
      throw new Error('No valid map data available for validatePlacement');
    }
    // Check bounds
    if (x < 0 || x >= currentMapData.boardSize.width || 
        y < 0 || y >= currentMapData.boardSize.height) {
      return { valid: false, reason: 'Out of bounds' };
    }

    // Check if square is empty
    if (board[y][x] !== null) {
      return { valid: false, reason: 'Square occupied' };
    }

    // Check if placement is on impassable terrain
    const terrainType = this.getTerrainType(x, y, currentMapData);
    if (!this.isTerrainPassable(terrainType)) {
      return { valid: false, reason: `Cannot place on ${terrainType}` };
    }

    // Check if placement is in correct setup area
    const setupRows = currentMapData.setupRows[side];
    if (!setupRows.includes(y)) {
      return { valid: false, reason: 'Invalid setup area' };
    }

    return { valid: true };
  }

  // Validate move during gameplay
  validateMove(board, fromX, fromY, toX, toY, side, mapData = null) {
    const currentMapData = this.isValidMapData(mapData) ? mapData : this.mapData;
    // Check bounds
    if (toX < 0 || toX >= currentMapData.boardSize.width || 
        toY < 0 || toY >= currentMapData.boardSize.height) {
      return { valid: false, reason: 'Out of bounds' };
    }

    const piece = board[fromY][fromX];
    if (!piece) {
      return { valid: false, reason: 'No piece at source' };
    }

    if (piece.side !== side) {
      return { valid: false, reason: 'Not your piece' };
    }

    if (!piece.moveable) {
      return { valid: false, reason: 'Piece cannot move' };
    }

    // Check destination
    const targetSquare = board[toY][toX];
    
    // Check if destination is water
    if (this.getTerrainType(toX, toY, currentMapData) === 'water') {
      return { valid: false, reason: 'Cannot move to water' };
    }

    if (targetSquare && targetSquare.side === side) {
      return { valid: false, reason: 'Cannot attack own piece' };
    }

    // Get movement rules for this piece type
    // Check if piece can move multiple spaces based on type, class, or special ability
    const canMoveMultipleSpaces = piece.type === 'scout' || 
                                  piece.class === 'scout' ||
                                  (piece.special && (piece.special.includes('move multiple spaces') || 
                                                   piece.special.includes('Moves multiple spaces')));
    const moveRules = canMoveMultipleSpaces ? this.movementRules.scout : 
                      (this.movementRules[piece.type] || this.movementRules.default);
    
    // Check movement distance and direction
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const distance = Math.max(dx, dy);

    // Must move in straight line (no diagonal moves)
    if (dx > 0 && dy > 0) {
      return { valid: false, reason: 'Must move in straight line' };
    }

    // Check distance limits
    if (distance > moveRules.maxDistance) {
      return { valid: false, reason: 'Move too far' };
    }

    // For pieces moving multiple spaces, check path is clear
    if (canMoveMultipleSpaces && distance > 1) {
      const pathClear = this.isPathClear(board, fromX, fromY, toX, toY);
      if (!pathClear) {
        return { valid: false, reason: 'Path blocked' };
      }
    }

    return { valid: true, isAttack: targetSquare !== null };
  }

  // Check if path is clear for scout movement
  isPathClear(board, fromX, fromY, toX, toY) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    for (let i = 1; i < steps; i++) {
      const checkX = fromX + (stepX * i);
      const checkY = fromY + (stepY * i);
      
      if (board[checkY][checkX] !== null) {
        return false;
      }
    }

    return true;
  }

  // Resolve combat between two pieces
  resolveCombat(attacker, defender) {
    // Check special cases first
    for (const specialCase of this.combatRules.specialCases) {
      if (this.matchesSpecialCase(attacker, defender, specialCase)) {
        return this.applySpecialCaseResult(attacker, defender, specialCase);
      }
    }

    // Apply normal combat rules
    if (attacker.rank < defender.rank) {
      return {
        result: 'attacker_wins',
        winner: attacker,
        loser: defender,
        description: `${attacker.name} defeats ${defender.name}`
      };
    } else if (attacker.rank > defender.rank) {
      return {
        result: 'defender_wins', 
        winner: defender,
        loser: attacker,
        description: `${defender.name} defeats ${attacker.name}`
      };
    } else {
      return {
        result: 'both_destroyed',
        winner: null,
        description: `${attacker.name} and ${defender.name} destroy each other`
      };
    }
  }

  // Check if a special combat case applies
  matchesSpecialCase(attacker, defender, specialCase) {
    let attackerMatch;
    if (specialCase.attacker === 'miner') {
      // Match units that can defuse bombs/traps
      attackerMatch = attacker.type === 'miner' || 
                     attacker.class === 'miner' ||
                     (attacker.special && (attacker.special.includes('can disable') || 
                                         attacker.special.includes('can defuse') ||
                                         attacker.special.includes('disable traps')));
    } else {
      attackerMatch = specialCase.attacker === '*' || specialCase.attacker === attacker.type;
    }
    
    // Handle special piece types dynamically based on their properties
    let defenderMatch;
    if (specialCase.defender === 'flag') {
      defenderMatch = defender.class === 'flag' || defender.special === 'Must be captured to win';
    } else if (specialCase.defender === 'bomb') {
      // Match pieces that destroy attackers (bombs/mines/traps)
      defenderMatch = defender.type === 'bomb' || 
                     defender.type === 'trap' ||
                     defender.class === 'bomb' ||
                     (defender.special && (defender.special.includes('Destroys any attacking unit') || 
                                         defender.special.includes('Destroys any attacker')));
    } else {
      defenderMatch = specialCase.defender === '*' || specialCase.defender === defender.type;
    }
    
    // Handle exceptions dynamically - check if attacker has the ability to handle this defender
    if (specialCase.exception) {
      // For bombs/mines, check if attacker can defuse/disable them
      if (specialCase.defender === 'bomb' && (defender.class === 'bomb' || (defender.special && (defender.special.includes('Destroys any attacking unit') || defender.special.includes('Destroys any attacker'))))) {
        const canDefuse = attacker.type === specialCase.exception || 
                         attacker.class === specialCase.exception ||
                         (attacker.special && (
                           attacker.special.includes('can disable') || 
                           attacker.special.includes('can defuse') ||
                           attacker.special.includes('disable acid pods')
                         ));
        if (canDefuse) {
          return false; // Exception applies, this special case doesn't match
        }
      } else if (attacker.type === specialCase.exception) {
        return false;
      }
    }

    return attackerMatch && defenderMatch;
  }

  // Apply special case combat result
  applySpecialCaseResult(attacker, defender, specialCase) {
    switch (specialCase.result) {
      case 'attacker_wins':
        return {
          result: 'attacker_wins',
          winner: attacker,
          loser: defender,
          description: specialCase.description
        };
      case 'defender_wins':
        return {
          result: 'defender_wins',
          winner: defender,
          loser: attacker,
          description: specialCase.description
        };
      case 'attacker_destroyed':
        return {
          result: 'defender_wins',
          winner: defender,
          loser: attacker,
          description: specialCase.description
        };
      case 'defender_destroyed':
        return {
          result: 'attacker_wins',
          winner: attacker,
          loser: defender,
          description: specialCase.description
        };
      case 'both_destroyed_bomb':
        return {
          result: 'both_destroyed',
          winner: null,
          description: specialCase.description
        };
      case 'game_won':
        return {
          result: 'game_won',
          winner: attacker,
          description: `${attacker.side} captures the flag and wins!`
        };
      default:
        return this.resolveCombat(attacker, defender);
    }
  }

  // Check if the specified player has lost (no flag or no movable pieces)
  checkWinCondition(board, side) {
    let hasFlag = false;
    let hasMovablePieces = false;

    console.log(`Checking win condition for side: ${side}`);
    
    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const piece = board[y][x];
        if (piece && piece.side === side) {
          // Check if this is a flag piece (piece that must be captured to win)
          console.log('Checking piece:', piece);
          if (piece.class === 'flag') {
            hasFlag = true;
          }
          if (piece.moveable) {
            hasMovablePieces = true;
          }
        }
      }
    }

    // Return true if this player has lost (no flag or no moves)
    if (!hasFlag) {
      return { gameOver: true, reason: 'flag_captured' };
    }

    if (!hasMovablePieces) {
      return { gameOver: true, reason: 'no_moves' };
    }

    return { gameOver: false };
  }

  // Get terrain type for a coordinate
  getTerrainType(x, y, mapData = null) {
    const currentMapData = this.isValidMapData(mapData) ? mapData : this.mapData;
    // Use new terrain structure with defaultTerrain and terrainOverrides
    if (currentMapData.terrainOverrides) {
      for (const [terrainType, coordinates] of Object.entries(currentMapData.terrainOverrides)) {
        if (coordinates.some(coord => coord.x === x && coord.y === y)) {
          return terrainType;
        }
      }
      return currentMapData.defaultTerrain || 'grassland';
    }
    
    // Fallback to old terrain structure for backwards compatibility
    const waterSquares = currentMapData.terrain?.waterSquares || currentMapData.waterSquares || [];
    const isWaterSquare = waterSquares.some(square => square.x === x && square.y === y);
    if (isWaterSquare) return 'water';
    
    const dirtSquares = currentMapData.terrain?.dirtSquares || [];
    const isDirtSquare = dirtSquares.some(square => square.x === x && square.y === y);
    if (isDirtSquare) return 'dirt';
    
    const grasslandSquares = currentMapData.terrain?.grasslandSquares || [];
    const isGrasslandSquare = grasslandSquares.some(square => square.x === x && square.y === y);
    if (isGrasslandSquare) return 'grassland';
    
    return 'default';
  }

  // Validate that map data has the required structure
  isValidMapData(mapData) {
    if (!mapData || typeof mapData !== 'object') return false;
    if (!mapData.setupRows || typeof mapData.setupRows !== 'object') return false;
    if (!mapData.boardSize || typeof mapData.boardSize !== 'object') return false;
    if (typeof mapData.boardSize.width !== 'number' || typeof mapData.boardSize.height !== 'number') return false;
    return true;
  }

  // Generate random piece placement for quick setup
  generateRandomPlacement(side, armyId = 'fantasy', mapData = null) {
    // Use provided map data if valid, otherwise fall back to default
    let currentMapData;
    
    if (this.isValidMapData(mapData)) {
      currentMapData = mapData;
    } else {
      console.log(`🎲 Using fallback map data (provided mapData was ${mapData ? 'invalid' : 'null'})`);
      currentMapData = this.mapData;
    }
    
    // Final safety check
    if (!this.isValidMapData(currentMapData)) {
      throw new Error('No valid map data available (both provided and default are invalid)');
    }
    
    if (!currentMapData.setupRows[side]) {
      throw new Error(`No setup rows for side '${side}'. Available sides: ${Object.keys(currentMapData.setupRows).join(', ')}`);
    }
    
    const army = this.generateArmy(side, armyId, currentMapData);
    const setupRows = currentMapData.setupRows[side];
    const positions = [];

    // Generate all valid positions (only passable terrain)
    for (const row of setupRows) {
      for (let col = 0; col < currentMapData.boardSize.width; col++) {
        const terrainType = this.getTerrainType(col, row, currentMapData);
        if (this.isTerrainPassable(terrainType)) {
          positions.push({ x: col, y: row });
        } else {
          console.log(`🚫 Skipping impassable terrain at (${col}, ${row}): ${terrainType}`);
        }
      }
    }

    // Shuffle positions
    const shuffledPositions = positions.sort(() => Math.random() - 0.5);

    console.log(`🎲 Generating random placement for ${armyId}:`, {
      armyPieces: army.length,
      availablePositions: shuffledPositions.length,
      side
    });

    // Verify we have enough positions
    if (army.length > shuffledPositions.length) {
      console.error(`❌ Not enough positions! Army has ${army.length} pieces but only ${shuffledPositions.length} positions available`);
      throw new Error(`Not enough positions for army placement. Army: ${army.length}, Positions: ${shuffledPositions.length}`);
    }

    // Assign positions to pieces
    army.forEach((piece, index) => {
      if (index < shuffledPositions.length) {
        piece.position = shuffledPositions[index];
      } else {
        console.error(`❌ No position available for piece ${index}:`, piece);
        piece.position = null;
      }
    });

    // Filter out any pieces without positions
    const validPieces = army.filter(piece => piece.position !== null);
    console.log(`✅ Random placement complete: ${validPieces.length}/${army.length} pieces positioned`);

    return validPieces;
  }
}

module.exports = new GameLogic();