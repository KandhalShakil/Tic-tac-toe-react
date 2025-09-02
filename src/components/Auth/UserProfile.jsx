import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Auth.css';

const UserProfile = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="user-profile">
      <div className="user-avatar">
        {user.avatar}
      </div>
      <div className="user-info">
        <h3>Welcome, {user.username}! 👋</h3>
        <p>{user.email}</p>
        <div className="user-stats">
          <div className="stat-item">
            <div className="stat-value">{user.stats.gamesPlayed}</div>
            <div className="stat-label">Games</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user.stats.gamesWon}</div>
            <div className="stat-label">Wins</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{user.stats.winRate}%</div>
            <div className="stat-label">Win Rate</div>
          </div>
        </div>
      </div>
      <button 
        className="logout-button"
        onClick={logout}
        title="Logout"
      >
        🚪 Logout
      </button>
    </div>
  );
};

export default UserProfile;
