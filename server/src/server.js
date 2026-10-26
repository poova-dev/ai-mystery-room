import 'dotenv/config';
import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = Number(process.env.PORT) || 5001;

// Attempt database connection
connectDB();

const server = app.listen(PORT, () => {
  console.log(`AI Mystery Room server running on port ${PORT} [NODE_ENV=${process.env.NODE_ENV || 'development'}]`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Try specifying a different port via PORT in .env (e.g. PORT=5001).`);
  } else {
    console.error('Server error:', err);
  }
  process.exit(1);
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await disconnectDB();
  server.close(() => {
    console.log('Server process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
