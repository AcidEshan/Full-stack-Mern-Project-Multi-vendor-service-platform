import mongoose from 'mongoose';
import Favorite from '../models/Favorite';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const fixFavoriteIndexes = async () => {
  try {
    // Connect to MongoDB using environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME || 'practicum_db';
    
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    await mongoose.connect(MONGODB_URI, { dbName: DB_NAME });
    console.log('Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.db.databaseName}`);

    // Drop all existing indexes except _id
    console.log('Dropping old indexes...');
    await Favorite.collection.dropIndexes();
    console.log('Old indexes dropped');

    // Sync indexes (create new ones from the model)
    console.log('Creating new indexes...');
    await Favorite.syncIndexes();
    console.log('New indexes created successfully');

    // Show current indexes
    const indexes = await Favorite.collection.getIndexes();
    console.log('Current indexes:', JSON.stringify(indexes, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error fixing indexes:', error);
    process.exit(1);
  }
};

fixFavoriteIndexes();
