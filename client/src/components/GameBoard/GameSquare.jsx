import React from 'react';
import styled from 'styled-components';
import { getPieceSymbol, getPieceColor, getTerrainType } from '../../utils/gameLogic';

const Square = styled.div.withConfig({
  shouldForwardProp: (prop) => !['clickable', 'terrainType', 'isSetupArea', 'isSelected', 'isValidMove', 'isDragTarget'].includes(prop)
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
  position: relative;
  
  // Terrain background
  background-image: ${props => {
    switch (props.terrainType) {
      case 'water': return 'url(/data/maps/terrain/water.png)';
      case 'dirt': return 'url(/data/maps/terrain/dirt.png)';
      case 'grassland': return 'url(/data/maps/terrain/grassland.png)';
      default: return 'none';
    }
  }};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  
  // Fallback background colors for when images don't load
  background-color: ${props => {
    switch (props.terrainType) {
      case 'water': return '#3b82f6';
      case 'dirt': return '#a3a3a3';  
      case 'grassland': return '#22c55e';
      default: return '#f3f4f6';
    }
  }};
  
  // Overlay colors for game states
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => {
      if (props.isDragTarget) return 'rgba(59, 130, 246, 0.4)';
      if (props.isSetupArea) return 'rgba(34, 197, 94, 0.2)';
      if (props.isSelected) return 'rgba(255, 255, 0, 0.4)';
      if (props.isValidMove) return 'rgba(34, 197, 94, 0.4)';
      return 'transparent';
    }};
    pointer-events: none;
    z-index: 1;
  }

  border-color: ${props => {
    if (props.isDragTarget) return '#3b82f6';
    if (props.isSelected) return '#fbbf24';
    if (props.isValidMove) return '#22c55e';
    return 'transparent';
  }};

  &:hover {
    ${props => props.clickable && `
      &::before {
        background: rgba(255, 255, 255, 0.2);
      }
      transform: scale(1.02);
    `}
  }
`;

const PieceContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['color', 'isDraggable'].includes(prop)
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: ${props => props.color};
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  position: relative;
  z-index: 2;
  cursor: ${props => props.isDraggable ? 'grab' : 'default'};
  
  &:active {
    cursor: ${props => props.isDraggable ? 'grabbing' : 'default'};
  }
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

const PieceImage = styled.img`
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 6px;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  transition: transform 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
  }
`;

function GameSquare({ 
  x, 
  y, 
  piece, 
  playerSide, 
  playerArmy,
  opponentArmy,
  gamePhase,
  mapData,
  isSelected, 
  isValidMove, 
  isSetupArea,
  isDragTarget,
  onClick,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd
}) {
  const terrainType = getTerrainType(x, y, mapData);
  const isWater = terrainType === 'water';
  const clickable = !isWater && (isSetupArea || isValidMove || (piece && piece.side === playerSide));
  
  // Debug actual terrain calculation
  if (x === 2 && y === 4) {
    console.log('🗺️ Terrain debug for water square (2,4):', {
      terrainType,
      mapData: mapData,
      hasTerrainOverrides: !!mapData?.terrainOverrides,
      waterOverrides: mapData?.terrainOverrides?.water
    });
  }
  
  const renderPiece = () => {
    if (!piece) return null;

    const symbol = getPieceSymbol(piece);
    const color = piece.side === playerSide ? '#4ade80' : '#ef4444';
    const isPlayerPiece = piece.side === playerSide;
    const isDraggable = gamePhase === 'setup' && isPlayerPiece && piece.position;
    
    // Show image for player's own pieces if we have army data
    if (isPlayerPiece && playerArmy && piece.type) {
      const imagePath = `/data/armies/${playerArmy}/64x64/${piece.type}.png`;
      
      return (
        <PieceContainer 
          color={color} 
          isDraggable={isDraggable}
          draggable={isDraggable}
          onDragStart={isDraggable ? onDragStart : undefined}
          onDragEnd={isDraggable ? onDragEnd : undefined}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PieceImage 
              src={imagePath} 
              alt={piece.name || piece.type}
              onError={(e) => {
                // Fallback to symbol if image fails to load
                console.log(`Failed to load image: ${imagePath}`);
                e.target.style.display = 'none';
                const symbolElement = e.target.parentNode.querySelector('[data-fallback="symbol"]');
                if (symbolElement) {
                  symbolElement.style.display = 'block';
                }
              }}
            />
            <PieceSymbol data-fallback="symbol" style={{ display: 'none', fontSize: '2.2rem' }}>
              {symbol}
            </PieceSymbol>
          </div>
          {(piece.revealed || piece.side === playerSide) && (
            <PieceRank>{piece.rank || "-"}</PieceRank>
          )}
        </PieceContainer>
      );
    }
    
    // Show revealed opponent pieces with their actual unit image
    if (!isPlayerPiece && piece.revealed && opponentArmy && piece.type !== 'hidden') {
      const imagePath = `/data/armies/${opponentArmy}/64x64/${piece.type}.png`;
      
      return (
        <PieceContainer 
          color={color} 
          isDraggable={isDraggable}
          draggable={isDraggable}
          onDragStart={isDraggable ? onDragStart : undefined}
          onDragEnd={isDraggable ? onDragEnd : undefined}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PieceImage 
              src={imagePath} 
              alt={piece.name || piece.type}
              onError={(e) => {
                // Fallback to symbol if image fails to load
                console.log(`Failed to load revealed opponent image: ${imagePath}`);
                e.target.style.display = 'none';
                const symbolElement = e.target.parentNode.querySelector('[data-fallback="symbol"]');
                if (symbolElement) {
                  symbolElement.style.display = 'block';
                }
              }}
            />
            <PieceSymbol data-fallback="symbol" style={{ display: 'none', fontSize: '2.2rem' }}>
              {symbol}
            </PieceSymbol>
          </div>
          <PieceRank>{piece.rank || "-"}</PieceRank>
        </PieceContainer>
      );
    }
    
    // Show army icon for hidden opponent pieces (including at game end)
    if (!isPlayerPiece && !piece.revealed && opponentArmy && (piece.type === 'hidden' || gamePhase === 'finished')) {
      console.log('🎭 Rendering army icon for opponent piece:', { 
        piece, 
        opponentArmy, 
        isPlayerPiece, 
        revealed: piece.revealed,
        gamePhase,
        type: piece.type
      });
      const armyIconPath = `/data/armies/${opponentArmy}/${opponentArmy}.png`;
      
      return (
        <PieceContainer 
          color={color} 
          isDraggable={isDraggable}
          draggable={isDraggable}
          onDragStart={isDraggable ? onDragStart : undefined}
          onDragEnd={isDraggable ? onDragEnd : undefined}
        >
          <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <PieceImage 
              src={armyIconPath} 
              alt={`${opponentArmy} army piece`}
              onError={(e) => {
                // Fallback to symbol if army icon fails to load
                console.log(`Failed to load army icon: ${armyIconPath}`);
                e.target.style.display = 'none';
                const symbolElement = e.target.parentNode.querySelector('[data-fallback="symbol"]');
                if (symbolElement) {
                  symbolElement.style.display = 'block';
                }
              }}
            />
            <PieceSymbol data-fallback="symbol" style={{ display: 'none', fontSize: '2.2rem' }}>
              {symbol}
            </PieceSymbol>
          </div>
        </PieceContainer>
      );
    }
    
    // Show symbol for revealed pieces or when no army data
    return (
      <PieceContainer 
        color={color} 
        isDraggable={isDraggable}
        draggable={isDraggable}
        onDragStart={isDraggable ? onDragStart : undefined}
        onDragEnd={isDraggable ? onDragEnd : undefined}
      >
        <PieceSymbol>{symbol}</PieceSymbol>
        {(piece.revealed || piece.side === playerSide) && (
          <PieceRank>{piece.rank || "-"}</PieceRank>
        )}
      </PieceContainer>
    );
  };

  return (
    <Square
      clickable={clickable}
      terrainType={terrainType}
      isSelected={isSelected}
      isValidMove={isValidMove}
      isSetupArea={isSetupArea}
      isDragTarget={isDragTarget}
      onClick={clickable ? onClick : undefined}
      onDragOver={onDragOver}
      onDrop={onDrop}
      title={isWater ? 'Water' : piece ? `${piece.name} (${piece.side})` : `${terrainType} terrain (${x}, ${y})`}
    >
      {renderPiece()}
    </Square>
  );
}

export default GameSquare;