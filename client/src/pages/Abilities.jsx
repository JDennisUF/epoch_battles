import React from 'react';
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
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const AbilityCard = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
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
      'Strategic Value': 'High',
      'Rarity': 'Uncommon'
    },
    examples: ['Sky Riders', 'Flying Carpets', 'War Eagles', 'Wind Elementals']
  },
  {
    id: 'mobile',
    name: 'Mobile',
    type: 'Movement',
    description: 'Swift units that can move multiple spaces in a single turn, covering ground quickly to outmaneuver enemies or rapidly respond to threats across the battlefield.',
    details: {
      'Movement Range': '2+ Spaces',
      'Terrain Restriction': 'None',
      'Strategic Value': 'Very High',
      'Rarity': 'Common'
    },
    examples: ['Scouts', 'Cavalry', 'Speed Demons', 'Swift Messengers']
  },
  {
    id: 'charge',
    name: 'Charge',
    type: 'Combat',
    description: 'Powerful melee fighters that can attack enemies from 2 squares away by charging into battle with devastating force, breaking through enemy lines.',
    details: {
      'Attack Range': '2 Squares',
      'Damage Type': 'Melee',
      'Strategic Value': 'High',
      'Rarity': 'Uncommon'
    },
    examples: ['Heavy Cavalry', 'Berserkers', 'War Rhinos', 'Battle Rams']
  },
  {
    id: 'sniper',
    name: 'Sniper',
    type: 'Combat',
    description: 'Elite marksmen capable of precise long-range attacks from 2 squares away. They can even shoot over water terrain, making them excellent for controlling key positions.',
    details: {
      'Attack Range': '2 Squares',
      'Damage Type': 'Ranged',
      'Special': 'Shoots over water',
      'Rarity': 'Rare'
    },
    examples: ['Marksmen', 'Archers', 'Gunners', 'Crossbow Experts']
  },
  {
    id: 'fear',
    name: 'Fear',
    type: 'Debuff',
    description: 'Terrifying units that weaken nearby enemies through intimidation. Adjacent enemy units lose 1 rank in combat, making them easier to defeat in battle.',
    details: {
      'Effect Range': 'Adjacent Units',
      'Rank Reduction': '-1 Combat Rank',
      'Duration': 'Continuous',
      'Rarity': 'Rare'
    },
    examples: ['Demons', 'Undead Lords', 'Terror Beasts', 'Nightmare Creatures']
  },
  {
    id: 'curse',
    name: 'Curse',
    type: 'Debuff',
    description: 'Dark magic that permanently weakens any unit that defeats this cursed warrior. The curse lingers, reducing the victor\'s combat effectiveness for the rest of the battle.',
    details: {
      'Trigger': 'Upon Death',
      'Effect': 'Permanent Weakness',
      'Target': 'Defeating Unit',
      'Rarity': 'Very Rare'
    },
    examples: ['Cursed Warriors', 'Dark Priests', 'Vengeful Spirits', 'Hex Masters']
  },
  {
    id: 'veteran',
    name: 'Veteran',
    type: 'Buff',
    description: 'Battle-hardened warriors that grow stronger with each victory. These experienced fighters gain permanent combat bonuses when they successfully defeat enemy units.',
    details: {
      'Trigger': 'Defeating Enemies',
      'Effect': 'Increased Strength',
      'Duration': 'Permanent',
      'Rarity': 'Uncommon'
    },
    examples: ['Elite Guards', 'War Veterans', 'Champion Fighters', 'Battle Masters']
  },
  {
    id: 'trap_sense',
    name: 'Trap Sense',
    type: 'Utility',
    description: 'Cautious and perceptive units that can detect and safely disarm enemy traps and mines. Their keen senses help them avoid dangerous explosive devices.',
    details: {
      'Detection': 'Traps & Mines',
      'Immunity': 'Explosive Damage',
      'Tactical Role': 'Support',
      'Rarity': 'Common'
    },
    examples: ['Miners', 'Engineers', 'Sappers', 'Demolition Experts']
  },
  {
    id: 'assassin',
    name: 'Assassin',
    type: 'Special',
    description: 'Deadly specialists trained to eliminate high-value targets. These shadowy fighters can take down even the most powerful enemy commanders through stealth and precision.',
    details: {
      'Target': 'High-Rank Units',
      'Method': 'Stealth Attack',
      'Success Rate': 'Variable',
      'Rarity': 'Very Rare'
    },
    examples: ['Shadow Assassins', 'Ninja', 'Spies', 'Silent Killers']
  }
];

function Abilities() {
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
                    {ability.examples.map((unit, index) => (
                      <UnitTag key={index}>{unit}</UnitTag>
                    ))}
                  </UnitList>
                </ExampleUnits>
              </AbilityDetails>
            </AbilityCard>
          );
        })}
      </AbilitiesGrid>
    </AbilitiesContainer>
  );
}

export default Abilities;