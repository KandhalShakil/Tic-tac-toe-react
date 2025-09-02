import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './GameStats.css';

const GameStats = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState('summary');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');
  const [lastFetched, setLastFetched] = useState(0);
  const MIN_FETCH_INTERVAL = 10000; // 10 seconds minimum between fetches

  useEffect(() => {
    const initializeData = async () => {
      if (user && token) {
        // Initial load of data
        fetchDataWithThrottling();
      }
    };
    
    initializeData();
    
    const refreshInterval = setInterval(() => {
      if (user && token) {
        fetchDataWithThrottling();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(refreshInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, token]);
  
  // Throttled data fetching
  const fetchDataWithThrottling = () => {
    const now = Date.now();
    if (now - lastFetched > MIN_FETCH_INTERVAL) {
      loadStats();
      loadGameHistory(historyPage);
      setLastFetched(now);
    }
  };

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('https://tic-tac-toe-react-roks.onrender.com/api/game/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache' // Prevent browser caching
        }
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setError(data.message || 'Failed to load statistics');
      }
    } catch (err) {
      setError('Error loading statistics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadGameHistory = async (page = 1, filters = {}) => {
    try {
      setLoading(true);
      
      // Build query string from filters
      const queryParams = new URLSearchParams({
        page,
        limit: 5,
        ...(filters.gameType && { gameType: filters.gameType }),
        ...(filters.result && { result: filters.result }),
        // Add a timestamp to prevent caching
        _t: Date.now()
      });
      
      const response = await fetch(`https://tic-tac-toe-react-roks.onrender.com/api/game/history?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });

      const data = await response.json();
      if (data.success) {
        setGameHistory(data.games);
        setHistoryPage(data.pagination.page);
        setTotalPages(data.pagination.totalPages);
      } else {
        setError(data.message || 'Failed to load game history');
      }
    } catch (err) {
      setError('Error loading game history. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const renderSummaryTab = () => {
    if (!stats) return <div className="stats-loading">Loading stats...</div>;
    
    return (
      <div className="stats-summary">
        <div className="stats-summary-section">
          <h3>Overall Performance</h3>
          <div className="stats-cards">
            <div className="stats-card">
              <h4>Games Played</h4>
              <p className="stats-number">{stats.basic.gamesPlayed}</p>
            </div>
            <div className="stats-card">
              <h4>Win Rate</h4>
              <p className="stats-number">{stats.basic.winRate}%</p>
            </div>
            <div className="stats-card">
              <h4>Wins</h4>
              <p className="stats-number">{stats.basic.gamesWon}</p>
            </div>
            <div className="stats-card">
              <h4>Losses</h4>
              <p className="stats-number">{stats.basic.gamesLost}</p>
            </div>
            <div className="stats-card">
              <h4>Draws</h4>
              <p className="stats-number">{stats.basic.gamesDraw}</p>
            </div>
          </div>
        </div>
        
        <div className="stats-summary-section">
          <h3>AI Performance</h3>
          <div className="stats-ai-cards">
            {stats.detailed.aiPerformance && Object.keys(stats.detailed.aiPerformance).map(difficulty => (
              <div className="stats-ai-card" key={difficulty}>
                <h4>{difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} AI</h4>
                <div className="stats-ai-data">
                  <p>Games: {stats.detailed.aiPerformance[difficulty].total}</p>
                  <p>Wins: {stats.detailed.aiPerformance[difficulty].wins}</p>
                  <p>Win Rate: {stats.detailed.aiPerformance[difficulty].winRate}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="stats-summary-section">
          <h3>Recent Form</h3>
          <div className="stats-recent-form">
            {stats.detailed.recentForm && stats.detailed.recentForm.map((result, index) => (
              <div 
                key={index} 
                className={`form-indicator ${result === 'win' ? 'win' : result === 'lose' ? 'lose' : 'draw'}`}
                title={result.charAt(0).toUpperCase() + result.slice(1)}
              >
                {result === 'win' ? 'W' : result === 'lose' ? 'L' : 'D'}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryTab = () => {
    return (
      <div className="game-history">
        <div className="history-filters">
          <div className="filter-header">
            <h4 className="filter-title">🎮 Game Filters</h4>
            <div className="filter-status">
              {(difficultyFilter !== 'all' || resultFilter !== 'all') && (
                <div className="active-filters">
                  <span className="filter-indicator">
                    🔍 Active: {difficultyFilter !== 'all' && difficultyFilter}{' '}
                    {resultFilter !== 'all' && resultFilter}
                  </span>
                  <button 
                    className="clear-filters-btn"
                    onClick={() => {
                      setDifficultyFilter('all');
                      setResultFilter('all');
                    }}
                  >
                    ✕ Clear All
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="filter-controls">
            <div className="filter-group">
              <label>🎯 Game Type</label>
              <select 
                value={difficultyFilter} 
                onChange={(e) => setDifficultyFilter(e.target.value)}
              >
                <option value="all">🌟 All Games</option>
                <option value="ai">🤖 vs AI</option>
                <option value="human">👤 vs Human</option>
              </select>
            </div>
            
            <div className="filter-group">
              <label>🏆 Game Result</label>
              <select 
                value={resultFilter} 
                onChange={(e) => setResultFilter(e.target.value)}
              >
                <option value="all">📊 All Results</option>
                <option value="win">🎉 Wins Only</option>
                <option value="lose">😔 Losses Only</option>
                <option value="draw">🤝 Draws Only</option>
              </select>
            </div>
          </div>
        </div>
        
        {gameHistory.length === 0 ? (
          <div className="no-games">No games found</div>
        ) : (
          <>
            <div className="history-list">
              {gameHistory.map(game => (
                <div className="history-item" key={game.id}>
                  <div className="history-item-header">
                    <div className="game-date">{formatDate(game.completedAt)}</div>
                    <div className={`game-result ${game.result}`}>
                      {game.result.charAt(0).toUpperCase() + game.result.slice(1)}
                    </div>
                  </div>
                  
                  <div className="history-item-body">
                    <div className="game-type">
                      {game.gameType === 'ai' 
                        ? `vs AI (${game.aiDifficulty.charAt(0).toUpperCase() + game.aiDifficulty.slice(1)})` 
                        : 'vs Human'}
                    </div>
                    <div className="game-details">
                      <div>Moves: {game.totalMoves}</div>
                      <div>Complexity: {game.gameComplexity.charAt(0).toUpperCase() + game.gameComplexity.slice(1)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="pagination">
              <button 
                disabled={historyPage === 1}
                onClick={() => loadGameHistory(historyPage - 1)}
              >
                Previous
              </button>
              <span>Page {historyPage} of {totalPages}</span>
              <button 
                disabled={historyPage === totalPages}
                onClick={() => loadGameHistory(historyPage + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  if (error) {
    return <div className="stats-error">{error}</div>;
  }

  return (
    <div className="game-stats-container">
      {/* Loading overlay that only shows during data refresh */}
      <div className={`loading-overlay ${loading ? 'visible' : ''}`}>
        <div className="loading-spinner">
          <span role="img" aria-label="loading">🔄</span>
        </div>
      </div>
      
      <h2>Your Game Statistics</h2>
      
      <div className="stats-tabs">
        <button 
          className={activeTab === 'summary' ? 'active' : ''} 
          onClick={() => setActiveTab('summary')}
        >
          Summary
        </button>
        <button 
          className={activeTab === 'history' ? 'active' : ''} 
          onClick={() => setActiveTab('history')}
        >
          Game History
        </button>
      </div>
      
      <div className="stats-content stable-content">
        {error ? (
          <div className="stats-error">{error}</div>
        ) : (
          activeTab === 'summary' ? renderSummaryTab() : renderHistoryTab()
        )}
      </div>
    </div>
  );
};

export default GameStats;
