import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameSquare from './GameSquare';
import PieceSelector from './PieceSelector';
import PlacementSelector from './PlacementSelector';
import { GAME_CONFIG, getTerrainType, canMoveTo, generateArmy, loadTerrainData, isTerrainPassable } from '../../utils/gameLogic';
import ArmySelector from './ArmySelector';
import CombatModal from './CombatModal';
import GameResultModal from './GameResultModal';
import ChatBox from '../UI/ChatBox';

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
  width: 1050px;
  height: 1050px;

  @media (max-width: 768px) {
    width: 750px;
    height: 750px;
  }
`;

const GameInfo = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 20px;
  border-radius: 10px;
  min-width: 400px;
  width: 400px;
  height: fit-content;
  
  @media (max-width: 768px) {
    min-width: 100%;
    width: 100%;
  }
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

const CancelButton = styled.button`
  background: linear-gradient(45deg, #ef4444, #dc2626);
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
  const [combatData, setCombatData] = useState(null);
  const [gameResult, setGameResult] = useState(null);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [draggedFromPosition, setDraggedFromPosition] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const { socket } = useSocket();
  const { user } = useAuth();

  const playerSide = players.find(p => p.userId === user.id)?.side;
  const isCurrentTurn = gameState?.currentPlayer === playerSide;
  const gamePhase = gameState?.phase || 'setup';
  const mapData = gameState?.mapData;
  const player = localPlayers.find(p => p.userId === user.id);
  const hasSelectedArmy = player?.army != null;
  
  console.log('🗺️ GameBoard mapData:', { 
    hasMapData: !!mapData, 
    mapDataId: mapData?.id, 
    hasTerrainOverrides: !!mapData?.terrainOverrides,
    gamePhase,
    fullGameState: gameState
  });

  // Check if map data is invalid - but don't early return, just log the error
  const hasValidMapData = mapData && mapData.setupRows && mapData.boardSize;
  if (!hasValidMapData) {
    console.error('❌ Invalid mapData structure:', mapData);
    console.error('❌ Full gameState:', gameState);
  }

  // Load terrain data on component mount
  useEffect(() => {
    loadTerrainData().catch(error => {
      console.error('Failed to load terrain data:', error);
    });
  }, []);

  // Chat message handler with deduplication
  const handleChatMessage = React.useCallback((data) => {
    console.log('Chat message received:', data);
    
    const newMessage = {
      userId: data.userId,
      text: data.message,
      timestamp: data.timestamp || new Date().toISOString()
    };
    
    setChatMessages(prev => {
      // Check for duplicate messages (same user, text, and within 1 second)
      const isDuplicate = prev.some(msg => 
        msg.userId === newMessage.userId && 
        msg.text === newMessage.text &&
        Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000
      );
      
      if (isDuplicate) {
        console.log('Duplicate chat message detected, ignoring');
        return prev;
      }
      
      return [...prev, newMessage];
    });
    
    // Play notification sound (only for messages from other players)
    if (data.userId !== user.id) {
      playNotificationSound();
    }
  }, [user.id]);

  const playNotificationSound = () => {
    try {
      // Try to load and play notification sound file first
      const audio = new Audio('/sounds/message-notification.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Fallback to programmatic sound if file doesn't exist
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      });
    } catch (e) {
      console.log('Could not play notification sound:', e);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handlePiecesPlaced = (data) => {
      console.log('Pieces placed event received:', data);
      setGameState(data.gameState);
      
      // Only automatically confirm setup if this player placed the pieces
      if (data.playerId === user.id) {
        setTimeout(() => {
          socket.emit('confirm_setup', { gameId });
        }, 100);
      }
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
      
      // Show combat modal if this was a combat move
      if (data.combatResult) {
        setCombatData(data.combatResult);
      }
    };

    const handleGameFinished = (data) => {
      console.log('Game finished:', data);
      // Store the game result but don't show it immediately if there's combat happening
      if (!combatData) {
        setGameResult({ winner: data.winner, reason: data.reason });
      } else {
        // If combat is happening, delay showing the result
        setTimeout(() => {
          setGameResult({ winner: data.winner, reason: data.reason });
        }, 100);
      }
    };

    const handleRandomPlacement = (data) => {
      console.log('Received random placement:', data.pieces);
      setSetupPieces(data.pieces);
      
      // Check if all pieces have positions
      const piecesWithPositions = data.pieces.filter(p => p.position && p.position.x !== undefined && p.position.y !== undefined);
      console.log('Pieces with positions:', piecesWithPositions.length, '/', data.pieces.length);
      
      // If all pieces have positions, auto-confirm after a short delay
      const expectedPieceCount = data.pieces.length;
      if (piecesWithPositions.length === expectedPieceCount) {
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
    socket.on('chat_message', handleChatMessage);
    socket.on('chat_error', (data) => {
      console.error('Chat error:', data);
      alert(`Chat error: ${data.message}`);
    });

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
      socket.off('chat_message', handleChatMessage);
      socket.off('chat_error');
    };
  }, [socket]);

  const handleSquareClick = (x, y) => {
    if (gamePhase === 'setup') {
      handleSetupClick(x, y);
    } else if (gamePhase === 'playing' && isCurrentTurn) {
      handleGameClick(x, y);
    }
  };

  const handleDragStart = (piece, x, y) => {
    if (gamePhase !== 'setup') return;
    
    setDraggedPiece(piece);
    setDraggedFromPosition({ x, y });
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (targetX, targetY) => {
    if (!draggedPiece || !draggedFromPosition || gamePhase !== 'setup') return;

    const { x: fromX, y: fromY } = draggedFromPosition;
    
    // Don't allow dropping on the same position
    if (fromX === targetX && fromY === targetY) {
      setDraggedPiece(null);
      setDraggedFromPosition(null);
      return;
    }

    // Check if target is in valid setup area
    if (!mapData.setupRows?.[playerSide]?.includes(targetY)) {
      setDraggedPiece(null);
      setDraggedFromPosition(null);
      return;
    }

    // Check if target terrain is passable
    const targetTerrainType = getTerrainType(targetX, targetY, mapData);
    if (!isTerrainPassable(targetTerrainType)) {
      setDraggedPiece(null);
      setDraggedFromPosition(null);
      return;
    }

    // Find pieces at source and target positions
    const sourcePiece = setupPieces.find(p => p.position?.x === fromX && p.position?.y === fromY);
    const targetPiece = setupPieces.find(p => p.position?.x === targetX && p.position?.y === targetY);

    if (sourcePiece) {
      const updatedPieces = setupPieces.map(piece => {
        if (piece.id === sourcePiece.id) {
          // Move source piece to target position
          return { ...piece, position: { x: targetX, y: targetY } };
        } else if (targetPiece && piece.id === targetPiece.id) {
          // Move target piece to source position (swap)
          return { ...piece, position: { x: fromX, y: fromY } };
        }
        return piece;
      });

      setSetupPieces(updatedPieces);
    }

    setDraggedPiece(null);
    setDraggedFromPosition(null);
  };

  const handleDragEnd = () => {
    setDraggedPiece(null);
    setDraggedFromPosition(null);
  };

  const handleSetupClick = (x, y) => {
    if (!selectedPieceType) return;
    
    // Check if it's a valid setup position
    if (!mapData.setupRows?.[playerSide]?.includes(y)) return;
    if (gameState.board[y][x]) return; // Square occupied
    
    // Check if terrain is passable
    const terrainType = getTerrainType(x, y, mapData);
    if (!isTerrainPassable(terrainType)) return;

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
      } else if (validMoves.some(move => move && move.x === x && move.y === y)) {
        // Make move
        socket.emit('game_move', {
          gameId,
          fromX,
          fromY,
          toX: x,
          toY: y
        });
      } else if (clickedPiece && clickedPiece.side === playerSide) {
        // Select different piece
        selectPiece(x, y, clickedPiece);
      } else {
        // Invalid move, deselect
        setSelectedSquare(null);
        setValidMoves([]);
      }
    } else if (clickedPiece && clickedPiece.side === playerSide && clickedPiece.moveable) {
      // Select piece
      selectPiece(x, y, clickedPiece);
    }
  };

  const selectPiece = (x, y, piece) => {
    setSelectedSquare({ x, y });
    
    // Calculate valid moves
    const moves = [];
    if (gameState?.board) {
      const boardHeight = mapData?.boardSize?.height || 10;
      const boardWidth = mapData?.boardSize?.width || 10;
      for (let toY = 0; toY < boardHeight; toY++) {
        for (let toX = 0; toX < boardWidth; toX++) {
          if (canMoveTo(x, y, toX, toY, gameState.board, playerSide, mapData)) {
            moves.push({ x: toX, y: toY });
          }
        }
      }
    }
    console.log('Setting valid moves:', moves);
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
    const expectedPieceCount = setupPieces.length;
    
    if (placedPieces.length > 0 && placedPieces.length < expectedPieceCount) {
      alert(`Please place all ${expectedPieceCount} pieces before confirming setup! You have placed ${placedPieces.length}/${expectedPieceCount} pieces.`);
      return;
    }
    
    // If no pieces are placed, we need to show the confirmation dialog
    // If pieces are already placed, we can confirm directly
    if (placedPieces.length === expectedPieceCount) {
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

  const handleLoadPlacement = (placementData) => {
    if (gamePhase !== 'setup' || !armyData) return;

    // Clear current setup pieces
    setSetupPieces([]);
    
    // Generate army pieces with positions from placement
    const army = generateArmy(playerSide, armyData, mapData);
    const placedArmy = army.map((piece, index) => {
      const placement = placementData[index];
      return {
        ...piece,
        position: placement ? { x: placement.x, y: placement.y } : null
      };
    });
    
    setSetupPieces(placedArmy);
  };

  const handleSavePlacement = (savedPlacement) => {
    console.log('Placement saved:', savedPlacement);
    // Could show a success message here
  };

  const getCurrentPlacementData = () => {
    return setupPieces
      .filter(piece => piece.position)
      .map(piece => ({
        type: piece.type,
        x: piece.position.x,
        y: piece.position.y
      }));
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

    // Don't automatically confirm - wait for pieces_placed event
    setShowConfirmDialog(false);
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
      setSetupPieces(generateArmy(playerSide, armyData, mapData));
    }
  }, [gamePhase, hasSelectedArmy, setupPieces.length, playerSide, armyData, mapData]);

  const renderBoard = () => {
    const squares = [];
    console.log('🎮 Rendering board with gameState:', { 
      opponentArmy: gameState?.opponentArmy, 
      phase: gamePhase, 
      playerSide 
    });
    
    const boardHeight = mapData?.boardSize?.height || 10;
    const boardWidth = mapData?.boardSize?.width || 10;
    
    for (let y = 0; y < boardHeight; y++) {
      for (let x = 0; x < boardWidth; x++) {
        let piece = null;
        
        if (gamePhase === 'setup') {
          // Show setup pieces
          piece = setupPieces.find(p => p.position?.x === x && p.position?.y === y);
        } else {
          // Show game pieces
          piece = gameState.board[y]?.[x];
        }

        const isSelected = selectedSquare?.x === x && selectedSquare?.y === y;
        const isValidMove = validMoves.some(move => {
          if (!move || typeof move.x === 'undefined' || typeof move.y === 'undefined') {
            console.error('Invalid move in validMoves array:', move, 'at index:', validMoves.indexOf(move));
            return false;
          }
          return move.x === x && move.y === y;
        });
        const isSetupArea = gamePhase === 'setup' && mapData.setupRows?.[playerSide]?.includes(y);

        squares.push(
          <GameSquare
            key={`${x}-${y}`}
            x={x}
            y={y}
            piece={piece}
            playerSide={playerSide}
            playerArmy={player?.army || selectedArmy}
            opponentArmy={gameState?.opponentArmy}
            gamePhase={gamePhase}
            mapData={mapData}
            isSelected={isSelected}
            isValidMove={isValidMove}
            isSetupArea={isSetupArea}
            isDragTarget={draggedPiece && isSetupArea && isTerrainPassable(getTerrainType(x, y, mapData))}
            onClick={() => handleSquareClick(x, y)}
            onDragStart={() => piece && handleDragStart(piece, x, y)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(x, y)}
            onDragEnd={handleDragEnd}
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

  const handleSendChatMessage = (message) => {
    if (socket && message.trim()) {
      socket.emit('chat_message', {
        gameId,
        message: message.trim()
      });
    }
  };

  // Show army selector if needed
  if (showArmySelector) {
    return (
      <>
        <ArmySelector 
          onSelectArmy={handleArmySelection}
          onCancel={handleCancelArmySelection}
          playerSide={playerSide}
        />
        {/* Show blurred game board in background */}
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none' }}>
          <BoardContainer>
      <BoardWrapper>
        <Board>{hasValidMapData ? renderBoard() : <div>Loading map...</div>}</Board>
        
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
              Pieces placed: {setupPieces.filter(p => p.position).length}/{setupPieces.length}
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
            <PlayerInfo key={player.userId} color={player.side === 'home' ? '#3b82f6' : '#ef4444'}>
              <span>
                {player.username} ({player.side === 'home' ? 'Home' : 'Away'})
                {gamePhase === 'setup' && player.isReady && ' ✓'}
              </span>
              <span>{player.side === playerSide ? '(You)' : ''}</span>
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

  // Show error message if mapData is invalid
  if (!hasValidMapData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <h2>Error: Invalid map data</h2>
        <p>mapData: {JSON.stringify(mapData, null, 2)}</p>
        <p>Please refresh the page or contact support.</p>
      </div>
    );
  }

  return (
    <>
      {combatData && (
        <CombatModal 
          combatData={combatData} 
          onClose={() => {
            setCombatData(null);
            // Check if there's a pending game result to show after combat
            if (gamePhase === 'finished' && !gameResult) {
              setTimeout(() => {
                setGameResult({ 
                  winner: gameState.winner, 
                  reason: gameState.lastMove?.winReason || 'game_over' 
                });
              }, 500);
            }
          }}
        />
      )}
      
      {gameResult && (
        <GameResultModal 
          gameResult={gameResult}
          playerSide={playerSide}
          players={localPlayers}
          onExit={() => {
            setGameResult(null);
            // TODO: Navigate back to lobby/home
            window.location.href = '/';
          }}
        />
      )}
      
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
                  Pieces placed: {setupPieces.filter(p => p.position).length}/{setupPieces.length}
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
            <PlayerInfo key={player.userId} color={player.side === 'home' ? '#3b82f6' : '#ef4444'}>
              <span>
                {player.username} ({player.side === 'home' ? 'Home' : 'Away'})
                {gamePhase === 'setup' && player.isReady && ' ✓'}
              </span>
              <span>{player.side === playerSide ? '(You)' : ''}</span>
            </PlayerInfo>
          ))}
        </InfoSection>

        {gamePhase === 'setup' && (
          <InfoSection>
            <InfoTitle>Setup</InfoTitle>
            <PlacementSelector
              mapId={mapData?.id}
              currentPlacements={getCurrentPlacementData()}
              onLoadPlacement={handleLoadPlacement}
              onSavePlacement={handleSavePlacement}
              disabled={!hasSelectedArmy || !armyData}
              expectedPieceCount={setupPieces.length}
            />
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

        <InfoSection>
          <ChatBox
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUserId={user.id}
            players={localPlayers}
          />
        </InfoSection>
      </GameInfo>
    </BoardContainer>
    </>
  );
}

export default GameBoard;