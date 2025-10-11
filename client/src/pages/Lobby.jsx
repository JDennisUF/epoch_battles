import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import axios from 'axios';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import MapSelector from '../components/MapSelector';
import { playNotificationSound, playSuccessSound, initSounds } from '../utils/sounds';

const LobbyContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    padding: 10px;
  }
`;

const MainContent = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 30px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;

  @media (max-width: 768px) {
    order: -1;
  }
`;

const SidebarCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Title = styled.h1`
  margin-bottom: 20px;
  font-size: 2rem;
  text-align: center;
`;

const WelcomeMessage = styled.div`
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.1rem;
  opacity: 0.9;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
`;

const MapSelectorContainer = styled.div`
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const MapSelectorTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.2rem;
  text-align: center;
  color: #4ade80;
`;

const ActionButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  border-radius: 12px;
  color: white;
  padding: 20px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const OnlineUsersList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const UserItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  font-weight: 500;
  margin-bottom: 4px;
`;

const UserStats = styled.div`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const InviteButton = styled.button`
  background: rgba(102, 126, 234, 0.3);
  border: 1px solid rgba(102, 126, 234, 0.5);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(102, 126, 234, 0.5);
  }
`;

const SectionTitle = styled.h3`
  margin-bottom: 15px;
  font-size: 1.2rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 20px;
  opacity: 0.7;
  font-style: italic;
`;

const NotificationArea = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1001;
`;

const Notification = styled.div`
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  margin-bottom: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;

const RejoinCard = styled.div`
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  border: 2px solid #d97706;
  padding: 20px;
  border-radius: 15px;
  margin-bottom: 20px;
  color: white;
  box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
  animation: pulse 2s infinite;

  @keyframes pulse {
    0%, 100% { 
      box-shadow: 0 8px 25px rgba(251, 191, 36, 0.3);
    }
    50% { 
      box-shadow: 0 8px 35px rgba(251, 191, 36, 0.5);
    }
  }
`;

const RejoinTitle = styled.h3`
  margin: 0 0 10px 0;
  font-size: 1.3rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const RejoinMessage = styled.p`
  margin: 0 0 15px 0;
  font-size: 1rem;
  opacity: 0.9;
`;

const RejoinTimer = styled.div`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 15px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const RejoinButton = styled.button`
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.1rem;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover {
    background: linear-gradient(135deg, #059669 0%, #047857 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }
`;


function Lobby() {
  const { user } = useAuth();
  const { socket, connected, joinLobby, invitePlayer } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [selectedMap, setSelectedMap] = useState(null);
  const [isLoadingInitialMap, setIsLoadingInitialMap] = useState(true);
  const [rejoinableGame, setRejoinableGame] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Function to save map selection to server
  const saveMapSelection = async (mapData) => {
    if (mapData && mapData.id && !isLoadingInitialMap) {
      try {
        await axios.put('/users/current-map', { mapId: mapData.id });
        console.log('Map selection saved:', mapData.id);
      } catch (error) {
        console.error('Failed to save map selection:', error);
      }
    }
  };

  // Handle map selection change (only for user interactions)
  const handleMapSelect = React.useCallback((mapData) => {
    setSelectedMap(mapData);
    saveMapSelection(mapData);
  }, [isLoadingInitialMap]);

  // Load user's current map selection
  useEffect(() => {
    const loadCurrentMap = async () => {
      try {
        const response = await axios.get('/users/me/current-map');
        const mapId = response.data.currentMap;
        if (mapId) {
          // Load the map data
          const mapResponse = await fetch(`/data/maps/${mapId}.json`);
          if (mapResponse.ok) {
            const mapData = await mapResponse.json();
            setSelectedMap(mapData);
          }
        }
      } catch (error) {
        console.error('Failed to load current map:', error);
        // Fallback to classic map
        try {
          const mapResponse = await fetch('/data/maps/classic.json');
          if (mapResponse.ok) {
            const mapData = await mapResponse.json();
            setSelectedMap(mapData);
          }
        } catch (fallbackError) {
          console.error('Failed to load fallback map:', fallbackError);
        }
      }
    };

    if (user) {
      loadCurrentMap().finally(() => {
        setIsLoadingInitialMap(false);
      });
    }
  }, [user]);

  // Function to check for rejoinable games
  const checkRejoinableGame = async () => {
    try {
      const response = await axios.get('/games/rejoinable');
      if (response.data.hasRejoinableGame) {
        setRejoinableGame(response.data);
        setTimeLeft(response.data.timeLeftMs);
      } else {
        setRejoinableGame(null);
        setTimeLeft(0);
      }
    } catch (error) {
      console.error('Failed to check rejoinable games:', error);
      // Clear rejoinable game on error to prevent infinite retries
      setRejoinableGame(null);
      setTimeLeft(0);
      
      // If it's a 404, the endpoint doesn't exist, so stop retrying
      if (error.response?.status === 404) {
        console.warn('Rejoinable games endpoint not found, disabling checks');
        return false; // Signal to stop retrying
      }
    }
    return true; // Signal that retries are okay
  };

  // Check for rejoinable games
  useEffect(() => {
    let interval;
    
    if (user) {
      const startChecking = async () => {
        const shouldContinue = await checkRejoinableGame();
        if (shouldContinue) {
          // Check every 10 seconds only if initial check succeeded
          interval = setInterval(async () => {
            const continueChecking = await checkRejoinableGame();
            if (!continueChecking && interval) {
              clearInterval(interval);
            }
          }, 10000);
        }
      };
      
      startChecking();
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [user]);

  // Refresh rejoinable games when returning to lobby (e.g., from profile)
  useEffect(() => {
    if (user && location.pathname === '/lobby') {
      checkRejoinableGame();
    }
  }, [location.pathname, user]);

  // Countdown timer for rejoinable game
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1000);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (rejoinableGame && timeLeft <= 0) {
      // Time expired, clear rejoinable game
      setRejoinableGame(null);
    }
  }, [timeLeft, rejoinableGame]);

  // Fetch online users from API
  useEffect(() => {
    const fetchOnlineUsers = async () => {
      try {
        const response = await axios.get('/users/online');
        setOnlineUsers(response.data.users);
      } catch (error) {
        console.error('Failed to fetch online users:', error);
      }
    };

    if (user) {
      fetchOnlineUsers();
      // Refresh every 30 seconds
      const interval = setInterval(fetchOnlineUsers, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  useEffect(() => {
    if (connected) {
      joinLobby();
    }
  }, [connected, joinLobby]);

  // Initialize sounds on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      initSounds();
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleInvitationSent = (data) => {
      addNotification(`Invitation sent to ${data.targetUsername}`, 'success');
    };

    const handleInviteError = (error) => {
      addNotification(error.message, 'error');
    };

    const handleGameCreated = (gameData) => {
      addNotification('Game created! Redirecting...', 'success');
      // Play success sound
      playSuccessSound();
      // Navigate to game page with game data passed in state to avoid race condition
      setTimeout(() => {
        navigate('/game', { state: { gameData } });
      }, 1000);
    };

    const handleInvitationDeclined = (data) => {
      addNotification(`${data.from} declined your invitation`, 'info');
    };

    const handleUserOnline = (userData) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(u => u.id !== userData.userId);
        return [...filtered, {
          id: userData.userId,
          username: userData.username,
          isOnline: true
        }];
      });
    };

    const handleUserOffline = (userData) => {
      setOnlineUsers(prev => prev.filter(u => u.id !== userData.userId));
    };

    socket.on('invitation_sent', handleInvitationSent);
    socket.on('invite_error', handleInviteError);
    socket.on('game_created', handleGameCreated);
    socket.on('invitation_declined', handleInvitationDeclined);
    socket.on('user_online', handleUserOnline);
    socket.on('user_offline', handleUserOffline);

    return () => {
      socket.off('invitation_sent', handleInvitationSent);
      socket.off('invite_error', handleInviteError);
      socket.off('game_created', handleGameCreated);
      socket.off('invitation_declined', handleInvitationDeclined);
      socket.off('user_online', handleUserOnline);
      socket.off('user_offline', handleUserOffline);
    };
  }, [socket]);

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleInvitePlayer = (userId) => {
    if (!selectedMap) {
      addNotification('Please select a map first', 'error');
      return;
    }
    invitePlayer(userId, selectedMap);
  };

  const handleRandomMatch = () => {
    addNotification('Random matchmaking not yet implemented', 'info');
  };

  const handleJoinTournament = () => {
    addNotification('Tournaments not yet implemented', 'info');
  };

  const handleRejoinGame = async () => {
    try {
      const response = await axios.post('/games/rejoin');
      if (response.data.game) {
        addNotification('Rejoining game...', 'success');
        setRejoinableGame(null);
        setTimeLeft(0);
        // Navigate to game with the resumed game data
        setTimeout(() => {
          navigate('/game', { state: { gameData: response.data.game } });
        }, 1000);
      }
    } catch (error) {
      console.error('Failed to rejoin game:', error);
      addNotification('Failed to rejoin game', 'error');
      setRejoinableGame(null);
    }
  };

  const formatTimeLeft = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <LobbyContainer>
        <MainContent>
          <Title>Game Lobby</Title>
          
          {rejoinableGame && (
            <RejoinCard>
              <RejoinTitle>⚠️ Game Awaiting Your Return</RejoinTitle>
              <RejoinMessage>
                You have an active game against {rejoinableGame.opponent} that was paused due to disconnection.
              </RejoinMessage>
              <RejoinTimer>
                Time remaining: {formatTimeLeft(timeLeft)}
              </RejoinTimer>
              <RejoinButton onClick={handleRejoinGame}>
                🎮 Rejoin Game
              </RejoinButton>
            </RejoinCard>
          )}
          
          <WelcomeMessage>
            Welcome back, {user?.username}! Ready for battle?
          </WelcomeMessage>

          <MapSelectorContainer>
            <MapSelectorTitle>Choose Your Battlefield</MapSelectorTitle>
            <MapSelector
              selectedMap={selectedMap}
              onMapSelect={handleMapSelect}
              disabled={!connected}
            />
          </MapSelectorContainer>

          <QuickActions>
            <ActionButton onClick={handleRandomMatch} disabled={!connected}>
              🎲 Random Match
            </ActionButton>
            <ActionButton onClick={handleJoinTournament} disabled={!connected}>
              🏆 Join Tournament
            </ActionButton>
            <ActionButton disabled={!connected}>
              📊 View Leaderboard
            </ActionButton>
            <ActionButton disabled={!connected}>
              📈 My Statistics
            </ActionButton>
          </QuickActions>

          {!connected && (
            <EmptyState>
              Connecting to server...
            </EmptyState>
          )}
        </MainContent>

        <Sidebar>
          <SidebarCard>
            <SectionTitle>Online Players ({onlineUsers.length})</SectionTitle>
            {onlineUsers.length === 0 ? (
              <EmptyState>No other players online</EmptyState>
            ) : (
              <OnlineUsersList>
                {onlineUsers.map(user => (
                  <UserItem key={user.id}>
                    <UserInfo>
                      <UserName>{user.username}</UserName>
                      <UserStats>
                        {user.wins || 0}W - {user.losses || 0}L
                      </UserStats>
                    </UserInfo>
                    <InviteButton 
                      onClick={() => handleInvitePlayer(user.id)}
                      disabled={!connected}
                    >
                      Invite
                    </InviteButton>
                  </UserItem>
                ))}
              </OnlineUsersList>
            )}
          </SidebarCard>

        </Sidebar>
      </LobbyContainer>

      <NotificationArea>
        {notifications.map(notification => (
          <Notification key={notification.id}>
            {notification.message}
          </Notification>
        ))}
      </NotificationArea>
    </>
  );
}

export default Lobby;