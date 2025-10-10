import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const ViewerContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  backdrop-filter: blur(8px);
`;

const ViewerModal = styled.div`
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  border-radius: 20px;
  padding: 30px;
  max-width: 1600px;
  max-height: 95vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
  width: 90vw;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-bottom: 2px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 20px;
`;

const Title = styled.h2`
  font-size: 2rem;
  background: linear-gradient(45deg, #4ade80, #22d3ee);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
`;

const CloseButton = styled.button`
  background: linear-gradient(45deg, #ef4444, #dc2626);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
  }
`;

const UnitsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const UnitCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    border-color: #4ade80;
  }
`;

const UnitHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 15px;
`;

const UnitImageContainer = styled.div`
  position: relative;
  width: 128px;
  height: 128px;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const UnitImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AbilityIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['position'].includes(prop)
})`
  position: absolute;
  ${props => props.position === 'topLeft' ? 'top: 4px; left: 4px;' : ''}
  ${props => props.position === 'topRight' ? 'top: 4px; right: 4px;' : ''}
  ${props => props.position === 'bottomLeft' ? 'bottom: 4px; left: 4px;' : ''}
  ${props => props.position === 'bottomRight' ? 'bottom: 4px; right: 4px;' : ''}
  background: transparent;
  z-index: 3;
  line-height: 1;
`;

const AbilityIconSmall = styled.img`
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;


const UnitInfo = styled.div`
  flex: 1;
`;

const UnitName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.4rem;
  color: #4ade80;
`;

const UnitDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 10px;
  margin-bottom: 10px;
`;

const UnitDetail = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const DetailLabel = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const DetailValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
  color: #22d3ee;
`;

const UnitDescription = styled.p`
  margin: 15px 0;
  line-height: 1.5;
  opacity: 0.9;
  font-size: 0.95rem;
`;

const AbilitiesSection = styled.div`
  margin-top: 15px;
`;

const AbilitiesTitle = styled.h4`
  margin: 0 0 10px 0;
  font-size: 1rem;
  color: #fbbf24;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const AbilitiesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
`;

const AbilityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.05);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AbilityIconLarge = styled.img`
  width: 48px;
  height: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
`;

const AbilityInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const AbilityName = styled.span`
  font-weight: 600;
  color: #4ade80;
  font-size: 0.9rem;
`;

const AbilityDescription = styled.span`
  font-size: 0.8rem;
  opacity: 0.8;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  opacity: 0.7;
`;

const ErrorMessage = styled.div`
  text-align: center;
  padding: 40px;
  font-size: 1.2rem;
  color: #ef4444;
`;

function UnitViewer({ armyId, armyName, onClose }) {
  const [armyData, setArmyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadArmyData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/data/armies/${armyId}/${armyId}.json`);
        if (!response.ok) {
          throw new Error(`Failed to load army data: ${response.statusText}`);
        }
        
        const data = await response.json();
        setArmyData(data);
      } catch (err) {
        console.error('Error loading army data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (armyId) {
      loadArmyData();
    }
  }, [armyId]);

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

  // Helper function to render ability indicators on unit image
  const renderAbilityIndicators = (unitData) => {
    const indicators = [];
    
    if (hasAbility(unitData, 'flying')) {
      indicators.push(
        <AbilityIndicator 
          key="flying" 
          position="topLeft"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/flying_48.png"
            alt="Flying"
            title="Flying: Can move over water terrain"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'mobile')) {
      indicators.push(
        <AbilityIndicator 
          key="mobile" 
          position="bottomRight"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/mobile_48.png"
            alt="Mobile"
            title="Mobile: Can move multiple spaces"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'charge')) {
      indicators.push(
        <AbilityIndicator 
          key="charge" 
          position="topRight"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/charge_48.png"
            alt="Charge"
            title="Charge: Can attack units 2 squares away"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'sniper')) {
      indicators.push(
        <AbilityIndicator 
          key="sniper" 
          position="topRight"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/sniper_48.png"
            alt="Sniper"
            title="Sniper: Can attack units 2 squares away, shoots over water"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'fear')) {
      indicators.push(
        <AbilityIndicator 
          key="fear" 
          position="topLeft"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/fear_48.png"
            alt="Fear"
            title="Fear: Adjacent enemies lose 1 rank in combat"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'curse')) {
      indicators.push(
        <AbilityIndicator 
          key="curse" 
          position="bottomLeft"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/curse_48.png"
            alt="Curse"
            title="Curse: Units that defeat this unit are permanently weakened"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'veteran')) {
      indicators.push(
        <AbilityIndicator 
          key="veteran" 
          position="topRight"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/veteran_48.png"
            alt="Veteran"
            title="Veteran: Gets stronger when defeating enemies"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'trap_sense')) {
      indicators.push(
        <AbilityIndicator 
          key="trap_sense" 
          position="bottomLeft"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/trap_sense_48.png"
            alt="Trap Sense"
            title="Trap Sense: Can detect and avoid traps"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'assassin')) {
      indicators.push(
        <AbilityIndicator 
          key="assassin" 
          position="bottomLeft"
        >
          <AbilityIconSmall 
            src="/data/icons/abilities/assassin_48.png"
            alt="Assassin"
            title="Assassin: Can eliminate high-ranking targets"
          />
        </AbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'recon')) {
      const reconAbility = unitData.abilities.find(ability => 
        (typeof ability === 'object' && ability.id === 'recon') || ability === 'recon'
      );
      const tokens = (typeof reconAbility === 'object') ? 
        (reconAbility.remainingTokens !== undefined ? reconAbility.remainingTokens : reconAbility.tokens) || 1 : 1;
      
      if (tokens > 0) {
        indicators.push(
          <AbilityIndicator 
            key="recon" 
            position="topRight"
          >
            <AbilityIconSmall 
              src="/data/icons/abilities/recon_48.png"
              alt="Recon"
              title={`Recon: Can reveal ${tokens} enemy units per game`}
            />
          </AbilityIndicator>
        );
      }
    }
    
    return indicators;
  };

  const getAbilityInfo = (ability) => {
    const abilityId = typeof ability === 'string' ? ability : ability.id;
    
    switch (abilityId) {
      case 'flying':
        return { 
          name: 'Flying', 
          description: 'Can move over water terrain',
          icon: '/data/icons/abilities/flying_48.png'
        };
      case 'mobile':
        // Check if ability has custom spaces parameter
        const spaces = (typeof ability === 'object' && ability.spaces) ? ability.spaces : 2; // Default to 2 if not specified
        return { 
          name: 'Mobile', 
          description: `Can move ${spaces} spaces`,
          icon: '/data/icons/abilities/mobile_48.png'
        };
      case 'charge':
        return { 
          name: 'Charge', 
          description: 'Can attack units 2 squares away',
          icon: '/data/icons/abilities/charge_48.png'
        };
      case 'sniper':
        return { 
          name: 'Sniper', 
          description: 'Can attack units 2 squares away, shoots over water',
          icon: '/data/icons/abilities/sniper_48.png'
        };
      case 'fear':
        return { 
          name: 'Fear', 
          description: 'Adjacent enemies lose 1 rank in combat',
          icon: '/data/icons/abilities/fear_48.png'
        };
      case 'curse':
        return { 
          name: 'Curse', 
          description: 'Units that defeat this unit are permanently weakened',
          icon: '/data/icons/abilities/curse_48.png'
        };
      case 'veteran':
        return { 
          name: 'Veteran', 
          description: 'Gets stronger when defeating enemies',
          icon: '/data/icons/abilities/veteran_48.png'
        };
      case 'trap_sense':
        return { 
          name: 'Trap Sense', 
          description: 'Can detect and avoid traps',
          icon: '/data/icons/abilities/trap_sense_48.png'
        };
      case 'assassin':
        return { 
          name: 'Assassin', 
          description: 'Can eliminate high-ranking targets',
          icon: '/data/icons/abilities/assassin_48.png'
        };
      case 'recon':
        // Check if ability has custom tokens parameter (prefer remaining tokens if available)
        const tokens = (typeof ability === 'object') ? 
          (ability.remainingTokens !== undefined ? ability.remainingTokens : ability.tokens) || 1 : 1;
        return { 
          name: 'Recon', 
          description: `Can reveal ${tokens} enemy units per game`,
          icon: '/data/icons/abilities/recon_48.png'
        };
      default:
        return { 
          name: abilityId, 
          description: 'Special ability',
          icon: `/data/icons/abilities/${abilityId}_48.png`
        };
    }
  };

  const getMovementSpaces = (unitData) => {
    if (!unitData.moveable) {
      return '-';
    }
    
    // Check if unit has Mobile ability
    if (unitData.abilities) {
      const mobileAbility = unitData.abilities.find(ability => {
        const abilityId = typeof ability === 'string' ? ability : ability.id;
        return abilityId === 'mobile';
      });
      
      if (mobileAbility) {
        // Return custom spaces if specified, otherwise default Mobile movement
        return (typeof mobileAbility === 'object' && mobileAbility.spaces) ? mobileAbility.spaces : 2;
      }
    }
    
    // Default movement for moveable units
    return 1;
  };

  const renderUnit = (unitId, unitData) => {
    const imagePath = `/data/armies/${armyId}/128x128/${unitId}.png`;
    
    return (
      <UnitCard key={unitId}>
        <UnitHeader>
          <UnitImageContainer>
            <UnitImage 
              src={imagePath}
              alt={unitData.name || unitId}
            />
            {renderAbilityIndicators(unitData)}
          </UnitImageContainer>
          
          <UnitInfo>
            <UnitName>{unitData.name || unitId}</UnitName>
            <UnitDetails>
              <UnitDetail>
                <DetailLabel>Rank</DetailLabel>
                <DetailValue>{unitData.rank || 'N/A'}</DetailValue>
              </UnitDetail>
              <UnitDetail>
                <DetailLabel>Class</DetailLabel>
                <DetailValue>{unitData.class || 'Unit'}</DetailValue>
              </UnitDetail>
              <UnitDetail>
                <DetailLabel>Movement</DetailLabel>
                <DetailValue>{getMovementSpaces(unitData)}</DetailValue>
              </UnitDetail>
            </UnitDetails>
          </UnitInfo>
        </UnitHeader>
        
        {unitData.description && (
          <UnitDescription>{unitData.description}</UnitDescription>
        )}
        
        {unitData.special && (
          <UnitDescription><strong>Special:</strong> {unitData.special}</UnitDescription>
        )}
        
        {unitData.abilities && unitData.abilities.length > 0 && (
          <AbilitiesSection>
            <AbilitiesTitle>
              ⚡ Abilities
            </AbilitiesTitle>
            <AbilitiesList>
              {unitData.abilities.map((ability, index) => {
                const abilityInfo = getAbilityInfo(ability);
                return (
                  <AbilityItem key={index}>
                    <AbilityIconLarge 
                      src={abilityInfo.icon}
                      alt={abilityInfo.name}
                    />
                    <AbilityInfo>
                      <AbilityName>{abilityInfo.name}</AbilityName>
                      <AbilityDescription>{abilityInfo.description}</AbilityDescription>
                    </AbilityInfo>
                  </AbilityItem>
                );
              })}
            </AbilitiesList>
          </AbilitiesSection>
        )}
      </UnitCard>
    );
  };

  return (
    <ViewerContainer onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ViewerModal>
        <Header>
          <Title>{armyName} Units</Title>
          <CloseButton onClick={onClose}>Close</CloseButton>
        </Header>
        
        {loading && <LoadingMessage>Loading army units...</LoadingMessage>}
        
        {error && <ErrorMessage>Error: {error}</ErrorMessage>}
        
        {armyData && armyData.pieces && (
          <UnitsGrid>
            {Object.entries(armyData.pieces).map(([unitId, unitData]) => 
              renderUnit(unitId, unitData)
            )}
          </UnitsGrid>
        )}
      </ViewerModal>
    </ViewerContainer>
  );
}

export default UnitViewer;