import React from 'react';
import styled from 'styled-components';
import { PIECES } from '../../utils/gameLogic';

const SelectorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
`;

const PieceButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'selected'
})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: ${props => props.selected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255, 255, 255, 0.05)'};
  border: 1px solid ${props => props.selected ? '#22c55e' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 5px;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const PieceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const PieceSymbol = styled.span`
  font-size: 1.2rem;
  width: 20px;
  text-align: center;
`;

const PieceName = styled.span`
  font-weight: 500;
`;

const PieceRank = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const PieceCount = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: 600;
`;

function PieceSelector({ pieces, selectedType, onSelectType, armyData }) {
  // Use army data pieces if available, otherwise fallback to default PIECES
  const availablePieces = armyData?.pieces || PIECES;
  
  const getPieceCount = (type) => {
    const pieceInfo = availablePieces[type];
    if (!pieceInfo) {
      console.warn(`Missing piece info for getPieceCount: ${type}`);
      return { placed: 0, total: 0, remaining: 0 };
    }
    const totalCount = pieceInfo.count;
    const placedCount = pieces.filter(p => p.type === type && p.position).length;
    return { placed: placedCount, total: totalCount, remaining: totalCount - placedCount };
  };

  const pieceTypes = Object.keys(availablePieces);

  return (
    <SelectorContainer>
      {pieceTypes.map(type => {
        const pieceInfo = availablePieces[type];
        const counts = getPieceCount(type);
        const isSelected = selectedType === type;
        const canSelect = counts.remaining > 0;

        // Safety check to ensure pieceInfo exists
        if (!pieceInfo) {
          console.warn(`Missing piece info for type: ${type}`);
          return null;
        }

        return (
          <PieceButton
            key={type}
            selected={isSelected}
            disabled={!canSelect}
            onClick={() => canSelect ? onSelectType(isSelected ? null : type) : null}
            title={(pieceInfo.description || 'No description') + (pieceInfo.special ? ` - ${pieceInfo.special}` : '')}
          >
            <PieceInfo>
              <PieceSymbol>{pieceInfo.symbol || '?'}</PieceSymbol>
              <PieceName>{pieceInfo.name || type}</PieceName>
              {pieceInfo.rank && <PieceRank>#{pieceInfo.rank}</PieceRank>}
            </PieceInfo>
            <PieceCount>
              {counts.placed}/{counts.total}
            </PieceCount>
          </PieceButton>
        );
      })}
    </SelectorContainer>
  );
}

export default PieceSelector;