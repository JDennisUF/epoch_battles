import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import GameDetailsModal from './GameDetailsModal';

const HistoryContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 15px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
`;

const TabContainer = styled.div`
  display: flex;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button`
  flex: 1;
  padding: 15px 20px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#4ade80' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 3px solid ${props => props.active ? '#4ade80' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${props => props.active ? '#4ade80' : 'white'};
  }
`;

const ContentArea = styled.div`
  padding: 20px;
  max-height: 600px;
  overflow-y: auto;
`;

const GamesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const GameCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
`;

const GameHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 15px;
`;

const GameTitle = styled.h3`
  margin: 0;
  font-size: 1.2rem;
  color: #4ade80;
`;

const GameStatus = styled.span`
  background: ${props => {
    switch(props.status) {
      case 'finished': return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
      case 'active': return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      case 'paused': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'setup': return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
      default: return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
    }
  }};
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const GameInfo = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
  margin-bottom: 15px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const InfoLabel = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
  text-transform: uppercase;
  font-weight: 500;
`;

const InfoValue = styled.span`
  font-size: 1rem;
  font-weight: 600;
`;

const GameResult = styled.div`
  background: ${props => {
    if (props.result === 'won') return 'rgba(16, 185, 129, 0.2)';
    if (props.result === 'lost') return 'rgba(239, 68, 68, 0.2)';
    return 'rgba(107, 114, 128, 0.2)';
  }};
  border: 1px solid ${props => {
    if (props.result === 'won') return 'rgba(16, 185, 129, 0.4)';
    if (props.result === 'lost') return 'rgba(239, 68, 68, 0.4)';
    return 'rgba(107, 114, 128, 0.4)';
  }};
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  font-weight: 600;
  color: ${props => {
    if (props.result === 'won') return '#10b981';
    if (props.result === 'lost') return '#ef4444';
    return '#6b7280';
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 40px 20px;
  opacity: 0.7;
  font-style: italic;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px 20px;
  opacity: 0.8;
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
    transform: translateY(-1px);
  }
`;

function GameHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('active');
  const [finishedGames, setFinishedGames] = useState([]);
  const [activeGames, setActiveGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);

  useEffect(() => {
    loadGameHistory();
  }, [activeTab]);

  const loadGameHistory = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (activeTab === 'finished') {
        const response = await axios.get('/games/history/finished/1');
        setFinishedGames(response.data.games || []);
      } else {
        const response = await axios.get('/games/history/active');
        setActiveGames(response.data.games || []);
      }
    } catch (error) {
      console.error('Failed to load game history:', error);
      // Set empty arrays instead of error for better UX
      if (activeTab === 'finished') {
        setFinishedGames([]);
      } else {
        setActiveGames([]);
      }
      setError('Unable to load game history at this time');
    } finally {
      setLoading(false);
    }
  };

  const getGameResult = (game, userId) => {
    if (game.status !== 'finished') return null;
    
    const winner = game.gameState.winner;
    const playerSide = game.players.find(p => p.userId === userId)?.side;
    
    if (!winner) return 'draw';
    return winner === playerSide ? 'won' : 'lost';
  };

  const getOpponentName = (game, userId) => {
    const opponent = game.players.find(p => p.userId !== userId);
    return opponent ? opponent.username : 'Unknown';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getMapName = (game) => {
    try {
      // Try gameState.mapData first (for active games), then game.mapData (for finished games)
      let mapData = game.gameState?.mapData || game.mapData;
      
      // Handle string JSON mapData
      if (typeof mapData === 'string') {
        mapData = JSON.parse(mapData);
      }
      
      const mapName = mapData?.name || mapData?.id;
      console.log('Map name debug:', { 
        gameId: game.id, 
        hasGameStateMapData: !!game.gameState?.mapData,
        hasDirectMapData: !!game.mapData,
        mapName,
        mapData: mapData 
      });
      
      return mapName || 'Unknown Map';
    } catch (error) {
      console.error('Error parsing map data:', error, game);
      return 'Unknown Map';
    }
  };

  const handleGameClick = (game) => {
    if (game.status === 'finished') {
      // Show game details modal
      setSelectedGameId(game.id);
    } else {
      // Rejoin active game
      navigate('/game', { state: { gameData: game } });
    }
  };

  const getStatusDisplay = (status) => {
    switch(status) {
      case 'active': return 'In Progress';
      case 'paused': return 'Paused';
      case 'setup': return 'Setting Up';
      case 'finished': return 'Completed';
      default: return status;
    }
  };

  return (
    <>
      <HistoryContainer>
        <TabContainer>
          <Tab 
            active={activeTab === 'active'} 
            onClick={() => setActiveTab('active')}
          >
            Active Games ({activeGames.length})
          </Tab>
          <Tab 
            active={activeTab === 'finished'} 
            onClick={() => setActiveTab('finished')}
          >
            Finished Games
          </Tab>
        </TabContainer>

      <ContentArea>
        {loading ? (
          <LoadingState>Loading games...</LoadingState>
        ) : error ? (
          <EmptyState>Error: {error}</EmptyState>
        ) : (
          <GamesList>
            {activeTab === 'active' ? (
              activeGames.length === 0 ? (
                <EmptyState>No active games found</EmptyState>
              ) : (
                activeGames.map(game => (
                  <GameCard key={game.id} onClick={() => handleGameClick(game)}>
                    <GameHeader>
                      <GameTitle>vs {getOpponentName(game, user.id)}</GameTitle>
                      <GameStatus status={game.status}>
                        {getStatusDisplay(game.status)}
                      </GameStatus>
                    </GameHeader>
                    
                    <GameInfo>
                      <InfoItem>
                        <InfoLabel>Map</InfoLabel>
                        <InfoValue>{getMapName(game)}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Started</InfoLabel>
                        <InfoValue>{formatDate(game.createdAt)}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Turn</InfoLabel>
                        <InfoValue>{game.gameState.turnNumber}</InfoValue>
                      </InfoItem>
                      <InfoItem>
                        <InfoLabel>Phase</InfoLabel>
                        <InfoValue>{game.gameState.phase}</InfoValue>
                      </InfoItem>
                    </GameInfo>

                    {game.status === 'paused' && (
                      <GameResult result="paused">
                        Game paused - Click to rejoin
                      </GameResult>
                    )}
                  </GameCard>
                ))
              )
            ) : (
              finishedGames.length === 0 ? (
                <EmptyState>No finished games found</EmptyState>
              ) : (
                finishedGames.map(game => {
                  const result = getGameResult(game, user.id);
                  return (
                    <GameCard key={game.id} onClick={() => handleGameClick(game)}>
                      <GameHeader>
                        <GameTitle>vs {getOpponentName(game, user.id)}</GameTitle>
                        <GameStatus status={game.status}>Completed</GameStatus>
                      </GameHeader>
                      
                      <GameInfo>
                        <InfoItem>
                          <InfoLabel>Map</InfoLabel>
                          <InfoValue>{getMapName(game)}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Finished</InfoLabel>
                          <InfoValue>{formatDate(game.finishedAt)}</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Duration</InfoLabel>
                          <InfoValue>{game.gameState.turnNumber} turns</InfoValue>
                        </InfoItem>
                        <InfoItem>
                          <InfoLabel>Moves</InfoLabel>
                          <InfoValue>{game.gameState.moveHistory?.length || 0}</InfoValue>
                        </InfoItem>
                      </GameInfo>

                      <GameResult result={result}>
                        {result === 'won' && '🏆 Victory'}
                        {result === 'lost' && '💀 Defeat'}
                        {result === 'draw' && '🤝 Draw'}
                      </GameResult>
                    </GameCard>
                  );
                })
              )
            )}
          </GamesList>
        )}
      </ContentArea>
      </HistoryContainer>

      {selectedGameId && (
        <GameDetailsModal
          gameId={selectedGameId}
          currentUserId={user.id}
          onClose={() => setSelectedGameId(null)}
        />
      )}
    </>
  );
}

export default GameHistory;