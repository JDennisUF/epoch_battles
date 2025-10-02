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

function Game() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [gameData, setGameData] = useState(location.state?.gameData || null);
  const [loading, setLoading] = useState(!location.state?.gameData);
  const [error, setError] = useState(null);
  const hasJoinedRoom = useRef(false);

  useEffect(() => {
    // If we already have game data from navigation state, skip the API call
    if (gameData) {
      setLoading(false);
      return;
    }

    const loadGame = async () => {
      try {
        if (gameId) {
          // Load specific game
          const response = await axios.get(`/games/${gameId}`);
          setGameData(response.data.game);
        } else {
          // Load current game
          const response = await axios.get('/games/current');
          if (response.data.game) {
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

    socket.on('game_joined', handleGameJoined);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('game_joined', handleGameJoined);
      socket.off('join_error', handleJoinError);
      
      // Leave game room when component unmounts
      if (gameData) {
        socket.emit('leave_game', { gameId: gameData.id });
      }
      hasJoinedRoom.current = false;
    };
  }, [socket, gameData?.id]); // Only depend on socket and gameData.id

  const handleBackToLobby = () => {
    navigate('/lobby');
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
    <GameContainer>
      <BackButton onClick={handleBackToLobby}>
        ← Back to Lobby
      </BackButton>
      
      <GameBoard
        gameId={gameData.id}
        gameState={gameData.gameState}
        players={gameData.players}
      />
    </GameContainer>
  );
}

export default Game;