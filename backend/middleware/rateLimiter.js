import rateLimit from 'express-rate-limit';
import { checkUsageLimit } from '../services/usageService.js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'rate-limiter' },
});

/**
 * Create a rate limiter with specified limits
 */
export function createRateLimiter(requests, windowMinutes) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max: requests,
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userId: req.user?.id,
        path: req.path,
      });
      
      res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please wait ${windowMinutes} minutes before trying again.`,
        retryAfter: windowMinutes * 60,
      });
    },
  });
}

/**
 * Create tier-based rate limiter for authenticated routes
 */
export function createTierRateLimiter() {
  // Store limiters for each tier
  const limiters = {
    free: createRateLimiter(10, 1440), // 10 per day
    pro: createRateLimiter(200, 1440), // 200 per day
    team: createRateLimiter(1000, 1440), // 1000 per day
  };
  
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const tier = req.user.tier || 'free';
    const limiter = limiters[tier] || limiters.free;
    
    // Apply the appropriate rate limiter
    limiter(req, res, next);
  };
}

/**
 * Usage-based rate limiter that checks database usage counts
 */
export function createUsageRateLimiter() {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
      // Check usage limit without incrementing
      const usage = await checkUsageLimit(req.user.id);
      
      if (!usage.allowed) {
        logger.warn('Usage limit exceeded', {
          userId: req.user.id,
          used: usage.used,
          limit: usage.limit,
        });
        
        return res.status(429).json({
          error: 'Usage limit exceeded',
          message: `You have used ${usage.used} out of ${usage.limit} queries this month.`,
          usage: {
            used: usage.used,
            limit: usage.limit,
            remaining: usage.remaining,
            resetDate: usage.resetDate,
          },
          upgradeUrl: '/pricing',
        });
      }
      
      // Add usage info to request for later use
      req.usage = usage;
      next();
      
    } catch (error) {
      logger.error('Usage rate limiter error', { 
        error: error.message,
        userId: req.user.id,
      });
      
      // Allow request to proceed on error (fail open)
      next();
    }
  };
}

/**
 * IP-based rate limiter for public endpoints
 */
export const publicEndpointLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for authenticated users
    return req.user ? true : false;
  },
});

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per 15 minutes
  skipSuccessfulRequests: true, // Don't count successful requests
  message: 'Too many attempts, please try again later.',
});

/**
 * API key rate limiter for external API access
 */
export function createApiKeyRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    keyGenerator: (req) => {
      // Use API key as the identifier
      return req.user?.apiKeyId || req.ip;
    },
    handler: (req, res) => {
      logger.warn('API rate limit exceeded', {
        apiKeyId: req.user?.apiKeyId,
        userId: req.user?.id,
      });
      
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: 'API rate limit exceeded. Maximum 60 requests per minute.',
        retryAfter: 60,
      });
    },
  });
}

/**
 * Dynamic rate limiter that adjusts based on server load
 */
export function createDynamicRateLimiter(baseRequests = 100, baseWindow = 15) {
  let currentMultiplier = 1;
  
  // Monitor server load and adjust multiplier
  setInterval(() => {
    const usage = process.memoryUsage();
    const heapUsedPercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (heapUsedPercent > 80) {
      currentMultiplier = 0.5; // Reduce limits under high load
    } else if (heapUsedPercent > 60) {
      currentMultiplier = 0.75;
    } else {
      currentMultiplier = 1;
    }
  }, 30000); // Check every 30 seconds
  
  return rateLimit({
    windowMs: baseWindow * 60 * 1000,
    max: (req) => Math.floor(baseRequests * currentMultiplier),
    message: 'Server is under high load, please try again later.',
  });
}

/**
 * Middleware to log rate limit headers
 */
export function logRateLimitInfo(req, res, next) {
  res.on('finish', () => {
    const remaining = res.getHeader('X-RateLimit-Remaining');
    const limit = res.getHeader('X-RateLimit-Limit');
    
    if (remaining !== undefined && parseInt(remaining) < 10) {
      logger.info('Low rate limit remaining', {
        userId: req.user?.id,
        ip: req.ip,
        remaining,
        limit,
        path: req.path,
      });
    }
  });
  
  next();
}