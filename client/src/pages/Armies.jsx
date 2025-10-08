import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import UnitViewer from '../components/GameBoard/UnitViewer';

const ArmiesContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 140px);
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 40px;
`;

const PageTitle = styled.h1`
  font-size: 3rem;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #4ade80, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`;

const PageDescription = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.8);
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const ArmyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const ArmyCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 25px;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.4);
    border-color: #4ade80;
    background: linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transition: left 0.5s ease;
  }

  &:hover::before {
    left: 100%;
  }
`;

const ArmyHeader = styled.div`
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const ArmyName = styled.h2`
  font-size: 1.6rem;
  margin-bottom: 8px;
  color: #4ade80;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const ArmyDescription = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
  line-height: 1.5;
  margin-bottom: 20px;
`;

const UnitsPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
`;

const UnitPreview = styled.div`
  position: relative;
  aspect-ratio: 1;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    border-color: #4ade80;
    transform: scale(1.05);
  }
`;

const UnitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const UnitCount = styled.div`
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(0, 0, 0, 0.8);
  color: #4ade80;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  border: 1px solid #4ade80;
`;

const UnitEmoji = styled.div`
  font-size: 1.8rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const ViewButton = styled.button`
  width: 100%;
  background: linear-gradient(135deg, #8b7355 0%, #6b5b3c 100%);
  border: 2px solid #5a4a3a;
  color: #f1f3f4;
  padding: 15px 20px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  z-index: 1;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  
  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #a0845a 0%, #7d6843 100%);
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(139, 115, 85, 0.4);
  }
  
  &:active {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
  }
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 60px;
  font-size: 1.4rem;
  color: rgba(255, 255, 255, 0.7);
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 60px;
  font-size: 1.4rem;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(239, 68, 68, 0.3);
`;

// Army configurations - same as in ArmySelector
const ARMIES = [
  {
    id: 'fantasy',
    name: 'Fantasy Realm',
    description: 'Dragons, wizards, and magical creatures dominate this mystical battlefield',
    theme: 'fantasy'
  },
  {
    id: 'medieval',
    name: 'Medieval Kingdom',
    description: 'Knights, kings, and castle warfare in the age of chivalry',
    theme: 'medieval'
  },
  {
    id: 'sci_fi',
    name: 'Sci-Fi Empire',
    description: 'AI overlords, mechs, and futuristic technology from distant worlds',
    theme: 'sci-fi'
  },
  {
    id: 'post_apocalyptic',
    name: 'Post-Apocalyptic',
    description: 'Wasteland survivors and jury-rigged vehicles in a broken world',
    theme: 'post-apocalyptic'
  },
  {
    id: 'undead_legion',
    name: 'Undead Legion',
    description: 'Lich kings, vampires, and creatures of the night rise from darkness',
    theme: 'undead'
  },
  {
    id: 'roman_legion',
    name: 'Roman Legion',
    description: 'Caesars, centurions, and the disciplined might of Rome',
    theme: 'roman'
  },
  {
    id: 'tribal',
    name: 'Tribal Warriors',
    description: 'Shamans, totems, and ancient tribal power connected to nature',
    theme: 'tribal'
  },
  {
    id: 'alien_hive',
    name: 'Alien Hive',
    description: 'Hive queens, bio-forms, and extraterrestrial swarms from beyond',
    theme: 'alien'
  },
  {
    id: 'ancient_egypt',
    name: 'Ancient Egypt',
    description: 'Pharaohs, priests, and the eternal mysteries of the pyramids',
    theme: 'ancient'
  },
  {
    id: 'shogun_dynasty',
    name: 'Shogun Dynasty',
    description: 'Samurai, ninja, and the unbreakable honor of feudal Japan',
    theme: 'samurai'
  },
  {
    id: 'ww1',
    name: 'Great War',
    description: 'Trenches, gas masks, and the first brutal mechanized warfare',
    theme: 'ww1'
  },
  {
    id: 'ww2',
    name: 'World War II',
    description: 'Commanders, tanks, and the global fight for freedom',
    theme: 'ww2'
  }
];

function Armies() {
  const [armyData, setArmyData] = useState({});
  const [loading, setLoading] = useState(true);
  const [showUnitViewer, setShowUnitViewer] = useState(false);
  const [viewingArmy, setViewingArmy] = useState(null);

  useEffect(() => {
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

  const handleViewArmy = (armyId, armyName) => {
    console.log('View army clicked for:', armyId);
    setViewingArmy({ id: armyId, name: armyName });
    setShowUnitViewer(true);
  };

  const handleCloseUnitViewer = () => {
    setShowUnitViewer(false);
    setViewingArmy(null);
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

    // Get any additional interesting units to fill out preview
    const previewUnits = [highestRank, flag, bomb, scout].filter(Boolean);
    
    // If we don't have 4 units yet, add more high-value or interesting units
    if (previewUnits.length < 4) {
      const additionalUnits = units
        .filter(u => !previewUnits.includes(u))
        .filter(u => u.rank && u.rank <= 5) // High-ranking units
        .sort((a, b) => a.rank - b.rank); // Sort by rank
      
      previewUnits.push(...additionalUnits.slice(0, 4 - previewUnits.length));
    }

    return previewUnits.slice(0, 4);
  };

  const getImagePath = (armyId, unitId) => {
    // Use 128x128 images for the preview
    return `/data/armies/${armyId}/128x128/${unitId}.png`;
  };

  if (loading) {
    return (
      <ArmiesContainer>
        <PageHeader>
          <PageTitle>Battle Armies</PageTitle>
          <PageDescription>
            Explore the diverse armies available for battle
          </PageDescription>
        </PageHeader>
        <LoadingMessage>Loading armies...</LoadingMessage>
      </ArmiesContainer>
    );
  }

  return (
    <ArmiesContainer>
      <PageHeader>
        <PageTitle>Battle Armies</PageTitle>
        <PageDescription>
          Discover the unique units, abilities, and strategies of each army. 
          Click on any army to explore its full roster of warriors, commanders, and special units.
        </PageDescription>
      </PageHeader>
      
      <ArmyGrid>
        {ARMIES.map(army => {
          const previewUnits = getPreviewUnits(army.id);
          const hasData = armyData[army.id];
          
          return (
            <ArmyCard key={army.id}>
              <ArmyHeader>
                <ArmyName>{army.name}</ArmyName>
                <ArmyDescription>{army.description}</ArmyDescription>
              </ArmyHeader>
              
              {hasData && (
                <UnitsPreview>
                  {previewUnits.map((unit, index) => (
                    <UnitPreview key={unit.id || index}>
                      <UnitImage 
                        src={getImagePath(army.id, unit.id)}
                        alt={unit.name}
                        onError={(e) => {
                          // Fallback to emoji if image fails to load
                          e.target.style.display = 'none';
                          e.target.parentNode.innerHTML = `<div style="font-size: 1.8rem; filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));">${unit.symbol || '⚔️'}</div>`;
                        }}
                      />
                      {unit.count > 1 && <UnitCount>{unit.count}</UnitCount>}
                    </UnitPreview>
                  ))}
                </UnitsPreview>
              )}
              
              <ViewButton 
                onClick={() => handleViewArmy(army.id, army.name)}
                disabled={!hasData}
              >
                {hasData ? 'View All Units' : 'Loading...'}
              </ViewButton>
            </ArmyCard>
          );
        })}
      </ArmyGrid>

      {showUnitViewer && viewingArmy && (
        <UnitViewer
          armyId={viewingArmy.id}
          armyName={viewingArmy.name}
          onClose={handleCloseUnitViewer}
        />
      )}
    </ArmiesContainer>
  );
}

export default Armies;