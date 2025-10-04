import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const SelectorContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const SelectorModal = styled.div`
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 1000px;
  max-height: 90vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
`;

const Title = styled.h2`
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  background: linear-gradient(45deg, #4ade80, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const ArmyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const ArmyCard = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'selected'
})`
  background: ${props => props.selected 
    ? 'linear-gradient(135deg, #4ade80 0%, #22d3ee 100%)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border: 2px solid ${props => props.selected 
    ? 'transparent' 
    : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 15px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  color: ${props => props.selected ? '#000' : '#fff'};

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    border-color: ${props => props.selected ? 'transparent' : '#4ade80'};
  }
`;

const ArmyName = styled.h3`
  margin-bottom: 10px;
  font-size: 1.3rem;
  text-align: center;
`;

const ArmyDescription = styled.p`
  margin-bottom: 20px;
  text-align: center;
  opacity: 0.8;
  font-size: 0.9rem;
`;

const UnitsPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 15px;
`;

const UnitPreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const UnitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const UnitCount = styled.div`
  position: absolute;
  top: 2px;
  right: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
`;

const UnitEmoji = styled.div`
  font-size: 1.2rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 30px;
`;

const ActionButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  padding: 15px 30px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CancelButton = styled(ActionButton)`
  background: linear-gradient(45deg, #ef4444, #dc2626);
`;

// Army configurations
const ARMIES = [
  {
    id: 'fantasy',
    name: 'Fantasy Realm',
    description: 'Dragons, wizards, and magical creatures',
    theme: 'fantasy'
  },
  {
    id: 'medieval',
    name: 'Medieval Kingdom',
    description: 'Knights, kings, and castle warfare',
    theme: 'medieval'
  },
  {
    id: 'sci_fi',
    name: 'Sci-Fi Empire',
    description: 'AI overlords, mechs, and futuristic technology',
    theme: 'sci-fi'
  },
  {
    id: 'post_apocalyptic',
    name: 'Post-Apocalyptic',
    description: 'Wasteland survivors and jury-rigged vehicles',
    theme: 'post-apocalyptic'
  },
  {
    id: 'undead_legion',
    name: 'Undead Legion',
    description: 'Lich kings, vampires, and creatures of the night',
    theme: 'undead'
  },
  {
    id: 'roman_legion',
    name: 'Roman Legion',
    description: 'Caesars, centurions, and the might of Rome',
    theme: 'roman'
  },
  {
    id: 'tribal',
    name: 'Tribal Warriors',
    description: 'Shamans, totems, and ancient tribal power',
    theme: 'tribal'
  },
  {
    id: 'alien_hive',
    name: 'Alien Hive',
    description: 'Hive queens, bio-forms, and extraterrestrial swarms',
    theme: 'alien'
  }
];

function ArmySelector({ onSelectArmy, onCancel, playerColor }) {
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [armyData, setArmyData] = useState({});
  const [loading, setLoading] = useState(true);
  
  // Debug: Track when component unmounts unexpectedly
  React.useEffect(() => {
    console.log('ArmySelector mounted');
    return () => {
      console.log('ArmySelector unmounted');
    };
  }, []);

  useEffect(() => {
    // Load army data
    const loadArmyData = async () => {
      const data = {};
      
      try {
        // Load all themed armies
        for (const army of ARMIES) {
          try {
            const url = `/data/armies/${army.id}/${army.id}.json`;
            console.log(`Loading ${army.id} army from:`, url);
            
            const response = await fetch(url);
            
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            data[army.id] = await response.json();
            console.log(`${army.id} army loaded successfully:`, data[army.id]);
          } catch (error) {
            console.error(`Failed to load ${army.id} army:`, error);
          }
        }
        
        setArmyData(data);
      } catch (error) {
        console.error('Failed to load army data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadArmyData();
  }, []);

  const handleArmySelect = (armyId) => {
    console.log('Army card clicked:', armyId);
    setSelectedArmy(armyId);
  };

  const handleConfirm = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Army selection confirmed:', {
      selectedArmy,
      hasArmyData: !!armyData[selectedArmy],
      armyData: armyData[selectedArmy]
    });
    
    if (selectedArmy && armyData[selectedArmy]) {
      console.log('Calling onSelectArmy with:', selectedArmy, armyData[selectedArmy]);
      onSelectArmy(selectedArmy, armyData[selectedArmy]);
    } else {
      console.error('Cannot confirm: no army selected or army data missing');
    }
  };

  const getPreviewUnits = (armyId) => {
    const army = armyData[armyId];
    if (!army) return [];

    // Get a representative sample of units for preview
    const units = Object.values(army.pieces || {});
    
    // Try to find key unit types with more flexible matching
    const highestRank = units.find(u => u.rank === 1);
    const flag = units.find(u => u.class === 'flag' || (!u.rank && (u.special?.includes('win') || u.special?.includes('captured'))));
    const bomb = units.find(u => u.class === 'bomb' || (!u.rank && (u.special?.includes('attacking') || u.special?.includes('Destroys'))));
    const scout = units.find(u => u.class === 'scout' || u.special?.includes('multiple spaces') || u.special?.includes('straight line'));
    const spy = units.find(u => u.class === 'spy' || u.rank === 10);

    // Get any additional interesting units to fill out preview
    const previewUnits = [highestRank, flag, bomb, scout, spy].filter(Boolean);
    
    // If we don't have 5 units yet, add more high-value or interesting units
    if (previewUnits.length < 5) {
      const additionalUnits = units
        .filter(u => !previewUnits.includes(u))
        .filter(u => u.rank && u.rank <= 5) // High-ranking units
        .sort((a, b) => a.rank - b.rank); // Sort by rank
      
      previewUnits.push(...additionalUnits.slice(0, 5 - previewUnits.length));
    }

    return previewUnits.slice(0, 5);
  };

  const getImagePath = (armyId, unitId) => {
    // Use 128x128 images for the preview
    return `/data/armies/${armyId}/128x128/${unitId}.png`;
  };

  if (loading) {
    return (
      <SelectorContainer>
        <SelectorModal>
          <Title>Loading Armies...</Title>
        </SelectorModal>
      </SelectorContainer>
    );
  }

  return (
    <SelectorContainer>
      <SelectorModal>
        <Title>Choose Your Army</Title>
        <p style={{ textAlign: 'center', marginBottom: '30px', opacity: 0.8 }}>
          Select an army theme for your {playerColor === 'home' ? 'Home' : 'Away'} forces
        </p>
        
        <ArmyGrid>
          {ARMIES.map(army => {
            const previewUnits = getPreviewUnits(army.id);
            
            return (
              <ArmyCard
                key={army.id}
                selected={selectedArmy === army.id}
                onClick={() => handleArmySelect(army.id)}
              >
                <ArmyName>{army.name}</ArmyName>
                <ArmyDescription>{army.description}</ArmyDescription>
                
                <UnitsPreview>
                  {previewUnits.map((unit, index) => (
                    <UnitPreview key={unit.id || index}>
                      <UnitImage 
                        src={getImagePath(army.id, unit.id)}
                        alt={unit.name}
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div style="font-size: 1.2rem;">${unit.symbol}</div>`;
                        }}
                      />
                      {unit.count > 1 && <UnitCount>{unit.count}</UnitCount>}
                    </UnitPreview>
                  ))}
                </UnitsPreview>
                
                {armyData[army.id] && (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', opacity: 0.7 }}>
                    {Object.keys(armyData[army.id].pieces || {}).length} unit types
                  </div>
                )}
              </ArmyCard>
            );
          })}
        </ArmyGrid>

        <ButtonContainer>
          <CancelButton type="button" onClick={onCancel}>
            Cancel
          </CancelButton>
          <ActionButton 
            type="button"
            onClick={handleConfirm}
            disabled={!selectedArmy}
          >
            Confirm Army Selection
          </ActionButton>
        </ButtonContainer>
      </SelectorModal>
    </SelectorContainer>
  );
}

export default ArmySelector;