import React from 'react';
import styled, { keyframes } from 'styled-components';

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

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  animation: ${fadeIn} 0.3s ease-out;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 20px;
  padding: 40px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
  animation: ${slideIn} 0.5s ease-out;
  border: 3px solid ${props => props.isWinner ? '#10b981' : '#ef4444'};
  text-align: center;
`;

const ResultTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 20px;
  color: ${props => props.isWinner ? '#10b981' : '#ef4444'};
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  font-weight: bold;
`;

const WinnerSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 30px 0;
`;

const ArmyImage = styled.img.withConfig({
  shouldForwardProp: (prop) => prop !== 'isWinner'
})`
  width: 128px;
  height: 128px;
  object-fit: contain;
  border-radius: 15px;
  border: 3px solid ${props => props.isWinner ? '#10b981' : '#6b7280'};
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.4);
  margin-bottom: 15px;
`;

const PlayerName = styled.h2`
  font-size: 1.5rem;
  color: ${props => props.isWinner ? '#10b981' : '#f3f4f6'};
  margin: 10px 0 5px 0;
`;

const PlayerColor = styled.p`
  font-size: 1rem;
  color: #9ca3af;
  margin: 0;
  text-transform: capitalize;
`;

const ReasonText = styled.p`
  font-size: 1.1rem;
  color: #d1d5db;
  margin: 20px 0;
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  border-left: 4px solid ${props => props.isWinner ? '#10b981' : '#ef4444'};
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  margin-top: 30px;
`;

const ExitButton = styled.button`
  padding: 12px 24px;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  background: linear-gradient(45deg, #6b7280, #4b5563);
  color: white;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    background: linear-gradient(45deg, #4b5563, #374151);
  }
`;

function GameResultModal({ gameResult, playerSide, players, onExit }) {
  if (!gameResult) return null;

  const { winner, reason } = gameResult;
  const isPlayerWinner = winner === playerSide;
  
  const winnerPlayer = players.find(p => p.side === winner);
  const loserPlayer = players.find(p => p.side !== winner);

  const getReasonText = (reason) => {
    switch (reason) {
      case 'flag_captured':
        return 'Victory by capturing the enemy flag!';
      case 'no_moves':
        return 'Victory by eliminating all enemy moveable pieces!';
      default:
        return `Victory by ${reason}`;
    }
  };

  const getArmyImagePath = (player) => {
    if (!player?.army) {
      throw new Error(`Missing army data for player: ${JSON.stringify(player)}`);
    }
    return `/data/armies/${player.army}/${player.army}.png`;
  };

  return (
    <ModalOverlay>
      <ModalContent isWinner={isPlayerWinner}>
        <ResultTitle isWinner={isPlayerWinner}>
          {isPlayerWinner ? '🎉 VICTORY! 🎉' : '💀 DEFEAT 💀'}
        </ResultTitle>

        <WinnerSection>
          <ArmyImage 
            src={getArmyImagePath(winnerPlayer)}
            alt={`${winnerPlayer.army} army`}
            isWinner={true}
          />
          <PlayerName isWinner={true}>
            {winnerPlayer.username}
          </PlayerName>
          <PlayerColor>
            {winnerPlayer.army} Army Wins
          </PlayerColor>
        </WinnerSection>

        <ReasonText isWinner={isPlayerWinner}>
          {getReasonText(reason)}
        </ReasonText>

        <ButtonGroup>
          <ExitButton onClick={onExit}>
            Close
          </ExitButton>
        </ButtonGroup>
      </ModalContent>
    </ModalOverlay>
  );
}

export default GameResultModal;