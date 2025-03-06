import { Request, Response, NextFunction } from 'express';
import { SERVER_CONFIG } from '../config';

/**
 * Custom error interface
 */
export interface IAppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;
}

/**
 * Custom error class
 */
export class AppError extends Error implements IAppError {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Development error handler
 * @param err Error object
 * @param res Response object
 */
const sendErrorDev = (err: IAppError, res: Response) => {
  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message,
    stack: err.stack,
    timestamp: new Date(),
  });
};

/**
 * Production error handler
 * @param err Error object
 * @param res Response object
 */
const sendErrorProd = (err: IAppError, res: Response) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode || 500).json({
      success: false,
      error: err.message,
      timestamp: new Date(),
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      success: false,
      error: 'Something went wrong',
      timestamp: new Date(),
    });
  }
};

/**
 * Global error handling middleware
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const appError = err as IAppError;
  appError.statusCode = appError.statusCode || 500;
  appError.status = appError.status || 'error';
  appError.isOperational = appError.isOperational || false;

  if (SERVER_CONFIG.isDevelopment) {
    sendErrorDev(appError, res);
  } else {
    sendErrorProd(appError, res);
  }
}; 