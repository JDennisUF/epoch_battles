import React from 'react';
import styled from 'styled-components';

const GameContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  text-align: center;
`;

const PlaceholderCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  margin-bottom: 20px;
  font-size: 2.5rem;
`;

const Message = styled.p`
  font-size: 1.2rem;
  opacity: 0.9;
  margin-bottom: 30px;
`;

const ComingSoonBadge = styled.div`
  display: inline-block;
  background: linear-gradient(45deg, #667eea, #764ba2);
  padding: 10px 20px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
`;

function Game() {
  return (
    <GameContainer>
      <PlaceholderCard>
        <Title>🎮 Game Board</Title>
        <Message>
          The game interface is currently under development. 
          This will include the strategic board, piece placement, 
          and real-time battle mechanics.
        </Message>
        <ComingSoonBadge>
          Coming in Phase 2 - Game Logic Implementation
        </ComingSoonBadge>
      </PlaceholderCard>
    </GameContainer>
  );
}

export default Game;