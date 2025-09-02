import React, { useState, useEffect } from 'react';
import Board from './Board';
import { useAuth } from '../contexts/AuthContext';
import '../styles.css';

/**
 * Game component - Main game logic and state management
 * Manages the entire Tic-Tac-Toe game state and logic
 */
const Game = () => {
  const { user, token, refreshUserData } = useAuth();
  
  // 🛠 React Hooks & State Functions
  const [board, setBoard] = useState(() => initializeBoard()); // Board state
  const [currentPlayer, setCurrentPlayer] = useState('X'); // Current player state
  const [winner, setWinner] = useState(null); // Winner state
  const [winningSquares, setWinningSquares] = useState([]); // Winning squares for highlighting
  const [isDraw, setIsDraw] = useState(false); // Draw state
  const [gameMode, setGameMode] = useState('human'); // Game mode: 'human' or 'ai'
  const [aiDifficulty, setAiDifficulty] = useState('medium'); // AI difficulty
  const [autoRestartTimer, setAutoRestartTimer] = useState(null); // Timer for auto restart
  const [autoRestartCountdown, setAutoRestartCountdown] = useState(0); // Countdown for auto restart
  
  // 📊 Game tracking for database
  const [moves, setMoves] = useState([]); // Track all moves made
  const [matchSaved, setMatchSaved] = useState(false); // Prevent duplicate saves

  // 💾 Database Functions for Match Records

  /**
   * saveMatchRecord() → saves complete game data to database
   * @param {string} finalWinner - Winner of the game ('X', 'O', or 'draw')
   * @param {Array} finalWinningLine - Winning combination squares
   */
  const saveMatchRecord = async (finalWinner, finalWinningLine = []) => {
    if (!user || !token || matchSaved) return;

    try {
      const response = await fetch('https://tic-tac-toe-react-roks.onrender.com/api/game/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          board,
          winner: finalWinner,
          winningLine: finalWinningLine,
          moves,
          gameType: gameMode,
          aiDifficulty: gameMode === 'ai' ? aiDifficulty : null
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Match record saved:', data.game);
        setMatchSaved(true);
        
        // Update user stats if provided
        if (data.game.userStats) {
          console.log('📊 Updated stats:', data.game.userStats);
          
          // Refresh user data in AuthContext to update UI
          await refreshUserData();
        }
      } else {
        console.error('❌ Failed to save match record:', data.message);
      }
    } catch (error) {
      console.error('❌ Error saving match record:', error);
    }
  };

  // 🎮 Core Game Logic Functions

  /**
   * initializeBoard() → creates a 3×3 empty board (array of 9 nulls)
   * @returns {Array} - Array of 9 null values representing empty board
   */
  function initializeBoard() {
    return Array(9).fill(null);
  }

  /**
   * checkWinner(board) → checks rows, columns, diagonals for a win
   * @param {Array} board - Current board state
   * @returns {Object|null} - Winner info or null
   */
  function checkWinner(board) {
    const winningCombinations = [
      [0, 1, 2], // Top row
      [3, 4, 5], // Middle row
      [6, 7, 8], // Bottom row
      [0, 3, 6], // Left column
      [1, 4, 7], // Middle column
      [2, 5, 8], // Right column
      [0, 4, 8], // Diagonal top-left to bottom-right
      [2, 4, 6], // Diagonal top-right to bottom-left
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
  }

  /**
   * isDraw(board) → checks if the board is full with no winner
   * @param {Array} board - Current board state
   * @returns {boolean} - True if draw, false otherwise
   */
  function isDrawGame(board) {
    return board.every(square => square !== null) && !checkWinner(board);
  }

  /**
   * resetGame() → clears board, resets current player, winner, and game state
   */
  function resetGame() {
    setBoard(initializeBoard());
    setCurrentPlayer('X');
    setWinner(null);
    setWinningSquares([]);
    setIsDraw(false);
    setMoves([]);
    setMatchSaved(false);
    
    // Clear auto-restart timer and countdown
    if (autoRestartTimer) {
      clearInterval(autoRestartTimer);
      setAutoRestartTimer(null);
    }
    setAutoRestartCountdown(0);
  }

  // 👤 Player Turn Management

  /**
   * switchPlayer() → switches between "X" and "O"
   * @param {string} current - Current player
   * @returns {string} - Next player
   */
  function switchPlayer(current = currentPlayer) {
    return current === 'X' ? 'O' : 'X';
  }

  // 🤖 AI Mode Functions

  /**
   * makeRandomMove(board) → easy AI: pick random empty square
   * @param {Array} board - Current board state
   * @returns {number|null} - Index of move or null if no moves available
   */
  function makeRandomMove(board) {
    const emptySquares = board
      .map((square, index) => square === null ? index : null)
      .filter(val => val !== null);
    
    if (emptySquares.length === 0) return null;
    
    const randomIndex = Math.floor(Math.random() * emptySquares.length);
    return emptySquares[randomIndex];
  }

  /**
   * makeBestMove(board) → hard AI using minimax algorithm
   * @param {Array} board - Current board state
   * @param {string} player - AI player symbol
   * @returns {number|null} - Best move index
   */
  function makeBestMove(board, player = 'O') {
    const minimax = (board, depth, isMaximizing, alpha = -Infinity, beta = Infinity) => {
      const winner = checkWinner(board);
      
      if (winner?.player === player) return 10 - depth;
      if (winner?.player === (player === 'X' ? 'O' : 'X')) return depth - 10;
      if (isDrawGame(board)) return 0;

      if (isMaximizing) {
        let maxEval = -Infinity;
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = player;
            const evalScore = minimax(board, depth + 1, false, alpha, beta);
            board[i] = null;
            maxEval = Math.max(maxEval, evalScore);
            alpha = Math.max(alpha, evalScore);
            if (beta <= alpha) break;
          }
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        const opponent = player === 'X' ? 'O' : 'X';
        for (let i = 0; i < 9; i++) {
          if (board[i] === null) {
            board[i] = opponent;
            const evalScore = minimax(board, depth + 1, true, alpha, beta);
            board[i] = null;
            minEval = Math.min(minEval, evalScore);
            beta = Math.min(beta, evalScore);
            if (beta <= alpha) break;
          }
        }
        return minEval;
      }
    };

    let bestMove = -1;
    let bestValue = -Infinity;
    const boardCopy = [...board];

    for (let i = 0; i < 9; i++) {
      if (boardCopy[i] === null) {
        boardCopy[i] = player;
        const moveValue = minimax(boardCopy, 0, false);
        boardCopy[i] = null;

        if (moveValue > bestValue) {
          bestMove = i;
          bestValue = moveValue;
        }
      }
    }

    return bestMove !== -1 ? bestMove : makeRandomMove(board);
  }

  /**
   * makeMediumMove(board) → medium AI: random + some logic
   * @param {Array} board - Current board state
   * @param {string} player - AI player symbol
   * @returns {number|null} - Move index
   */
  function makeMediumMove(board, player = 'O') {
    // 70% chance to make best move, 30% random
    return Math.random() < 0.7 ? makeBestMove(board, player) : makeRandomMove(board);
  }

  /**
   * handleClick(index) → processes a player's move on a given square
   * @param {number} index - Square index to place move
   */
  function handleClick(index) {
    // Prevent moves if game is over or square is already filled
    if (winner || isDraw || board[index]) {
      return;
    }

    // Create new board with the move
    const newBoard = [...board];
    newBoard[index] = currentPlayer;
    
    // Track the move for database record
    const newMove = {
      player: currentPlayer,
      position: index,
      timestamp: Date.now()
    };
    setMoves(prevMoves => [...prevMoves, newMove]);
    
    // Update board state
    setBoard(newBoard);
    
    // Switch to next player
    setCurrentPlayer(switchPlayer(currentPlayer));
  }

  // AI move logic
  useEffect(() => {
    if (gameMode === 'ai' && currentPlayer === 'O' && !winner && !isDraw) {
      const timer = setTimeout(() => {
        let aiMove;
        switch (aiDifficulty) {
          case 'easy':
            aiMove = makeRandomMove(board);
            break;
          case 'hard':
            aiMove = makeBestMove(board, 'O');
            break;
          case 'medium':
          default:
            aiMove = makeMediumMove(board, 'O');
        }
        
        if (aiMove !== null) {
          handleClick(aiMove);
        }
      }, 500); // Small delay for better UX

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPlayer, gameMode, board, winner, isDraw, aiDifficulty]);

  // 🎨 UI & Rendering Functions

  /**
   * getStatusMessage() → generates text like "Player X's turn" or "Player O wins!"
   * @returns {string} - Status message to display
   */
  function getStatusMessage() {
    if (winner) {
      return gameMode === 'ai' && winner === 'O' 
        ? `AI (${winner}) wins!` 
        : `Player ${winner} wins!`;
    }
    if (isDraw) {
      return "It's a draw!";
    }
    if (gameMode === 'ai' && currentPlayer === 'O') {
      return `AI (${currentPlayer}) is thinking...`;
    }
    return `Player ${currentPlayer}'s turn`;
  }

  /**
   * renderSquare(index) → returns JSX for a square with value and click handler
   * @param {number} index - Square index
   * @returns {JSX.Element} - Square component
   */
  function renderSquare(index) {
    const isWinningSquare = winningSquares.includes(index);
    
    return (
      <Square
        key={index}
        value={board[index]}
        onClick={() => handleClick(index)}
        isWinning={isWinningSquare}
        disabled={winner || isDraw}
      />
    );
  }

  // useEffect Hook for winner/draw detection
  useEffect(() => {
    const winnerInfo = checkWinner(board);
    if (winnerInfo) {
      setWinner(winnerInfo.player);
      setWinningSquares(winnerInfo.squares);
    } else if (isDrawGame(board)) {
      setIsDraw(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [board]);

  // useEffect Hook for saving match records when game ends
  useEffect(() => {
    if ((winner || isDraw) && !matchSaved && moves.length > 0) {
      const finalWinner = winner || 'draw';
      const finalWinningLine = winner ? winningSquares : [];
      
      // Small delay to ensure state is updated
      setTimeout(() => {
        saveMatchRecord(finalWinner, finalWinningLine);
      }, 100);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw, matchSaved, moves.length, winningSquares]);

  // useEffect Hook for auto-restart countdown when game ends
  useEffect(() => {
    if ((winner || isDraw) && !autoRestartTimer) {
      // Start 10 second countdown for auto-restart
      setAutoRestartCountdown(10);
      
      const timer = setInterval(() => {
        setAutoRestartCountdown(prevCount => {
          if (prevCount <= 1) {
            // Time's up - clear the interval and restart the game
            clearInterval(timer);
            resetGame();
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      
      setAutoRestartTimer(timer);
      
      // Cleanup function to clear timer if component unmounts
      return () => {
        clearInterval(timer);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [winner, isDraw]);

  return (
    <div className="game">
      <h1 className="game-title">🎮 Tic-Tac-Toe</h1>
      
      {/* Game mode selector */}
      <div className="game-controls">
        <div className="mode-selector">
          <button 
            className={`mode-btn ${gameMode === 'human' ? 'active' : ''}`}
            onClick={() => { setGameMode('human'); resetGame(); }}
          >
            👥 Human vs Human
          </button>
          <button 
            className={`mode-btn ${gameMode === 'ai' ? 'active' : ''}`}
            onClick={() => { setGameMode('ai'); resetGame(); }}
          >
            🤖 vs AI
          </button>
        </div>
        
        {gameMode === 'ai' && (
          <div className="difficulty-selector">
            <label>AI Difficulty:</label>
            <select 
              value={aiDifficulty} 
              onChange={(e) => setAiDifficulty(e.target.value)}
              className="difficulty-select"
            >
              <option value="easy">🟢 Easy</option>
              <option value="medium">🟡 Medium</option>
              <option value="hard">🔴 Hard</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Game status */}
      <div className="game-status">
        {getStatusMessage()}
        {autoRestartCountdown > 0 && (
          <div className="restart-countdown">
            Auto-restart in {autoRestartCountdown} seconds...
          </div>
        )}
      </div>
      
      {/* Game board */}
      <Board 
        board={board}
        onSquareClick={handleClick}
        winningSquares={winningSquares}
        gameOver={winner || isDraw}
        renderSquare={renderSquare}
      />
      
      {/* Restart button */}
      <button 
        className="restart-button"
        onClick={resetGame}
      >
        🔄 Restart Game
      </button>
    </div>
  );
};

// Square component definition
const Square = ({ value, onClick, isWinning, disabled }) => {
  const handleClick = () => {
    if (disabled || value) return;
    onClick();
  };

  const getSquareClasses = () => {
    let classes = 'square';
    if (isWinning) classes += ' square-winning';
    if (disabled && !value) classes += ' square-disabled';
    if (value) classes += ' square-filled';
    if (value === 'X') classes += ' square-x';
    if (value === 'O') classes += ' square-o';
    return classes;
  };

  return (
    <button
      className={getSquareClasses()}
      onClick={handleClick}
      disabled={disabled && !value}
      aria-label={`Square ${value || 'empty'}`}
    >
      {value}
    </button>
  );
};

export default Game;
