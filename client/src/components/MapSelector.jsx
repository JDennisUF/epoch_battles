import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';
import MapPreview from './MapPreview';

const MapSelectorContainer = styled.div`
  margin-bottom: 20px;
  position: relative;
`;

const SelectorTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.1rem;
  color: #ffffff;
`;

const MapGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 10px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MapOption = styled.div`
  background: ${props => props.selected ? 'rgba(102, 126, 234, 0.3)' : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.selected ? 'rgba(102, 126, 234, 0.8)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: ${props => props.selected ? 'rgba(102, 126, 234, 0.4)' : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.selected ? 'rgba(102, 126, 234, 1)' : 'rgba(255, 255, 255, 0.3)'};
    transform: translateY(-2px);
  }
`;

const MapName = styled.div`
  font-weight: 600;
  font-size: 1rem;
  margin-bottom: 8px;
  color: #ffffff;
`;

const MapDescription = styled.div`
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 10px;
  line-height: 1.4;
`;

const MapDetails = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
  gap: 8px;
`;

const MapSize = styled.span`
  background: rgba(255, 255, 255, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
`;

const MapTheme = styled.span`
  background: rgba(102, 126, 234, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  color: rgba(102, 126, 234, 1);
`;

const MapDifficulty = styled.span`
  background: ${props => {
    switch(props.difficulty) {
      case 'easy': return 'rgba(34, 197, 94, 0.2)';
      case 'medium': return 'rgba(245, 158, 11, 0.2)';
      case 'hard': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  color: ${props => {
    switch(props.difficulty) {
      case 'easy': return '#22c55e';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#9ca3af';
    }
  }};
  padding: 4px 8px;
  border-radius: 4px;
  text-transform: capitalize;
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
  const [hoveredMap, setHoveredMap] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

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
          'islands.json', 
          'fortress.json', 
          'valley.json', 
          'crossroads.json', 
          'labyrinth.json', 
          'arctic.json'
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

  const handleMouseEnter = (map, event) => {
    if (disabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
    setHoveredMap(map);
  };

  const handleMouseMove = (event) => {
    if (!hoveredMap || disabled) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      setMousePosition({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredMap(null);
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
    <MapSelectorContainer 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <SelectorTitle>Select Map</SelectorTitle>
      <MapGrid>
        {maps.map((map) => (
          <MapOption
            key={map.id}
            selected={selectedMap?.id === map.id}
            onClick={() => !disabled && onMapSelect(map)}
            onMouseEnter={(e) => handleMouseEnter(map, e)}
            style={{ opacity: disabled ? 0.6 : 1, cursor: disabled ? 'not-allowed' : 'pointer' }}
          >
            <MapName>{map.name}</MapName>
            <MapDescription>{map.description}</MapDescription>
            <MapDetails>
              <MapSize>
                {map.boardSize?.width || 10}×{map.boardSize?.height || 10}
              </MapSize>
              <MapTheme>{map.theme || 'classic'}</MapTheme>
              <MapDifficulty difficulty={map.difficulty}>
                {map.difficulty || 'standard'}
              </MapDifficulty>
            </MapDetails>
          </MapOption>
        ))}
      </MapGrid>
      
      {hoveredMap && (
        <MapPreview 
          map={hoveredMap} 
          position={mousePosition}
        />
      )}
    </MapSelectorContainer>
  );
}

export default MapSelector;