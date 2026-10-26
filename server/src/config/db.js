import mongoose from 'mongoose';

/**
 * Connect to MongoDB using MONGODB_URI from environment variables.
 * Handles missing credentials and connection events gracefully.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim() === '') {
    console.warn('[MongoDB] MONGODB_URI is not configured in environment. Database features will be unavailable.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000, // Fast timeout for responsiveness
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return true;
  } catch (error) {
    console.error(`[MongoDB] Connection error: ${error.message}`);
    return false;
  }
};

/**
 * Helper to check current database connection status.
 * @returns {boolean}
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Disconnect from MongoDB (useful for graceful shutdown and testing).
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log('[MongoDB] Disconnected.');
  }
};

// Connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('[MongoDB] Connection lost.');
});

mongoose.connection.on('reconnected', () => {
  console.log('[MongoDB] Connection reestablished.');
});

export default {
  connectDB,
  isDbConnected,
  disconnectDB,
};
