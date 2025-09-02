const express = require('express');
const mongoose = require('mongoose');
const Game = require('../models/Game');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/game/complete
// @desc    Complete a game and save match record
// @access  Private
router.post('/complete', auth, async (req, res) => {
  try {
    const { board, winner, winningLine = [], moves = [], gameType, aiDifficulty } = req.body;

    if (!board || !Array.isArray(board) || board.length !== 9) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board state'
      });
    }

    // Create a complete game record
    const game = new Game({
      players: {
        playerX: req.userId,
        playerO: gameType === 'ai' ? null : req.userId
      },
      gameType: gameType || 'ai',
      aiDifficulty: aiDifficulty || 'medium',
      board,
      moves: moves.map((move, index) => ({
        player: move.player,
        position: move.position,
        timestamp: new Date(Date.now() - (moves.length - index) * 2000) // Estimate timestamps
      })),
      status: 'completed',
      completedAt: new Date()
    });

    // Complete the game with results
    await game.completeGame(winner, winningLine);

    // Update user statistics
    const user = await User.findById(req.userId);
    if (user) {
      user.stats.gamesPlayed += 1;
      
      if (winner === 'draw') {
        user.stats.gamesDraw += 1;
      } else if (winner === 'X') { // User is always X
        user.stats.gamesWon += 1;
      } else {
        user.stats.gamesLost += 1;
      }
      
      // Calculate win rate
      user.stats.winRate = user.stats.gamesPlayed > 0 
        ? Math.round((user.stats.gamesWon / user.stats.gamesPlayed) * 100) 
        : 0;
      
      await user.save();
    }

    res.status(201).json({
      success: true,
      message: 'Game completed and match record saved',
      game: {
        id: game._id,
        result: game.result,
        matchDetails: game.matchDetails,
        userStats: user.stats
      }
    });

  } catch (error) {
    console.error('Game completion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error completing game',
      error: error.message
    });
  }
});

// @route   GET /api/game/history
// @desc    Get user's detailed game history with match records
// @access  Private
router.get('/history', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, gameType, result } = req.query;
    const skip = (page - 1) * limit;

    // Build query
    const query = {
      $or: [
        { 'players.playerX': req.userId },
        { 'players.playerO': req.userId }
      ],
      status: 'completed'
    };

    if (gameType && ['human', 'ai'].includes(gameType)) {
      query.gameType = gameType;
    }

    if (result && ['win', 'lose', 'draw'].includes(result)) {
      if (result === 'win') {
        query.$or = [
          { 'players.playerX': req.userId, 'result.playerXResult': 'win' },
          { 'players.playerO': req.userId, 'result.playerOResult': 'win' }
        ];
      } else if (result === 'lose') {
        query.$or = [
          { 'players.playerX': req.userId, 'result.playerXResult': 'lose' },
          { 'players.playerO': req.userId, 'result.playerOResult': 'lose' }
        ];
      } else if (result === 'draw') {
        query['result.winner'] = 'draw';
      }
    }

    const games = await Game.find(query)
      .populate('players.playerX', 'username avatar')
      .populate('players.playerO', 'username avatar')
      .sort({ completedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Game.countDocuments(query);

    // Format game history for client
    const gameHistory = games.map(game => {
      const isPlayerX = game.players.playerX && game.players.playerX._id.toString() === req.userId;
      const userResult = isPlayerX ? game.result.playerXResult : game.result.playerOResult;
      
      return {
        id: game._id,
        gameType: game.gameType,
        aiDifficulty: game.aiDifficulty,
        opponent: game.gameType === 'ai' ? 'AI' : (
          isPlayerX 
            ? (game.players.playerO ? game.players.playerO.username : 'Unknown')
            : (game.players.playerX ? game.players.playerX.username : 'Unknown')
        ),
        userSymbol: isPlayerX ? 'X' : 'O',
        result: userResult,
        winner: game.result.winner,
        totalMoves: game.matchDetails.totalMoves,
        gameComplexity: game.matchDetails.gameComplexity,
        averageMoveTime: Math.round(game.matchDetails.averageMoveTime * 100) / 100,
        completedAt: game.completedAt,
        winningLine: game.result.winningLine
      };
    });

    res.json({
      success: true,
      games: gameHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving game history'
    });
  }
});

// @route   GET /api/game/stats
// @desc    Get detailed user game statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const userId = req.userId;

    // Get basic user stats
    const user = await User.findById(userId).select('stats username');
    
    // Get detailed game statistics
    const totalGames = await Game.countDocuments({
      $or: [
        { 'players.playerX': userId },
        { 'players.playerO': userId }
      ],
      status: 'completed'
    });

    const wins = await Game.countDocuments({
      $or: [
        { 'players.playerX': userId, 'result.playerXResult': 'win' },
        { 'players.playerO': userId, 'result.playerOResult': 'win' }
      ]
    });

    const losses = await Game.countDocuments({
      $or: [
        { 'players.playerX': userId, 'result.playerXResult': 'lose' },
        { 'players.playerO': userId, 'result.playerOResult': 'lose' }
      ]
    });

    const draws = await Game.countDocuments({
      $or: [
        { 'players.playerX': userId },
        { 'players.playerO': userId }
      ],
      'result.winner': 'draw'
    });

    // AI game statistics
    const aiGames = await Game.aggregate([
      {
        $match: {
          'players.playerX': new mongoose.Types.ObjectId(userId),
          gameType: 'ai',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: '$aiDifficulty',
          total: { $sum: 1 },
          wins: {
            $sum: {
              $cond: [{ $eq: ['$result.playerXResult', 'win'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Recent performance (last 10 games)
    const recentGames = await Game.find({
      $or: [
        { 'players.playerX': userId },
        { 'players.playerO': userId }
      ],
      status: 'completed'
    })
    .sort({ completedAt: -1 })
    .limit(10)
    .select('result players completedAt');

    const recentResults = recentGames.map(game => {
      const isPlayerX = game.players.playerX && game.players.playerX.toString() === userId;
      return isPlayerX ? game.result.playerXResult : game.result.playerOResult;
    });

    res.json({
      success: true,
      stats: {
        basic: user.stats,
        detailed: {
          totalGames,
          wins,
          losses,
          draws,
          winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0
        },
        aiPerformance: aiGames.reduce((acc, curr) => {
          acc[curr._id] = {
            total: curr.total,
            wins: curr.wins,
            winRate: Math.round((curr.wins / curr.total) * 100)
          };
          return acc;
        }, {}),
        recentForm: recentResults
      }
    });

  } catch (error) {
    console.error('Game stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error retrieving game statistics'
    });
  }
});

// @route   POST /api/game/create
// @desc    Create a new game
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { gameType, aiDifficulty } = req.body;

    if (!gameType || !['human', 'ai'].includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid game type'
      });
    }

    if (gameType === 'ai' && (!aiDifficulty || !['easy', 'medium', 'hard'].includes(aiDifficulty))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid AI difficulty'
      });
    }

    const game = new Game({
      players: {
        playerX: req.userId,
        playerO: gameType === 'ai' ? null : req.userId // For now, human vs human uses same user
      },
      gameType,
      aiDifficulty: gameType === 'ai' ? aiDifficulty : null
    });

    await game.save();

    res.status(201).json({
      success: true,
      message: 'Game created successfully',
      game: game.getGameState()
    });

  } catch (error) {
    console.error('Game creation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating game'
    });
  }
});

// @route   POST /api/game/:gameId/move
// @desc    Make a move in a game
// @access  Private
router.post('/:gameId/move', auth, async (req, res) => {
  try {
    const { position } = req.body;
    const gameId = req.params.gameId;

    if (typeof position !== 'number' || position < 0 || position > 8) {
      return res.status(400).json({
        success: false,
        message: 'Invalid position'
      });
    }

    const game = await Game.findById(gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user is part of this game
    if (!game.players.playerX.equals(req.userId) && 
        (!game.players.playerO || !game.players.playerO.equals(req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this game'
      });
    }

    // Determine player symbol
    let playerSymbol;
    if (game.players.playerX.equals(req.userId)) {
      playerSymbol = 'X';
    } else {
      playerSymbol = 'O';
    }

    // Make the move
    await game.makeMove(playerSymbol, position);

    // Update user stats if game is completed
    if (game.status === 'completed') {
      const user = await User.findById(req.userId);
      if (user) {
        let result;
        if (game.result.winner === 'draw') {
          result = 'draw';
        } else if (game.result.winner === playerSymbol) {
          result = 'win';
        } else {
          result = 'loss';
        }
        await user.updateStats(result);
      }
    }

    res.json({
      success: true,
      message: 'Move made successfully',
      game: game.getGameState()
    });

  } catch (error) {
    console.error('Move error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error making move'
    });
  }
});

// @route   GET /api/game/:gameId
// @desc    Get game state
// @access  Private
router.get('/:gameId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user is part of this game
    if (!game.players.playerX.equals(req.userId) && 
        (!game.players.playerO || !game.players.playerO.equals(req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this game'
      });
    }

    res.json({
      success: true,
      game: game.getGameState()
    });

  } catch (error) {
    console.error('Get game error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game'
    });
  }
});

// @route   GET /api/game/user/history
// @desc    Get user's game history
// @access  Private
router.get('/user/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const games = await Game.find({
      $or: [
        { 'players.playerX': req.userId },
        { 'players.playerO': req.userId }
      ]
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('players.playerX', 'username avatar')
    .populate('players.playerO', 'username avatar');

    const total = await Game.countDocuments({
      $or: [
        { 'players.playerX': req.userId },
        { 'players.playerO': req.userId }
      ]
    });

    res.json({
      success: true,
      games: games.map(game => ({
        ...game.getGameState(),
        players: game.players
      })),
      pagination: {
        current: page,
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Game history error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching game history'
    });
  }
});

// @route   DELETE /api/game/:gameId
// @desc    Abandon/delete a game
// @access  Private
router.delete('/:gameId', auth, async (req, res) => {
  try {
    const game = await Game.findById(req.params.gameId);
    if (!game) {
      return res.status(404).json({
        success: false,
        message: 'Game not found'
      });
    }

    // Check if user is part of this game
    if (!game.players.playerX.equals(req.userId) && 
        (!game.players.playerO || !game.players.playerO.equals(req.userId))) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this game'
      });
    }

    if (game.status === 'active') {
      game.status = 'abandoned';
      game.result.endReason = 'abandoned';
      game.completedAt = new Date();
      await game.save();
    }

    res.json({
      success: true,
      message: 'Game abandoned successfully'
    });

  } catch (error) {
    console.error('Game abandonment error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error abandoning game'
    });
  }
});

module.exports = router;
