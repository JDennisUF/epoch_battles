import React from 'react';
import styled from 'styled-components';
import { useAuth } from '../hooks/useAuth';
import GameHistory from '../components/GameHistory/GameHistory';

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
          <SectionTitle>Game History</SectionTitle>
          <GameHistory />
        </Section>

      </ProfileCard>
    </ProfileContainer>
  );
}

export default Profile;