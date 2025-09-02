const mongoose = require('mongoose');

const gameSchema = new mongoose.Schema({
  players: {
    playerX: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    playerO: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null // null for AI games
    }
  },
  gameType: {
    type: String,
    enum: ['human', 'ai'],
    required: true
  },
  aiDifficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: null // only for AI games
  },
  board: {
    type: [String], // Array of 9 elements ('X', 'O', or null)
    default: Array(9).fill(null)
  },
  moves: [{
    player: {
      type: String,
      enum: ['X', 'O'],
      required: true
    },
    position: {
      type: Number,
      min: 0,
      max: 8,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  currentPlayer: {
    type: String,
    enum: ['X', 'O'],
    default: 'X'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active'
  },
  result: {
    winner: {
      type: String,
      enum: ['X', 'O', 'draw', null],
      default: null
    },
    winningLine: {
      type: [Number], // Array of winning positions [0,1,2] for example
      default: []
    },
    endReason: {
      type: String,
      enum: ['win', 'draw', 'abandoned', 'timeout'],
      default: null
    },
    playerXResult: {
      type: String,
      enum: ['win', 'lose', 'draw'],
      default: null
    },
    playerOResult: {
      type: String,
      enum: ['win', 'lose', 'draw'],
      default: null
    }
  },
  matchDetails: {
    totalMoves: {
      type: Number,
      default: 0
    },
    averageMoveTime: {
      type: Number, // in seconds
      default: 0
    },
    firstMoveTime: {
      type: Number, // time to first move in seconds
      default: 0
    },
    gameComplexity: {
      type: String,
      enum: ['simple', 'medium', 'complex'],
      default: 'simple'
    }
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Method to make a move
gameSchema.methods.makeMove = function(player, position) {
  if (this.status !== 'active') {
    throw new Error('Game is not active');
  }
  
  if (this.board[position] !== null) {
    throw new Error('Position already occupied');
  }
  
  if (this.currentPlayer !== player) {
    throw new Error('Not your turn');
  }
  
  // Make the move
  this.board[position] = player;
  this.moves.push({
    player,
    position,
    timestamp: new Date()
  });
  
  // Check for winner
  const winner = this.checkWinner();
  if (winner) {
    this.result.winner = winner.player;
    this.result.winningLine = winner.line;
    this.result.endReason = 'win';
    this.status = 'completed';
    this.completedAt = new Date();
  } else if (this.board.every(cell => cell !== null)) {
    // Draw
    this.result.winner = 'draw';
    this.result.endReason = 'draw';
    this.status = 'completed';
    this.completedAt = new Date();
  } else {
    // Switch player
    this.currentPlayer = player === 'X' ? 'O' : 'X';
  }
  
  return this.save();
};

// Method to check winner
gameSchema.methods.checkWinner = function() {
  const winningCombinations = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
    [0, 4, 8], [2, 4, 6] // Diagonals
  ];
  
  for (const line of winningCombinations) {
    const [a, b, c] = line;
    if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
      return {
        player: this.board[a],
        line: line
      };
    }
  }
  
  return null;
};

// Method to complete a game and calculate match details
gameSchema.methods.completeGame = function(winner, winningLine = []) {
  this.status = 'completed';
  this.completedAt = new Date();
  this.result.winner = winner;
  this.result.winningLine = winningLine;
  
  if (winner === 'draw') {
    this.result.endReason = 'draw';
    this.result.playerXResult = 'draw';
    this.result.playerOResult = 'draw';
  } else {
    this.result.endReason = 'win';
    this.result.playerXResult = winner === 'X' ? 'win' : 'lose';
    this.result.playerOResult = winner === 'O' ? 'win' : 'lose';
  }
  
  // Calculate match details
  this.matchDetails.totalMoves = this.moves.length;
  
  if (this.moves.length > 0) {
    // Calculate average move time
    const moveTimes = [];
    for (let i = 0; i < this.moves.length; i++) {
      const moveTime = i === 0 
        ? (this.moves[i].timestamp - this.startedAt) / 1000
        : (this.moves[i].timestamp - this.moves[i-1].timestamp) / 1000;
      moveTimes.push(moveTime);
    }
    
    this.matchDetails.averageMoveTime = moveTimes.reduce((a, b) => a + b, 0) / moveTimes.length;
    this.matchDetails.firstMoveTime = moveTimes[0] || 0;
    
    // Determine game complexity based on number of moves
    if (this.moves.length <= 5) {
      this.matchDetails.gameComplexity = 'simple';
    } else if (this.moves.length <= 7) {
      this.matchDetails.gameComplexity = 'medium';
    } else {
      this.matchDetails.gameComplexity = 'complex';
    }
  }
  
  return this.save();
};

// Method to get game state for client
gameSchema.methods.getGameState = function() {
  return {
    id: this._id,
    gameType: this.gameType,
    aiDifficulty: this.aiDifficulty,
    board: this.board,
    currentPlayer: this.currentPlayer,
    status: this.status,
    result: this.result,
    startedAt: this.startedAt,
    completedAt: this.completedAt,
    moves: this.moves.length
  };
};

// Indexes for better performance
gameSchema.index({ 'players.playerX': 1 });
gameSchema.index({ 'players.playerO': 1 });
gameSchema.index({ status: 1 });
gameSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Game', gameSchema);
