import React from 'react';
import styled from 'styled-components';
import { getPieceSymbol, getPieceColor } from '../../utils/gameLogic';

const Square = styled.div.withConfig({
  shouldForwardProp: (prop) => !['clickable', 'isWater', 'isSetupArea', 'isSelected', 'isValidMove'].includes(prop)
})`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  
  background: ${props => {
    if (props.isWater) return '#1e40af';
    if (props.isSetupArea) return 'rgba(34, 197, 94, 0.1)';
    if (props.isSelected) return 'rgba(255, 255, 0, 0.3)';
    if (props.isValidMove) return 'rgba(34, 197, 94, 0.3)';
    return 'rgba(255, 255, 255, 0.05)';
  }};

  border-color: ${props => {
    if (props.isSelected) return '#fbbf24';
    if (props.isValidMove) return '#22c55e';
    return 'transparent';
  }};

  &:hover {
    ${props => props.clickable && `
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    `}
  }
`;

const PieceContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color'
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: ${props => props.color};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const PieceSymbol = styled.div`
  font-size: 2.2rem;
  line-height: 1;
`;

const PieceRank = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 3px;
  opacity: 0.8;
`;

function GameSquare({ 
  x, 
  y, 
  piece, 
  playerColor, 
  isSelected, 
  isValidMove, 
  isWater, 
  isSetupArea,
  onClick 
}) {
  const clickable = !isWater && (isSetupArea || isValidMove || (piece && piece.color === playerColor));
  
  const renderPiece = () => {
    if (!piece) return null;

    const symbol = getPieceSymbol(piece);
    const color = piece.color === playerColor ? '#4ade80' : '#ef4444';
    
    return (
      <PieceContainer color={color}>
        <PieceSymbol>{symbol}</PieceSymbol>
        {(piece.revealed || piece.color === playerColor) && piece.rank && (
          <PieceRank>{piece.rank}</PieceRank>
        )}
      </PieceContainer>
    );
  };

  const renderWater = () => {
    if (!isWater) return null;
    return (
      <PieceContainer color="#60a5fa">
        <PieceSymbol>🌊</PieceSymbol>
      </PieceContainer>
    );
  };

  return (
    <Square
      clickable={clickable}
      isSelected={isSelected}
      isValidMove={isValidMove}
      isWater={isWater}
      isSetupArea={isSetupArea}
      onClick={clickable ? onClick : undefined}
      title={isWater ? 'Water' : piece ? `${piece.name} (${piece.color})` : `(${x}, ${y})`}
    >
      {isWater ? renderWater() : renderPiece()}
    </Square>
  );
}

export default GameSquare;