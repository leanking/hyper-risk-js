import { Request, Response, NextFunction } from 'express';
import { RATE_LIMIT_CONFIG, DB_TABLES } from '../config';
import supabase from '../config/supabase';
import { RequestTracking } from '@shared/types';

/**
 * Rate limiting middleware
 * Restricts the number of requests from a single IP address within a time window
 */
export const rateLimitMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get client IP address
    const ipAddress = req.ip || req.socket.remoteAddress || 'unknown';
    const endpoint = req.originalUrl;
    const currentTime = new Date();
    const windowStartTime = new Date(currentTime.getTime() - RATE_LIMIT_CONFIG.windowMs);

    // Check if the IP address has exceeded the rate limit
    const { data: requestTrackingData, error } = await supabase
      .from(DB_TABLES.requestTracking)
      .select('*')
      .eq('ipAddress', ipAddress)
      .gte('timestamp', windowStartTime.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('Error checking rate limit:', error);
      return next();
    }

    // Count the number of requests within the time window
    const requestCount = requestTrackingData?.length || 0;

    // If the request count exceeds the limit, return 429 Too Many Requests
    if (requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again later',
        timestamp: new Date(),
      });
    }

    // Record the request
    const { error: insertError } = await supabase
      .from(DB_TABLES.requestTracking)
      .insert({
        ipAddress,
        endpoint,
        timestamp: currentTime.toISOString(),
        count: requestCount + 1,
        createdAt: currentTime.toISOString(),
        updatedAt: currentTime.toISOString(),
      });

    if (insertError) {
      console.error('Error recording request:', insertError);
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error('Error in rate limit middleware:', error);
    next();
  }
}; 