import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import styled from 'styled-components';

import { AuthProvider, useAuth } from './hooks/useAuth';
import { SocketProvider } from './hooks/useSocket';

import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Game from './pages/Game';
import Profile from './pages/Profile';

import Header from './components/UI/Header';

const AppContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #2d3436 0%, #636e72 100%);
  color: #e8f4f8;
`;

const MainContent = styled.main`
  padding-top: 70px; // Account for fixed header
  min-height: calc(100vh - 70px);

  @media (max-width: 768px) {
    padding-top: 60px;
    min-height: calc(100vh - 60px);
  }
`;

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/" />;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Router>
      <AppContainer>
        {user && <Header />}
        <MainContent>
          <Routes>
            <Route path="/" element={user ? <Navigate to="/lobby" /> : <Home />} />
            <Route 
              path="/lobby" 
              element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game/:gameId?" 
              element={
                <ProtectedRoute>
                  <Game />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:username?" 
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppRoutes />
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;