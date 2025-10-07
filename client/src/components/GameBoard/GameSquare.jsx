import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { getPieceSymbol, getPieceColor, getTerrainType } from '../../utils/gameLogic';

// Helper function to check if piece has a specific ability
const hasAbility = (piece, abilityName) => {
  if (!piece?.abilities) return false;
  
  return piece.abilities.some(ability => {
    if (typeof ability === 'string') {
      return ability === abilityName;
    } else if (typeof ability === 'object') {
      return ability.id === abilityName;
    }
    return false;
  });
};

// Helper function to check if piece is a mine/bomb type
const isMineType = (piece) => {
  return piece?.class === 'bomb' || piece?.class === 'mine';
};

// Helper function to check if this mine should be detected by trap_sense
const isMineDetectedByTrapSense = (mineX, mineY, board, playerSide) => {
  const directions = [
    [0, -1],  // North
    [1, 0],   // East
    [0, 1],   // South
    [-1, 0]   // West
  ];
  
  for (const [dx, dy] of directions) {
    const adjacentX = mineX + dx;
    const adjacentY = mineY + dy;
    
    // Check bounds
    if (adjacentX >= 0 && adjacentX < board[0].length && 
        adjacentY >= 0 && adjacentY < board.length) {
      const adjacentPiece = board[adjacentY][adjacentX];
      
      // Check if adjacent piece is a friendly unit with trap_sense OR is a miner class
      const canDetectTraps = adjacentPiece && 
                            adjacentPiece.side === playerSide && 
                            (hasAbility(adjacentPiece, 'trap_sense') || adjacentPiece.class === 'miner');
      
      if (canDetectTraps) {
        console.log(`🔍 Trap detected at (${mineX},${mineY}) by ${adjacentPiece.type} at (${adjacentX},${adjacentY})`);
        return true;
      }
    }
  }
  
  return false;
};

// Helper function to check if a piece is adjacent to enemies with Fear
const getFearPenalty = (piece, x, y, board) => {
  if (!piece || !board) return 0;
  
  let fearPenalty = 0;
  const directions = [
    [0, -1],  // North
    [1, 0],   // East
    [0, 1],   // South
    [-1, 0]   // West
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
          hasAbility(adjacentPiece, 'fear')) {
        fearPenalty++;
      }
    }
  }
  
  return fearPenalty;
};

// Helper function to calculate rank display and color
const getRankDisplay = (piece, x, y, board) => {
  if (!piece.rank) return { rank: '', colorType: 'normal' };
  
  let currentRank = piece.rank;
  const originalRank = piece.originalRank || piece.rank;
  
  // Add fear modifier (temporary rank increase when adjacent to fear units)
  const fearPenalty = getFearPenalty(piece, x, y, board);
  currentRank += fearPenalty;
  
  // Determine color based on rank comparison
  let colorType = 'normal';
  if (currentRank < originalRank) {
    colorType = 'better'; // Lower rank number = stronger = green
  } else if (currentRank > originalRank) {
    colorType = 'worse'; // Higher rank number = weaker = red
  }
  
  return { 
    rank: currentRank.toString(), 
    colorType: colorType 
  };
};

// Helper function to render ability indicators
const renderAbilityIndicators = (piece) => {
  const indicators = [];
  
  if (hasAbility(piece, 'flying')) {
    indicators.push(
      <AbilityIndicator 
        key="flying" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/flying.png"
          alt="Flying"
          title="Flying: Can move over water terrain"
          onError={(e) => {
            // Fallback to emoji if PNG fails to load
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '🪽';
          }}
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'fleet')) {
    indicators.push(
      <AbilityIndicator 
        key="fleet" 
        position="bottomRight"
      >
        <AbilityIcon 
          src="/data/icons/abilities/fleet.png"
          alt="Fleet"
          title="Fleet: Can move multiple spaces"
          onError={(e) => {
            // Fallback to emoji if PNG fails to load
            e.target.style.display = 'none';
            e.target.parentNode.innerHTML = '⚡';
          }}
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'charge')) {
    indicators.push(
      <AbilityIndicator 
        key="charge" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/charge.png"
          alt="Charge"
          title="Charge: Can attack units 2 squares away"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'sniper')) {
    indicators.push(
      <AbilityIndicator 
        key="sniper" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/sniper.png"
          alt="Sniper"
          title="Sniper: Can attack units 2 squares away, shoots over water"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'fear')) {
    indicators.push(
      <AbilityIndicator 
        key="fear" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/fear.png"
          alt="Fear"
          title="Fear: Adjacent enemies lose 1 rank in combat"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'curse')) {
    indicators.push(
      <AbilityIndicator 
        key="curse" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/curse.png"
          alt="Curse"
          title="Curse: Units that defeat this unit are permanently weakened"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'veteran')) {
    indicators.push(
      <AbilityIndicator 
        key="veteran" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/veteran.png"
          alt="Veteran"
          title="Veteran: Gets stronger when defeating enemies"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'trap_sense')) {
    indicators.push(
      <AbilityIndicator 
        key="trap_sense" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/trap_sense.png"
          alt="Trap Sense"
          title="Trap Sense: Can detect and avoid traps"
        />
      </AbilityIndicator>
    );
  }
  
  if (hasAbility(piece, 'assassin')) {
    indicators.push(
      <AbilityIndicator 
        key="assassin" 
        position="topLeft"
      >
        <AbilityIcon 
          src="/data/icons/abilities/assassin.png"
          alt="Assassin"
          title="Assassin: Can eliminate high-ranking targets"
        />
      </AbilityIndicator>
    );
  }
  
  return indicators;
};

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
      case 'mountain': return 'url(/data/maps/terrain/mountain.png)';
      case 'sand': return 'url(/data/maps/terrain/sand.png)';
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
      case 'mountain': return '#6b7280';
      case 'sand': return '#fbbf24';
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

const DefensiveBonusIndicator = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  background: transparent;
  font-size: 0.8rem;
  z-index: 3;
  line-height: 1;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8), 0 0 6px rgba(0, 0, 0, 0.6);
`;

const AbilityIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['position'].includes(prop)
})`
  position: absolute;
  ${props => props.position === 'topLeft' ? 'top: 2px; left: 2px;' : ''}
  ${props => props.position === 'topRight' ? 'top: 2px; right: 26px;' : ''}
  ${props => props.position === 'bottomLeft' ? 'bottom: 2px; left: 2px;' : ''}
  ${props => props.position === 'bottomRight' ? 'bottom: 2px; right: 2px;' : ''}
  background: transparent;
  z-index: 3;
  line-height: 1;
`;

const AbilityIcon = styled.img`
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const PieceSymbol = styled.div`
  font-size: 2.2rem;
  line-height: 1;
`;

const PieceRank = styled.div.withConfig({
  shouldForwardProp: (prop) => !['colorType'].includes(prop)
})`
  position: absolute;
  bottom: 2px;
  left: 2px;
  font-size: 0.8rem;
  font-weight: 700;
  color: ${props => {
    switch (props.colorType) {
      case 'better': return '#22c55e'; // Green for better ranks (lower numbers)
      case 'worse': return '#ef4444';  // Red for worse ranks (higher numbers)
      default: return 'white';         // White for unchanged ranks
    }
  }};
  background: rgba(0, 0, 0, 0.7);
  padding: 1px 4px;
  border-radius: 3px;
  line-height: 1;
  z-index: 3;
`;

const PieceImage = styled.img`
  width: 84px;
  height: 84px;
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
  gameX,  // Game coordinates for terrain/logic calculations (new prop)
  gameY,  // Game coordinates for terrain/logic calculations (new prop)
  piece, 
  playerSide, 
  playerArmy,
  opponentArmy,
  gamePhase,
  mapData,
  board,
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
  const [opponentArmyName, setOpponentArmyName] = useState(null);

  // Load opponent army data to get the display name
  useEffect(() => {
    if (opponentArmy && !opponentArmyName) {
      const loadOpponentArmyName = async () => {
        try {
          const response = await fetch(`/data/armies/${opponentArmy}/${opponentArmy}.json`);
          if (response.ok) {
            const armyData = await response.json();
            setOpponentArmyName(armyData.name || opponentArmy);
          }
        } catch (error) {
          console.log(`Failed to load opponent army name for ${opponentArmy}:`, error);
          setOpponentArmyName(opponentArmy); // Fallback to ID
        }
      };
      loadOpponentArmyName();
    }
  }, [opponentArmy, opponentArmyName]);
  // Use game coordinates for terrain calculations, fall back to display coords if game coords not provided
  const terrainX = typeof gameX !== 'undefined' ? gameX : x;
  const terrainY = typeof gameY !== 'undefined' ? gameY : y;
  
  const terrainType = getTerrainType(terrainX, terrainY, mapData);
  const isWater = terrainType === 'water';
  const clickable = !isWater && (isSetupArea || isValidMove || (piece && piece.side === playerSide));
  
  // Get the actual piece from the board (not the display piece which might be hidden)
  const actualPiece = board?.[terrainY]?.[terrainX];
  
  // Debug: Log all pieces to see what we're working with
  if (actualPiece) {
    console.log(`🔍 Square at (${terrainX},${terrainY}):`, {
      type: actualPiece.type,
      class: actualPiece.class,
      side: actualPiece.side,
      revealed: actualPiece.revealed,
      playerSide: playerSide,
      isMine: isMineType(actualPiece),
      isEnemyMine: isMineType(actualPiece) && actualPiece.side !== playerSide
    });
  }
  
  // Check if this mine should be revealed and highlighted due to trap_sense detection
  const isTrapDetected = actualPiece && 
                         isMineType(actualPiece) && 
                         actualPiece.side !== playerSide && 
                         board && 
                         isMineDetectedByTrapSense(terrainX, terrainY, board, playerSide);

  // If trap is detected, reveal the mine
  if (isTrapDetected && actualPiece && !actualPiece.revealed) {
    actualPiece.revealed = true;
    console.log(`🔍 Hidden mine revealed by trap sense: ${actualPiece.type} at (${terrainX},${terrainY})`);
  }
  
  // Use actualPiece if it was revealed by trap sense, otherwise use the display piece
  const pieceToRender = (actualPiece && actualPiece.revealed && actualPiece.side !== playerSide) ? actualPiece : piece;
  
  const renderPiece = () => {
    
    if (!pieceToRender) return null;

    const symbol = getPieceSymbol(pieceToRender);
    const color = pieceToRender.side === playerSide ? '#4ade80' : '#ef4444';
    const isPlayerPiece = pieceToRender.side === playerSide;
    const isDraggable = gamePhase === 'setup' && isPlayerPiece && pieceToRender.position;
    
    // Show image for player's own pieces if we have army data
    if (isPlayerPiece && playerArmy && pieceToRender.type) {
      const imagePath = `/data/armies/${playerArmy}/64x64/${pieceToRender.type}.png`;
      
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
              alt={pieceToRender.name || pieceToRender.type}
            />
            {terrainType === 'mountain' && (
              <DefensiveBonusIndicator title="Mountain Defense: +1 rank when defending">
                🛡️
              </DefensiveBonusIndicator>
            )}
            {renderAbilityIndicators(pieceToRender)}
            {(pieceToRender.revealed || pieceToRender.side === playerSide) && pieceToRender.rank && (() => {
              const rankInfo = getRankDisplay(pieceToRender, terrainX, terrainY, board);
              return <PieceRank colorType={rankInfo.colorType}>{rankInfo.rank}</PieceRank>;
            })()}
          </div>
        </PieceContainer>
      );
    }
    
    // Show revealed opponent pieces with their actual unit image
    if (!isPlayerPiece && pieceToRender.revealed && opponentArmy && pieceToRender.type !== 'hidden') {
      const imagePath = `/data/armies/${opponentArmy}/64x64/${pieceToRender.type}.png`;
      
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
              alt={pieceToRender.name || pieceToRender.type}
            />
            {terrainType === 'mountain' && (
              <DefensiveBonusIndicator title="Mountain Defense: +1 rank when defending">
                🛡️
              </DefensiveBonusIndicator>
            )}
            {renderAbilityIndicators(pieceToRender)}
            {pieceToRender.rank && (() => {
              const rankInfo = getRankDisplay(pieceToRender, terrainX, terrainY, board);
              return <PieceRank colorType={rankInfo.colorType}>{rankInfo.rank}</PieceRank>;
            })()}
          </div>
        </PieceContainer>
      );
    }
    
    // Show army icon for hidden opponent pieces (including at game end)
    if (!isPlayerPiece && !piece.revealed && opponentArmy && (piece.type === 'hidden' || gamePhase === 'finished')) {
      // console.log('🎭 Rendering army icon for opponent piece:', { 
      //   piece, 
      //   opponentArmy, 
      //   isPlayerPiece, 
      //   revealed: piece.revealed,
      //   gamePhase,
      //   type: piece.type
      // });
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
            {terrainType === 'mountain' && (
              <DefensiveBonusIndicator title="Mountain Defense: +1 rank when defending">
                🛡️
              </DefensiveBonusIndicator>
            )}
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
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PieceSymbol>{symbol}</PieceSymbol>
          {terrainType === 'mountain' && (
            <DefensiveBonusIndicator title="Mountain Defense: +1 rank when defending">
              🛡️
            </DefensiveBonusIndicator>
          )}
          {renderAbilityIndicators(pieceToRender)}
          {(pieceToRender.revealed || pieceToRender.side === playerSide) && pieceToRender.rank && (() => {
            const rankInfo = getRankDisplay(pieceToRender, terrainX, terrainY, board);
            return <PieceRank colorType={rankInfo.colorType}>{rankInfo.rank}</PieceRank>;
          })()}
        </div>
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
      title={isWater ? 'Water' : pieceToRender ? 
        (pieceToRender.name ? `${pieceToRender.name} (${pieceToRender.side})` : 
         pieceToRender.side === playerSide ? `Your ${pieceToRender.type}` : 
         `${opponentArmyName || opponentArmy || 'Enemy'} army unit`) : 
        `${terrainType} terrain (${terrainX}, ${terrainY})`}
    >
      {renderPiece()}
    </Square>
  );
}

export default GameSquare;