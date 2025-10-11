import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../hooks/useAuth';
import GameBoard from '../components/GameBoard/GameBoard';
import axios from 'axios';

const GameContainer = styled.div`
  min-height: calc(100vh - 60px);
  padding: 20px;
`;

const LoadingCard = styled.div`
  max-width: 600px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  padding: 40px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
`;

const ErrorCard = styled(LoadingCard)`
  border-color: rgba(239, 68, 68, 0.3);
  background: rgba(239, 68, 68, 0.1);
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
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
  z-index: 2000;
`;

const ConfirmationModal = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 15px;
  padding: 30px;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const ModalTitle = styled.h2`
  color: #f59e0b;
  margin-bottom: 15px;
  font-size: 1.5rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
`;

const ModalMessage = styled.p`
  color: white;
  margin-bottom: 25px;
  font-size: 1.1rem;
  line-height: 1.5;
`;

const ModalButtons = styled.div`
  display: flex;
  gap: 15px;
  justify-content: center;
`;

const ConfirmButton = styled.button`
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    transform: translateY(-1px);
  }
`;

const CancelButton = styled.button`
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
  border: none;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  
  &:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
    transform: translateY(-1px);
  }
`;

const ConnectionStatus = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  background: ${props => {
    if (props.type === 'disconnected') return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    if (props.type === 'reconnected') return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
  }};
  color: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  z-index: 1500;
  border: 2px solid ${props => {
    if (props.type === 'disconnected') return '#dc2626';
    if (props.type === 'reconnected') return '#059669';
    return '#d97706';
  }};
  animation: slideIn 0.3s ease-out;
  max-width: 350px;
  
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
`;

const StatusTitle = styled.div`
  font-weight: bold;
  font-size: 1.1rem;
  margin-bottom: 5px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const StatusMessage = styled.div`
  font-size: 0.95rem;
  opacity: 0.9;
  line-height: 1.4;
`;

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [gameData, setGameData] = useState(location.state?.gameData || null);
  const [loading, setLoading] = useState(!location.state?.gameData);
  const [error, setError] = useState(null);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    // If we already have game data from navigation state, skip the API call
    if (gameData) {
      console.log('🎮 Using game data from navigation state:', {
        hasMapData: !!gameData?.gameState?.mapData,
        mapDataId: gameData?.gameState?.mapData?.id,
        mapDataName: gameData?.gameState?.mapData?.name,
        hasTerrainOverrides: !!gameData?.gameState?.mapData?.terrainOverrides,
        terrainOverrideKeys: gameData?.gameState?.mapData?.terrainOverrides ? Object.keys(gameData.gameState.mapData.terrainOverrides) : null
      });
      setLoading(false);
      return;
    }

    const loadGame = async () => {
      try {
        if (gameId) {
          // Load specific game
          const response = await axios.get(`/games/${gameId}`);
          console.log('🎮 Loaded game from API:', {
            hasMapData: !!response.data.game?.gameState?.mapData,
            mapDataId: response.data.game?.gameState?.mapData?.id,
            mapDataName: response.data.game?.gameState?.mapData?.name,
            hasTerrainOverrides: !!response.data.game?.gameState?.mapData?.terrainOverrides,
            terrainOverrideKeys: response.data.game?.gameState?.mapData?.terrainOverrides ? Object.keys(response.data.game.gameState.mapData.terrainOverrides) : null
          });
          setGameData(response.data.game);
        } else {
          // Load current game
          const response = await axios.get('/games/current');
          if (response.data.game) {
            console.log('🎮 Loaded current game from API:', {
              hasMapData: !!response.data.game?.gameState?.mapData,
              mapDataId: response.data.game?.gameState?.mapData?.id,
              mapDataName: response.data.game?.gameState?.mapData?.name,
              hasTerrainOverrides: !!response.data.game?.gameState?.mapData?.terrainOverrides,
              terrainOverrideKeys: response.data.game?.gameState?.mapData?.terrainOverrides ? Object.keys(response.data.game.gameState.mapData.terrainOverrides) : null
            });
            setGameData(response.data.game);
          } else {
            setError('No active game found');
          }
        }
      } catch (error) {
        console.error('Failed to load game:', error);
        setError(error.response?.data?.message || 'Failed to load game');
      } finally {
        setLoading(false);
      }
    };

    loadGame();
  }, [gameId]); // Removed gameData from dependency array to prevent infinite loop

  useEffect(() => {
    if (!socket || !gameData || hasJoinedRoom.current) return;

    // Join the game room only once
    socket.emit('join_game', { gameId: gameData.id });
    hasJoinedRoom.current = true;

    const handleGameJoined = (data) => {
      console.log('🎮 Game joined, received data:', {
        hasMapData: !!data.gameState?.mapData,
        mapDataId: data.gameState?.mapData?.id,
        mapDataName: data.gameState?.mapData?.name,
        hasTerrainOverrides: !!data.gameState?.mapData?.terrainOverrides,
        terrainOverrideKeys: data.gameState?.mapData?.terrainOverrides ? Object.keys(data.gameState.mapData.terrainOverrides) : null
      });
      
      // Only update if the game state has actually changed
      setGameData(prevData => {
        if (prevData?.gameState?.phase !== data.gameState?.phase ||
            prevData?.gameState?.turnNumber !== data.gameState?.turnNumber) {
          return data;
        }
        return prevData;
      });
    };

    const handleJoinError = (error) => {
      setError(error.message);
    };

    const handlePlayerDisconnected = (data) => {
      console.log('🔌 Player disconnected:', data);
      setConnectionStatus({
        type: 'disconnected',
        title: '⚠️ Player Disconnected',
        message: data.message,
        timestamp: Date.now()
      });
      // Auto-hide after 10 seconds for disconnection notifications
      setTimeout(() => setConnectionStatus(null), 10000);
    };

    const handlePlayerReconnected = (data) => {
      console.log('🔌 Player reconnected:', data);
      setConnectionStatus({
        type: 'reconnected',
        title: '✅ Player Reconnected',
        message: data.message,
        timestamp: Date.now()
      });
      // Auto-hide after 5 seconds for reconnection notifications
      setTimeout(() => setConnectionStatus(null), 5000);
    };

    const handleGameAbandoned = (data) => {
      console.log('🚫 Game abandoned:', data);
      setConnectionStatus({
        type: 'disconnected',
        title: '🚫 Game Abandoned',
        message: data.reason,
        timestamp: Date.now()
      });
      // Don't auto-hide game abandonment notifications
    };

    socket.on('game_joined', handleGameJoined);
    socket.on('join_error', handleJoinError);
    socket.on('player_disconnected', handlePlayerDisconnected);
    socket.on('player_reconnected', handlePlayerReconnected);
    socket.on('game_abandoned', handleGameAbandoned);

    return () => {
      socket.off('game_joined', handleGameJoined);
      socket.off('join_error', handleJoinError);
      socket.off('player_disconnected', handlePlayerDisconnected);
      socket.off('player_reconnected', handlePlayerReconnected);
      socket.off('game_abandoned', handleGameAbandoned);
      
      // Leave game room when component unmounts
      if (gameData) {
        socket.emit('leave_game', { gameId: gameData.id });
      }
      hasJoinedRoom.current = false;
    };
  }, [socket, gameData?.id]); // Only depend on socket and gameData.id

  // Browser navigation warning for active games
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      // Only warn if game is in active phase (not setup or finished)
      if (gameData?.gameState?.phase === 'playing') {
        e.preventDefault();
        e.returnValue = 'You are in an active game. Leaving will forfeit the match.';
        return 'You are in an active game. Leaving will forfeit the match.';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [gameData?.gameState?.phase]);

  const handleBackToLobby = () => {
    // Check if game is in active playing phase
    if (gameData?.gameState?.phase === 'playing') {
      setShowLeaveConfirmation(true);
    } else {
      // Safe to leave during setup or finished games
      navigate('/lobby');
    }
  };

  const handleConfirmLeave = () => {
    setShowLeaveConfirmation(false);
    navigate('/lobby');
  };

  const handleCancelLeave = () => {
    setShowLeaveConfirmation(false);
  };

  if (loading) {
    return (
      <GameContainer>
        <LoadingCard>
          <h2>Loading Game...</h2>
          <p>Please wait while we load your game.</p>
        </LoadingCard>
      </GameContainer>
    );
  }

  if (error) {
    return (
      <GameContainer>
        <ErrorCard>
          <h2>Error</h2>
          <p>{error}</p>
          <BackButton onClick={handleBackToLobby}>
            Back to Lobby
          </BackButton>
        </ErrorCard>
      </GameContainer>
    );
  }

  if (!gameData) {
    return (
      <GameContainer>
        <LoadingCard>
          <h2>No Game Found</h2>
          <p>You don't have an active game.</p>
          <BackButton onClick={handleBackToLobby}>
            Back to Lobby
          </BackButton>
        </LoadingCard>
      </GameContainer>
    );
  }

  // Check if user is a player in this game
  const isPlayer = gameData.players.some(p => p.userId === user.id);
  if (!isPlayer) {
    return (
      <GameContainer>
        <ErrorCard>
          <h2>Access Denied</h2>
          <p>You are not a player in this game.</p>
          <BackButton onClick={handleBackToLobby}>
            Back to Lobby
          </BackButton>
        </ErrorCard>
      </GameContainer>
    );
  }

  return (
    <>
      <GameContainer>
        <GameBoard
          gameId={gameData.id}
          gameState={gameData.gameState}
          players={gameData.players}
          onBackToLobby={handleBackToLobby}
        />
      </GameContainer>
      
      {connectionStatus && (
        <ConnectionStatus type={connectionStatus.type}>
          <StatusTitle>{connectionStatus.title}</StatusTitle>
          <StatusMessage>{connectionStatus.message}</StatusMessage>
        </ConnectionStatus>
      )}
      
      {showLeaveConfirmation && (
        <ModalOverlay onClick={handleCancelLeave}>
          <ConfirmationModal onClick={(e) => e.stopPropagation()}>
            <ModalTitle>⚠️ Leave Active Game?</ModalTitle>
            <ModalMessage>
              This action will:
              <br />• Forfeit the current match
              <br />• Count as a loss in your statistics
              <br />• End the game for your opponent
              <br />• Cannot be undone
            </ModalMessage>
            <ModalButtons>
              <CancelButton onClick={handleCancelLeave}>
                Stay in Game
              </CancelButton>
              <ConfirmButton onClick={handleConfirmLeave}>
                Leave Anyway
              </ConfirmButton>
            </ModalButtons>
          </ConfirmationModal>
        </ModalOverlay>
      )}
    </>
  );
}

export default Game;