import React from 'react';
import styled from 'styled-components';
import { getTerrainType } from '../utils/gameLogic';

const PreviewContainer = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
  z-index: 1000;
  pointer-events: none;
  max-width: 400px;
  min-width: 300px;
`;

const PreviewTitle = styled.h3`
  margin: 0 0 15px 0;
  color: #4ade80;
  font-size: 1.2rem;
  text-align: center;
`;

const PreviewDescription = styled.p`
  margin: 0 0 15px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.9rem;
  line-height: 1.4;
  text-align: center;
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 1px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 8px;
  aspect-ratio: 1;
  margin-bottom: 15px;
`;

const MapSquare = styled.div`
  aspect-ratio: 1;
  border-radius: 2px;
  background-color: ${props => {
    switch(props.terrain) {
      case 'water': return '#3b82f6';
      case 'dirt': return '#a3a3a3';
      case 'grassland': return '#22c55e';
      default: return '#22c55e';
    }
  }};
  opacity: ${props => props.isSetupArea ? 0.7 : 1};
  border: ${props => props.isSetupArea ? '1px solid rgba(255, 255, 255, 0.3)' : 'none'};
  position: relative;
  
  ${props => props.isSetupArea && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        45deg,
        transparent,
        transparent 2px,
        rgba(255, 255, 255, 0.1) 2px,
        rgba(255, 255, 255, 0.1) 4px
      );
      border-radius: 2px;
    }
  `}
`;

const MapDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 8px;
`;

const DetailTag = styled.span`
  background: ${props => {
    switch(props.type) {
      case 'size': return 'rgba(255, 255, 255, 0.1)';
      case 'theme': return 'rgba(102, 126, 234, 0.2)';
      case 'difficulty-easy': return 'rgba(34, 197, 94, 0.2)';
      case 'difficulty-medium': return 'rgba(245, 158, 11, 0.2)';
      case 'difficulty-hard': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.type) {
      case 'theme': return 'rgba(102, 126, 234, 1)';
      case 'difficulty-easy': return '#22c55e';
      case 'difficulty-medium': return '#f59e0b';
      case 'difficulty-hard': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.8)';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: capitalize;
`;

const Legend = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 10px;
  font-size: 0.75rem;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  color: rgba(255, 255, 255, 0.7);
`;

const LegendColor = styled.div`
  width: 12px;
  height: 12px;
  border-radius: 2px;
  background-color: ${props => props.color};
`;

function MapPreview({ map, position }) {
  if (!map) return null;

  const renderMapGrid = () => {
    const squares = [];
    
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const terrain = getTerrainType(x, y, map);
        const isHomeSetup = map.setupRows?.home?.includes(y);
        const isAwaySetup = map.setupRows?.away?.includes(y);
        const isSetupArea = isHomeSetup || isAwaySetup;
        
        squares.push(
          <MapSquare
            key={`${x}-${y}`}
            terrain={terrain}
            isSetupArea={isSetupArea}
          />
        );
      }
    }
    
    return squares;
  };

  return (
    <PreviewContainer style={{ 
      left: position.x, 
      top: position.y,
      transform: 'translate(-50%, -100%)',
      marginTop: '-10px'
    }}>
      <PreviewTitle>{map.name}</PreviewTitle>
      <PreviewDescription>{map.description}</PreviewDescription>
      
      <MapGrid>
        {renderMapGrid()}
      </MapGrid>
      
      <MapDetails>
        <DetailTag type="size">
          {map.boardSize?.width || 10}×{map.boardSize?.height || 10}
        </DetailTag>
        <DetailTag type="theme">
          {map.theme || 'classic'}
        </DetailTag>
        <DetailTag type={`difficulty-${map.difficulty}`}>
          {map.difficulty || 'standard'}
        </DetailTag>
      </MapDetails>
      
      <Legend>
        <LegendItem>
          <LegendColor color="#22c55e" />
          <span>Grassland</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#a3a3a3" />
          <span>Dirt</span>
        </LegendItem>
        <LegendItem>
          <LegendColor color="#3b82f6" />
          <span>Water</span>
        </LegendItem>
      </Legend>
    </PreviewContainer>
  );
}

export default MapPreview;