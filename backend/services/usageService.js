import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'usage-service' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Track usage for a user action
 * @param {string} userId - User ID
 * @param {string} actionType - Type of action (chat, search, etc.)
 * @param {Object} metadata - Additional metadata
 * @returns {Object} Usage status
 */
export async function trackUsage(userId, actionType = 'chat', metadata = {}) {
  try {
    // Get current user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('tier, usage_count, usage_limit, usage_reset_date')
      .eq('id', userId)
      .single();
    
    if (userError || !user) {
      logger.error('User not found for usage tracking', { userId });
      return { allowed: false, error: 'User not found' };
    }
    
    // Check if usage reset is needed
    const resetDate = new Date(user.usage_reset_date);
    const now = new Date();
    
    if (now > resetDate) {
      // Reset usage count
      await resetUserUsage(userId);
      user.usage_count = 0;
    }
    
    // Check if user has exceeded limit
    if (user.usage_count >= user.usage_limit) {
      logger.warn('Usage limit exceeded', { 
        userId, 
        count: user.usage_count, 
        limit: user.usage_limit 
      });
      
      return {
        allowed: false,
        limit: user.usage_limit,
        used: user.usage_count,
        resetDate: user.usage_reset_date,
        error: 'Usage limit exceeded',
      };
    }
    
    // Increment usage count
    const newCount = user.usage_count + 1;
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        usage_count: newCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (updateError) {
      logger.error('Failed to update usage count', { 
        userId, 
        error: updateError 
      });
      return { allowed: false, error: 'Failed to update usage' };
    }
    
    // Log usage for analytics
    await logUsage(userId, actionType, metadata);
    
    return {
      allowed: true,
      limit: user.usage_limit,
      used: newCount,
      remaining: user.usage_limit - newCount,
      resetDate: user.usage_reset_date,
    };
    
  } catch (error) {
    logger.error('Usage tracking error', { 
      userId, 
      error: error.message 
    });
    return { allowed: false, error: 'Usage tracking failed' };
  }
}

/**
 * Reset user's monthly usage
 */
async function resetUserUsage(userId) {
  const nextResetDate = new Date();
  nextResetDate.setDate(nextResetDate.getDate() + 30);
  
  await supabase
    .from('users')
    .update({
      usage_count: 0,
      usage_reset_date: nextResetDate.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);
  
  logger.info('User usage reset', { userId, nextResetDate });
}

/**
 * Log usage details for analytics
 */
async function logUsage(userId, actionType, metadata) {
  try {
    // Calculate approximate cost
    let costCents = 0;
    if (actionType === 'chat') {
      costCents = 10; // ~$0.10 per query
    }
    
    await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action_type: actionType,
        tokens_used: metadata.tokens || 0,
        search_queries: metadata.searches || 1,
        cost_cents: costCents,
        metadata: metadata,
        created_at: new Date().toISOString(),
      });
      
  } catch (error) {
    // Don't fail the main operation if logging fails
    logger.error('Failed to log usage', { 
      userId, 
      error: error.message 
    });
  }
}

/**
 * Get usage statistics for a user
 */
export async function getUserUsageStats(userId, startDate = null, endDate = null) {
  try {
    // Get current usage
    const { data: user } = await supabase
      .from('users')
      .select('tier, usage_count, usage_limit, usage_reset_date')
      .eq('id', userId)
      .single();
    
    // Build query for historical usage
    let query = supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    
    const { data: logs, error } = await query.limit(100);
    
    if (error) {
      throw error;
    }
    
    // Calculate statistics
    const stats = {
      current: {
        tier: user.tier,
        used: user.usage_count,
        limit: user.usage_limit,
        remaining: user.usage_limit - user.usage_count,
        resetDate: user.usage_reset_date,
      },
      history: {
        totalQueries: logs.length,
        totalCost: logs.reduce((sum, log) => sum + (log.cost_cents || 0), 0) / 100,
        byDay: groupByDay(logs),
        byType: groupByType(logs),
      },
    };
    
    return stats;
    
  } catch (error) {
    logger.error('Get usage stats error', { 
      userId, 
      error: error.message 
    });
    throw error;
  }
}

/**
 * Check if user can perform action without incrementing
 */
export async function checkUsageLimit(userId) {
  try {
    const { data: user } = await supabase
      .from('users')
      .select('usage_count, usage_limit, usage_reset_date')
      .eq('id', userId)
      .single();
    
    if (!user) {
      return { allowed: false, error: 'User not found' };
    }
    
    // Check if reset needed
    const resetDate = new Date(user.usage_reset_date);
    const now = new Date();
    
    if (now > resetDate) {
      return {
        allowed: true,
        limit: user.usage_limit,
        used: 0,
        remaining: user.usage_limit,
      };
    }
    
    const allowed = user.usage_count < user.usage_limit;
    
    return {
      allowed,
      limit: user.usage_limit,
      used: user.usage_count,
      remaining: Math.max(0, user.usage_limit - user.usage_count),
      resetDate: user.usage_reset_date,
    };
    
  } catch (error) {
    logger.error('Check usage limit error', { 
      userId, 
      error: error.message 
    });
    return { allowed: false, error: 'Failed to check usage' };
  }
}

/**
 * Track token usage for billing
 */
export async function trackTokenUsage(userId, metadata) {
  try {
    const tokens = metadata.tokensUsed || 0;
    const costCents = Math.ceil(tokens * 0.01); // Rough estimate
    
    await supabase
      .from('usage_logs')
      .insert({
        user_id: userId,
        action_type: 'tokens',
        tokens_used: tokens,
        cost_cents: costCents,
        metadata: metadata,
        created_at: new Date().toISOString(),
      });
      
  } catch (error) {
    logger.error('Track token usage error', { 
      userId, 
      error: error.message 
    });
  }
}

// Helper functions
function groupByDay(logs) {
  const grouped = {};
  
  logs.forEach(log => {
    const date = new Date(log.created_at).toISOString().split('T')[0];
    if (!grouped[date]) {
      grouped[date] = {
        count: 0,
        cost: 0,
      };
    }
    grouped[date].count++;
    grouped[date].cost += (log.cost_cents || 0) / 100;
  });
  
  return grouped;
}

function groupByType(logs) {
  const grouped = {};
  
  logs.forEach(log => {
    const type = log.action_type;
    if (!grouped[type]) {
      grouped[type] = {
        count: 0,
        cost: 0,
      };
    }
    grouped[type].count++;
    grouped[type].cost += (log.cost_cents || 0) / 100;
  });
  
  return grouped;
}