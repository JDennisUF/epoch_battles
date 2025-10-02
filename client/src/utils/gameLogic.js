import defaultArmy from '../data/armies/default.json';
import classicMap from '../data/maps/classic.json';

export const PIECES = defaultArmy.pieces;
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
  const maxDistance = piece.type === 'scout' ? 9 : 1;
  if (distance > maxDistance) return false;

  // For scouts, check path is clear
  if (piece.type === 'scout' && distance > 1) {
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

export const generateArmy = (color) => {
  const army = [];
  Object.entries(PIECES).forEach(([pieceType, pieceInfo]) => {
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