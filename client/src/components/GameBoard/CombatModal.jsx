import React, { useState, useEffect } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { playCombatSound, playBombExplosionSound, playFlagCaptureSound } from '../../utils/sounds';

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
  opacity: ${props => props.isLoser ? 0.3 : 1};
  transition: opacity 0.8s ease-out;
  filter: ${props => props.isLoser ? 'grayscale(80%)' : 'none'};
  
  ${props => props.isLoser && css`
    transform: scale(0.95);
    transition: opacity 0.8s ease-out, filter 0.8s ease-out, transform 0.8s ease-out;
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

  // Play combat sounds using the new MP3 sound system
  const handleCombatSound = async (combatData) => {
    try {
      const { attacker, defender, result } = combatData;
      
      console.log('🔊 Combat sound debug:', {
        attackerUnit: attacker.unit.name,
        attackerClass: attacker.unit.class,
        attackerId: attacker.unit.id,
        attackerArmy: attacker.army,
        defenderUnit: defender.unit.name,
        defenderClass: defender.unit.class
      });
      
      // Special case for bomb explosions
      if (defender.unit.class === 'bomb' || attacker.unit.class === 'bomb') {
        console.log('🔊 Playing bomb explosion sound');
        await playBombExplosionSound();
        return;
      }
      
      // Special case for flag capture
      if (defender.unit.class === 'flag') {
        console.log('🔊 Playing flag capture sound');
        await playFlagCaptureSound();
        return;
      }
      
      // For regular combat, play the attacker's sound (since they initiated)
      console.log('🔊 Playing combat sound for:', attacker.unit.class, attacker.unit.id, attacker.army || 'default');
      await playCombatSound(
        attacker.unit.class, 
        attacker.unit.id, 
        attacker.army || 'default'
      );
      
    } catch (err) {
      console.log('Combat sound playback failed:', err);
    }
  };

  // Generate combat sounds programmatically (DEPRECATED - keeping for fallback)
  const playSyntheticCombatSound = (outcome) => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const playTone = (frequency, duration, volume = 0.3, type = 'sine') => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
        
        return duration;
      };

      const playSequence = async (notes) => {
        let time = 0;
        for (const note of notes) {
          setTimeout(() => {
            playTone(note.freq, note.duration, note.volume, note.type);
          }, time * 1000);
          time += note.duration * 0.8; // Slight overlap
        }
      };

      // Different sound patterns for each outcome
      if (outcome === 'win') {
        const winPatterns = [
          // Victory fanfare
          [
            { freq: 440, duration: 0.15, volume: 0.3, type: 'triangle' },
            { freq: 554, duration: 0.15, volume: 0.3, type: 'triangle' },
            { freq: 659, duration: 0.3, volume: 0.4, type: 'triangle' }
          ],
          // Sword clash victory
          [
            { freq: 800, duration: 0.1, volume: 0.2, type: 'sawtooth' },
            { freq: 600, duration: 0.1, volume: 0.2, type: 'sawtooth' },
            { freq: 880, duration: 0.4, volume: 0.3, type: 'triangle' }
          ],
          // Rising victory
          [
            { freq: 330, duration: 0.1, volume: 0.3, type: 'square' },
            { freq: 440, duration: 0.1, volume: 0.3, type: 'square' },
            { freq: 550, duration: 0.2, volume: 0.4, type: 'triangle' }
          ]
        ];
        const pattern = winPatterns[Math.floor(Math.random() * winPatterns.length)];
        playSequence(pattern);
        
      } else if (outcome === 'loss') {
        const lossPatterns = [
          // Descending defeat
          [
            { freq: 659, duration: 0.2, volume: 0.3, type: 'triangle' },
            { freq: 440, duration: 0.2, volume: 0.3, type: 'triangle' },
            { freq: 330, duration: 0.4, volume: 0.2, type: 'sine' }
          ],
          // Heavy thud
          [
            { freq: 200, duration: 0.1, volume: 0.4, type: 'sawtooth' },
            { freq: 150, duration: 0.3, volume: 0.3, type: 'sine' }
          ],
          // Sword clang defeat
          [
            { freq: 700, duration: 0.05, volume: 0.2, type: 'sawtooth' },
            { freq: 400, duration: 0.05, volume: 0.2, type: 'sawtooth' },
            { freq: 250, duration: 0.4, volume: 0.2, type: 'sine' }
          ]
        ];
        const pattern = lossPatterns[Math.floor(Math.random() * lossPatterns.length)];
        playSequence(pattern);
        
      } else if (outcome === 'draw') {
        const drawPatterns = [
          // Mutual destruction
          [
            { freq: 500, duration: 0.15, volume: 0.3, type: 'sawtooth' },
            { freq: 500, duration: 0.15, volume: 0.3, type: 'sawtooth' },
            { freq: 300, duration: 0.3, volume: 0.2, type: 'sine' }
          ],
          // Double clash
          [
            { freq: 600, duration: 0.1, volume: 0.3, type: 'square' },
            { freq: 400, duration: 0.1, volume: 0.3, type: 'square' },
            { freq: 500, duration: 0.2, volume: 0.2, type: 'triangle' }
          ]
        ];
        const pattern = drawPatterns[Math.floor(Math.random() * drawPatterns.length)];
        playSequence(pattern);
      }
      
    } catch (err) {
      console.log('Combat sound generation failed:', err);
    }
  };

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
      
      // Determine combat outcome and play sound
      let soundOutcome;
      if (result === 'both_destroyed') {
        soundOutcome = 'draw';
      } else if (result === 'attacker_wins') {
        soundOutcome = 'win';
      } else if (result === 'defender_wins') {
        soundOutcome = 'loss';
      }
      
      // Play the new MP3 combat sound
      handleCombatSound(combatData);
      
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
              <UnitRank>
                Rank {attacker.unit.originalRank || attacker.unit.rank}
                {attacker.unit.effectiveRank && attacker.unit.effectiveRank !== (attacker.unit.originalRank || attacker.unit.rank) && 
                  ` (${attacker.unit.effectiveRank})`
                }
              </UnitRank>
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
              <UnitRank>
                Rank {defender.unit.originalRank || defender.unit.rank}
                {defender.unit.effectiveRank && defender.unit.effectiveRank !== (defender.unit.originalRank || defender.unit.rank) && 
                  ` (${defender.unit.effectiveRank})`
                }
              </UnitRank>
            </UnitInfo>
          </UnitDisplay>
        </CombatArena>

        {showResult && (
          <>
            <ResultText victory={winner === 'attacker'}>
              {combatData.description || (
                <>
                  {result === 'attacker_wins' && `${attacker.unit.name} defeats ${defender.unit.name}!`}
                  {result === 'defender_wins' && `${defender.unit.name} defeats ${attacker.unit.name}!`}
                  {result === 'both_destroyed' && 'Both units destroyed!'}
                  {result === 'move_blocked' && 'Attack blocked!'}
                </>
              )}
            </ResultText>
            
            {combatData.cursed && (
              <ResultText victory={false} style={{ marginTop: '10px', color: '#a855f7' }}>
                💀 CURSE ACTIVATED! The winner has been permanently weakened!
              </ResultText>
            )}
          </>
        )}

        <CloseButton onClick={onClose}>
          Continue Game
        </CloseButton>
      </ModalContent>
    </ModalOverlay>
  );
}

export default CombatModal;