import 'reflect-metadata';
import express, { type Express } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { configureContainer } from './infrastructure/di/index.js';

// Initialize dependency injection container
configureContainer();

const app: Express = express();
const PORT = process.env.PORT ?? 3000;

// Middleware
// CORS configuration with credentials support for HTTP-only cookies
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  credentials: true, // Allow cookies to be sent with requests
}));

// Body parser middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Cookie parser middleware (for JWT tokens in HTTP-only cookies with SameSite=Strict)
app.use(cookieParser());

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

export default app;
