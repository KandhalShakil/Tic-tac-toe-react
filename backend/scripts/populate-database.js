const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Game = require('../models/Game');

// Sample data
const sampleUsers = [
  {
    username: 'player1',
    email: 'player1@example.com',
    password: 'password123'
  },
  {
    username: 'player2', 
    email: 'player2@example.com',
    password: 'password123'
  },
  {
    username: 'gamer_pro',
    email: 'gamer@example.com',
    password: 'password123'
  },
  {
    username: 'tic_tac_master',
    email: 'master@example.com',
    password: 'password123'
  }
];

const sampleGames = [
  {
    gameType: 'ai',
    aiDifficulty: 'easy',
    status: 'completed',
    board: ['X', 'O', 'X', 'O', 'X', 'O', 'X', null, null],
    moves: [
      { player: 'X', position: 0 },
      { player: 'O', position: 1 },
      { player: 'X', position: 2 },
      { player: 'O', position: 3 },
      { player: 'X', position: 4 },
      { player: 'O', position: 5 },
      { player: 'X', position: 6 }
    ],
    result: {
      winner: 'X',
      winningLine: [0, 2, 4, 6],
      endReason: 'win',
      playerXResult: 'win',
      playerOResult: 'lose'
    },
    matchDetails: {
      totalMoves: 7,
      averageMoveTime: 2.5,
      firstMoveTime: 1.2,
      gameComplexity: 'simple'
    }
  },
  {
    gameType: 'ai',
    aiDifficulty: 'medium', 
    status: 'completed',
    board: ['X', 'O', 'X', 'O', 'O', 'X', 'O', 'X', 'X'],
    moves: [
      { player: 'X', position: 0 },
      { player: 'O', position: 1 },
      { player: 'X', position: 2 },
      { player: 'O', position: 3 },
      { player: 'X', position: 5 },
      { player: 'O', position: 4 },
      { player: 'X', position: 7 },
      { player: 'O', position: 6 },
      { player: 'X', position: 8 }
    ],
    result: {
      winner: 'draw',
      winningLine: [],
      endReason: 'draw',
      playerXResult: 'draw',
      playerOResult: 'draw'
    },
    matchDetails: {
      totalMoves: 9,
      averageMoveTime: 3.1,
      firstMoveTime: 1.8,
      gameComplexity: 'complex'
    }
  },
  {
    gameType: 'ai',
    aiDifficulty: 'hard',
    status: 'completed', 
    board: ['X', 'X', 'X', 'O', 'O', null, null, null, null],
    moves: [
      { player: 'X', position: 0 },
      { player: 'O', position: 3 },
      { player: 'X', position: 1 },
      { player: 'O', position: 4 },
      { player: 'X', position: 2 }
    ],
    result: {
      winner: 'X',
      winningLine: [0, 1, 2],
      endReason: 'win',
      playerXResult: 'win',
      playerOResult: 'lose'
    },
    matchDetails: {
      totalMoves: 5,
      averageMoveTime: 4.2,
      firstMoveTime: 2.1,
      gameComplexity: 'medium'
    }
  },
  {
    gameType: 'ai',
    aiDifficulty: 'easy',
    status: 'completed',
    board: ['X', 'O', null, 'X', 'O', null, 'X', null, null],
    moves: [
      { player: 'X', position: 0 },
      { player: 'O', position: 1 },
      { player: 'X', position: 3 },
      { player: 'O', position: 4 },
      { player: 'X', position: 6 }
    ],
    result: {
      winner: 'X',
      winningLine: [0, 3, 6],
      endReason: 'win',
      playerXResult: 'win',
      playerOResult: 'lose'
    },
    matchDetails: {
      totalMoves: 5,
      averageMoveTime: 2.8,
      firstMoveTime: 1.5,
      gameComplexity: 'simple'
    }
  },
  {
    gameType: 'ai',
    aiDifficulty: 'medium',
    status: 'completed',
    board: ['O', 'X', 'O', 'X', 'O', 'X', 'X', 'O', 'X'],
    moves: [
      { player: 'X', position: 1 },
      { player: 'O', position: 0 },
      { player: 'X', position: 3 },
      { player: 'O', position: 2 },
      { player: 'X', position: 5 },
      { player: 'O', position: 4 },
      { player: 'X', position: 6 },
      { player: 'O', position: 7 },
      { player: 'X', position: 8 }
    ],
    result: {
      winner: 'O',
      winningLine: [0, 4, 8],
      endReason: 'win',
      playerXResult: 'lose',
      playerOResult: 'win'
    },
    matchDetails: {
      totalMoves: 9,
      averageMoveTime: 3.5,
      firstMoveTime: 2.0,
      gameComplexity: 'complex'
    }
  }
];

async function populateDatabase() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB Atlas');

    // Clear existing data
    console.log('🗑️ Clearing existing data...');
    await User.deleteMany({});
    await Game.deleteMany({});

    // Create sample users
    console.log('👥 Creating sample users...');
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      const user = new User({
        username: userData.username,
        email: userData.email,
        password: hashedPassword
      });
      
      const savedUser = await user.save();
      createdUsers.push(savedUser);
      console.log(`✅ Created user: ${userData.username}`);
    }

    // Create sample games for each user
    console.log('🎮 Creating sample games...');
    let gameCount = 0;
    
    for (const user of createdUsers) {
      // Create 3-5 games per user
      const numGames = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numGames; i++) {
        const gameData = sampleGames[Math.floor(Math.random() * sampleGames.length)];
        
        const game = new Game({
          players: {
            playerX: user._id,
            playerO: null // AI game
          },
          gameType: gameData.gameType,
          aiDifficulty: gameData.aiDifficulty,
          board: gameData.board,
          moves: gameData.moves,
          status: gameData.status,
          result: gameData.result,
          matchDetails: gameData.matchDetails,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date within last 30 days
        });
        
        await game.save();
        gameCount++;
      }
      
      console.log(`✅ Created ${numGames} games for user: ${user.username}`);
    }

    console.log('🎉 Database population completed!');
    console.log(`📊 Summary:`);
    console.log(`   👥 Users created: ${createdUsers.length}`);
    console.log(`   🎮 Games created: ${gameCount}`);
    console.log(`   🗄️ Database: ${mongoose.connection.name}`);

    // Show some statistics
    const totalUsers = await User.countDocuments();
    const totalGames = await Game.countDocuments();
    const wins = await Game.countDocuments({ 'result.playerXResult': 'win' });
    const losses = await Game.countDocuments({ 'result.playerXResult': 'lose' });
    const draws = await Game.countDocuments({ 'result.playerXResult': 'draw' });

    console.log(`\n📈 Database Statistics:`);
    console.log(`   Total Users: ${totalUsers}`);
    console.log(`   Total Games: ${totalGames}`);
    console.log(`   Wins: ${wins}`);
    console.log(`   Losses: ${losses}`);
    console.log(`   Draws: ${draws}`);

  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    // Close connection
    mongoose.connection.close();
    console.log('👋 Database connection closed');
  }
}

// Run the population script
populateDatabase();
