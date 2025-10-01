import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';

const ProfileContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
`;

const ProfileCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ProfileHeader = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Avatar = styled.div`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: bold;
  margin: 0 auto 20px;
  color: white;
`;

const Username = styled.h1`
  margin-bottom: 10px;
  font-size: 2rem;
`;

const JoinDate = styled.p`
  opacity: 0.7;
  font-size: 0.9rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 5px;
  color: #4ade80;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.8;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionTitle = styled.h2`
  margin-bottom: 15px;
  font-size: 1.3rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  opacity: 0.7;
  font-style: italic;
`;

function Profile() {
  const { user } = useAuth();

  if (!user) {
    return (
      <ProfileContainer>
        <ProfileCard>
          <EmptyState>Loading profile...</EmptyState>
        </ProfileCard>
      </ProfileContainer>
    );
  }

  const winRate = user.stats.gamesPlayed > 0 
    ? ((user.stats.wins / user.stats.gamesPlayed) * 100).toFixed(1)
    : 0;

  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileHeader>
          <Avatar>
            {user.username.charAt(0).toUpperCase()}
          </Avatar>
          <Username>{user.username}</Username>
          <JoinDate>
            Joined {new Date(user.createdAt).toLocaleDateString()}
          </JoinDate>
        </ProfileHeader>

        <Section>
          <SectionTitle>Statistics</SectionTitle>
          <StatsGrid>
            <StatCard>
              <StatValue>{user.stats.gamesPlayed}</StatValue>
              <StatLabel>Games Played</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{user.stats.wins}</StatValue>
              <StatLabel>Wins</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{user.stats.losses}</StatValue>
              <StatLabel>Losses</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{winRate}%</StatValue>
              <StatLabel>Win Rate</StatLabel>
            </StatCard>
            <StatCard>
              <StatValue>{user.stats.ranking}</StatValue>
              <StatLabel>Rating</StatLabel>
            </StatCard>
          </StatsGrid>
        </Section>

        <Section>
          <SectionTitle>Recent Games</SectionTitle>
          <EmptyState>
            Game history will be available once you start playing!
          </EmptyState>
        </Section>

        <Section>
          <SectionTitle>Achievements</SectionTitle>
          <EmptyState>
            Achievement system coming soon!
          </EmptyState>
        </Section>
      </ProfileCard>
    </ProfileContainer>
  );
}

export default Profile;