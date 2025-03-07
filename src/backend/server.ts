// Register module aliases
import './module-alias';

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
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

// Configure CORS to handle multiple origins
const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = Array.isArray(CORS_CONFIG.origin) 
      ? CORS_CONFIG.origin 
      : CORS_CONFIG.origin.split(',');
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: CORS_CONFIG.methods,
  allowedHeaders: CORS_CONFIG.allowedHeaders
};

app.use(cors(corsOptions));

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

// Serve static files from the React app in production
if (SERVER_CONFIG.nodeEnv === 'production') {
  // Serve static files
  app.use(express.static(path.join(__dirname, '../public')));

  // Handle React routing, return all requests to React app
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(__dirname, '../public/index.html'));
  });
}

// 404 handler for API routes only in production
app.use('/api/*', (req, res) => {
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