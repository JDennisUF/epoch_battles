import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

const AbilitiesContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  min-height: calc(100vh - 140px);
`;

const PageHeader = styled.div`
  text-align: center;
  margin-bottom: 50px;
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
  max-width: 800px;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
`;

const AbilitiesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 30px;
  margin-bottom: 40px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const AbilityCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 20px;
  transition: all 0.3s ease;
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

const AbilityHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const AbilityIconContainer = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4ade80 0%, #22d3ee 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 25px rgba(74, 222, 128, 0.3);
  flex-shrink: 0;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 2px;
    background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
    border-radius: 10px;
    z-index: 1;
  }
`;

const AbilityIcon = styled.img`
  width: 48px;
  height: 48px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  position: relative;
  z-index: 2;
`;

const AbilityInfo = styled.div`
  flex: 1;
`;

const AbilityName = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 8px;
  color: #4ade80;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const AbilityType = styled.div`
  display: inline-block;
  background: rgba(34, 211, 238, 0.2);
  color: #22d3ee;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border: 1px solid rgba(34, 211, 238, 0.3);
`;

const AbilityDescription = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  position: relative;
  z-index: 1;
`;

const AbilityDetails = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
  z-index: 1;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const DetailLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.9rem;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #22d3ee;
  font-weight: 600;
  font-size: 0.9rem;
`;

const ExampleUnits = styled.div`
  margin-top: 15px;
`;

const ExampleTitle = styled.h4`
  color: #fbbf24;
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const UnitList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const UnitTag = styled.span`
  background: rgba(251, 191, 36, 0.1);
  color: #fbbf24;
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(251, 191, 36, 0.2);
`;

const RealUnitContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  background: rgba(74, 222, 128, 0.1);
  color: #4ade80;
  padding: 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  border: 1px solid rgba(74, 222, 128, 0.2);
  transition: all 0.2s ease;
  width: 110px;
  flex-shrink: 0;

  &:hover {
    background: rgba(74, 222, 128, 0.2);
    border-color: rgba(74, 222, 128, 0.4);
    transform: translateY(-2px);
  }
`;

const UnitIconContainer = styled.div`
  position: relative;
  width: 64px;
  height: 64px;
`;

const UnitIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
  border-radius: 6px;
`;

const SmallAbilityIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['position'].includes(prop)
})`
  position: absolute;
  ${props => props.position === 'topLeft' ? 'top: 2px; left: 2px;' : ''}
  ${props => props.position === 'topRight' ? 'top: 2px; right: 2px;' : ''}
  ${props => props.position === 'bottomLeft' ? 'bottom: 2px; left: 2px;' : ''}
  ${props => props.position === 'bottomRight' ? 'bottom: 2px; right: 2px;' : ''}
  background: transparent;
  z-index: 3;
  line-height: 1;
`;

const SmallAbilityIcon = styled.img`
  width: 16px;
  height: 16px;
  filter: drop-shadow(0 0 2px rgba(0, 0, 0, 0.8));
`;

const UnitName = styled.span`
  font-weight: 600;
  text-align: center;
  line-height: 1.2;
  word-break: break-word;
  hyphens: none;
  width: 100%;
  font-size: 0.75rem;
`;

const UnitTooltip = styled.div`
  position: fixed;
  background: linear-gradient(135deg, #1e1e2e 0%, #2d2d44 100%);
  border: 2px solid rgba(74, 222, 128, 0.3);
  border-radius: 12px;
  padding: 20px;
  max-width: 400px;
  z-index: 1000;
  pointer-events: none;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  opacity: ${props => props.visible ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const TooltipHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 15px;
`;

const TooltipIconContainer = styled.div`
  position: relative;
  width: 128px;
  height: 128px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

const TooltipIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.4));
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
  width: 24px;
  height: 24px;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
`;

const TooltipInfo = styled.div`
  flex: 1;
`;

const TooltipName = styled.h3`
  margin: 0 0 8px 0;
  font-size: 1.2rem;
  color: #4ade80;
  font-weight: 700;
`;

const TooltipDetails = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const TooltipDetail = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
`;

const TooltipLabel = styled.span`
  color: rgba(255, 255, 255, 0.7);
`;

const TooltipValue = styled.span`
  color: #22d3ee;
  font-weight: 600;
`;

const TooltipDescription = styled.p`
  margin: 15px 0 0 0;
  line-height: 1.4;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.9);
`;

const TooltipSpecial = styled.p`
  margin: 10px 0 0 0;
  line-height: 1.4;
  font-size: 0.9rem;
  color: #fbbf24;
  font-weight: 600;
`;

// Comprehensive ability data
const ABILITIES = [
  {
    id: 'flying',
    name: 'Flying',
    type: 'Movement',
    description: 'Units with this ability can soar over water terrain and other obstacles that would normally block ground-based movement. This tactical advantage allows for surprise attacks and strategic positioning.',
    details: {
      'Movement Type': 'Aerial',
      'Terrain Bypass': 'Water, Obstacles',
      'Strategic Value': 'High'
    },
    realUnits: [
      { name: 'Scout Hawk', army: 'fantasy' },
      { name: 'Recon Drone', army: 'sci_fi' },
      { name: 'Shadow Wraith', army: 'undead_legion' }
    ]
  },
  {
    id: 'mobile',
    name: 'Mobile',
    type: 'Movement',
    description: 'Swift units that can move multiple spaces in a single turn, covering ground quickly to outmaneuver enemies or rapidly respond to threats across the battlefield.',
    details: {
      'Movement Range': '2+ Spaces',
      'Terrain Restriction': 'None',
      'Strategic Value': 'Very High'
    },
    realUnits: [
      { name: 'Scout Hawk', army: 'fantasy' },
      { name: 'Scout Rider', army: 'medieval' },
      { name: 'Motor Scout', army: 'post_apocalyptic' }
    ]
  },
  {
    id: 'charge',
    name: 'Charge',
    type: 'Combat',
    description: 'Powerful melee fighters that can attack enemies from 2 squares away by charging into battle with devastating force, breaking through enemy lines.',
    details: {
      'Attack Range': '2 Squares',
      'Damage Type': 'Melee',
      'Strategic Value': 'High'
    },
    realUnits: [
      { name: 'Knight', army: 'medieval' },
      { name: 'Mech Pilot', army: 'sci_fi' },
      { name: 'Tank Commander', army: 'post_apocalyptic' }
    ]
  },
  {
    id: 'sniper',
    name: 'Sniper',
    type: 'Combat',
    description: 'Elite marksmen capable of precise long-range attacks from 2 squares away. They can even shoot over water terrain, making them excellent for controlling key positions.',
    details: {
      'Attack Range': '2 Squares',
      'Damage Type': 'Ranged',
      'Special': 'Shoots over water'
    },
    realUnits: [
      { name: 'Ranger', army: 'fantasy' },
      { name: 'Sniper', army: 'post_apocalyptic' },
      { name: 'Spitter Beast', army: 'alien_hive' }
    ]
  },
  {
    id: 'fear',
    name: 'Fear',
    type: 'Debuff',
    description: 'Terrifying units that weaken nearby enemies through intimidation. Adjacent enemy units lose 1 rank in combat, making them easier to defeat in battle.',
    details: {
      'Effect Range': 'Adjacent Units',
      'Rank Reduction': '-1 Combat Rank',
      'Duration': 'Continuous'
    },
    realUnits: [
      { name: 'Knight Commander', army: 'medieval' },
      { name: 'Death Knight', army: 'undead_legion' },
      { name: 'Alpha Warrior', army: 'alien_hive' }
    ]
  },
  {
    id: 'curse',
    name: 'Curse',
    type: 'Debuff',
    description: 'Dark magic that permanently weakens any unit that defeats this cursed warrior. The curse lingers, reducing the victor\'s combat effectiveness for the rest of the battle.',
    details: {
      'Trigger': 'Upon Death',
      'Effect': 'Permanent Weakness',
      'Target': 'Defeating Unit'
    },
    realUnits: [
      { name: 'Necromancer', army: 'undead_legion' }
    ]
  },
  {
    id: 'veteran',
    name: 'Veteran',
    type: 'Buff',
    description: 'Battle-hardened warriors that grow stronger with each victory. These experienced fighters gain permanent combat bonuses when they successfully defeat enemy units.',
    details: {
      'Trigger': 'Defeating Enemies',
      'Effect': 'Increased Strength',
      'Duration': 'Permanent'
    },
    realUnits: [
      { name: 'Star Captain', army: 'sci_fi' },
      { name: 'Brawler', army: 'post_apocalyptic' },
      { name: 'Skeleton Warrior', army: 'undead_legion' }
    ]
  },
  {
    id: 'trap_sense',
    name: 'Trap Sense',
    type: 'Utility',
    description: 'Cautious and perceptive units that can detect and safely disarm enemy traps and mines. Their keen senses help them avoid dangerous explosive devices.',
    details: {
      'Detection': 'Traps & Mines',
      'Immunity': 'Explosive Damage',
      'Tactical Role': 'Support'
    },
    realUnits: [
      { name: 'Dwarf Miner', army: 'fantasy' },
      { name: 'Engineer', army: 'sci_fi' },
      { name: 'Sapper', army: 'medieval' }
    ]
  },
  {
    id: 'assassin',
    name: 'Assassin',
    type: 'Special',
    description: 'Deadly specialists trained to eliminate high-value targets. These shadowy fighters can take down even the most powerful enemy commanders through stealth and precision.',
    details: {
      'Target': 'High-Rank Units',
      'Method': 'Stealth Attack',
      'Success Rate': 'Variable'
    },
    realUnits: [
      { name: 'Thief', army: 'fantasy' },
      { name: 'Hacker', army: 'sci_fi' },
      { name: 'Assassin', army: 'medieval' }
    ]
  },
  {
    id: 'recon',
    name: 'Recon',
    type: 'Utility',
    description: 'Strategic intelligence gathering ability that allows commanders to reveal enemy unit identities. Skip your turn and choose any non-adjacent enemy unit to reveal permanently.',
    details: {
      'Action Cost': 'Skip Turn',
      'Uses Per Game': 'Limited Tokens',
      'Target Range': 'Any Non-Adjacent',
      'Tactical Role': 'Intelligence'
    },
    realUnits: [
      { name: 'Archmage', army: 'fantasy' },
      { name: 'Queen', army: 'medieval' },
      { name: 'Overlord AI', army: 'sci_fi' }
    ]
  }
];

function Abilities() {
  const [tooltip, setTooltip] = useState({
    visible: false,
    unitData: null,
    position: { x: 0, y: 0 }
  });
  const [hoverTimer, setHoverTimer] = useState(null);
  const [exampleUnitsData, setExampleUnitsData] = useState({});

  // Load all example unit data when component mounts
  useEffect(() => {
    const loadAllExampleUnits = async () => {
      const unitDataMap = {};
      
      for (const ability of ABILITIES) {
        for (const unit of ability.realUnits) {
          const unitKey = `${unit.army}_${unit.name.toLowerCase().replace(/\s+/g, '_')}`;
          if (!unitDataMap[unitKey]) {
            const unitData = await loadUnitData(unit.name, unit.army);
            if (unitData) {
              unitDataMap[unitKey] = unitData;
            }
          }
        }
      }
      
      setExampleUnitsData(unitDataMap);
    };

    loadAllExampleUnits();
  }, []);

  const getAbilityTypeColor = (type) => {
    switch (type) {
      case 'Movement':
        return { bg: 'rgba(34, 211, 238, 0.2)', border: 'rgba(34, 211, 238, 0.3)', color: '#22d3ee' };
      case 'Combat':
        return { bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.3)', color: '#ef4444' };
      case 'Debuff':
        return { bg: 'rgba(139, 69, 19, 0.2)', border: 'rgba(139, 69, 19, 0.3)', color: '#8b4513' };
      case 'Buff':
        return { bg: 'rgba(74, 222, 128, 0.2)', border: 'rgba(74, 222, 128, 0.3)', color: '#4ade80' };
      case 'Utility':
        return { bg: 'rgba(251, 191, 36, 0.2)', border: 'rgba(251, 191, 36, 0.3)', color: '#fbbf24' };
      case 'Special':
        return { bg: 'rgba(147, 51, 234, 0.2)', border: 'rgba(147, 51, 234, 0.3)', color: '#9333ea' };
      default:
        return { bg: 'rgba(156, 163, 175, 0.2)', border: 'rgba(156, 163, 175, 0.3)', color: '#9ca3af' };
    }
  };

  const loadUnitData = async (unitName, armyId) => {
    try {
      const response = await fetch(`/data/armies/${armyId}/${armyId}.json`);
      if (!response.ok) return null;
      
      const armyData = await response.json();
      const unitId = unitName.toLowerCase().replace(/\s+/g, '_');
      
      return armyData.pieces[unitId] || null;
    } catch (error) {
      console.error('Error loading unit data:', error);
      return null;
    }
  };

  const handleUnitHover = async (event, unit) => {
    // Clear any existing timer
    if (hoverTimer) {
      clearTimeout(hoverTimer);
    }

    // Capture the position immediately before the timeout
    const rect = event.currentTarget.getBoundingClientRect();
    const position = {
      x: rect.right + 10,
      y: rect.top
    };

    // Set a timer for 500ms delay
    const timer = setTimeout(async () => {
      const unitData = await loadUnitData(unit.name, unit.army);
      if (unitData) {
        setTooltip({
          visible: true,
          unitData: { ...unitData, unitId: unit.name.toLowerCase().replace(/\s+/g, '_'), armyId: unit.army },
          position: position
        });
      }
    }, 500);

    setHoverTimer(timer);
  };

  const handleUnitLeave = () => {
    if (hoverTimer) {
      clearTimeout(hoverTimer);
      setHoverTimer(null);
    }
    setTooltip({ visible: false, unitData: null, position: { x: 0, y: 0 } });
  };

  const getMovementSpaces = (unitData) => {
    if (!unitData.moveable) return '-';
    
    if (unitData.abilities) {
      const mobileAbility = unitData.abilities.find(ability => {
        const abilityId = typeof ability === 'string' ? ability : ability.id;
        return abilityId === 'mobile';
      });
      
      if (mobileAbility) {
        return (typeof mobileAbility === 'object' && mobileAbility.spaces) ? mobileAbility.spaces : 2;
      }
    }
    
    return 1;
  };

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

  // Helper function to render small ability indicators for example unit icons
  const renderSmallAbilityIndicators = (unitData) => {
    const indicators = [];
    
    if (hasAbility(unitData, 'flying')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="flying" 
          position="topLeft"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/flying_48.png"
            alt="Flying"
            title="Flying"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'mobile')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="mobile" 
          position="bottomRight"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/mobile_48.png"
            alt="Mobile"
            title="Mobile"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'charge')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="charge" 
          position="topRight"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/charge_48.png"
            alt="Charge"
            title="Charge"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'sniper')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="sniper" 
          position="topRight"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/sniper_48.png"
            alt="Sniper"
            title="Sniper"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'fear')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="fear" 
          position="topLeft"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/fear_48.png"
            alt="Fear"
            title="Fear"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'curse')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="curse" 
          position="bottomLeft"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/curse_48.png"
            alt="Curse"
            title="Curse"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'veteran')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="veteran" 
          position="topRight"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/veteran_48.png"
            alt="Veteran"
            title="Veteran"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'trap_sense')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="trap_sense" 
          position="bottomLeft"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/trap_sense_48.png"
            alt="Trap Sense"
            title="Trap Sense"
          />
        </SmallAbilityIndicator>
      );
    }
    
    if (hasAbility(unitData, 'assassin')) {
      indicators.push(
        <SmallAbilityIndicator 
          key="assassin" 
          position="bottomLeft"
        >
          <SmallAbilityIcon 
            src="/data/icons/abilities/assassin_48.png"
            alt="Assassin"
            title="Assassin"
          />
        </SmallAbilityIndicator>
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
          <SmallAbilityIndicator 
            key="recon" 
            position="topRight"
          >
            <SmallAbilityIcon 
              src="/data/icons/abilities/recon_48.png"
              alt="Recon"
              title="Recon"
            />
          </SmallAbilityIndicator>
        );
      }
    }
    
    return indicators;
  };

  return (
    <AbilitiesContainer>
      <PageHeader>
        <PageTitle>Special Abilities</PageTitle>
        <PageDescription>
          Discover the unique special abilities that give certain units tactical advantages on the battlefield. 
          Each ability provides distinct strategic opportunities and can turn the tide of battle when used effectively.
        </PageDescription>
      </PageHeader>
      
      <AbilitiesGrid>
        {ABILITIES.map(ability => {
          const typeColors = getAbilityTypeColor(ability.type);
          
          return (
            <AbilityCard key={ability.id}>
              <AbilityHeader>
                <AbilityIconContainer>
                  <AbilityIcon 
                    src={`/data/icons/abilities/${ability.id}_48.png`}
                    alt={ability.name}
                  />
                </AbilityIconContainer>
                
                <AbilityInfo>
                  <AbilityName>{ability.name}</AbilityName>
                  <AbilityType 
                    style={{
                      background: typeColors.bg,
                      color: typeColors.color,
                      borderColor: typeColors.border
                    }}
                  >
                    {ability.type}
                  </AbilityType>
                </AbilityInfo>
              </AbilityHeader>
              
              <AbilityDescription>{ability.description}</AbilityDescription>
              
              <AbilityDetails>
                {Object.entries(ability.details).map(([label, value]) => (
                  <DetailItem key={label}>
                    <DetailLabel>{label}:</DetailLabel>
                    <DetailValue>{value}</DetailValue>
                  </DetailItem>
                ))}
                
                <ExampleUnits>
                  <ExampleTitle>Example Units:</ExampleTitle>
                  <UnitList>
                    {ability.realUnits.map((unit, index) => {
                      const unitKey = `${unit.army}_${unit.name.toLowerCase().replace(/\s+/g, '_')}`;
                      const unitData = exampleUnitsData[unitKey];
                      
                      return (
                        <RealUnitContainer 
                          key={index}
                          onMouseEnter={(e) => handleUnitHover(e, unit)}
                          onMouseLeave={handleUnitLeave}
                        >
                          <UnitIconContainer>
                            <UnitIcon 
                              src={`/data/armies/${unit.army}/64x64/${unit.name.toLowerCase().replace(/\s+/g, '_')}.png`}
                              alt={unit.name}
                            />
                            {unitData && renderSmallAbilityIndicators(unitData)}
                          </UnitIconContainer>
                          <UnitName>{unit.name}</UnitName>
                        </RealUnitContainer>
                      );
                    })}
                  </UnitList>
                </ExampleUnits>
              </AbilityDetails>
            </AbilityCard>
          );
        })}
      </AbilitiesGrid>
      
      {tooltip.visible && tooltip.unitData && (
        <UnitTooltip
          visible={tooltip.visible}
          style={{
            left: `${tooltip.position.x}px`,
            top: `${tooltip.position.y}px`
          }}
        >
          <TooltipHeader>
            <TooltipIconContainer>
              <TooltipIcon 
                src={`/data/armies/${tooltip.unitData.armyId}/256x256/${tooltip.unitData.unitId}.png`}
                alt={tooltip.unitData.name}
              />
              {renderAbilityIndicators(tooltip.unitData)}
            </TooltipIconContainer>
            <TooltipInfo>
              <TooltipName>{tooltip.unitData.name}</TooltipName>
              <TooltipDetails>
                <TooltipDetail>
                  <TooltipLabel>Rank:</TooltipLabel>
                  <TooltipValue>{tooltip.unitData.rank || 'N/A'}</TooltipValue>
                </TooltipDetail>
                <TooltipDetail>
                  <TooltipLabel>Movement:</TooltipLabel>
                  <TooltipValue>{getMovementSpaces(tooltip.unitData)}</TooltipValue>
                </TooltipDetail>
              </TooltipDetails>
            </TooltipInfo>
          </TooltipHeader>
          
          {tooltip.unitData.description && (
            <TooltipDescription>{tooltip.unitData.description}</TooltipDescription>
          )}
          
          {tooltip.unitData.special && (
            <TooltipSpecial>Special: {tooltip.unitData.special}</TooltipSpecial>
          )}
        </UnitTooltip>
      )}
    </AbilitiesContainer>
  );
}

export default Abilities;