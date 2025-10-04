import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameSquare from './GameSquare';
import PieceSelector from './PieceSelector';
import { GAME_CONFIG, isWaterSquare, canMoveTo, generateArmy } from '../../utils/gameLogic';
import ArmySelector from './ArmySelector';

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
  width: 900px;
  height: 900px;

  @media (max-width: 768px) {
    width: 640px;
    height: 640px;
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
  const [selectedArmy, setSelectedArmy] = useState(null);
  const [armyData, setArmyData] = useState(null);
  const [showArmySelector, setShowArmySelector] = useState(false);
  const [localPlayers, setLocalPlayers] = useState(players);
  const [piecesPlaced, setPiecesPlaced] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { socket } = useSocket();
  const { user } = useAuth();

  const playerColor = players.find(p => p.userId === user.id)?.color;
  const isCurrentTurn = gameState?.currentPlayer === playerColor;
  const gamePhase = gameState?.phase || 'setup';
  const player = localPlayers.find(p => p.userId === user.id);
  const hasSelectedArmy = player?.army != null;

  useEffect(() => {
    if (!socket) return;

    const handlePiecesPlaced = (data) => {
      console.log('Pieces placed event received:', data);
      setGameState(data.gameState);
    };

    const handleSetupConfirmed = (data) => {
      console.log('Setup confirmed event received:', data);
      if (data.playerId === user.id) {
        setIsPlayerReady(true);
        setShowConfirmDialog(false);
      }
      setLocalPlayers(data.players);
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
      setPiecesPlaced(false);
      setIsPlayerReady(false);
      setShowConfirmDialog(false);
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
      console.log('Received random placement:', data.pieces);
      setSetupPieces(data.pieces);
      
      // Check if all pieces have positions
      const piecesWithPositions = data.pieces.filter(p => p.position && p.position.x !== undefined && p.position.y !== undefined);
      console.log('Pieces with positions:', piecesWithPositions.length, '/', data.pieces.length);
      
      // If all pieces have positions, auto-confirm after a short delay
      if (piecesWithPositions.length === 40) {
        console.log('All pieces positioned, auto-confirming random setup');
        setTimeout(() => {
          const placements = data.pieces
            .filter(piece => piece.position && piece.position.x !== undefined && piece.position.y !== undefined)
            .map(piece => ({
              type: piece.type,
              x: piece.position.x,
              y: piece.position.y
            }));
          
          socket.emit('setup_pieces', {
            gameId,
            placements,
            isRandom: true
          });
        }, 500); // Small delay to let UI update
      }
    };

    const handleSetupError = (data) => {
      console.error('Setup error:', data);
      alert(`Setup error: ${data.message}`);
    };

    const handleArmySelected = (data) => {
      // Update players with army selections
      if (data.players) {
        console.log('Army selected, updating local players:', data);
        setLocalPlayers(data.players);
      }
    };

    const handleArmySelectionError = (data) => {
      console.error('Army selection error:', data);
      alert(`Army selection error: ${data.message}`);
      // Reset local state and show selector again
      setSelectedArmy(null);
      setArmyData(null);
      setShowArmySelector(true);
    };

    socket.on('pieces_placed', handlePiecesPlaced);
    socket.on('setup_confirmed', handleSetupConfirmed);
    socket.on('game_started', handleGameStarted);
    socket.on('move_made', handleMoveMade);
    socket.on('game_finished', handleGameFinished);
    socket.on('random_placement', handleRandomPlacement);
    socket.on('setup_error', handleSetupError);
    socket.on('army_selected', handleArmySelected);
    socket.on('army_selection_error', handleArmySelectionError);

    return () => {
      socket.off('pieces_placed', handlePiecesPlaced);
      socket.off('setup_confirmed', handleSetupConfirmed);
      socket.off('game_started', handleGameStarted);
      socket.off('move_made', handleMoveMade);
      socket.off('game_finished', handleGameFinished);
      socket.off('random_placement', handleRandomPlacement);
      socket.off('setup_error', handleSetupError);
      socket.off('army_selected', handleArmySelected);
      socket.off('army_selection_error', handleArmySelectionError);
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
    // Clear any manually placed pieces
    setSetupPieces(prev => prev.map(piece => ({ ...piece, position: null })));
    // Generate random setup
    socket.emit('random_setup', { gameId });
  };

  const handleConfirmSetup = () => {
    // Check if pieces are placed manually
    const placedPieces = setupPieces.filter(piece => piece.position);
    
    if (placedPieces.length > 0 && placedPieces.length < 40) {
      alert(`Please place all 40 pieces before confirming setup! You have placed ${placedPieces.length}/40 pieces.`);
      return;
    }
    
    // If no pieces are placed, we need to show the confirmation dialog
    // If pieces are already placed, we can confirm directly
    if (placedPieces.length === 40) {
      // Pieces already placed manually, just confirm
      finalizeSetup(false);
    } else {
      // No pieces placed, show confirmation dialog
      setShowConfirmDialog(true);
    }
  };

  const handleConfirmOK = () => {
    finalizeSetup(true); // true = use random placement
  };

  const handleConfirmCancel = () => {
    setShowConfirmDialog(false);
  };

  const finalizeSetup = (useRandom) => {
    if (useRandom) {
      // Use random placement and confirm
      socket.emit('place_pieces', {
        gameId,
        placements: [], // Empty placements will trigger random in server
        isRandom: true
      });
    } else {
      // Use manually placed pieces
      const placements = setupPieces
        .filter(piece => piece.position)
        .map(piece => ({
          type: piece.type,
          x: piece.position.x,
          y: piece.position.y
        }));

      socket.emit('place_pieces', {
        gameId,
        placements,
        isRandom: false
      });
    }

    // Then confirm setup
    setTimeout(() => {
      socket.emit('confirm_setup', { gameId });
      setShowConfirmDialog(false);
    }, 100);
  };



  // Sync local players with props
  useEffect(() => {
    setLocalPlayers(players);
  }, [players]);

  // Show army selector when game starts and player hasn't selected army
  useEffect(() => {
    console.log('Army selector decision:', { gamePhase, hasSelectedArmy, showArmySelector, playerArmy: player?.army, selectedArmy });
    if (gamePhase === 'setup' && !hasSelectedArmy && !showArmySelector && !selectedArmy) {
      console.log('Showing army selector');
      setShowArmySelector(true);
    } else if (hasSelectedArmy || selectedArmy) {
      console.log('Army selected, hiding selector');
      setShowArmySelector(false);
    }
  }, [gamePhase, hasSelectedArmy, showArmySelector, player?.army, selectedArmy]);

  // Initialize setup pieces if in setup phase and army is selected
  useEffect(() => {
    if (gamePhase === 'setup' && hasSelectedArmy && setupPieces.length === 0 && armyData) {
      setSetupPieces(generateArmy(playerColor, armyData));
    }
  }, [gamePhase, hasSelectedArmy, setupPieces.length, playerColor, armyData]);

  const renderBoard = () => {
    const squares = [];
    console.log('🎮 Rendering board with gameState:', { 
      opponentArmy: gameState?.opponentArmy, 
      phase: gamePhase, 
      playerColor 
    });
    
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
            playerArmy={player?.army || selectedArmy}
            opponentArmy={gameState?.opponentArmy}
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

  const handleArmySelection = (armyId, armyDataObj) => {
    console.log('handleArmySelection called with:', { armyId, armyDataObj, gameId });
    
    // Set local state immediately to prevent selector from showing again
    setSelectedArmy(armyId);
    setArmyData(armyDataObj);
    setShowArmySelector(false);
    
    // Emit army selection to server
    if (socket && gameId) {
      console.log('Emitting select_army event to server');
      socket.emit('select_army', {
        gameId,
        armyId
      });
    } else {
      console.error('Cannot emit army selection: missing socket or gameId', { socket: !!socket, gameId });
      // If we can't emit to server, show selector again
      setShowArmySelector(true);
    }
  };

  const handleCancelArmySelection = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Army selection cancelled');
    // For now, just go back to lobby - could be enhanced
    window.location.href = '/lobby';
  };

  // Show army selector if needed
  if (showArmySelector) {
    return (
      <>
        <ArmySelector 
          onSelectArmy={handleArmySelection}
          onCancel={handleCancelArmySelection}
          playerColor={playerColor}
        />
        {/* Show blurred game board in background */}
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none' }}>
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
          {localPlayers.map(player => (
            <PlayerInfo key={player.userId} color={player.color === 'home' ? '#3b82f6' : '#ef4444'}>
              <span>
                {player.username} ({player.color === 'home' ? 'Home' : 'Away'})
                {gamePhase === 'setup' && player.isReady && ' ✓'}
              </span>
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
        </div>
      </>
    );
  }

  return (
    <BoardContainer>
      <BoardWrapper>
        <Board>{renderBoard()}</Board>
        
        {gamePhase === 'setup' && (
          <div>
            {!isPlayerReady && !showConfirmDialog && (
              <>
                <ActionButton onClick={handleRandomSetup}>
                  Random Setup
                </ActionButton>
                <ActionButton onClick={handleConfirmSetup}>
                  Confirm Setup
                </ActionButton>
                <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
                  Pieces placed: {setupPieces.filter(p => p.position).length}/40
                </div>
              </>
            )}
            {showConfirmDialog && (
              <>
                <ActionButton onClick={handleConfirmOK}>
                  OK (Use Random Setup)
                </ActionButton>
                <CancelButton onClick={handleConfirmCancel}>
                  Cancel
                </CancelButton>
                <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center', color: '#fbbf24' }}>
                  No pieces placed manually. Confirm to use random setup?
                </div>
              </>
            )}
            {isPlayerReady && (
              <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center', color: '#4ade80' }}>
                ✓ Setup confirmed! Waiting for opponent...
              </div>
            )}
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
          {localPlayers.map(player => (
            <PlayerInfo key={player.userId} color={player.color === 'home' ? '#3b82f6' : '#ef4444'}>
              <span>
                {player.username} ({player.color === 'home' ? 'Home' : 'Away'})
                {gamePhase === 'setup' && player.isReady && ' ✓'}
              </span>
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
              armyData={armyData}
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