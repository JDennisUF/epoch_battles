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
  height: 60px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  z-index: 1000;
`;

const Logo = styled(Link)`
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  background: linear-gradient(45deg, #fff, #f0f0f0);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  &:hover {
    opacity: 0.8;
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
  gap: 15px;

  @media (max-width: 768px) {
    gap: 10px;
  }
`;

const Username = styled.span`
  color: white;
  font-weight: 500;

  @media (max-width: 480px) {
    display: none;
  }
`;

const ConnectionStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.9rem;
`;

const StatusDot = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${props => props.connected ? '#4ade80' : '#ef4444'};
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  @media (max-width: 480px) {
    padding: 8px 12px;
    font-size: 0.9rem;
  }
`;

const StatsDisplay = styled.div`
  font-size: 0.9rem;
  opacity: 0.9;

  @media (max-width: 768px) {
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
          to={`/profile/${user?.username}`}
          className={location.pathname.startsWith('/profile') ? 'active' : ''}
        >
          Profile
        </NavLink>
      </Nav>

      <UserInfo>
        <ConnectionStatus>
          <StatusDot connected={connected} />
          {connected ? 'Online' : 'Offline'}
        </ConnectionStatus>
        
        {user && (
          <>
            <StatsDisplay>
              {user.stats.wins}W - {user.stats.losses}L
            </StatsDisplay>
            <Username>{user.username}</Username>
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