import 'reflect-metadata';
import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { configureContainer } from './infrastructure/di/index.js';
import { authRoutes, courseRoutes, materialRoutes, quizRoutes, assignmentRoutes, gradingRoutes } from './presentation/api/routes/index.js';
import { errorHandler, requestLogger, errorLogger, maintenanceMode } from './presentation/api/middleware/index.js';
import { getPrismaClient } from './infrastructure/persistence/prisma/client.js';
import { logger } from './infrastructure/logging/logger.js';

// Initialize dependency injection container
configureContainer();

const app: Express = express();
const PORT = parseInt(process.env.PORT ?? '3000', 10);

// Middleware
// CORS configuration with credentials support for HTTP-only cookies
// Allow multiple origins for development (localhost, 127.0.0.1, Docker network)
const corsOrigins = process.env.CORS_ORIGIN?.split(',').map(o => o.trim()) || [];
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://frontend:5173',
  ...corsOrigins,
].filter(Boolean);

console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, Postman, or same-origin)
    if (!origin) {
      console.log('Request with no origin - allowing');
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      console.log(`CORS allowed origin: ${origin}`);
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      console.warn(`Allowed origins are: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies to be sent with requests
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Set-Cookie'],
}));

// Body parser middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Cookie parser middleware (for JWT tokens in HTTP-only cookies with SameSite=Strict)
app.use(cookieParser());

// Maintenance mode middleware (check before processing requests)
// Requirements: 21.4 - Maintenance mode support
app.use(maintenanceMode);

// Request logging middleware (log all incoming requests)
// Requirements: 21.2, 21.3 - Request/response logging with context
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api', materialRoutes);
app.use('/api', quizRoutes);
app.use('/api', assignmentRoutes);
app.use('/api', gradingRoutes);

// Error logging middleware (log errors before handling)
// Requirements: 21.2 - Error tracking with context
app.use(errorLogger);

// Error handler middleware (must be last)
app.use(errorHandler);

/**
 * Initialize database connection and start server
 * Requirements: 21.1 - Database connection retry logic
 */
async function startServer(): Promise<void> {
  try {
    // Initialize database connection with retry logic
    logger.info('Initializing database connection...');
    await getPrismaClient();
    logger.info('Database connection established successfully');

    // Start server
    // Listen on 0.0.0.0 to accept connections from outside the container
    // This is required for Docker containerized applications
    app.listen(PORT, '0.0.0.0', () => {
      logger.info('Server started successfully', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development'
      });
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    logger.error('Failed to start server', {
      error: (error as Error).message,
      stack: (error as Error).stack
    });
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

export default app;
