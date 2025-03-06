import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { SERVER_CONFIG, CORS_CONFIG, API_ENDPOINTS } from './config';
import { errorHandler } from './middleware/error-handler.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';

// Import routes
import walletRoutes from './routes/wallet.routes';
// import transactionRoutes from './routes/transaction.routes';
// import positionRoutes from './routes/position.routes';
import pnlRoutes from './routes/pnl.routes';
// import riskMetricsRoutes from './routes/risk-metrics.routes';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(CORS_CONFIG));

// Apply rate limiting to all routes
app.use(rateLimitMiddleware as express.RequestHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date(),
    },
    timestamp: new Date(),
  });
});

// API routes
app.use(API_ENDPOINTS.wallets, walletRoutes);
// app.use(API_ENDPOINTS.transactions, transactionRoutes);
// app.use(API_ENDPOINTS.positions, positionRoutes);
app.use(API_ENDPOINTS.pnl, pnlRoutes);
// app.use(API_ENDPOINTS.riskMetrics, riskMetricsRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date(),
  });
});

// Global error handler
app.use(errorHandler);

// Start server
const PORT = SERVER_CONFIG.port;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${SERVER_CONFIG.nodeEnv} mode`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

export default app; 