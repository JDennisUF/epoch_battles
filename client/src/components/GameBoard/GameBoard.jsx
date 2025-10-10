import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../hooks/useSocket';
import { useAuth } from '../../hooks/useAuth';
import GameSquare from './GameSquare';
import PieceSelector from './PieceSelector';
import SavedPlacementsModal from './SavedPlacementsModal';
import { GAME_CONFIG, getTerrainType, canMoveTo, generateArmy, loadTerrainData, loadAbilitiesData, isTerrainPassable, hasAbility, getReconTokens, arePositionsAdjacent } from '../../utils/gameLogic';
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
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  min-height: 100vh;

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
  background: linear-gradient(145deg, #5a6c57 0%, #3e4a3b 100%);
  padding: 15px;
  border-radius: 10px;
  border: 3px solid #2d3436;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 2px 4px rgba(255, 255, 255, 0.1);
  width: 1050px;
  height: 1050px;

  @media (max-width: 768px) {
    width: 750px;
    height: 750px;
  }
`;

const GameInfo = styled.div`
  background: linear-gradient(145deg, #4a5d4a 0%, #3e4a3b 100%);
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #2d3436;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  min-width: 400px;
  width: 400px;
  height: fit-content;
  color: #e8f4f8;
  
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
  color: #c19a6b;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  border-bottom: 2px solid #8b7355;
  padding-bottom: 5px;
`;

const PlayerInfo = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'color'
})`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin: 8px 0;
  background: linear-gradient(135deg, #556b2f 0%, #3e4a3b 100%);
  border-radius: 8px;
  border-left: 4px solid ${props => props.color};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  color: #f1f3f4;
  font-weight: 500;
`;

const PhaseIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'phase'
})`
  text-align: center;
  padding: 12px;
  background: ${props => {
    switch (props.phase) {
      case 'setup': return 'linear-gradient(135deg, #b8860b 0%, #8b7355 100%)';
      case 'playing': return 'linear-gradient(135deg, #6b8e23 0%, #556b2f 100%)';
      case 'finished': return 'linear-gradient(135deg, #8b4513 0%, #654321 100%)';
      default: return 'linear-gradient(135deg, #696969 0%, #2f4f4f 100%)';
    }
  }};
  border-radius: 8px;
  border: 2px solid #2d3436;
  font-weight: 600;
  margin-bottom: 20px;
  color: #f1f3f4;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ActionButton = styled.button`
  background: linear-gradient(135deg, #8b7355 0%, #6b5b3c 100%);
  border: 2px solid #5a4a3a;
  color: #f1f3f4;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin: 6px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #a0845a 0%, #7d6843 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
  }
`;

const CancelButton = styled.button`
  background: linear-gradient(135deg, #8b4513 0%, #654321 100%);
  border: 2px solid #5a2d0c;
  color: #f1f3f4;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  margin: 6px;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #a0522d 0%, #8b4513 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
  }
`;

const LastMoveInfo = styled.div`
  background: linear-gradient(135deg, #3e4a3b 0%, #2d3436 100%);
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #5a6c57;
  font-size: 0.9rem;
  margin-top: 10px;
  color: #c19a6b;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const SelectedUnitPanel = styled.div`
  background: linear-gradient(145deg, #4a5d4a 0%, #3e4a3b 100%);
  border: 2px solid #5a6c57;
  border-radius: 10px;
  padding: 15px;
  margin-bottom: 15px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
`;

const UnitImageContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
  position: relative;
`;

const UnitImage = styled.img`
  width: 256px;
  height: 256px;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const UnitName = styled.h4`
  margin: 8px 0 4px 0;
  color: #c19a6b;
  font-size: 1.1rem;
  font-weight: 600;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
`;

const UnitRank = styled.div`
  color: #a8b2a5;
  font-size: 0.9rem;
  margin-bottom: 8px;
  font-weight: 500;
`;

const AbilitiesList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.85rem;
`;

const AbilityItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #e8f4f8;
  padding: 6px 12px;
  background: linear-gradient(135deg, #3e4a3b 0%, #2d3436 100%);
  border-radius: 6px;
  border: 1px solid #5a6c57;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
`;

const AbilityIconSmall = styled.img`
  width: 16px;
  height: 16px;
  filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.8));
`;

const SelectedUnitAbilityIndicator = styled.div.withConfig({
  shouldForwardProp: (prop) => !['position'].includes(prop)
})`
  position: absolute;
  ${props => props.position === 'topLeft' ? 'top: 4px; left: 4px;' : ''}
  ${props => props.position === 'topRight' ? 'top: 4px; right: 4px;' : ''}
  ${props => props.position === 'bottomLeft' ? 'bottom: 4px; left: 4px;' : ''}
  ${props => props.position === 'bottomRight' ? 'bottom: 4px; right: 4px;' : ''}
  background: transparent;
  z-index: 3;
  line-height: 1;
`;

const SelectedUnitAbilityIcon = styled.img`
  width: 32px;
  height: 32px;
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.8));
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
`;

const BackButton = styled.button`
  background: linear-gradient(135deg, #8b7355 0%, #6b5b3c 100%);
  border: 2px solid #5a4a3a;
  color: #f1f3f4;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-size: 0.9rem;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  white-space: nowrap;

  &:hover:not(:disabled) {
    background: linear-gradient(135deg, #a0845a 0%, #7d6843 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: linear-gradient(135deg, #6a6a6a 0%, #4a4a4a 100%);
  }
`;

function GameBoard({ gameId, gameState: initialGameState, players, onBackToLobby }) {
  const [gameState, setGameState] = useState(initialGameState);
  const [selectedSquare, setSelectedSquare] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [reconMode, setReconMode] = useState(null); // { piece: pieceData, fromX, fromY }
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
  const [showSavedPlacements, setShowSavedPlacements] = useState(false);
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

  // Load terrain and abilities data on component mount
  useEffect(() => {
    loadTerrainData().catch(error => {
      console.error('Failed to load terrain data:', error);
    });
    loadAbilitiesData().catch(error => {
      console.error('Failed to load abilities data:', error);
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
      // Don't show the game result immediately - let it be shown when combat modal closes
      // The combat modal's onClose handler will check for finished games and show the result
      console.log('Game finished event received, result will be shown after combat modal closes');
    };

    const handleReconUsed = (data) => {
      console.log('Recon used:', data);
      // Update game state with revealed unit and decremented tokens
      setGameState(data.gameState);
      // Exit recon mode
      setReconMode(null);
      setSelectedSquare(null);
      setValidMoves([]);
    };

    const handleReconError = (data) => {
      console.error('Recon error:', data);
      alert(`Recon error: ${data.message}`);
      // Exit recon mode on error
      setReconMode(null);
      setSelectedSquare(null);
      setValidMoves([]);
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
    socket.on('recon_used', handleReconUsed);
    socket.on('recon_error', handleReconError);

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
      socket.off('recon_used', handleReconUsed);
      socket.off('recon_error', handleReconError);
    };
  }, [socket]);

  // Coordinate transformation helpers for flipping home player's view
  const transformCoordinatesForDisplay = (gameX, gameY, playerSide, boardHeight = 10, boardWidth = 10) => {
    if (playerSide === 'home') {
      // Flip both vertically AND horizontally for home player (180 degree rotation)
      return { 
        x: (boardWidth - 1) - gameX,   // Flip horizontally
        y: (boardHeight - 1) - gameY   // Flip vertically
      };
    } else {
      // No transformation for away player
      return { x: gameX, y: gameY };
    }
  };

  const transformCoordinatesFromDisplay = (displayX, displayY, playerSide, boardHeight = 10, boardWidth = 10) => {
    if (playerSide === 'home') {
      // Convert display coordinates back to game coordinates for home player (reverse 180 degree rotation)
      return { 
        x: (boardWidth - 1) - displayX,   // Reverse horizontal flip
        y: (boardHeight - 1) - displayY   // Reverse vertical flip
      };
    } else {
      // No transformation for away player
      return { x: displayX, y: displayY };
    }
  };

  const handleSquareClick = (displayX, displayY) => {
    // Transform display coordinates back to game coordinates
    const { x: gameX, y: gameY } = transformCoordinatesFromDisplay(
      displayX, 
      displayY, 
      playerSide, 
      mapData?.boardSize?.height || 10,
      mapData?.boardSize?.width || 10
    );
    
    if (gamePhase === 'setup') {
      handleSetupClick(gameX, gameY);
    } else if (gamePhase === 'playing' && isCurrentTurn) {
      handleGameClick(gameX, gameY);
    }
  };

  const handleDragStart = (piece, displayX, displayY) => {
    if (gamePhase !== 'setup') return;
    
    // Transform display coordinates back to game coordinates
    const { x: gameX, y: gameY } = transformCoordinatesFromDisplay(
      displayX, 
      displayY, 
      playerSide, 
      mapData?.boardSize?.height || 10,
      mapData?.boardSize?.width || 10
    );
    
    setDraggedPiece(piece);
    setDraggedFromPosition({ x: gameX, y: gameY });
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
  };

  const handleDrop = (displayTargetX, displayTargetY) => {
    if (!draggedPiece || !draggedFromPosition || gamePhase !== 'setup') return;

    // Transform display coordinates back to game coordinates
    const { x: targetX, y: targetY } = transformCoordinatesFromDisplay(
      displayTargetX, 
      displayTargetY, 
      playerSide, 
      mapData?.boardSize?.height || 10,
      mapData?.boardSize?.width || 10
    );

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

    // Handle Recon mode
    if (reconMode) {
      // Check if clicking on enemy piece that is not adjacent to recon unit
      if (clickedPiece && clickedPiece.side !== playerSide && !clickedPiece.revealed) {
        const { fromX, fromY } = reconMode || {};
        
        // Ensure coordinates are valid
        if (fromX === undefined || fromY === undefined) {
          setReconMode(null);
          return;
        }
        
        // Check if target is not adjacent (using orthogonal adjacency only)
        const isAdjacent = arePositionsAdjacent(fromX, fromY, x, y);
        
        if (!isAdjacent) {
          // Execute Recon action
          socket.emit('game_recon', {
            gameId,
            fromX,
            fromY,
            targetX: x,
            targetY: y
          });
          
          // Exit Recon mode
          setReconMode(null);
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      }
      
      // Cancel Recon mode if clicking elsewhere
      setReconMode(null);
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (selectedSquare) {
      const { x: fromX, y: fromY } = selectedSquare;
      const selectedPiece = board[fromY]?.[fromX];
      
      if (fromX === x && fromY === y) {
        // If clicking same piece again, check for Recon ability
        if (hasAbility(selectedPiece, 'recon') && getReconTokens(selectedPiece) > 0) {
          setReconMode({ piece: selectedPiece, fromX, fromY });
          setValidMoves([]); // Clear movement highlights
          return;
        }
        
        // Otherwise deselect
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

  // Get the currently selected piece
  const getSelectedPiece = () => {
    if (!selectedSquare) return null;
    
    if (gamePhase === 'setup') {
      return setupPieces.find(p => p.position?.x === selectedSquare.x && p.position?.y === selectedSquare.y);
    } else {
      return gameState.board[selectedSquare.y]?.[selectedSquare.x];
    }
  };

  // Helper to check if piece has a specific ability
  const hasAbility = (piece, abilityName) => {
    if (!piece?.abilities) return false;
    
    return piece.abilities.some(ability => {
      if (typeof ability === 'string') {
        return ability === abilityName;
      } else if (typeof ability === 'object') {
        return ability.id === abilityName;
      }
      return false;
    });
  };

  // Get ability display name and description
  const getAbilityInfo = (ability) => {
    if (typeof ability === 'string') {
      switch (ability) {
        case 'flying':
          return { name: 'Flying', description: 'Can move over water terrain', icon: '/data/icons/abilities/flying.png' };
        case 'mobile':
          return { name: 'Mobile', description: 'Can move multiple spaces', icon: '/data/icons/abilities/mobile.png' };
        case 'trap_sense':
          return { name: 'Trap Sense', description: 'Can detect and avoid traps', icon: '/data/icons/abilities/trap_sense.png' };
        case 'assassin':
          return { name: 'Assassin', description: 'Can eliminate high-ranking targets', icon: '/data/icons/abilities/assassin.png' };
        case 'charge':
          return { name: 'Charge', description: 'Can attack units 2 squares away', icon: '/data/icons/abilities/charge.png' };
        case 'sniper':
          return { name: 'Sniper', description: 'Can attack units 2 squares away, shoots over water', icon: '/data/icons/abilities/sniper.png' };
        case 'fear':
          return { name: 'Fear', description: 'Adjacent enemies lose 1 rank in combat', icon: '/data/icons/abilities/fear.png' };
        case 'curse':
          return { name: 'Curse', description: 'Units that defeat this unit are permanently weakened', icon: '/data/icons/abilities/curse.png' };
        case 'veteran':
          return { name: 'Veteran', description: 'Gets stronger when defeating enemies', icon: '/data/icons/abilities/veteran.png' };
        default:
          return { name: ability, description: 'Special ability', icon: null };
      }
    } else if (typeof ability === 'object') {
      const baseInfo = getAbilityInfo(ability.id);
      if (ability.id === 'mobile' && ability.spaces) {
        return { ...baseInfo, description: `Can move up to ${ability.spaces} spaces` };
      }
      return baseInfo;
    }
    return { name: 'Unknown', description: 'Special ability', icon: null };
  };

  // Helper function to render ability indicators for selected unit
  const renderSelectedUnitAbilityIndicators = (piece) => {
    const indicators = [];
    
    if (hasAbility(piece, 'flying')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="flying" 
          position="topLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/flying.png"
            alt="Flying"
            title="Flying: Can move over water terrain"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'mobile')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="mobile" 
          position="bottomRight"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/mobile.png"
            alt="Mobile"
            title="Mobile: Can move multiple spaces"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'charge')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="charge" 
          position="topLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/charge.png"
            alt="Charge"
            title="Charge: Can attack units 2 squares away"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'sniper')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="sniper" 
          position="topRight"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/sniper.png"
            alt="Sniper"
            title="Sniper: Can attack units 2 squares away, shoots over water"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'fear')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="fear" 
          position="topLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/fear.png"
            alt="Fear"
            title="Fear: Adjacent enemies lose 1 rank in combat"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'curse')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="curse" 
          position="bottomLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/curse.png"
            alt="Curse"
            title="Curse: Units that defeat this unit are permanently weakened"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'veteran')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="veteran" 
          position="topRight"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/veteran.png"
            alt="Veteran"
            title="Veteran: Gets stronger when defeating enemies"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'trap_sense')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="trap_sense" 
          position="bottomLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/trap_sense.png"
            alt="Trap Sense"
            title="Trap Sense: Can detect and avoid traps"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'assassin')) {
      indicators.push(
        <SelectedUnitAbilityIndicator 
          key="assassin" 
          position="bottomLeft"
        >
          <SelectedUnitAbilityIcon 
            src="/data/icons/abilities/assassin.png"
            alt="Assassin"
            title="Assassin: Can eliminate high-ranking targets"
          />
        </SelectedUnitAbilityIndicator>
      );
    }
    
    if (hasAbility(piece, 'recon')) {
      const tokens = getReconTokens(piece);
      if (tokens > 0) {
        indicators.push(
          <SelectedUnitAbilityIndicator 
            key="recon" 
            position="topRight"
          >
            <SelectedUnitAbilityIcon 
              src="/data/icons/abilities/recon.png"
              alt="Recon"
              title={`Recon: Can reveal ${tokens} enemy units per game`}
            />
          </SelectedUnitAbilityIndicator>
        );
      }
    }
    
    return indicators;
  };

  // Render the selected unit panel
  const renderSelectedUnitPanel = () => {
    const piece = getSelectedPiece();
    if (!piece || piece.side !== playerSide) return null;

    const playerArmy = player?.army || selectedArmy;
    if (!playerArmy) return null;

    const imagePath = `/data/armies/${playerArmy}/256x256/${piece.type}.png`;

    return (
      <SelectedUnitPanel>
        <UnitImageContainer>
          <UnitImage 
            src={imagePath} 
            alt={piece.name || piece.type}
          />
          {renderSelectedUnitAbilityIndicators(piece)}
        </UnitImageContainer>
        <UnitName>{piece.name || piece.type}</UnitName>
        {piece.rank && <UnitRank>Rank {piece.rank}</UnitRank>}
        
        {piece.abilities && piece.abilities.length > 0 && (
          <AbilitiesList>
            {piece.abilities.map((ability, index) => {
              const abilityInfo = getAbilityInfo(ability);
              return (
                <AbilityItem key={index}>
                  {abilityInfo.icon && (
                    <AbilityIconSmall 
                      src={abilityInfo.icon} 
                      alt={abilityInfo.name}
                      onError={(e) => e.target.style.display = 'none'}
                    />
                  )}
                  <span>{abilityInfo.name}</span>
                  <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>- {abilityInfo.description}</span>
                </AbilityItem>
              );
            })}
          </AbilitiesList>
        )}
      </SelectedUnitPanel>
    );
  };

  const renderBoard = () => {
    const squares = [];
    console.log('🎮 Rendering board with gameState:', { 
      opponentArmy: gameState?.opponentArmy, 
      phase: gamePhase, 
      playerSide 
    });
    
    const boardHeight = mapData?.boardSize?.height || 10;
    const boardWidth = mapData?.boardSize?.width || 10;
    
    // Create array to store squares in display order
    const displaySquares = [];
    
    // Generate squares in game coordinate order first
    for (let gameY = 0; gameY < boardHeight; gameY++) {
      for (let gameX = 0; gameX < boardWidth; gameX++) {
        let piece = null;
        
        if (gamePhase === 'setup') {
          // Show setup pieces (using game coordinates)
          piece = setupPieces.find(p => p.position?.x === gameX && p.position?.y === gameY);
        } else {
          // Show game pieces (using game coordinates)
          piece = gameState?.board?.[gameY]?.[gameX];
        }

        // Transform game coordinates to display coordinates
        const { x: displayX, y: displayY } = transformCoordinatesForDisplay(
          gameX, 
          gameY, 
          playerSide, 
          boardHeight,
          boardWidth
        );

        const isSelected = selectedSquare?.x === gameX && selectedSquare?.y === gameY;
        const isValidMove = validMoves.some(move => {
          if (!move || typeof move.x === 'undefined' || typeof move.y === 'undefined') {
            console.error('Invalid move in validMoves array:', move, 'at index:', validMoves.indexOf(move));
            return false;
          }
          return move.x === gameX && move.y === gameY;
        });
        const isSetupArea = gamePhase === 'setup' && mapData.setupRows?.[playerSide]?.includes(gameY);
        
        // Check if this square is a valid Recon target
        const isReconTarget = reconMode && reconMode.fromX !== undefined && reconMode.fromY !== undefined && 
          piece && piece.side !== playerSide && !piece.revealed && 
          !arePositionsAdjacent(reconMode.fromX, reconMode.fromY, gameX, gameY);

        const square = {
          displayX,
          displayY,
          gameX,
          gameY,
          element: (
            <GameSquare
              key={`${gameX}-${gameY}`}
              x={displayX}  // Display coordinates for click handling
              y={displayY}
              gameX={gameX}  // Game coordinates for terrain/logic calculations
              gameY={gameY}
              piece={piece}
              playerSide={playerSide}
              playerArmy={player?.army || selectedArmy}
              opponentArmy={gameState?.opponentArmy}
              gamePhase={gamePhase}
              mapData={mapData}
              board={gameState?.board}
              isSelected={isSelected}
              isValidMove={isValidMove}
              isSetupArea={isSetupArea}
              isReconTarget={isReconTarget}
              isDragTarget={draggedPiece && isSetupArea && isTerrainPassable(getTerrainType(gameX, gameY, mapData))}
              onClick={() => handleSquareClick(displayX, displayY)}
              onDragStart={() => piece && handleDragStart(piece, displayX, displayY)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(displayX, displayY)}
              onDragEnd={handleDragEnd}
            />
          )
        };
        
        displaySquares.push(square);
      }
    }
    
    // Sort squares by display coordinates for proper grid rendering
    displaySquares.sort((a, b) => {
      if (a.displayY !== b.displayY) {
        return a.displayY - b.displayY; // Sort by row first
      }
      return a.displayX - b.displayX; // Then by column
    });
    
    // Extract the sorted elements
    return displaySquares.map(square => square.element);
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
            <PlayerInfo key={player.userId} color={player.side === 'home' ? '#6b8e23' : '#8b4513'}>
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
            {gameState.lastMove && gameState.lastMove.from && gameState.lastMove.to && (
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
            // Keep player at the completed game map
          }}
        />
      )}
      
      <SavedPlacementsModal
        isOpen={showSavedPlacements}
        onClose={() => setShowSavedPlacements(false)}
        mapId={mapData?.id}
        currentPlacements={getCurrentPlacementData()}
        onLoadPlacement={handleLoadPlacement}
        onSavePlacement={handleSavePlacement}
        expectedPieceCount={setupPieces.length}
      />
      
      <BoardContainer>
        <BoardWrapper>
          <Board>{renderBoard()}</Board>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', gap: '20px' }}>
            <div style={{ flex: '0 0 auto' }}>
              {onBackToLobby && (
                <BackButton onClick={onBackToLobby}>
                  ← Back to Lobby
                </BackButton>
              )}
            </div>
            
            <div style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
              {gamePhase === 'setup' && !isPlayerReady && !showConfirmDialog && (
                <>
                  <ActionButton onClick={handleRandomSetup}>
                    Random Setup
                  </ActionButton>
                  <ActionButton onClick={() => setShowSavedPlacements(true)}>
                    Saved Placements
                  </ActionButton>
                  <ActionButton onClick={handleConfirmSetup}>
                    Confirm Setup
                  </ActionButton>
                </>
              )}
              {gamePhase === 'setup' && showConfirmDialog && (
                <>
                  <ActionButton onClick={handleConfirmOK}>
                    OK (Use Random Setup)
                  </ActionButton>
                  <CancelButton onClick={handleConfirmCancel}>
                    Cancel
                  </CancelButton>
                </>
              )}
            </div>
          </div>
          
          {gamePhase === 'setup' && (
            <div style={{ marginTop: '10px', fontSize: '0.9rem', textAlign: 'center' }}>
              {!isPlayerReady && !showConfirmDialog && (
                <div style={{ color: '#c19a6b' }}>
                  Pieces placed: {setupPieces.filter(p => p.position).length}/{setupPieces.length}
                </div>
              )}
              {showConfirmDialog && (
                <div style={{ color: '#fbbf24' }}>
                  No pieces placed manually. Confirm to use random setup?
                </div>
              )}
              {isPlayerReady && (
                <div style={{ color: '#4ade80' }}>
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
            <PlayerInfo key={player.userId} color={player.side === 'home' ? '#6b8e23' : '#8b4513'}>
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
              armyData={armyData}
            />
          </InfoSection>
        )}

        {gamePhase === 'playing' && (
          <InfoSection>
            <InfoTitle>Game Status</InfoTitle>
            <div>Turn: {gameState.turnNumber}</div>
            <div>Current Player: {gameState.currentPlayer}</div>
            {gameState.lastMove && gameState.lastMove.from && gameState.lastMove.to && (
              <LastMoveInfo>
                Last Move: {gameState.lastMove.type} from ({gameState.lastMove.from.x}, {gameState.lastMove.from.y}) to ({gameState.lastMove.to.x}, {gameState.lastMove.to.y})
              </LastMoveInfo>
            )}
          </InfoSection>
        )}

        {gamePhase === 'playing' && renderSelectedUnitPanel()}

        <InfoSection>
          <ChatBox
            messages={chatMessages}
            onSendMessage={handleSendChatMessage}
            currentUserId={user.id}
            players={localPlayers}
            gamePhase={gamePhase}
          />
        </InfoSection>
      </GameInfo>
    </BoardContainer>
    </>
  );
}

export default GameBoard;