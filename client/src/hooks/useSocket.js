import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

const SocketContext = createContext();

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3001';

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      const token = localStorage.getItem('token');
      if (!token) return;

      // Create socket connection
      const newSocket = io(SOCKET_URL, {
        auth: {
          token
        }
      });

      newSocket.on('connect', () => {
        console.log('Connected to server');
        setConnected(true);
      });

      newSocket.on('disconnect', () => {
        console.log('Disconnected from server');
        setConnected(false);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        setConnected(false);
      });

      // Handle user status updates
      newSocket.on('user_online', (userData) => {
        setOnlineUsers(prev => {
          const filtered = prev.filter(u => u.userId !== userData.userId);
          return [...filtered, userData];
        });
      });

      newSocket.on('user_offline', (userData) => {
        setOnlineUsers(prev => prev.filter(u => u.userId !== userData.userId));
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    } else {
      // Clean up socket when user logs out
      if (socket) {
        socket.close();
        setSocket(null);
        setConnected(false);
        setOnlineUsers([]);
      }
    }
  }, [user]);

  // Socket event handlers
  const joinLobby = () => {
    if (socket && connected) {
      socket.emit('join_lobby');
    }
  };

  const leaveLobby = () => {
    if (socket && connected) {
      socket.emit('leave_lobby');
    }
  };

  const sendChatMessage = (message, gameId = null) => {
    if (socket && connected) {
      socket.emit('chat_message', { message, gameId });
    }
  };

  const invitePlayer = (targetUserId) => {
    if (socket && connected) {
      socket.emit('invite_player', { targetUserId });
    }
  };

  const respondToInvitation = (fromUserId, accepted) => {
    if (socket && connected) {
      socket.emit('invitation_response', { fromUserId, accepted });
    }
  };

  const joinGame = (gameId) => {
    if (socket && connected) {
      socket.emit('join_game', { gameId });
    }
  };

  const leaveGame = (gameId) => {
    if (socket && connected) {
      socket.emit('leave_game', { gameId });
    }
  };

  const makeMove = (moveData) => {
    if (socket && connected) {
      socket.emit('game_move', moveData);
    }
  };

  const value = {
    socket,
    connected,
    onlineUsers,
    joinLobby,
    leaveLobby,
    sendChatMessage,
    invitePlayer,
    respondToInvitation,
    joinGame,
    leaveGame,
    makeMove
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};