import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useAuth } from '../../hooks/useAuth';
import { useSocket } from '../../hooks/useSocket';

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: linear-gradient(135deg, rgba(45, 52, 54, 0.95) 0%, rgba(99, 110, 114, 0.95) 100%);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #5a6c57;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;

  @media (max-width: 768px) {
    height: 60px;
  }
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: #c19a6b;
  text-decoration: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.7);
  letter-spacing: 1px;
  text-transform: uppercase;

  &:hover {
    color: #daa520;
    text-shadow: 2px 2px 6px rgba(0, 0, 0, 0.8);
  }
`;

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const NavLink = styled(Link)`
  color: white;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;

  @media (max-width: 768px) {
    gap: 15px;
  }
`;

const Username = styled(Link)`
  color: white;
  font-weight: 600;
  font-size: 1.4rem;
  text-decoration: none;
  transition: all 0.3s ease;
  padding: 8px 12px;
  border-radius: 6px;

  &:hover {
    color: #4ade80;
    background: rgba(255, 255, 255, 0.1);
  }

  &.active {
    color: #4ade80;
    background: rgba(255, 255, 255, 0.15);
  }

  @media (max-width: 768px) {
    font-size: 1.2rem;
    padding: 6px 10px;
  }

  @media (max-width: 480px) {
    display: none;
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.2rem;
  font-weight: 500;
  color: white;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatusDot = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'connected'
})`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${props => props.connected ? '#4ade80' : '#ef4444'};
  box-shadow: 0 0 8px ${props => props.connected ? 'rgba(74, 222, 128, 0.5)' : 'rgba(239, 68, 68, 0.5)'};

  @media (max-width: 768px) {
    width: 10px;
    height: 10px;
  }
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1.1rem;
  font-weight: 500;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-1px);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 1rem;
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
`;


const InvitationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-right: 15px;

  @media (max-width: 768px) {
    margin-right: 10px;
    gap: 6px;
  }
`;

const MilitaryButton = styled.button`
  background: linear-gradient(135deg, #2d3436 0%, #636e72 50%, #2d3436 100%);
  border: 2px solid #5a6c57;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);

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

  &:hover {
    transform: translateY(-1px);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.2),
      0 4px 8px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 
      inset 0 1px 0 rgba(255, 255, 255, 0.1),
      0 1px 2px rgba(0, 0, 0, 0.3);
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 0.8rem;
  }
`;

const AcceptButton = styled(MilitaryButton)`
  background: linear-gradient(135deg, #1e3a1e 0%, #4ade80 50%, #1e3a1e 100%);
  border-color: #22c55e;
  
  &:hover {
    background: linear-gradient(135deg, #1e3a1e 0%, #22c55e 50%, #1e3a1e 100%);
  }
`;

const DeclineButton = styled(MilitaryButton)`
  background: linear-gradient(135deg, #3a1e1e 0%, #ef4444 50%, #3a1e1e 100%);
  border-color: #dc2626;
  
  &:hover {
    background: linear-gradient(135deg, #3a1e1e 0%, #dc2626 50%, #3a1e1e 100%);
  }
`;

const InvitationBadge = styled.div`
  background: linear-gradient(135deg, #8b5a3c 0%, #d4af37 50%, #8b5a3c 100%);
  border: 2px solid #c19a6b;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.1),
    0 2px 4px rgba(0, 0, 0, 0.3);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { 
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.3),
        0 0 0 0 rgba(212, 175, 55, 0.7);
    }
    50% { 
      box-shadow: 
        inset 0 1px 0 rgba(255, 255, 255, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.3),
        0 0 0 8px rgba(212, 175, 55, 0);
    }
  }

  @media (max-width: 768px) {
    padding: 3px 6px;
    font-size: 0.7rem;
  }
`;

function Header() {
  const { user, logout } = useAuth();
  const { socket, connected, respondToInvitation } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [gameInvitations, setGameInvitations] = useState([]);

  // Handle game invitations
  useEffect(() => {
    if (!socket) return;

    const handleGameInvitation = (invitation) => {
      setGameInvitations(prev => [...prev, { ...invitation, id: Date.now() }]);
    };

    const handleGameCreated = (gameData) => {
      // Clear invitations when game is created
      setGameInvitations([]);
      navigate('/game', { state: { gameData } });
    };

    const handleInvitationDeclined = () => {
      // Clear invitations if declined elsewhere
      setGameInvitations([]);
    };

    socket.on('game_invitation', handleGameInvitation);
    socket.on('game_created', handleGameCreated);
    socket.on('invitation_declined', handleInvitationDeclined);

    return () => {
      socket.off('game_invitation', handleGameInvitation);
      socket.off('game_created', handleGameCreated);
      socket.off('invitation_declined', handleInvitationDeclined);
    };
  }, [socket, navigate]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleInvitationResponse = (invitation, accepted) => {
    respondToInvitation(invitation.from.id, accepted, invitation.mapData);
    setGameInvitations(prev => prev.filter(inv => inv.id !== invitation.id));
  };

  // Get the most recent invitation for display
  const currentInvitation = gameInvitations[gameInvitations.length - 1];

  return (
    <HeaderContainer>
      <Logo to="/lobby">Epoch Battles</Logo>
      
      <Nav>
        <NavLink 
          to="/lobby" 
          className={isActive('/lobby') ? 'active' : ''}
        >
          Lobby
        </NavLink>
        <NavLink 
          to="/armies" 
          className={isActive('/armies') ? 'active' : ''}
        >
          Armies
        </NavLink>
        <NavLink 
          to="/abilities" 
          className={isActive('/abilities') ? 'active' : ''}
        >
          Abilities
        </NavLink>
        <NavLink 
          to="/help" 
          className={isActive('/help') ? 'active' : ''}
        >
          Help
        </NavLink>
      </Nav>

      <UserInfo>
        {currentInvitation && (
          <InvitationContainer>
            <InvitationBadge>
              Battle Request from {currentInvitation.from.username}
            </InvitationBadge>
            <AcceptButton 
              onClick={() => handleInvitationResponse(currentInvitation, true)}
              title="Accept Battle"
            >
              ⚔️ Accept
            </AcceptButton>
            <DeclineButton 
              onClick={() => handleInvitationResponse(currentInvitation, false)}
              title="Decline Battle"
            >
              🛡️ Decline
            </DeclineButton>
          </InvitationContainer>
        )}
        
        <ConnectionStatus>
          <StatusDot connected={connected} />
          {connected ? 'Online' : 'Offline'}
        </ConnectionStatus>
        
        {user && (
          <>
            <Username 
              to={`/profile/${user.username}`}
              className={location.pathname.startsWith('/profile') ? 'active' : ''}
            >
              {user.username}
            </Username>
          </>
        )}
        
        <LogoutButton onClick={handleLogout}>
          Logout
        </LogoutButton>
      </UserInfo>
    </HeaderContainer>
  );
}

export default Header;