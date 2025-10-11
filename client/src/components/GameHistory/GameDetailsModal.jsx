import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import axios from 'axios';

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
  padding: 20px;
`;

const ModalContent = styled.div`
  background: linear-gradient(135deg, #1f2937 0%, #374151 100%);
  border-radius: 15px;
  max-width: 900px;
  max-height: 90vh;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  padding: 25px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #4ade80;
  font-size: 1.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 5px;
  
  &:hover {
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 30px;
  overflow-y: auto;
  max-height: calc(90vh - 120px);
`;

const GameSummary = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
`;

const SummaryItem = styled.div`
  text-align: center;
`;

const SummaryLabel = styled.div`
  font-size: 0.9rem;
  opacity: 0.7;
  margin-bottom: 5px;
  text-transform: uppercase;
  font-weight: 500;
`;

const SummaryValue = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: #4ade80;
`;

const GameResult = styled.div`
  background: ${props => {
    if (props.result === 'won') return 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    if (props.result === 'lost') return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)';
  }};
  color: white;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  font-weight: 600;
  font-size: 1.2rem;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const TabContainer = styled.div`
  display: flex;
  margin-bottom: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  overflow: hidden;
`;

const Tab = styled.button`
  flex: 1;
  padding: 12px 20px;
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#4ade80' : 'rgba(255, 255, 255, 0.7)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.05);
    color: ${props => props.active ? '#4ade80' : 'white'};
  }
`;

const MoveHistory = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  max-height: 400px;
  overflow-y: auto;
`;

const MoveItem = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 12px 15px;
  margin-bottom: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border-left: 4px solid ${props => props.playerSide === 'home' ? '#10b981' : '#f59e0b'};
`;

const MoveNumber = styled.span`
  font-weight: 600;
  color: #4ade80;
  min-width: 40px;
`;

const MoveDescription = styled.span`
  flex: 1;
  margin: 0 15px;
`;

const MoveTime = styled.span`
  font-size: 0.8rem;
  opacity: 0.7;
`;

const FinalBoard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
`;

const BoardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 2px;
  max-width: 500px;
  margin: 0 auto;
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 8px;
`;

const BoardSquare = styled.div`
  aspect-ratio: 1;
  background: ${props => {
    if (props.isWater) return 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%)';
    if (props.piece) {
      if (props.piece.side === 'home') return 'rgba(16, 185, 129, 0.3)';
      if (props.piece.side === 'away') return 'rgba(245, 158, 11, 0.3)';
    }
    return 'rgba(255, 255, 255, 0.1)';
  }};
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  color: white;
  font-weight: 600;
  position: relative;
  overflow: hidden;
`;

const UnitIcon = styled.img`
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 2px;
`;

const WaterIcon = styled.div`
  font-size: 0.8rem;
  color: #60a5fa;
`;

const LoadingState = styled.div`
  text-align: center;
  padding: 40px;
  opacity: 0.7;
`;

const ErrorState = styled.div`
  text-align: center;
  padding: 40px;
  color: #ef4444;
`;

function GameDetailsModal({ gameId, onClose, currentUserId }) {
  const [gameDetails, setGameDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');

  useEffect(() => {
    loadGameDetails();
  }, [gameId]);

  const loadGameDetails = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/games/details/${gameId}`);
      setGameDetails(response.data.game);
    } catch (error) {
      console.error('Failed to load game details:', error);
      setError('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const getGameResult = () => {
    if (!gameDetails) return null;
    
    const winner = gameDetails.gameState.winner;
    const playerSide = gameDetails.players.find(p => p.userId === currentUserId)?.side;
    
    if (!winner) return 'draw';
    return winner === playerSide ? 'won' : 'lost';
  };

  const getOpponentName = () => {
    if (!gameDetails) return 'Unknown';
    const opponent = gameDetails.players.find(p => p.userId !== currentUserId);
    return opponent ? opponent.username : 'Unknown';
  };

  const formatMoveDescription = (move) => {
    const fromPos = `${String.fromCharCode(65 + move.from.x)}${move.from.y + 1}`;
    const toPos = `${String.fromCharCode(65 + move.to.x)}${move.to.y + 1}`;
    
    if (move.type === 'move') {
      return `${move.piece.unitType || move.piece.type} ${fromPos} → ${toPos}`;
    } else if (move.combatResult) {
      const winner = move.combatResult.winner;
      return `Combat: ${fromPos} → ${toPos} (${winner} wins)`;
    }
    
    return `${fromPos} → ${toPos}`;
  };

  const isWaterSquare = (x, y) => {
    if (!gameDetails?.mapData) return false;
    const mapData = typeof gameDetails.mapData === 'string' 
      ? JSON.parse(gameDetails.mapData) 
      : gameDetails.mapData;
    
    return mapData.waterSquares?.some(water => water.x === x && water.y === y) || false;
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

  const getGameDuration = () => {
    if (!gameDetails) return 'Unknown';
    const start = new Date(gameDetails.createdAt);
    const end = new Date(gameDetails.finishedAt);
    const diffMs = end - start;
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m`;
    return `${Math.floor(diffMins / 60)}h ${diffMins % 60}m`;
  };

  const getUnitImagePath = (piece) => {
    if (!piece) return null;
    
    // Get the army from the piece's side
    const player = gameDetails.players.find(p => p.side === piece.side);
    const army = player?.army || 'default';
    
    // Use 64x64 size for small board icons
    const imagePath = `/data/armies/${army}/64x64/${piece.type}.png`;
    return imagePath;
  };

  if (loading) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Game Details</ModalTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </ModalHeader>
          <ModalBody>
            <LoadingState>Loading game details...</LoadingState>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  }

  if (error) {
    return (
      <ModalOverlay onClick={onClose}>
        <ModalContent onClick={(e) => e.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>Game Details</ModalTitle>
            <CloseButton onClick={onClose}>×</CloseButton>
          </ModalHeader>
          <ModalBody>
            <ErrorState>{error}</ErrorState>
          </ModalBody>
        </ModalContent>
      </ModalOverlay>
    );
  }

  const result = getGameResult();

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>Game vs {getOpponentName()}</ModalTitle>
          <CloseButton onClick={onClose}>×</CloseButton>
        </ModalHeader>
        
        <ModalBody>
          <GameResult result={result}>
            {result === 'won' && '🏆 Victory!'}
            {result === 'lost' && '💀 Defeat'}
            {result === 'draw' && '🤝 Draw'}
          </GameResult>

          <GameSummary>
            <SummaryItem>
              <SummaryLabel>Duration</SummaryLabel>
              <SummaryValue>{getGameDuration()}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Turns</SummaryLabel>
              <SummaryValue>{gameDetails.gameState.turnNumber}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Moves</SummaryLabel>
              <SummaryValue>{gameDetails.moveHistory.length}</SummaryValue>
            </SummaryItem>
            <SummaryItem>
              <SummaryLabel>Finished</SummaryLabel>
              <SummaryValue>{formatDate(gameDetails.finishedAt)}</SummaryValue>
            </SummaryItem>
          </GameSummary>

          <TabContainer>
            <Tab active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}>
              Summary
            </Tab>
            <Tab active={activeTab === 'moves'} onClick={() => setActiveTab('moves')}>
              Move History
            </Tab>
            <Tab active={activeTab === 'board'} onClick={() => setActiveTab('board')}>
              Final Board
            </Tab>
          </TabContainer>

          {activeTab === 'moves' && (
            <MoveHistory>
              {gameDetails.moveHistory.length === 0 ? (
                <div style={{ textAlign: 'center', opacity: 0.7 }}>No moves recorded</div>
              ) : (
                gameDetails.moveHistory.map((move, index) => (
                  <MoveItem key={index} playerSide={move.piece?.side}>
                    <MoveNumber>#{index + 1}</MoveNumber>
                    <MoveDescription>{formatMoveDescription(move)}</MoveDescription>
                    <MoveTime>{new Date(move.timestamp).toLocaleTimeString()}</MoveTime>
                  </MoveItem>
                ))
              )}
            </MoveHistory>
          )}

          {activeTab === 'board' && (
            <FinalBoard>
              <h3 style={{ marginBottom: '20px', color: '#4ade80' }}>Final Board State</h3>
              <BoardGrid>
                {Array.from({ length: 100 }, (_, i) => {
                  const x = i % 10;
                  const y = Math.floor(i / 10);
                  const piece = gameDetails.gameState.board[y][x];
                  const isWater = isWaterSquare(x, y);
                  
                  return (
                    <BoardSquare key={i} piece={piece} isWater={isWater}>
                      {isWater ? (
                        <WaterIcon>💧</WaterIcon>
                      ) : piece ? (
                        <UnitIcon 
                          src={getUnitImagePath(piece)}
                          alt={piece.name || piece.type}
                          onError={(e) => {
                            // Fallback to symbol if image fails to load
                            e.target.style.display = 'none';
                            e.target.parentNode.innerHTML = piece.symbol || piece.type?.charAt(0) || '?';
                          }}
                        />
                      ) : ''}
                    </BoardSquare>
                  );
                })}
              </BoardGrid>
            </FinalBoard>
          )}
        </ModalBody>
      </ModalContent>
    </ModalOverlay>
  );
}

export default GameDetailsModal;