import express from 'express';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { authenticateToken, requireTier, authenticateApiKey } from '../middleware/auth.js';
import { getUserUsageStats } from '../services/usageService.js';
import Joi from 'joi';
import crypto from 'crypto';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-routes' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  currentPassword: Joi.string().optional(),
  newPassword: Joi.string().min(8).optional(),
});

const createApiKeySchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
});

// Apply authentication to all user routes
router.use(authenticateToken);

/**
 * Get user profile
 */
router.get('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, tier, usage_count, usage_limit, usage_reset_date, created_at, last_login')
      .eq('id', userId)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      success: true,
      user,
    });
    
  } catch (error) {
    logger.error('Get profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

/**
 * Update user profile
 */
router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.id;
    const { error: validationError, value } = updateProfileSchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validationError.details[0].message 
      });
    }
    
    const updates = {};
    
    // Handle name update
    if (value.name) {
      updates.name = value.name;
    }
    
    // Handle email update
    if (value.email && value.email !== req.user.email) {
      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', value.email)
        .single();
      
      if (existingUser) {
        return res.status(409).json({ error: 'Email already in use' });
      }
      
      updates.email = value.email;
    }
    
    // Handle password update
    if (value.currentPassword && value.newPassword) {
      // Verify current password
      const { data: user } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();
      
      const isValidPassword = await bcrypt.compare(value.currentPassword, user.password_hash);
      
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      updates.password_hash = await bcrypt.hash(value.newPassword, 10);
    }
    
    // Apply updates
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);
      
      if (updateError) {
        throw updateError;
      }
      
      logger.info('Profile updated', { userId, updates: Object.keys(updates) });
    }
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
    });
    
  } catch (error) {
    logger.error('Update profile error', { error: error.message });
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * Get usage statistics
 */
router.get('/usage', async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    
    const stats = await getUserUsageStats(userId, startDate, endDate);
    
    res.json({
      success: true,
      usage: stats,
    });
    
  } catch (error) {
    logger.error('Get usage error', { error: error.message });
    res.status(500).json({ error: 'Failed to get usage statistics' });
  }
});

/**
 * List API keys (team tier only)
 */
router.get('/api-keys', requireTier(['team']), async (req, res) => {
  try {
    const userId = req.user.id;
    
    const { data: apiKeys, error } = await supabase
      .from('api_keys')
      .select('id, name, key_prefix, is_active, usage_count, last_used, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    res.json({
      success: true,
      apiKeys: apiKeys || [],
    });
    
  } catch (error) {
    logger.error('List API keys error', { error: error.message });
    res.status(500).json({ error: 'Failed to list API keys' });
  }
});

/**
 * Create new API key (team tier only)
 */
router.post('/api-keys', requireTier(['team']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { error: validationError, value } = createApiKeySchema.validate(req.body);
    
    if (validationError) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: validationError.details[0].message 
      });
    }
    
    // Check if user has reached API key limit
    const { count } = await supabase
      .from('api_keys')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);
    
    if (count >= 5) {
      return res.status(400).json({ 
        error: 'API key limit reached',
        message: 'You can have a maximum of 5 active API keys',
      });
    }
    
    // Generate API key
    const apiKey = `hgpt_${crypto.randomBytes(32).toString('base64url')}`;
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyPrefix = apiKey.substring(0, 10);
    
    // Save to database
    const { data: newKey, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        user_id: userId,
        name: value.name,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select('id, name, key_prefix, created_at')
      .single();
    
    if (insertError) {
      throw insertError;
    }
    
    logger.info('API key created', { userId, keyId: newKey.id });
    
    res.json({
      success: true,
      apiKey: {
        ...newKey,
        key: apiKey, // Only returned once during creation
      },
      message: 'Save this API key securely. It will not be shown again.',
    });
    
  } catch (error) {
    logger.error('Create API key error', { error: error.message });
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

/**
 * Delete API key (team tier only)
 */
router.delete('/api-keys/:keyId', requireTier(['team']), async (req, res) => {
  try {
    const userId = req.user.id;
    const { keyId } = req.params;
    
    // Verify ownership
    const { data: apiKey } = await supabase
      .from('api_keys')
      .select('id')
      .eq('id', keyId)
      .eq('user_id', userId)
      .single();
    
    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }
    
    // Soft delete (mark as inactive)
    const { error } = await supabase
      .from('api_keys')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', keyId);
    
    if (error) {
      throw error;
    }
    
    logger.info('API key deleted', { userId, keyId });
    
    res.json({
      success: true,
      message: 'API key deleted successfully',
    });
    
  } catch (error) {
    logger.error('Delete API key error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete API key' });
  }
});

/**
 * Get referral statistics
 */
router.get('/referrals', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's referral code
    const { data: user } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .single();
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Generate referral code from email
    const referralCode = crypto
      .createHash('sha256')
      .update(user.email)
      .digest('hex')
      .substring(0, 8)
      .toUpperCase();
    
    // Count referrals
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('referral_code', referralCode);
    
    res.json({
      success: true,
      referralCode,
      referralCount: count || 0,
      referralLink: `${process.env.FRONTEND_URL}/register?ref=${referralCode}`,
    });
    
  } catch (error) {
    logger.error('Get referrals error', { error: error.message });
    res.status(500).json({ error: 'Failed to get referral statistics' });
  }
});

/**
 * Delete account
 */
router.delete('/account', async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ 
        error: 'Password required',
        message: 'Please provide your password to confirm account deletion',
      });
    }
    
    // Verify password
    const { data: user } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', userId)
      .single();
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    
    // Soft delete - mark as deleted but keep data for legal/audit purposes
    const { error } = await supabase
      .from('users')
      .update({ 
        status: 'deleted',
        email: `deleted_${userId}@deleted.com`, // Prevent email reuse
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);
    
    if (error) {
      throw error;
    }
    
    logger.info('Account deleted', { userId });
    
    res.json({
      success: true,
      message: 'Account deleted successfully',
    });
    
  } catch (error) {
    logger.error('Delete account error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;