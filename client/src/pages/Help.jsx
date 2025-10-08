import React from 'react';
import styled from 'styled-components';

const HelpContainer = styled.div`
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

const PageSubtitle = styled.p`
  font-size: 1.4rem;
  color: #c19a6b;
  font-weight: 600;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
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

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 40px;
  margin-bottom: 40px;
`;

const Section = styled.div`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.02) 100%);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 30px;
  transition: all 0.3s ease;

  &:hover {
    border-color: #4ade80;
    box-shadow: 0 8px 25px rgba(74, 222, 128, 0.2);
  }
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  margin-bottom: 20px;
  color: #4ade80;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid #8b7355;
  padding-bottom: 10px;
`;

const SectionContent = styled.div`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
`;

const SubSection = styled.div`
  margin-bottom: 25px;
`;

const SubTitle = styled.h3`
  font-size: 1.4rem;
  color: #c19a6b;
  margin-bottom: 15px;
  font-weight: 600;
`;

const RulesList = styled.ul`
  margin: 15px 0;
  padding-left: 20px;
`;

const RuleItem = styled.li`
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.9);
`;

const CombatExample = styled.div`
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ExampleTitle = styled.h4`
  color: #fbbf24;
  font-size: 1.2rem;
  margin-bottom: 15px;
  font-weight: 600;
`;

const CombatGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  margin: 15px 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const UnitCard = styled.div`
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.1) 0%, rgba(34, 211, 238, 0.05) 100%);
  border: 1px solid rgba(74, 222, 128, 0.3);
  border-radius: 10px;
  padding: 15px;
  text-align: center;
`;

const UnitName = styled.div`
  font-weight: 600;
  color: #4ade80;
  margin-bottom: 5px;
`;

const UnitRank = styled.div`
  color: #22d3ee;
  font-size: 0.9rem;
`;

const VersusText = styled.div`
  font-size: 1.5rem;
  color: #c19a6b;
  font-weight: bold;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const ResultText = styled.div`
  margin-top: 15px;
  padding: 10px;
  background: rgba(251, 191, 36, 0.1);
  border-radius: 8px;
  border: 1px solid rgba(251, 191, 36, 0.3);
  color: #fbbf24;
  font-weight: 600;
`;

const AbilityGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const AbilityCard = styled.div`
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 15px;
`;

const AbilityName = styled.h4`
  color: #4ade80;
  margin-bottom: 8px;
  font-size: 1.1rem;
  font-weight: 600;
`;

const AbilityDesc = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
  line-height: 1.4;
`;

const HighlightBox = styled.div`
  background: linear-gradient(135deg, rgba(139, 115, 85, 0.2) 0%, rgba(107, 91, 60, 0.2) 100%);
  border: 2px solid #8b7355;
  border-radius: 12px;
  padding: 20px;
  margin: 20px 0;
`;

const HighlightTitle = styled.h3`
  color: #daa520;
  margin-bottom: 15px;
  font-size: 1.3rem;
  font-weight: 600;
`;

function Help() {
  return (
    <HelpContainer>
      <PageHeader>
        <PageTitle>Mission Briefing</PageTitle>
        <PageSubtitle>Strategic Command Manual</PageSubtitle>
        <PageDescription>
          Master the art of tactical warfare in this turn-based strategy game. 
          Command your army, outmaneuver your opponent, and capture their flag to achieve victory.
        </PageDescription>
      </PageHeader>
      
      <SectionGrid>
        <Section>
          <SectionTitle>🎯 Mission Objectives</SectionTitle>
          <SectionContent>
            <HighlightBox>
              <HighlightTitle>PRIMARY OBJECTIVE:</HighlightTitle>
              Capture the enemy flag to achieve immediate victory and secure the battlefield.
            </HighlightBox>
            
            <SubSection>
              <SubTitle>Victory Conditions:</SubTitle>
              <RulesList>
                <RuleItem><strong>Flag Capture:</strong> Move any unit onto the enemy flag to win instantly</RuleItem>
                <RuleItem><strong>Total Elimination:</strong> Destroy all enemy moveable units to force surrender</RuleItem>
                <RuleItem><strong>Strategic Paralysis:</strong> Block all possible enemy moves to claim victory</RuleItem>
              </RulesList>
            </SubSection>
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>⚔️ Combat Operations</SectionTitle>
          <SectionContent>
            <SubSection>
              <SubTitle>Battle Mechanics:</SubTitle>
              <RulesList>
                <RuleItem><strong>Rank System:</strong> Lower rank numbers defeat higher rank numbers (Rank 1 beats Rank 10)</RuleItem>
                <RuleItem><strong>Hidden Information:</strong> Enemy unit identities remain classified until engaged</RuleItem>
                <RuleItem><strong>Mutual Destruction:</strong> Equal rank units destroy each other in combat</RuleItem>
                <RuleItem><strong>Defensive Advantage:</strong> Mountain terrain provides +1 rank defensive bonus</RuleItem>
              </RulesList>
            </SubSection>

            <CombatExample>
              <ExampleTitle>Combat Scenario Alpha:</ExampleTitle>
              <CombatGrid>
                <UnitCard>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                    <div style={{position: 'relative', marginBottom: '15px'}}>
                      <img src="/data/armies/roman_legion/128x128/general.png" alt="General" style={{width: '120px', height: '120px'}} />
                      <div style={{position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', minWidth: '20px', textAlign: 'center'}}>3</div>
                    </div>
                    <div>
                      <UnitName>Roman Legion General</UnitName>
                      <UnitRank>Rank 3</UnitRank>
                    </div>
                  </div>
                </UnitCard>
                <VersusText>VS</VersusText>
                <UnitCard>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                    <div style={{position: 'relative', marginBottom: '15px'}}>
                      <img src="/data/armies/tribal/128x128/warrior_captain.png" alt="Warrior Captain" style={{width: '120px', height: '120px'}} />
                      <div style={{position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', minWidth: '20px', textAlign: 'center'}}>5</div>
                      <img src="/data/icons/abilities/charge.png" alt="Charge" style={{position: 'absolute', bottom: '5px', right: '5px', width: '28px', height: '28px'}} />
                    </div>
                    <div>
                      <UnitName>Tribal Warrior Captain</UnitName>
                      <UnitRank>Rank 5 (Charge ability)</UnitRank>
                    </div>
                  </div>
                </UnitCard>
              </CombatGrid>
              <ResultText>
                RESULT: Roman General victories (Rank 3 defeats Rank 5) - Warrior Captain eliminated
              </ResultText>
            </CombatExample>

            <CombatExample>
              <ExampleTitle>Combat Scenario Bravo - Special Case (Assassin Ability):</ExampleTitle>
              <CombatGrid>
                <UnitCard>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                    <div style={{position: 'relative', marginBottom: '15px'}}>
                      <img src="/data/armies/roman_legion/128x128/brutus.png" alt="Brutus" style={{width: '120px', height: '120px'}} />
                      <div style={{position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', minWidth: '20px', textAlign: 'center'}}>10</div>
                      <img src="/data/icons/abilities/mobile.png" alt="Mobile" style={{position: 'absolute', bottom: '5px', right: '5px', width: '28px', height: '28px'}} />
                      <img src="/data/icons/abilities/assassin.png" alt="Assassin" style={{position: 'absolute', top: '5px', left: '5px', width: '28px', height: '28px'}} />
                    </div>
                    <div>
                      <UnitName>Brutus (Spy)</UnitName>
                      <UnitRank>Rank 10 (Mobile + Assassin)</UnitRank>
                    </div>
                  </div>
                </UnitCard>
                <VersusText>VS</VersusText>
                <UnitCard>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'}}>
                    <div style={{position: 'relative', marginBottom: '15px'}}>
                      <img src="/data/armies/tribal/128x128/tribal_chief.png" alt="Tribal Chief" style={{width: '120px', height: '120px'}} />
                      <div style={{position: 'absolute', bottom: '5px', left: '5px', backgroundColor: 'rgba(0, 0, 0, 0.8)', color: 'white', fontSize: '16px', fontWeight: 'bold', padding: '2px 6px', borderRadius: '4px', minWidth: '20px', textAlign: 'center'}}>1</div>
                      <img src="/data/icons/abilities/fear.png" alt="Fear" style={{position: 'absolute', top: '5px', left: '5px', width: '28px', height: '28px'}} />
                    </div>
                    <div>
                      <UnitName>Tribal Chief (Marshal)</UnitName>
                      <UnitRank>Rank 1 (Fear ability)</UnitRank>
                    </div>
                  </div>
                </UnitCard>
              </CombatGrid>
              <ResultText>
                RESULT: Brutus victories (Assassin ability - defeats strongest enemy when attacking)
              </ResultText>
            </CombatExample>
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>🗺️ Deployment & Movement</SectionTitle>
          <SectionContent>
            <SubSection>
              <SubTitle>Setup Phase:</SubTitle>
              <RulesList>
                <RuleItem><strong>Deployment Zone:</strong> Place all 40 units in your 4-row territory</RuleItem>
                <RuleItem><strong>Strategic Positioning:</strong> Hide your flag and create defensive formations</RuleItem>
                <RuleItem><strong>Rapid Deployment:</strong> Use "Random Setup" for quick battlefield preparation</RuleItem>
                <RuleItem><strong>Saved Tactics:</strong> Store and reuse successful formations</RuleItem>
              </RulesList>
            </SubSection>

            <SubSection>
              <SubTitle>Movement Rules:</SubTitle>
              <RulesList>
                <RuleItem><strong>Standard Movement:</strong> One square per turn (up, down, left, right)</RuleItem>
                <RuleItem><strong>No Diagonal Movement:</strong> Units must move in straight lines</RuleItem>
                <RuleItem><strong>Terrain Restrictions:</strong> Water blocks movement (except Flying units)</RuleItem>
                <RuleItem><strong>Unit Collision:</strong> Cannot move through occupied squares</RuleItem>
              </RulesList>
            </SubSection>
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>⚡ Special Abilities</SectionTitle>
          <SectionContent>
            <SubSection>
              <SubTitle>Tactical Advantages:</SubTitle>
              <p>Elite units possess special capabilities that provide strategic advantages in combat and movement:</p>
              
              <AbilityGrid>
                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/flying_48.png" alt="Flying" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Flying
                  </AbilityName>
                  <AbilityDesc>
                    Aerial units can move over water terrain and pass over allied units during movement, 
                    providing unmatched battlefield mobility.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/mobile_48.png" alt="Mobile" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Mobile
                  </AbilityName>
                  <AbilityDesc>
                    Fast units can move multiple spaces in a single turn but cannot attack after 
                    moving more than one space.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/charge_48.png" alt="Charge" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Charge
                  </AbilityName>
                  <AbilityDesc>
                    Heavy cavalry can attack enemy units up to 2 squares away by charging into battle 
                    with devastating force.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/sniper_48.png" alt="Sniper" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Sniper
                  </AbilityName>
                  <AbilityDesc>
                    Precision marksmen can eliminate targets up to 2 squares away and shoot over 
                    water terrain.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/fear_48.png" alt="Fear" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Fear
                  </AbilityName>
                  <AbilityDesc>
                    Terrifying units weaken adjacent enemies by 1 rank during combat through 
                    psychological warfare.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/curse_48.png" alt="Curse" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Curse
                  </AbilityName>
                  <AbilityDesc>
                    Dark magic permanently weakens any unit that defeats this cursed warrior, 
                    reducing their combat effectiveness.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/veteran_48.png" alt="Veteran" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Veteran
                  </AbilityName>
                  <AbilityDesc>
                    Battle-hardened warriors grow stronger after their first victory, gaining 
                    permanent combat bonuses.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/trap_sense_48.png" alt="Trap Sense" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Trap Sense
                  </AbilityName>
                  <AbilityDesc>
                    Specialized engineers can detect and safely disarm enemy mines and explosive 
                    devices without taking damage.
                  </AbilityDesc>
                </AbilityCard>

                <AbilityCard>
                  <AbilityName>
                    <img src="/data/icons/abilities/assassin_48.png" alt="Assassin" style={{width: '32px', height: '32px', marginRight: '10px', verticalAlign: 'middle'}} />
                    Assassin
                  </AbilityName>
                  <AbilityDesc>
                    Elite operatives trained to eliminate high-value targets through stealth 
                    and precision strikes.
                  </AbilityDesc>
                </AbilityCard>
              </AbilityGrid>
            </SubSection>
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>🛡️ Tactical Intelligence</SectionTitle>
          <SectionContent>
            <SubSection>
              <SubTitle>Reconnaissance Rules:</SubTitle>
              <RulesList>
                <RuleItem><strong>Combat Revelation:</strong> Any unit engaged in battle reveals its identity to both players</RuleItem>
                <RuleItem><strong>Mobile Detection:</strong> Units moving more than 1 space reveal themselves (Mobile ability)</RuleItem>
                <RuleItem><strong>Scout Surveillance:</strong> Enemy units adjacent to Scouts are automatically identified</RuleItem>
                <RuleItem><strong>Intelligence Value:</strong> Use revealed information to plan your strategy</RuleItem>
              </RulesList>
            </SubSection>

            <HighlightBox>
              <HighlightTitle>STRATEGIC TIP:</HighlightTitle>
              Position your Scouts near enemy lines to gather intelligence while keeping your own 
              high-value units concealed until the crucial moment.
            </HighlightBox>
          </SectionContent>
        </Section>

        <Section>
          <SectionTitle>🏆 Victory Strategies</SectionTitle>
          <SectionContent>
            <SubSection>
              <SubTitle>Winning Tactics:</SubTitle>
              <RulesList>
                <RuleItem><strong>Flag Protection:</strong> Surround your flag with defensive units and mines</RuleItem>
                <RuleItem><strong>Mobile Reconnaissance:</strong> Use Mobile scouts to explore and map enemy positions</RuleItem>
                <RuleItem><strong>Special Forces:</strong> Deploy abilities strategically for maximum impact</RuleItem>
                <RuleItem><strong>Psychological Warfare:</strong> Use Fear units to weaken enemy formations</RuleItem>
                <RuleItem><strong>Combined Arms:</strong> Coordinate different unit types for combined attacks</RuleItem>
                <RuleItem><strong>Terrain Advantage:</strong> Control mountain positions for defensive bonuses</RuleItem>
              </RulesList>
            </SubSection>

            <HighlightBox>
              <HighlightTitle>COMMANDER'S WISDOM:</HighlightTitle>
              Victory belongs to the tactician who best combines deception, reconnaissance, and decisive action. 
              Study your opponent, protect your assets, and strike when the moment is right.
            </HighlightBox>
          </SectionContent>
        </Section>
      </SectionGrid>
    </HelpContainer>
  );
}

export default Help;