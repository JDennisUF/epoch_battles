import React, { useState } from 'react';
import styled from 'styled-components';
import Login from '../components/Auth/Login';
import Register from '../components/Auth/Register';

const HomeContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 20px;
`;

const ContentCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 40px;
  max-width: 800px;
  width: 100%;
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border: 1px solid rgba(255, 255, 255, 0.18);
`;

const Title = styled.h1`
  font-size: 3rem;
  font-weight: bold;
  text-align: center;
  margin-bottom: 20px;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  text-align: center;
  margin-bottom: 40px;
  opacity: 0.9;
`;

const AuthSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  margin-top: 40px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 30px;
`;

const Tab = styled.button`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 12px 24px;
  margin: 0 5px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &:first-child {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    margin-right: 0;
  }

  &:last-child {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: 0;
  }
`;

const GameFeatures = styled.div`
  margin-top: 40px;
  text-align: center;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
`;

const FeatureCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const FeatureIcon = styled.div`
  font-size: 2rem;
  margin-bottom: 10px;
`;

const FeatureTitle = styled.h3`
  margin-bottom: 8px;
  font-size: 1.1rem;
`;

const FeatureDescription = styled.p`
  font-size: 0.9rem;
  opacity: 0.8;
`;

function Home() {
  const [activeTab, setActiveTab] = useState('login');

  return (
    <HomeContainer>
      <ContentCard>
        <Title>Epoch Battles</Title>
        <Subtitle>
          A strategic online board game where hidden armies clash in tactical warfare.
          Outwit your opponent in this game of deception and strategy.
        </Subtitle>

        <TabContainer>
          <Tab 
            active={activeTab === 'login'} 
            onClick={() => setActiveTab('login')}
          >
            Login
          </Tab>
          <Tab 
            active={activeTab === 'register'} 
            onClick={() => setActiveTab('register')}
          >
            Register
          </Tab>
        </TabContainer>

        {activeTab === 'login' ? <Login /> : <Register />}

        <GameFeatures>
          <h2>Game Features</h2>
          <FeatureGrid>
            <FeatureCard>
              <FeatureIcon>⚔️</FeatureIcon>
              <FeatureTitle>Hidden Identity Combat</FeatureTitle>
              <FeatureDescription>
                Your pieces remain hidden until battle. Strategy through deception.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🎯</FeatureIcon>
              <FeatureTitle>Tactical Gameplay</FeatureTitle>
              <FeatureDescription>
                Different unit types with unique abilities and combat strengths.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>🌐</FeatureIcon>
              <FeatureTitle>Real-time Multiplayer</FeatureTitle>
              <FeatureDescription>
                Challenge players worldwide with instant matchmaking.
              </FeatureDescription>
            </FeatureCard>
            <FeatureCard>
              <FeatureIcon>📊</FeatureIcon>
              <FeatureTitle>Rankings & Stats</FeatureTitle>
              <FeatureDescription>
                Track your progress and climb the global leaderboards.
              </FeatureDescription>
            </FeatureCard>
          </FeatureGrid>
        </GameFeatures>
      </ContentCard>
    </HomeContainer>
  );
}

export default Home;