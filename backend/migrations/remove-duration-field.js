// Migration script to remove duration field from existing games
const mongoose = require('mongoose');
require('dotenv').config();

async function removeDurationField() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tictactoe');
    console.log('Connected to MongoDB');

    // Remove duration field from all game documents
    const result = await mongoose.connection.db.collection('games').updateMany(
      {}, // Match all documents
      { $unset: { duration: "" } } // Remove duration field
    );

    console.log(`Migration completed: ${result.modifiedCount} documents updated`);
    
    // Close connection
    await mongoose.connection.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  removeDurationField();
}

module.exports = removeDurationField;
