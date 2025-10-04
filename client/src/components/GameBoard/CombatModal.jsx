import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from { 
    transform: scale(0.8);
    opacity: 0;
  }
  to { 
    transform: scale(1);
    opacity: 1;
  }
`;

const shakeAnimation = keyframes`
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-3px); }
  20%, 40%, 60%, 80% { transform: translateX(3px); }
`;

const fadeOut = keyframes`
  from { 
    opacity: 1;
    transform: scale(1);
  }
  to { 
    opacity: 0;
    transform: scale(0.8);
  }
`;

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 15px;
  padding: 30px;
  max-width: 800px;
  width: 95%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  animation: ${slideIn} 0.4s ease-out;
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const CombatTitle = styled.h2`
  text-align: center;
  color: #f59e0b;
  margin-bottom: 20px;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const CombatArena = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 20px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  min-height: 300px;
  gap: 30px;
`;

const UnitDisplay = styled.div.withConfig({
  shouldForwardProp: (prop) => !['isAttacker', 'isShaking', 'isLoser'].includes(prop)
})`
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  flex: 1;
  animation: ${props => props.isShaking ? shakeAnimation : 'none'} 0.5s ease-in-out;
  opacity: ${props => props.isLoser ? 0 : 1};
  transition: opacity 0.8s ease-out;
  
  ${props => props.isLoser && css`
    animation: ${fadeOut} 0.8s ease-out forwards;
  `}
`;

const UnitImage = styled.img`
  width: 256px;
  height: 256px;
  object-fit: contain;
  border: 3px solid ${props => props.color || '#4b5563'};
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
`;

const UnitInfo = styled.div`
  text-align: center;
  margin-top: 15px;
  color: white;
`;

const UnitName = styled.h3`
  margin: 5px 0;
  font-size: 1.2rem;
  color: ${props => props.color || '#f3f4f6'};
`;

const UnitRank = styled.p`
  margin: 5px 0;
  color: #9ca3af;
  font-size: 0.9rem;
`;

const VersusText = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: #ef4444;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ResultText = styled.div`
  text-align: center;
  margin-top: 20px;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: bold;
  color: ${props => props.victory ? '#10b981' : '#ef4444'};
`;

const CloseButton = styled.button`
  display: block;
  margin: 20px auto 0;
  padding: 10px 30px;
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 8px;
  color: white;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
  }
`;

function CombatModal({ combatData, onClose }) {
  const [showResult, setShowResult] = useState(false);
  const [showAttackerShake, setShowAttackerShake] = useState(false);
  const [showDefenderShake, setShowDefenderShake] = useState(false);
  const [showLoser, setShowLoser] = useState(false);

  useEffect(() => {
    if (!combatData) return;

    const sequence = async () => {
      // Wait a moment to show both units
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Show combat action (shaking)
      setShowAttackerShake(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowAttackerShake(false);
      
      setShowDefenderShake(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      setShowDefenderShake(false);
      
      // Show result
      setShowResult(true);
      
      // Wait a moment then make loser disappear
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowLoser(true);
    };

    sequence();
  }, [combatData]);

  if (!combatData) return null;

  const { attacker, defender, result, winner } = combatData;
  
  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={e => e.stopPropagation()}>
        <CombatTitle>⚔️ COMBAT ⚔️</CombatTitle>
        
        <CombatArena>
          <UnitDisplay 
            isAttacker={true}
            isShaking={showAttackerShake}
            isLoser={showLoser && winner !== 'attacker'}
          >
            <UnitImage 
              src={`/data/armies/${attacker.army}/256x256/${attacker.unit.id}.png`}
              alt={attacker.unit.name}
              color="#3b82f6"
            />
            <UnitInfo>
              <UnitName color="#3b82f6">{attacker.unit.name}</UnitName>
              <UnitRank>Rank {attacker.unit.rank}</UnitRank>
            </UnitInfo>
          </UnitDisplay>

          <VersusText>VS</VersusText>

          <UnitDisplay 
            isAttacker={false}
            isShaking={showDefenderShake}
            isLoser={showLoser && winner !== 'defender'}
          >
            <UnitImage 
              src={`/data/armies/${defender.army}/256x256/${defender.unit.id}.png`}
              alt={defender.unit.name}
              color="#ef4444"
            />
            <UnitInfo>
              <UnitName color="#ef4444">{defender.unit.name}</UnitName>
              <UnitRank>Rank {defender.unit.rank}</UnitRank>
            </UnitInfo>
          </UnitDisplay>
        </CombatArena>

        {showResult && (
          <ResultText victory={winner === 'attacker'}>
            {result === 'attacker_wins' && `${attacker.unit.name} defeats ${defender.unit.name}!`}
            {result === 'defender_wins' && `${defender.unit.name} defeats ${attacker.unit.name}!`}
            {result === 'both_destroyed' && 'Both units destroyed!'}
            {result === 'move_blocked' && 'Attack blocked!'}
          </ResultText>
        )}

        <CloseButton onClick={onClose}>
          Continue Game
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
}

export default CombatModal;