import React from 'react';
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

const StatsDisplay = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: #4ade80;
  opacity: 1;

  @media (max-width: 768px) {
    font-size: 1.1rem;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

function Header() {
  const { user, logout } = useAuth();
  const { connected } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

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
            <StatsDisplay>
              {user.stats.wins}W - {user.stats.losses}L
            </StatsDisplay>
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