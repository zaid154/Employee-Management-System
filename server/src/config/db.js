import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Connect to MongoDB. Retries a few times so a slow-starting local
 * database doesn't crash the API on boot.
 */
export async function connectDB(retries = 5, delayMs = 3000) {
  mongoose.set('strictQuery', true);

  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await mongoose.connect(env.mongoUri);
      console.log(`✅ MongoDB connected (${mongoose.connection.name})`);
      return mongoose.connection;
    } catch (err) {
      console.error(`❌ MongoDB connection failed (attempt ${attempt}/${retries}): ${err.message}`);
      if (attempt === retries) throw err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}
