import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameSquare from './GameSquare';
import PieceSelector from './PieceSelector';
import { GAME_CONFIG, isWaterSquare, canMoveTo, generateArmy } from '../../utils/gameLogic';

const BoardContainer = styled.div`
  display: flex;
  gap: 20px;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const BoardWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Board = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  grid-template-rows: repeat(10, 1fr);
  gap: 2px;
  background: rgba(255, 255, 255, 0.1);
  padding: 15px;
  border-radius: 10px;
  width: 700px;
  height: 700px;

  @media (max-width: 768px) {
    width: 500px;
    height: 500px;
  }
`;

const GameInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  min-width: 300px;
  height: fit-content;
`;

const InfoSection = styled.div`
  margin-bottom: 20px;
`;

const InfoTitle = styled.h3`
  margin-bottom: 10px;
  color: #4ade80;
`;

const PlayerInfo = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color'
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  margin: 5px 0;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  border-left: 4px solid ${props => props.color};
`;

const PhaseIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'phase'
})`
  text-align: center;
  padding: 10px;
  background: ${props => {
    switch (props.phase) {
      case 'setup': return 'rgba(255, 165, 0, 0.2)';
      case 'playing': return 'rgba(34, 197, 94, 0.2)';
      case 'finished': return 'rgba(239, 68, 68, 0.2)';
      default: return 'rgba(156, 163, 175, 0.2)';
    }
  }};
  border-radius: 5px;
  font-weight: 600;
  margin-bottom: 20px;
`;

const ActionButton = styled.button`
  background: linear-gradient(45deg, #667eea, #764ba2);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 600;
  margin: 5px;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const LastMoveInfo = styled.div`
  background: rgba(255, 255, 255, 0.05);
  padding: 10px;
  border-radius: 5px;
  font-size: 0.9rem;
  margin-top: 10px;
`;

function GameBoard({ gameId, gameState: initialGameState, players }) {
  const [gameState, setGameState] = useState(initialGameState);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [setupPieces, setSetupPieces] = useState([]);
  const [selectedPieceType, setSelectedPieceType] = useState(null);
  const { socket } = useSocket();
  const { user } = useAuth();

  const playerColor = players.find(p => p.userId === user.id)?.color;
  const isCurrentTurn = gameState?.currentPlayer === playerColor;
  const gamePhase = gameState?.phase || 'setup';

  useEffect(() => {
    if (!socket) return;

    const handleSetupUpdated = (data) => {
      setGameState(data.gameState);
    };

    const handleGameStarted = (data) => {
      console.log('🎮 Client received game_started event:', {
        phase: data.gameState.phase,
        currentPlayer: data.gameState.currentPlayer
      });
      setGameState(data.gameState);
      setSetupPieces([]);
      setSelectedPieceType(null);
    };

    const handleMoveMade = (data) => {
      setGameState(data.gameState);
      setSelectedSquare(null);
      setValidMoves([]);
    };

    const handleGameFinished = (data) => {
      alert(`Game Over! ${data.winner} wins! Reason: ${data.reason}`);
    };

    const handleRandomPlacement = (data) => {
      setSetupPieces(data.pieces);
    };

    const handleSetupError = (data) => {
      console.error('Setup error:', data);
      alert(`Setup error: ${data.message}`);
    };

    socket.on('setup_updated', handleSetupUpdated);
    socket.on('game_started', handleGameStarted);
    socket.on('move_made', handleMoveMade);
    socket.on('game_finished', handleGameFinished);
    socket.on('random_placement', handleRandomPlacement);
    socket.on('setup_error', handleSetupError);

    return () => {
      socket.off('setup_updated', handleSetupUpdated);
      socket.off('game_started', handleGameStarted);
      socket.off('move_made', handleMoveMade);
      socket.off('game_finished', handleGameFinished);
      socket.off('random_placement', handleRandomPlacement);
      socket.off('setup_error', handleSetupError);
    };
  }, [socket]);

  const handleSquareClick = (x, y) => {
    if (gamePhase === 'setup') {
      handleSetupClick(x, y);
    } else if (gamePhase === 'playing' && isCurrentTurn) {
      handleGameClick(x, y);
    }
  };

  const handleSetupClick = (x, y) => {
    if (!selectedPieceType) return;
    
    // Check if it's a valid setup position
    if (!GAME_CONFIG.setupRows[playerColor].includes(y)) return;
    if (gameState.board[y][x]) return; // Square occupied
    if (isWaterSquare(x, y)) return;

    // Add piece to setup
    const piece = setupPieces.find(p => p.type === selectedPieceType && !p.position);
    if (piece) {
      piece.position = { x, y };
      setSetupPieces([...setupPieces]);
    }
  };

  const handleGameClick = (x, y) => {
    const board = gameState.board;
    const clickedPiece = board[y]?.[x];

    if (selectedSquare) {
      const { x: fromX, y: fromY } = selectedSquare;
      
      if (fromX === x && fromY === y) {
        // Deselect
        setSelectedSquare(null);
        setValidMoves([]);
      } else if (validMoves.some(move => move.x === x && move.y === y)) {
        // Make move
        socket.emit('game_move', {
          gameId,
          fromX,
          fromY,
          toX: x,
          toY: y
        });
      } else if (clickedPiece && clickedPiece.color === playerColor) {
        // Select different piece
        selectPiece(x, y, clickedPiece);
      } else {
        // Invalid move, deselect
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (clickedPiece && clickedPiece.color === playerColor && clickedPiece.moveable) {
      // Select piece
      selectPiece(x, y, clickedPiece);
    }
  };

  const selectPiece = (x, y, piece) => {
    setSelectedSquare({ x, y });
    
    // Calculate valid moves
    const moves = [];
    for (let toY = 0; toY < 10; toY++) {
      for (let toX = 0; toX < 10; toX++) {
        if (canMoveTo(x, y, toX, toY, gameState.board, playerColor)) {
          moves.push({ x: toX, y: toY });
        }
      }
    }
    setValidMoves(moves);
  };

  const handleRandomSetup = () => {
    socket.emit('random_setup', { gameId });
  };

  const handleConfirmSetup = () => {
    const placements = setupPieces
      .filter(piece => piece.position)
      .map(piece => ({
        type: piece.type,
        x: piece.position.x,
        y: piece.position.y
      }));

    console.log('Setup pieces:', setupPieces.length, 'Placed:', placements.length);
    console.log('Placements:', placements);

    if (placements.length !== 40) {
      alert(`Please place all 40 pieces before confirming setup! You have placed ${placements.length}/40 pieces.`);
      return;
    }

    console.log('Emitting setup_pieces event with gameId:', gameId);
    socket.emit('setup_pieces', {
      gameId,
      placements,
      isRandom: false
    });
  };

  const handleRandomConfirm = () => {
    socket.emit('setup_pieces', {
      gameId,
      placements: setupPieces.map(piece => ({
        type: piece.type,
        x: piece.position.x,
        y: piece.position.y
      })),
      isRandom: true
    });
  };

  // Initialize setup pieces if in setup phase
  useEffect(() => {
    if (gamePhase === 'setup' && setupPieces.length === 0) {
      setSetupPieces(generateArmy(playerColor));
    }
  }, [gamePhase, playerColor, setupPieces.length]);

  const renderBoard = () => {
    const squares = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        let piece = null;
        
        if (gamePhase === 'setup') {
          // Show setup pieces
          piece = setupPieces.find(p => p.position?.x === x && p.position?.y === y);
        } else {
          // Show game pieces
          piece = gameState.board[y]?.[x];
        }

        const isSelected = selectedSquare?.x === x && selectedSquare?.y === y;
        const isValidMove = validMoves.some(move => move.x === x && move.y === y);
        const isWater = isWaterSquare(x, y);
        const isSetupArea = gamePhase === 'setup' && GAME_CONFIG.setupRows[playerColor]?.includes(y);

        squares.push(
          <GameSquare
            key={`${x}-${y}`}
            x={x}
            y={y}
            piece={piece}
            playerColor={playerColor}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isWater={isWater}
            isSetupArea={isSetupArea}
            onClick={() => handleSquareClick(x, y)}
          />
        );
      }
    }
    return squares;
  };

  return (
    <BoardContainer>
      <BoardWrapper>
        <Board>{renderBoard()}</Board>
        
        {gamePhase === 'setup' && (
          <div>
            <ActionButton onClick={handleRandomSetup}>
              Random Setup
            </ActionButton>
            <ActionButton 
              onClick={setupPieces.every(p => p.position) ? handleConfirmSetup : handleRandomConfirm}
              disabled={setupPieces.length === 0}
            >
              {setupPieces.every(p => p.position) ? 'Confirm Setup' : 'Confirm Random'}
            </ActionButton>
            <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
              Pieces placed: {setupPieces.filter(p => p.position).length}/40
            </div>
          </div>
        )}
      </BoardWrapper>

      <GameInfo>
        <PhaseIndicator phase={gamePhase}>
          {gamePhase === 'setup' && 'Setup Phase - Place Your Pieces'}
          {gamePhase === 'playing' && `Playing - ${isCurrentTurn ? 'Your Turn' : 'Opponent\'s Turn'}`}
          {gamePhase === 'finished' && `Game Over - ${gameState.winner} Wins!`}
        </PhaseIndicator>

        <InfoSection>
          <InfoTitle>Players</InfoTitle>
          {players.map(player => (
            <PlayerInfo key={player.userId} color={player.color === 'home' ? '#3b82f6' : '#ef4444'}>
              <span>{player.username} ({player.color === 'home' ? 'Home' : 'Away'})</span>
              <span>{player.color === playerColor ? '(You)' : ''}</span>
            </PlayerInfo>
          ))}
        </InfoSection>

        {gamePhase === 'setup' && (
          <InfoSection>
            <InfoTitle>Setup</InfoTitle>
            <PieceSelector
              pieces={setupPieces}
              selectedType={selectedPieceType}
              onSelectType={setSelectedPieceType}
            />
          </InfoSection>
        )}

        {gamePhase === 'playing' && (
          <InfoSection>
            <InfoTitle>Game Status</InfoTitle>
            <div>Turn: {gameState.turnNumber}</div>
            <div>Current Player: {gameState.currentPlayer}</div>
            {gameState.lastMove && (
              <LastMoveInfo>
                Last Move: {gameState.lastMove.type} from ({gameState.lastMove.from.x}, {gameState.lastMove.from.y}) to ({gameState.lastMove.to.x}, {gameState.lastMove.to.y})
              </LastMoveInfo>
            )}
          </InfoSection>
        )}
      </GameInfo>
    </BoardContainer>
  );
}

export default GameBoard;