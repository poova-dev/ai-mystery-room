import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import healthRoutes from './routes/health.routes.js';
import { notFoundHandler } from './middleware/not-found.js';
import { errorHandler } from './middleware/error-handler.js';
import { standardRateLimiter } from './middleware/rate-limiters.js';

const app = express();

// Security headers with Helmet
app.use(helmet());

// CORS configuration - synchronized with CLIENT_URL
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// JSON body parser with size limit to prevent payload abuse
app.use(express.json({ limit: '1mb' }));

// Apply standard rate limiter to all API endpoints
app.use('/api', standardRateLimiter);

// API Routes
app.use('/api', healthRoutes);

// 404 Fallback Handler
app.use(notFoundHandler);

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
