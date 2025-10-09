import React, { useState, useEffect, useRef, useMemo } from 'react';
import styled from 'styled-components';
import { getTerrainType } from '../utils/gameLogic';

const MapSelectorContainer = styled.div`
  margin-bottom: 20px;
`;

const SelectorTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.1rem;
  color: #ffffff;
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MapCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid ${props => props.selected ? '#4ade80' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.selected ? '#4ade80' : 'rgba(255, 255, 255, 0.3)'};
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }
  
  ${props => props.disabled && `
    opacity: 0.6;
    cursor: not-allowed;
    &:hover {
      transform: none;
      box-shadow: none;
    }
  `}
`;

const CardTitle = styled.h4`
  margin: 0 0 10px 0;
  color: ${props => props.selected ? '#4ade80' : '#ffffff'};
  font-size: 1rem;
  text-align: center;
  font-weight: 600;
`;

const CardDescription = styled.p`
  margin: 0 0 15px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  line-height: 1.3;
  text-align: center;
`;

const CardDetails = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const MetaTag = styled.span`
  background: ${props => {
    if (props.type === 'size') return 'rgba(255, 255, 255, 0.1)';
    if (props.type === 'difficulty-easy') return 'rgba(34, 197, 94, 0.4)';
    if (props.type === 'difficulty-medium') return 'rgba(245, 158, 11, 0.4)';
    if (props.type === 'difficulty-hard') return 'rgba(239, 68, 68, 0.4)';
    return 'rgba(156, 163, 175, 0.2)';
  }};
  color: ${props => {
    if (props.type === 'difficulty-easy') return '#ffffff';
    if (props.type === 'difficulty-medium') return '#ffffff';
    if (props.type === 'difficulty-hard') return '#ffffff';
    return 'rgba(255, 255, 255, 0.8)';
  }};
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: capitalize;
  font-weight: ${props => props.type.startsWith('difficulty-') ? '600' : 'normal'};
  font-size: 0.75rem;
`;

const PreviewCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
`;

const PreviewTitle = styled.h4`
  margin: 0 0 10px 0;
  color: #4ade80;
  font-size: 1rem;
  text-align: center;
`;

const PreviewDescription = styled.p`
  margin: 0 0 15px 0;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.85rem;
  line-height: 1.3;
  text-align: center;
`;

const MiniMapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 1px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  padding: 6px;
  aspect-ratio: 1;
  margin-bottom: 12px;
`;

const MiniMapSquare = styled.div.withConfig({
  shouldForwardProp: (prop) => !['terrain', 'isSetupArea'].includes(prop)
})`
  aspect-ratio: 1;
  border-radius: 1px;
  background-color: ${props => {
    switch(props.terrain) {
      case 'water': return '#3b82f6';
      case 'dirt': return '#a3a3a3';
      case 'grassland': return '#22c55e';
      case 'mountain': return '#6b7280';
      case 'sand': return '#fbbf24';
      default: return '#22c55e';
    }
  }};
  opacity: ${props => props.isSetupArea ? 0.7 : 1};
  border: ${props => props.isSetupArea ? '1px solid rgba(255, 255, 255, 0.2)' : 'none'};
  
  ${props => props.isSetupArea && `
    position: relative;
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
        transparent 1px,
        rgba(255, 255, 255, 0.1) 1px,
        rgba(255, 255, 255, 0.1) 2px
      );
      border-radius: 1px;
    }
  `}
`;

const PreviewDetails = styled.div`
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-bottom: 10px;
`;

const PreviewLegend = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
  font-size: 0.7rem;
  flex-wrap: wrap;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  color: rgba(255, 255, 255, 0.7);
`;

const LegendColor = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 1px;
  background-color: ${props => props.color};
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 20px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

function MapSelector({ selectedMap, onMapSelect, disabled = false }) {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMaps = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch list of available maps
        const mapFiles = [
          'classic.json', 
          'highlands.json', 
          'canyon.json', 
          'fortress.json', 
          'valley.json', 
          'crossroads.json', 
          'labyrinth.json', 
          'arctic.json',
          'mountain_ridge.json',
          'central_peaks.json',
          'valley_defense.json',
          'highland_stronghold.json',
          'twin_peaks.json'
        ];
        const mapPromises = mapFiles.map(async (filename) => {
          try {
            const response = await fetch(`/data/maps/${filename}`);
            if (!response.ok) {
              throw new Error(`Failed to load ${filename}`);
            }
            const mapData = await response.json();
            return mapData;
          } catch (err) {
            console.warn(`Failed to load map ${filename}:`, err);
            return null;
          }
        });
        
        const mapResults = await Promise.all(mapPromises);
        const validMaps = mapResults.filter(map => map !== null);
        
        if (validMaps.length === 0) {
          throw new Error('No maps could be loaded');
        }
        
        setMaps(validMaps);
        
        // Auto-select the first map if none is selected
        if (!selectedMap && validMaps.length > 0) {
          onMapSelect(validMaps[0]);
        }
      } catch (err) {
        console.error('Error fetching maps:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMaps();
  }, [selectedMap, onMapSelect]);

  // Remove scroll effect since we're now using a grid

  const handleMapSelect = (map) => {
    if (!disabled) {
      onMapSelect(map);
    }
  };

  // Memoized terrain data for all maps
  const allMapTerrainData = useMemo(() => {
    const mapDataCache = {};
    
    maps.forEach(map => {
      const squares = [];
      const terrainSet = new Set();
      
      for (let y = 0; y < 10; y++) {
        for (let x = 0; x < 10; x++) {
          const terrain = getTerrainType(x, y, map);
          const isHomeSetup = map.setupRows?.home?.includes(y);
          const isAwaySetup = map.setupRows?.away?.includes(y);
          const isSetupArea = isHomeSetup || isAwaySetup;
          
          squares.push({
            key: `${x}-${y}`,
            terrain,
            isSetupArea
          });
          
          terrainSet.add(terrain);
        }
      }
      
      mapDataCache[map.id] = {
        squares,
        terrainTypes: Array.from(terrainSet)
      };
    });
    
    return mapDataCache;
  }, [maps]);

  const renderMiniMapForMap = (map) => {
    const terrainData = allMapTerrainData[map.id];
    if (!terrainData) return null;
    
    return terrainData.squares.map(square => (
      <MiniMapSquare
        key={square.key}
        terrain={square.terrain}
        isSetupArea={square.isSetupArea}
      />
    ));
  };

  const renderMapLegend = (map) => {
    const terrainData = allMapTerrainData[map.id];
    if (!terrainData) return null;
    
    return terrainData.terrainTypes.map(terrain => (
      <LegendItem key={terrain}>
        <LegendColor color={(() => {
          switch(terrain) {
            case 'water': return '#3b82f6';
            case 'dirt': return '#a3a3a3';
            case 'grassland': return '#22c55e';
            case 'mountain': return '#6b7280';
            case 'sand': return '#fbbf24';
            default: return '#22c55e';
          }
        })()} />
        <span>{terrain}</span>
      </LegendItem>
    ));
  };

  if (loading) {
    return (
      <MapSelectorContainer>
        <SelectorTitle>Select Map</SelectorTitle>
        <LoadingMessage>Loading available maps...</LoadingMessage>
      </MapSelectorContainer>
    );
  }

  if (error) {
    return (
      <MapSelectorContainer>
        <SelectorTitle>Select Map</SelectorTitle>
        <ErrorMessage>Error loading maps: {error}</ErrorMessage>
      </MapSelectorContainer>
    );
  }

  return (
    <MapSelectorContainer>
      <SelectorTitle>Select Map</SelectorTitle>
      <MapGrid>
        {maps.map((map) => (
          <MapCard
            key={map.id}
            selected={selectedMap?.id === map.id}
            disabled={disabled}
            onClick={() => handleMapSelect(map)}
          >
            <CardTitle selected={selectedMap?.id === map.id}>
              {map.name}
            </CardTitle>
            <CardDescription>
              {map.description}
            </CardDescription>
            
            <MiniMapGrid>
              {renderMiniMapForMap(map)}
            </MiniMapGrid>
            
            <CardDetails>
              <MetaTag type="size">
                {map.boardSize?.width || 10}×{map.boardSize?.height || 10}
              </MetaTag>
              <MetaTag type={`difficulty-${map.difficulty || 'standard'}`}>
                {map.difficulty || 'standard'}
              </MetaTag>
            </CardDetails>
            
            <PreviewLegend>
              {renderMapLegend(map)}
            </PreviewLegend>
          </MapCard>
        ))}
      </MapGrid>
    </MapSelectorContainer>
  );
}

export default MapSelector;