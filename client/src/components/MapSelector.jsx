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

const MapSelectorContent = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const MapListContainer = styled.div`
  flex: 1;
  min-width: 250px;
`;

const MapList = styled.div`
  max-height: 420px;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.2);
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
`;

const MapOption = styled.div`
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.3)' : 'transparent'};
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding: 12px 15px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: ${props => props.selected ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.05)'};
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const MapName = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  margin-bottom: 4px;
  color: ${props => props.selected ? '#ffffff' : '#e5e7eb'};
`;

const MapMeta = styled.div`
  display: flex;
  gap: 8px;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
`;

const MetaTag = styled.span`
  background: ${props => {
    if (props.type === 'size') return 'rgba(255, 255, 255, 0.1)';
    if (props.type === 'theme') return 'rgba(102, 126, 234, 0.2)';
    if (props.type === 'difficulty-easy') return 'rgba(34, 197, 94, 0.4)';
    if (props.type === 'difficulty-medium') return 'rgba(245, 158, 11, 0.4)';
    if (props.type === 'difficulty-hard') return 'rgba(239, 68, 68, 0.4)';
    return 'rgba(156, 163, 175, 0.2)';
  }};
  color: ${props => {
    if (props.type === 'theme') return 'rgba(102, 126, 234, 1)';
    if (props.type === 'difficulty-easy') return '#ffffff';
    if (props.type === 'difficulty-medium') return '#ffffff';
    if (props.type === 'difficulty-hard') return '#ffffff';
    return 'rgba(255, 255, 255, 0.8)';
  }};
  padding: 2px 6px;
  border-radius: 3px;
  text-transform: capitalize;
  font-weight: ${props => props.type.startsWith('difficulty-') ? '600' : 'normal'};
`;

const MapPreviewContainer = styled.div`
  flex: 0 0 280px;
  
  @media (max-width: 768px) {
    flex: none;
  }
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

const MiniMapSquare = styled.div`
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
  const mapListRef = useRef(null);
  const mapOptionRefs = useRef({});
  const userHasInteracted = useRef(false);
  const lastSelectedMapId = useRef(null);

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

  // Scroll to selected map when it changes (only after user interaction)
  useEffect(() => {
    // Only auto-scroll if:
    // 1. User has interacted with the component
    // 2. The selected map actually changed
    // 3. We have the necessary refs
    if (
      userHasInteracted.current &&
      selectedMap && 
      selectedMap.id !== lastSelectedMapId.current &&
      mapOptionRefs.current[selectedMap.id] && 
      mapListRef.current
    ) {
      const selectedElement = mapOptionRefs.current[selectedMap.id];
      const container = mapListRef.current;
      
      // Small delay to ensure the selection state has updated
      setTimeout(() => {
        // Get the position of the selected element relative to the container
        const elementTop = selectedElement.offsetTop;
        const elementHeight = selectedElement.offsetHeight;
        const containerTop = container.scrollTop;
        const containerHeight = container.clientHeight;
        
        // Check if element is fully visible
        const isAboveViewport = elementTop < containerTop;
        const isBelowViewport = elementTop + elementHeight > containerTop + containerHeight;
        
        if (isAboveViewport || isBelowViewport) {
          // Scroll to center the selected element
          const scrollTo = elementTop - (containerHeight / 2) + (elementHeight / 2);
          container.scrollTo({
            top: Math.max(0, scrollTo),
            behavior: 'smooth'
          });
        }
      }, 50);
    }
    
    // Update the last selected map ID
    if (selectedMap) {
      lastSelectedMapId.current = selectedMap.id;
    }
  }, [selectedMap]);

  const handleMapSelect = (map) => {
    if (!disabled) {
      // Mark that user has interacted with the component
      userHasInteracted.current = true;
      onMapSelect(map);
    }
  };

  // Memoized terrain data calculation
  const terrainData = useMemo(() => {
    if (!selectedMap) return { squares: [], terrainTypes: [] };
    
    const squares = [];
    const terrainSet = new Set();
    
    // Calculate terrain for all squares once
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const terrain = getTerrainType(x, y, selectedMap);
        const isHomeSetup = selectedMap.setupRows?.home?.includes(y);
        const isAwaySetup = selectedMap.setupRows?.away?.includes(y);
        const isSetupArea = isHomeSetup || isAwaySetup;
        
        squares.push({
          key: `${x}-${y}`,
          terrain,
          isSetupArea
        });
        
        terrainSet.add(terrain);
      }
    }
    
    return {
      squares,
      terrainTypes: Array.from(terrainSet)
    };
  }, [selectedMap?.id]); // Only recalculate when map ID changes

  const renderMiniMap = () => {
    return terrainData.squares.map(square => (
      <MiniMapSquare
        key={square.key}
        terrain={square.terrain}
        isSetupArea={square.isSetupArea}
      />
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
      <MapSelectorContent>
        <MapListContainer>
          <MapList ref={mapListRef}>
            {maps.map((map) => (
              <MapOption
                key={map.id}
                ref={el => mapOptionRefs.current[map.id] = el}
                selected={selectedMap?.id === map.id}
                onClick={() => handleMapSelect(map)}
                style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
              >
                <MapName selected={selectedMap?.id === map.id}>{map.name}</MapName>
                <MapMeta>
                  <MetaTag type="size">
                    {map.boardSize?.width || 10}×{map.boardSize?.height || 10}
                  </MetaTag>
                  <MetaTag type={`difficulty-${map.difficulty || 'standard'}`}>
                    {map.difficulty || 'standard'}
                  </MetaTag>
                </MapMeta>
              </MapOption>
            ))}
          </MapList>
        </MapListContainer>
        
        <MapPreviewContainer>
          {selectedMap && (
            <PreviewCard>
              <PreviewTitle>{selectedMap.name}</PreviewTitle>
              <PreviewDescription>{selectedMap.description}</PreviewDescription>
              
              <MiniMapGrid>
                {renderMiniMap()}
              </MiniMapGrid>
              
              <PreviewDetails>
                <MetaTag type="size">
                  {selectedMap.boardSize?.width || 10}×{selectedMap.boardSize?.height || 10}
                </MetaTag>
                <MetaTag type={`difficulty-${selectedMap.difficulty || 'standard'}`}>
                  {selectedMap.difficulty || 'standard'}
                </MetaTag>
              </PreviewDetails>
              
              <PreviewLegend>
                {terrainData.terrainTypes.map(terrain => (
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
                ))}
              </PreviewLegend>
            </PreviewCard>
          )}
        </MapPreviewContainer>
      </MapSelectorContent>
    </MapSelectorContainer>
  );
}

export default MapSelector;