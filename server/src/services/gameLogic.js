const fs = require('fs');
const path = require('path');

// Load game data from JSON files
const fantasyArmy = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/armies/fantasy/fantasy.json'), 'utf8'));
const classicMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/maps/classic.json'), 'utf8'));
const combatData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/combat.json'), 'utf8'));
const terrainData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/maps/terrain/terrain.json'), 'utf8'));
const abilitiesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/abilities/abilities.json'), 'utf8'));

class GameLogic {
  constructor() {
    this.pieces = fantasyArmy.pieces;
    this.mapData = classicMap;
    this.combatRules = combatData.combatRules;
    this.movementRules = combatData.movementRules;
    this.gamePhases = combatData.gamePhases;
    this.terrainTypes = terrainData.terrainTypes;
    this.abilities = abilitiesData.abilities;
  }

  // Check if piece has a specific ability
  hasAbility(piece, abilityName) {
    if (!piece.abilities) return false;
    
    return piece.abilities.some(ability => {
      if (typeof ability === 'string') {
        return ability === abilityName;
      } else if (typeof ability === 'object') {
        return ability.id === abilityName;
      }
      return false;
    });
  }

  // Get Fleet movement range for a piece
  getFleetMovementRange(piece) {
    if (!this.hasAbility(piece, 'fleet')) {
      return 1; // Default movement
    }
    
    // Find the Fleet ability in the piece's abilities array
    const fleetAbility = piece.abilities.find(ability => {
      if (typeof ability === 'object') {
        return ability.id === 'fleet';
      }
      return ability === 'fleet';
    });
    
    // If Fleet ability has custom spaces parameter, use it
    if (fleetAbility && typeof fleetAbility === 'object' && fleetAbility.spaces) {
      return fleetAbility.spaces;
    }
    
    // Default Fleet movement from abilities.json
    return this.abilities.fleet.parameters.spaces.default;
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
  getTerrainType(x, y, mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for getTerrainType. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
    
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
  countImpassableTerrainInSetupArea(side, mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for countImpassableTerrainInSetupArea. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
    
    if (!currentMapData || !currentMapData.setupRows) {
      return 0;
    }
    
    const setupRows = currentMapData.setupRows[side];
    if (!setupRows) {
      return 0;
    }
    
    let impassableCount = 0;
    
    // Check each position in the setup area
    for (const row of setupRows) {
      for (let col = 0; col < currentMapData.boardSize.width; col++) {
        const terrainType = this.getTerrainType(col, row, currentMapData);
        const isPassable = this.isTerrainPassable(terrainType);
        if (!isPassable) {
          console.log(`🚫 Found impassable terrain at (${col}, ${row}): ${terrainType}`);
          impassableCount++;
        }
      }
    }
    
    console.log(`📊 Impassable terrain tiles in ${side} setup area: ${impassableCount}`);
    return impassableCount;
  }

  // Legacy function for backward compatibility - now calls the new function
  countWaterTilesInSetupArea(side, mapData) {
    return this.countImpassableTerrainInSetupArea(side, mapData);
  }

  // Generate starting army for a player
  generateArmy(side, armyId = 'fantasy', mapData) {
    if (!armyId) {
      throw new Error('Army ID is required');
    }
    
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for generateArmy. Received: ${JSON.stringify(mapData)}`);
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
          abilities: pieceInfo.abilities || [], // Copy abilities from army data
          revealed: false,
          position: null // Will be set during setup
        });
      }
    });

    console.log(`⚔️ Generated army for ${side}:`, army.length, 'pieces');
    return army;
  }

  // Create empty board with water squares
  createBoard(mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for createBoard. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
    const board = Array(currentMapData.boardSize.height)
      .fill(null)
      .map(() => Array(currentMapData.boardSize.width).fill(null));

    // Don't put anything on water squares - they should be handled as terrain on client side
    // Water squares remain null on the board, terrain is handled by the client
    // The water validation is done in validateMove method instead

    return board;
  }

  // Validate piece placement during setup
  validatePlacement(board, piece, x, y, side, mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for validatePlacement. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
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
  validateMove(board, fromX, fromY, toX, toY, side, mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for validateMove. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
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
    
    // Check if destination is impassable terrain
    const terrainType = this.getTerrainType(toX, toY, currentMapData);
    if (!this.isTerrainPassable(terrainType)) {
      return { valid: false, reason: `Cannot move to ${terrainType}` };
    }
    
    // Check if destination is water and piece cannot fly
    const hasFlying = this.hasAbility(piece, 'flying');
    if (terrainType === 'water' && !hasFlying) {
      return { valid: false, reason: 'Cannot land on water' };
    }

    if (targetSquare && targetSquare.side === side) {
      return { valid: false, reason: 'Cannot attack own piece' };
    }

    // Get movement range for this piece
    const movementRange = this.getFleetMovementRange(piece);
    const canMoveMultipleSpaces = movementRange > 1;
    
    // Check movement distance and direction
    const dx = Math.abs(toX - fromX);
    const dy = Math.abs(toY - fromY);
    const distance = Math.max(dx, dy);

    // Must move in straight line (no diagonal moves)
    if (dx > 0 && dy > 0) {
      return { valid: false, reason: 'Must move in straight line' };
    }

    const isAttack = targetSquare !== null;
    const hasCharge = this.hasAbility(piece, 'charge');
    const hasSniper = this.hasAbility(piece, 'sniper');
    
    // Check distance limits based on action type
    if (isAttack && (hasCharge || hasSniper)) {
      // Charge or Sniper allows attacks up to 2 squares away
      if (distance > 2) {
        const abilityName = hasCharge ? 'Charge' : 'Sniper';
        return { valid: false, reason: `${abilityName} attack too far (max 2 squares)` };
      }
    } else {
      // Normal movement/attack uses Fleet range (or 1 if no Fleet)
      if (distance > movementRange) {
        return { valid: false, reason: 'Move too far' };
      }
    }

    // Check path for multi-space movement or ranged attacks (Charge/Sniper)
    if ((canMoveMultipleSpaces && distance > 1) || (isAttack && (hasCharge || hasSniper) && distance > 1)) {
      const pathClear = this.isPathClear(board, fromX, fromY, toX, toY, mapData, piece);
      if (!pathClear.valid) {
        return { valid: false, reason: pathClear.reason };
      }
    }
    
    // Fleet restriction: cannot attack after moving more than 1 space
    if (isAttack && distance > 1 && this.hasAbility(piece, 'fleet')) {
      return { valid: false, reason: 'Cannot attack after moving multiple spaces' };
    }
    
    return { valid: true, isAttack };
  }

  // Check if path is clear for Fleet movement
  isPathClear(board, fromX, fromY, toX, toY, mapData, piece) {
    const dx = toX - fromX;
    const dy = toY - fromY;
    const steps = Math.max(Math.abs(dx), Math.abs(dy));
    
    const stepX = dx === 0 ? 0 : dx / Math.abs(dx);
    const stepY = dy === 0 ? 0 : dy / Math.abs(dy);

    const hasFlying = this.hasAbility(piece, 'flying');

    for (let i = 1; i < steps; i++) {
      const checkX = fromX + (stepX * i);
      const checkY = fromY + (stepY * i);
      
      // Check if square is occupied by another piece
      if (board[checkY][checkX] !== null) {
        return { valid: false, reason: 'Path blocked' };
      }
      
      // Check if square has water terrain
      const terrainType = this.getTerrainType(checkX, checkY, mapData);
      if (terrainType === 'water' && !hasFlying && !this.hasAbility(piece, 'sniper')) {
        return { valid: false, reason: 'Cannot fly over water' };
      }
    }

    return { valid: true };
  }

  // Check if a unit is adjacent to enemies with Fear ability
  checkFearEffect(piece, board, x, y) {
    if (!piece) return 0;
    
    let fearPenalty = 0;
    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1]
    ];
    
    for (const [dx, dy] of directions) {
      const adjacentX = x + dx;
      const adjacentY = y + dy;
      
      // Check bounds
      if (adjacentX >= 0 && adjacentX < board[0].length && 
          adjacentY >= 0 && adjacentY < board.length) {
        const adjacentPiece = board[adjacentY][adjacentX];
        
        // Check if adjacent piece is an enemy with Fear ability
        if (adjacentPiece && 
            adjacentPiece.side !== piece.side && 
            this.hasAbility(adjacentPiece, 'fear')) {
          fearPenalty++;
        }
      }
    }
    
    return fearPenalty;
  }

  // Resolve combat between two pieces
  resolveCombat(attacker, defender, defenderTerrain = null, board = null, attackerPos = null, defenderPos = null) {
    // Check special cases first
    for (const specialCase of this.combatRules.specialCases) {
      if (this.matchesSpecialCase(attacker, defender, specialCase)) {
        return this.applySpecialCaseResult(attacker, defender, specialCase, defenderTerrain);
      }
    }

    // Calculate effective ranks with terrain bonuses
    let attackerRank = attacker.rank;
    let defenderRank = defender.rank;
    
    // Apply Fear effect if board position data is available
    if (board && attackerPos && defenderPos) {
      const attackerFearPenalty = this.checkFearEffect(attacker, board, attackerPos.x, attackerPos.y);
      const defenderFearPenalty = this.checkFearEffect(defender, board, defenderPos.x, defenderPos.y);
      
      if (attackerFearPenalty > 0) {
        attackerRank += attackerFearPenalty; // Higher rank number = weaker
        console.log(`😨 Fear effect: ${attacker.name} rank weakened from ${attacker.rank} to ${attackerRank} (${attackerFearPenalty} Fear units adjacent)`);
      }
      
      if (defenderFearPenalty > 0) {
        defenderRank += defenderFearPenalty; // Higher rank number = weaker
        console.log(`😨 Fear effect: ${defender.name} rank weakened from ${defender.rank} to ${defenderRank} (${defenderFearPenalty} Fear units adjacent)`);
      }
    }
    
    // Apply mountain terrain defensive bonus
    if (defenderTerrain === 'mountain') {
      defenderRank = Math.max(1, defenderRank - 1); // Lower rank number = stronger
      console.log(`🏔️ Mountain defensive bonus: ${defender.name} rank improved from ${defender.rank} to ${defenderRank}`);
    }

    // Apply normal combat rules with terrain-modified ranks
    const result = {
      attackerOriginalRank: attacker.rank,
      attackerEffectiveRank: attackerRank,
      defenderOriginalRank: defender.rank,
      defenderEffectiveRank: defenderRank
    };
    
    if (attackerRank < defenderRank) {
      return {
        result: 'attacker_wins',
        winner: attacker,
        loser: defender,
        description: defenderTerrain === 'mountain' ? 
          `${attacker.name} defeats ${defender.name} (mountain defense)` :
          `${attacker.name} defeats ${defender.name}`,
        ...result
      };
    } else if (attackerRank > defenderRank) {
      return {
        result: 'defender_wins', 
        winner: defender,
        loser: attacker,
        description: defenderTerrain === 'mountain' ? 
          `${defender.name} defends from mountain and defeats ${attacker.name}` :
          `${defender.name} defeats ${attacker.name}`,
        ...result
      };
    } else {
      return {
        result: 'both_destroyed',
        winner: null,
        description: defenderTerrain === 'mountain' ? 
          `${attacker.name} and ${defender.name} destroy each other (mountain defense not enough)` :
          `${attacker.name} and ${defender.name} destroy each other`,
        ...result
      };
    }
  }

  // Check if a special combat case applies
  matchesSpecialCase(attacker, defender, specialCase) {
    let attackerMatch;
    if (specialCase.attacker === 'miner') {
      // Match units that can defuse bombs/traps - only use class
      attackerMatch = attacker.class === 'miner';
    } else if (specialCase.attacker === 'spy') {
      // Match spy units - only use class
      attackerMatch = attacker.class === 'spy';
    } else if (specialCase.attacker === 'marshal') {
      // Match marshal units - only use class
      attackerMatch = attacker.class === 'marshal';
    } else {
      attackerMatch = specialCase.attacker === '*' || specialCase.attacker === attacker.class;
    }
    
    // Handle special piece types dynamically based on their class only
    let defenderMatch;
    if (specialCase.defender === 'flag') {
      defenderMatch = defender.class === 'flag';
    } else if (specialCase.defender === 'bomb') {
      // Match pieces that destroy attackers (bombs/mines/traps) - only use class
      defenderMatch = defender.class === 'bomb';
    } else if (specialCase.defender === 'spy') {
      // Match spy units - only use class
      defenderMatch = defender.class === 'spy';
    } else if (specialCase.defender === 'marshal') {
      // Match marshal units - only use class
      defenderMatch = defender.class === 'marshal';
    } else {
      defenderMatch = specialCase.defender === '*' || specialCase.defender === defender.class;
    }
    
    // Handle exceptions dynamically - check if attacker has the ability to handle this defender
    if (specialCase.exception) {
      // For bombs/mines, check if attacker can defuse/disable them - only use class
      if (specialCase.defender === 'bomb' && defender.class === 'bomb') {
        const canDefuse = attacker.class === specialCase.exception;
        if (canDefuse) {
          return false; // Exception applies, this special case doesn't match
        }
      } else if (attacker.class === specialCase.exception) {
        return false;
      }
    }

    return attackerMatch && defenderMatch;
  }

  // Apply special case combat result
  applySpecialCaseResult(attacker, defender, specialCase, defenderTerrain = null) {
    // Special cases use original ranks (no modifiers apply)
    const rankInfo = {
      attackerOriginalRank: attacker.rank,
      attackerEffectiveRank: attacker.rank,
      defenderOriginalRank: defender.rank,
      defenderEffectiveRank: defender.rank
    };
    
    switch (specialCase.result) {
      case 'attacker_wins':
        return {
          result: 'attacker_wins',
          winner: attacker,
          loser: defender,
          description: specialCase.description,
          ...rankInfo
        };
      case 'defender_wins':
        return {
          result: 'defender_wins',
          winner: defender,
          loser: attacker,
          description: specialCase.description,
          ...rankInfo
        };
      case 'attacker_destroyed':
        return {
          result: 'defender_wins',
          winner: defender,
          loser: attacker,
          description: specialCase.description,
          ...rankInfo
        };
      case 'defender_destroyed':
        return {
          result: 'attacker_wins',
          winner: attacker,
          loser: defender,
          description: specialCase.description,
          ...rankInfo
        };
      case 'both_destroyed_bomb':
        return {
          result: 'both_destroyed',
          winner: null,
          description: specialCase.description,
          ...rankInfo
        };
      case 'game_won':
        return {
          result: 'game_won',
          winner: attacker,
          description: `${attacker.side} captures the flag and wins!`,
          ...rankInfo
        };
      default:
        return this.resolveCombat(attacker, defender, defenderTerrain);
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


  // Validate that map data has the required structure
  isValidMapData(mapData) {
    if (!mapData || typeof mapData !== 'object') return false;
    if (!mapData.setupRows || typeof mapData.setupRows !== 'object') return false;
    if (!mapData.boardSize || typeof mapData.boardSize !== 'object') return false;
    if (typeof mapData.boardSize.width !== 'number' || typeof mapData.boardSize.height !== 'number') return false;
    return true;
  }

  // Generate random piece placement for quick setup
  generateRandomPlacement(side, armyId = 'fantasy', mapData) {
    if (!this.isValidMapData(mapData)) {
      throw new Error(`Invalid or missing map data provided for generateRandomPlacement. Received: ${JSON.stringify(mapData)}`);
    }
    
    const currentMapData = mapData;
    
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
        const isPassable = this.isTerrainPassable(terrainType);
        if (isPassable) {
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