import React, { useState, useEffect } from 'react';

const Game = () => {
  // Game state
  const [board, setBoard] = useState(Array(9).fill(null));
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [winner, setWinner] = useState(null);
  const [winningSquares, setWinningSquares] = useState([]);
  const [isDraw, setIsDraw] = useState(false);
  const [gameMode, setGameMode] = useState('human');
  const [aiDifficulty, setAiDifficulty] = useState('medium');
  const [autoRestartCountdown, setAutoRestartCountdown] = useState(0);
  const [moves, setMoves] = useState([]);
  const [matchSaved, setMatchSaved] = useState(false);
  const [playerEmojis, setPlayerEmojis] = useState({ X: '❌', O: '⭕' });

  // Initialize board
  const initializeBoard = () => Array(9).fill(null);

  // Check for winner
  const checkWinner = (board) => {
    const winningCombinations = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
      [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
      [0, 4, 8], [2, 4, 6]             // Diagonals
    ];

    for (const combination of winningCombinations) {
      const [a, b, c] = combination;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return {
          player: board[a],
          squares: combination,
        };
      }
    }
    return null;
  };

  // Check for draw
  const isDrawGame = (board) => {
    return board.every(square => square !== null) && !checkWinner(board);
  };

  // Reset game
  const resetGame = () => {
    setBoard(initializeBoard());
    setCurrentPlayer('X');
    setWinner(null);
    setWinningSquares([]);
    setIsDraw(false);
    setMoves([]);
    setMatchSaved(false);
    setAutoRestartCountdown(0);
  };

  // Switch player
  const switchPlayer = (current) => {
    return current === 'X' ? 'O' : 'X';
  };

  // AI moves
  const makeRandomMove = (board) => {
    const emptySquares = board
      .map((square, index) => square === null ? index : null)
      .filter(val => val !== null);
    
    if (emptySquares.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  };

  const makeBestMove = (board, player = 'O') => {
    // For simplicity, we'll use a placeholder for the minimax algorithm
    // In a real implementation, this would use the minimax algorithm
    return makeRandomMove(board); // Placeholder
  };

  const makeMediumMove = (board, player = 'O') => {
    return Math.random() < 0.7 ? makeBestMove(board, player) : makeRandomMove(board);
  };

  // Handle square click
  const handleClick = (index) => {
    if (winner || isDraw || board[index]) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    
    const newMove = {
      player: currentPlayer,
      position: index,
      timestamp: Date.now()
    };
    
    setMoves(prevMoves => [...prevMoves, newMove]);
    setBoard(newBoard);
    setCurrentPlayer(switchPlayer(currentPlayer));
  };

  // AI move logic
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && !isDraw) {
      const timer = setTimeout(() => {
        let aiMove;
        switch (aiDifficulty) {
          case 'easy': aiMove = makeRandomMove(board); break;
          case 'hard': aiMove = makeBestMove(board, 'O'); break;
          default: aiMove = makeMediumMove(board, 'O');
        }
        
        if (aiMove !== null) handleClick(aiMove);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [currentPlayer, gameMode, board, winner, isDraw, aiDifficulty]);

  // Check for winner/draw
  useEffect(() => {
    const winnerInfo = checkWinner(board);
    if (winnerInfo) {
      setWinner(winnerInfo.player);
      setWinningSquares(winnerInfo.squares);
    } else if (isDrawGame(board)) {
      setIsDraw(true);
    }
  }, [board]);

  // Auto-restart countdown
  useEffect(() => {
    if ((winner || isDraw) && autoRestartCountdown === 0) {
      setAutoRestartCountdown(10);
      
      const timer = setInterval(() => {
        setAutoRestartCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(timer);
            resetGame();
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [winner, isDraw]);

  // Get status message
  const getStatusMessage = () => {
    if (winner) {
      return gameMode === 'ai' && winner === 'O' 
        ? `AI (${playerEmojis[winner]}) wins!` 
        : `Player ${playerEmojis[winner]} wins!`;
    }
    if (isDraw) return "It's a draw!";
    if (gameMode === 'ai' && currentPlayer === 'O') return `AI (${playerEmojis[currentPlayer]}) is thinking...`;
    return `Player ${playerEmojis[currentPlayer]}'s turn`;
  };

  // Change player emoji
  const changePlayerEmoji = (player) => {
    const emojis = ['❌', '⭕', '⭐', '🔥', '😎', '🐱', '🚀', '🌙', '🌈', '⚡'];
    const currentIndex = emojis.indexOf(playerEmojis[player]);
    const nextIndex = (currentIndex + 1) % emojis.length;
    
    setPlayerEmojis(prev => ({
      ...prev,
      [player]: emojis[nextIndex]
    }));
  };

  return (
    <div style={styles.gameContainer}>
      <div style={styles.gameContent}>
        <h1 style={styles.gameTitle}>Tic-Tac-Toe</h1>
        
        {/* Player emoji selection */}
        <div style={styles.playerIcons}>
          <div style={styles.playerIconBlock}>
            <div style={styles.playerLabel}>Player X</div>
            <div style={styles.playerEmoji}>{playerEmojis.X}</div>
            <button 
              style={styles.changeEmojiButton}
              onClick={() => changePlayerEmoji('X')}
            >
              Change Icon
            </button>
          </div>
          
          <div style={styles.vsText}>VS</div>
          
          <div style={styles.playerIconBlock}>
            <div style={styles.playerLabel}>Player O</div>
            <div style={styles.playerEmoji}>{playerEmojis.O}</div>
            <button 
              style={styles.changeEmojiButton}
              onClick={() => changePlayerEmoji('O')}
            >
              Change Icon
            </button>
          </div>
        </div>
        
        {/* Game mode selector */}
        <div style={styles.gameControls}>
          <div style={styles.modeSelector}>
            <button 
              style={{
                ...styles.modeButton,
                ...(gameMode === 'human' ? styles.modeButtonActive : {})
              }}
              onClick={() => { setGameMode('human'); resetGame(); }}
            >
              👥 Player vs Player
            </button>
            <button 
              style={{
                ...styles.modeButton,
                ...(gameMode === 'ai' ? styles.modeButtonActive : {})
              }}
              onClick={() => { setGameMode('ai'); resetGame(); }}
            >
              🤖 Play vs AI
            </button>
          </div>
          
          {gameMode === 'ai' && (
            <div style={styles.difficultySelector}>
              <label style={styles.difficultyLabel}>AI Difficulty:</label>
              <select 
                value={aiDifficulty} 
                onChange={(e) => setAiDifficulty(e.target.value)}
                style={styles.difficultySelect}
              >
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🔴 Hard</option>
              </select>
            </div>
          )}
        </div>
        
        {/* Game status */}
        <div style={styles.gameStatus}>
          <div style={styles.statusText}>{getStatusMessage()}</div>
          {autoRestartCountdown > 0 && (
            <div style={styles.restartCountdown}>
              Auto-restart in {autoRestartCountdown} seconds...
            </div>
          )}
        </div>
        
        {/* Game board */}
        <div style={styles.board}>
          {board.map((value, index) => {
            const isWinning = winningSquares.includes(index);
            return (
              <button
                key={index}
                style={{
                  ...styles.square,
                  ...(value ? styles.squareFilled : {}),
                  ...(isWinning ? styles.squareWinning : {})
                }}
                onClick={() => handleClick(index)}
                disabled={winner || isDraw || value}
              >
                {value && <span style={styles.symbol}>{playerEmojis[value]}</span>}
              </button>
            );
          })}
        </div>
        
        {/* Restart button */}
        <button 
          style={styles.restartButton}
          onClick={resetGame}
        >
          🔄 Restart Game
        </button>
      </div>
    </div>
  );
};

// Modern CSS-in-JS styles
const styles = {
  gameContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0f0f23 0%, #1a1a2e 50%, #16213e 100%)',
    fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    padding: '20px',
  },
  gameContent: {
    backgroundColor: 'rgba(15, 15, 35, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '24px',
    padding: '30px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 255, 157, 0.1)',
    border: '1px solid rgba(0, 255, 157, 0.2)',
    maxWidth: '500px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
  },
  gameTitle: {
    fontSize: '2.5rem',
    fontWeight: '800',
    background: 'linear-gradient(45deg, #00ff9d, #00d4ff, #ff6b9d)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textAlign: 'center',
    margin: '0 0 10px 0',
    letterSpacing: '1px',
    textShadow: '0 0 20px rgba(0, 255, 157, 0.4)',
  },
  playerIcons: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '40px',
    marginBottom: '15px',
  },
  playerIconBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
  },
  playerLabel: {
    fontSize: '1.2rem',
    color: '#00d4ff',
    fontWeight: '600',
  },
  playerEmoji: {
    fontSize: '3rem',
    padding: '10px',
    background: 'linear-gradient(45deg, rgba(0, 255, 157, 0.2), rgba(0, 212, 255, 0.2))',
    borderRadius: '50%',
    width: '80px',
    height: '80px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    boxShadow: '0 0 20px rgba(0, 255, 157, 0.3)',
    border: '2px solid rgba(0, 255, 157, 0.4)',
  },
  vsText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#ff6b9d',
  },
  changeEmojiButton: {
    background: 'linear-gradient(145deg, #00ff9d, #00d4ff)',
    color: '#0f0f23',
    border: 'none',
    borderRadius: '12px',
    padding: '8px 16px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
    transition: 'all 0.3s ease',
  },
  gameControls: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    width: '100%',
  },
  modeSelector: {
    display: 'flex',
    gap: '12px',
    width: '100%',
  },
  modeButton: {
    flex: '1',
    padding: '14px',
    border: '2px solid rgba(0, 255, 157, 0.3)',
    background: 'rgba(0, 0, 0, 0.2)',
    color: '#00ff9d',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontWeight: '600',
    fontSize: '0.9rem',
  },
  modeButtonActive: {
    background: 'linear-gradient(145deg, #00ff9d, #00d4ff)',
    color: '#0f0f23',
    borderColor: 'transparent',
    boxShadow: '0 5px 15px rgba(0, 255, 157, 0.4)',
  },
  difficultySelector: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    color: '#00d4ff',
    fontWeight: '600',
  },
  difficultyLabel: {
    fontSize: '0.9rem',
  },
  difficultySelect: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '2px solid rgba(0, 212, 255, 0.3)',
    color: '#00d4ff',
    padding: '8px 12px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  gameStatus: {
    textAlign: 'center',
    margin: '10px 0',
  },
  statusText: {
    fontSize: '1.4rem',
    fontWeight: '700',
    background: 'linear-gradient(45deg, #00ff9d, #00d4ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: '8px',
  },
  restartCountdown: {
    fontSize: '0.9rem',
    color: '#00ff9d',
    opacity: '0.8',
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '12px',
    width: '100%',
    maxWidth: '340px',
    margin: '0 auto',
  },
  square: {
    aspectRatio: '1',
    background: 'rgba(15, 15, 35, 0.6)',
    border: '2px solid rgba(0, 255, 157, 0.3)',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden',
  },
  squareFilled: {
    cursor: 'not-allowed',
  },
  squareWinning: {
    background: 'rgba(0, 255, 157, 0.2)',
    borderColor: '#00ff9d',
    animation: 'winning-pulse 1.5s infinite alternate',
  },
  symbol: {
    fontSize: '2.5rem',
    fontWeight: '800',
  },
  restartButton: {
    background: 'linear-gradient(145deg, #00ff9d, #00d4ff)',
    color: '#0f0f23',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 24px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginTop: '10px',
  },
};

// Add keyframes for animation
const styleSheet = document.styleSheet;
const stylesheet = document.head.appendChild(document.createElement("style"));
stylesheet.innerHTML = `
  @keyframes winning-pulse {
    from { box-shadow: 0 0 10px rgba(0, 255, 157, 0.5); }
    to { box-shadow: 0 0 20px rgba(0, 255, 157, 0.8), 0 0 30px rgba(0, 255, 157, 0.4); }
  }
  
  button:hover {
    transform: translateY(-2px);
  }
  
  .mode-button:hover {
    background: rgba(0, 255, 157, 0.1);
    border-color: #00ff9d;
  }
  
  .square:hover:not(.filled) {
    background: rgba(0, 255, 157, 0.1);
    border-color: #00ff9d;
    transform: scale(1.05);
  }
  
  .restart-button:hover {
    background: linear-gradient(145deg, #00d4ff, #ff6b9d);
    box-shadow: 0 8px 20px rgba(0, 255, 157, 0.4);
  }
  
  .change-emoji-button:hover {
    background: linear-gradient(145deg, #00d4ff, #ff6b9d);
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(0, 255, 157, 0.4);
  }
`;

export default Game;
