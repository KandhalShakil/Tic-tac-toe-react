import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Game from './components/Game';
import GameStats from './components/GameStats';
import AuthModal from './components/Auth/AuthModal';
import UserProfile from './components/Auth/UserProfile';
import './App.css';

/**
 * Main App content component that uses authentication
 */
const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner">🎮</div>
          <p>Loading your game...</p>
        </div>
      </div>
    );
  }

  // Show authentication modal if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="App">
        <div className="welcome-container">
          <h1 className="welcome-title">🎮 Tic-Tac-Toe Champions</h1>
          <p className="welcome-subtitle">Join the ultimate battle of X's and O's!</p>
          
          <div className="welcome-features">
            <div className="feature-item">
              <span className="feature-icon">🤖</span>
              <h3>AI Opponents</h3>
              <p>Challenge our smart AI with 3 difficulty levels</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <h3>Track Stats</h3>
              <p>Monitor your wins, losses, and improvement</p>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🏆</span>
              <h3>Compete</h3>
              <p>Climb the leaderboards and prove your skills</p>
            </div>
          </div>

          <div className="welcome-actions">
            <button 
              className="auth-button primary"
              onClick={() => {
                setAuthMode('register');
                setShowAuthModal(true);
              }}
            >
              🚀 Get Started
            </button>
            <button 
              className="auth-button secondary"
              onClick={() => {
                setAuthMode('login');
                setShowAuthModal(true);
              }}
            >
              🎯 Sign In
            </button>
          </div>
        </div>

        <AuthModal 
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialMode={authMode}
        />
      </div>
    );
  }

  // Show authenticated app content
  return (
    <div className="App">
      <div className="app-container">
        <div className="app-header">
          <UserProfile />
        </div>
        <div className="game-container">
          <Game />
        </div>
        <div className="stats-container">
          <GameStats />
        </div>
      </div>
    </div>
  );
};

/**
 * Main App component with AuthProvider wrapper
 */
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
