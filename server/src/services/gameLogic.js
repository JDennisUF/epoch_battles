const fs = require('fs');
const path = require('path');

// Load game data from JSON files
const fantasyArmy = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/public/data/armies/fantasy/fantasy.json'), 'utf8'));
const classicMap = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../client/src/data/maps/classic.json'), 'utf8'));
const combatData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/combat.json'), 'utf8'));

class GameLogic {
  constructor() {
    this.pieces = fantasyArmy.pieces;
    this.mapData = classicMap;
    this.combatRules = combatData.combatRules;
    this.movementRules = combatData.movementRules;
    this.gamePhases = combatData.gamePhases;
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

  // Generate starting army for a player
  generateArmy(color, armyId = 'fantasy') {
    if (!armyId) {
      throw new Error('Army ID is required');
    }
    
    const armyData = this.loadArmyData(armyId);
    const army = [];
    
    Object.entries(armyData.pieces).forEach(([pieceType, pieceInfo]) => {
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
          revealed: false,
          position: null // Will be set during setup
        });
      }
    });

    return army;
  }

  // Create empty board with water squares
  createBoard() {
    const board = Array(this.mapData.boardSize.height)
      .fill(null)
      .map(() => Array(this.mapData.boardSize.width).fill(null));

    // Mark water squares as impassable
    this.mapData.waterSquares.forEach(({ x, y }) => {
      board[y][x] = { type: 'water', passable: false };
    });

    return board;
  }

  // Validate piece placement during setup
  validatePlacement(board, piece, x, y, color) {
    // Check bounds
    if (x < 0 || x >= this.mapData.boardSize.width || 
        y < 0 || y >= this.mapData.boardSize.height) {
      return { valid: false, reason: 'Out of bounds' };
    }

    // Check if square is empty
    if (board[y][x] !== null) {
      return { valid: false, reason: 'Square occupied' };
    }

    // Check if placement is in correct setup area
    const setupRows = this.mapData.setupRows[color];
    if (!setupRows.includes(y)) {
      return { valid: false, reason: 'Invalid setup area' };
    }

    return { valid: true };
  }

  // Validate move during gameplay
  validateMove(board, fromX, fromY, toX, toY, color) {
    // Check bounds
    if (toX < 0 || toX >= this.mapData.boardSize.width || 
        toY < 0 || toY >= this.mapData.boardSize.height) {
      return { valid: false, reason: 'Out of bounds' };
    }

    const piece = board[fromY][fromX];
    if (!piece) {
      return { valid: false, reason: 'No piece at source' };
    }

    if (piece.color !== color) {
      return { valid: false, reason: 'Not your piece' };
    }

    if (!piece.moveable) {
      return { valid: false, reason: 'Piece cannot move' };
    }

    // Check destination
    const targetSquare = board[toY][toX];
    if (targetSquare && targetSquare.type === 'water') {
      return { valid: false, reason: 'Cannot move to water' };
    }

    if (targetSquare && targetSquare.color === color) {
      return { valid: false, reason: 'Cannot attack own piece' };
    }

    // Get movement rules for this piece type
    // Check if piece can move multiple spaces based on type or special ability
    const canMoveMultipleSpaces = piece.type === 'scout' || 
                                  (piece.special && piece.special.includes('move multiple spaces'));
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
    const attackerMatch = specialCase.attacker === '*' || specialCase.attacker === attacker.type;
    
    // Handle special piece types dynamically based on their properties
    let defenderMatch;
    if (specialCase.defender === 'flag') {
      defenderMatch = defender.type === 'flag' || defender.special === 'Must be captured to win';
    } else if (specialCase.defender === 'bomb') {
      // Match pieces that destroy attackers (bombs/mines)
      defenderMatch = defender.type === 'bomb' || 
                     (defender.special && defender.special.includes('Destroys any attacking unit'));
    } else {
      defenderMatch = specialCase.defender === '*' || specialCase.defender === defender.type;
    }
    
    // Handle exceptions dynamically - check if attacker has the ability to handle this defender
    if (specialCase.exception) {
      // For bombs/mines, check if attacker can defuse/disable them
      if (specialCase.defender === 'bomb' && defender.special && defender.special.includes('Destroys any attacking unit')) {
        const canDefuse = attacker.type === specialCase.exception || 
                         (attacker.special && (
                           attacker.special.includes('can disable') || 
                           attacker.special.includes('can defuse')
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
      case 'game_won':
        return {
          result: 'game_won',
          winner: attacker,
          description: `${attacker.color} captures the flag and wins!`
        };
      default:
        return this.resolveCombat(attacker, defender);
    }
  }

  // Check if the specified player has lost (no flag or no movable pieces)
  checkWinCondition(board, color) {
    let hasFlag = false;
    let hasMovablePieces = false;

    for (let y = 0; y < board.length; y++) {
      for (let x = 0; x < board[y].length; x++) {
        const piece = board[y][x];
        if (piece && piece.color === color) {
          // Check if this is a flag piece (piece that must be captured to win)
          if (piece.special === 'Must be captured to win' || piece.type === 'flag') {
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

  // Generate random piece placement for quick setup
  generateRandomPlacement(color, armyId = 'fantasy') {
    const army = this.generateArmy(color, armyId);
    const setupRows = this.mapData.setupRows[color];
    const positions = [];

    // Generate all valid positions
    for (const row of setupRows) {
      for (let col = 0; col < this.mapData.boardSize.width; col++) {
        positions.push({ x: col, y: row });
      }
    }

    // Shuffle positions
    const shuffledPositions = positions.sort(() => Math.random() - 0.5);

    console.log(`🎲 Generating random placement for ${armyId}:`, {
      armyPieces: army.length,
      availablePositions: shuffledPositions.length,
      color
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