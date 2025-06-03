import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-middleware' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to authenticate JWT tokens
 */
export async function authenticateToken(req, res, next) {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please provide a valid authentication token',
      });
    }
    
    // Verify JWT token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        logger.warn('Invalid token attempt', { 
          error: err.message,
          ip: req.ip,
        });
        
        if (err.name === 'TokenExpiredError') {
          return res.status(401).json({ 
            error: 'Token expired',
            message: 'Please login again to continue',
          });
        }
        
        return res.status(403).json({ 
          error: 'Invalid token',
          message: 'The provided token is invalid',
        });
      }
      
      // Get fresh user data from database
      const { data: user, error } = await supabase
        .from('users')
        .select('id, email, name, tier, usage_limit, usage_count, status')
        .eq('id', decoded.id)
        .single();
      
      if (error || !user) {
        logger.error('User not found for valid token', { 
          userId: decoded.id,
          error: error?.message,
        });
        return res.status(403).json({ 
          error: 'User not found',
          message: 'The user associated with this token no longer exists',
        });
      }
      
      // Check if user is active
      if (user.status === 'suspended' || user.status === 'deleted') {
        return res.status(403).json({ 
          error: 'Account suspended',
          message: 'Your account has been suspended. Please contact support.',
        });
      }
      
      // Attach user to request object
      req.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        usageLimit: user.usage_limit,
        usageCount: user.usage_count,
      };
      
      // Log authenticated request
      logger.info('Authenticated request', {
        userId: user.id,
        tier: user.tier,
        endpoint: req.originalUrl,
        method: req.method,
      });
      
      next();
    });
  } catch (error) {
    logger.error('Authentication middleware error', { 
      error: error.message,
      stack: error.stack,
    });
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during authentication',
    });
  }
}

/**
 * Middleware to check if user has required tier
 */
export function requireTier(allowedTiers) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please login to access this feature',
      });
    }
    
    if (!allowedTiers.includes(req.user.tier)) {
      logger.warn('Tier access denied', {
        userId: req.user.id,
        userTier: req.user.tier,
        requiredTiers: allowedTiers,
        endpoint: req.originalUrl,
      });
      
      return res.status(403).json({ 
        error: 'Insufficient tier',
        message: `This feature requires one of the following tiers: ${allowedTiers.join(', ')}`,
        currentTier: req.user.tier,
        requiredTiers: allowedTiers,
      });
    }
    
    next();
  };
}

/**
 * Middleware to check API key for external API access
 */
export async function authenticateApiKey(req, res, next) {
  try {
    const apiKey = req.headers['x-api-key'];
    
    if (!apiKey) {
      return res.status(401).json({ 
        error: 'API key required',
        message: 'Please provide your API key in the x-api-key header',
      });
    }
    
    // Look up API key in database
    const { data: apiKeyData, error } = await supabase
      .from('api_keys')
      .select('id, user_id, name, last_used, is_active')
      .eq('key_hash', hashApiKey(apiKey))
      .single();
    
    if (error || !apiKeyData || !apiKeyData.is_active) {
      logger.warn('Invalid API key attempt', { 
        hashedKey: hashApiKey(apiKey).substring(0, 10),
        ip: req.ip,
      });
      return res.status(403).json({ 
        error: 'Invalid API key',
        message: 'The provided API key is invalid or inactive',
      });
    }
    
    // Get user associated with API key
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, tier, usage_limit, usage_count, status')
      .eq('id', apiKeyData.user_id)
      .single();
    
    if (userError || !user) {
      return res.status(403).json({ 
        error: 'User not found',
        message: 'The user associated with this API key no longer exists',
      });
    }
    
    // Check if user has API access (team tier only)
    if (user.tier !== 'team') {
      return res.status(403).json({ 
        error: 'API access denied',
        message: 'API access requires a Team subscription',
        currentTier: user.tier,
      });
    }
    
    // Update last used timestamp
    await supabase
      .from('api_keys')
      .update({ 
        last_used: new Date().toISOString(),
        usage_count: apiKeyData.usage_count + 1,
      })
      .eq('id', apiKeyData.id);
    
    // Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      tier: user.tier,
      usageLimit: user.usage_limit,
      usageCount: user.usage_count,
      apiKeyId: apiKeyData.id,
      apiKeyName: apiKeyData.name,
    };
    
    logger.info('API key authenticated', {
      userId: user.id,
      apiKeyId: apiKeyData.id,
      endpoint: req.originalUrl,
    });
    
    next();
  } catch (error) {
    logger.error('API key authentication error', { 
      error: error.message,
    });
    res.status(500).json({ 
      error: 'Authentication error',
      message: 'An error occurred during API key authentication',
    });
  }
}

/**
 * Hash API key for secure storage
 */
function hashApiKey(apiKey) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(apiKey).digest('hex');
}

/**
 * Optional authentication - attaches user if token present but doesn't require it
 */
export async function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    // No token provided, continue without user
    req.user = null;
    return next();
  }
  
  // If token provided, validate it
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) {
      // Invalid token, continue without user
      req.user = null;
      return next();
    }
    
    // Get user data
    const { data: user } = await supabase
      .from('users')
      .select('id, email, name, tier')
      .eq('id', decoded.id)
      .single();
    
    req.user = user || null;
    next();
  });
}