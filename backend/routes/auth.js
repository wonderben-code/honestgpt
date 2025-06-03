import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import Joi from 'joi';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'auth-routes' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(100).required(),
  referralCode: Joi.string().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const updatePasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

/**
 * Register new user
 */
router.post('/register', async (req, res) => {
  try {
    // Validate request
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.details[0].message 
      });
    }
    
    const { email, password, name, referralCode } = value;
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists with this email' 
      });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          tier: 'free',
        },
      },
    });
    
    if (authError) {
      logger.error('Supabase auth error', { error: authError });
      return res.status(500).json({ 
        error: 'Failed to create account' 
      });
    }
    
    // Create user profile in database
    const { data: newUser, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        name,
        password_hash: hashedPassword,
        tier: 'free',
        usage_limit: 10,
        usage_count: 0,
        referral_code: referralCode,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (dbError) {
      logger.error('Database error creating user', { error: dbError });
      // Clean up auth user if database insert fails
      await supabase.auth.admin.deleteUser(authData.user.id);
      return res.status(500).json({ 
        error: 'Failed to create user profile' 
      });
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: newUser.id, 
        email: newUser.email,
        tier: newUser.tier,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info('New user registered', { 
      userId: newUser.id, 
      email: newUser.email 
    });
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        tier: newUser.tier,
      },
      token,
    });
    
  } catch (error) {
    logger.error('Registration error', { error: error.message });
    res.status(500).json({ 
      error: 'An error occurred during registration' 
    });
  }
});

/**
 * Login user
 */
router.post('/login', async (req, res) => {
  try {
    // Validate request
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.details[0].message 
      });
    }
    
    const { email, password } = value;
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (authError) {
      logger.warn('Login failed', { email, error: authError.message });
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }
    
    // Get user profile from database
    const { data: user, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();
    
    if (dbError || !user) {
      logger.error('User profile not found', { userId: authData.user.id });
      return res.status(500).json({ 
        error: 'User profile not found' 
      });
    }
    
    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id);
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email,
        tier: user.tier,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    logger.info('User logged in', { userId: user.id });
    
    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tier: user.tier,
        usageLimit: user.usage_limit,
        usageCount: user.usage_count,
      },
      token,
    });
    
  } catch (error) {
    logger.error('Login error', { error: error.message });
    res.status(500).json({ 
      error: 'An error occurred during login' 
    });
  }
});

/**
 * Logout user
 */
router.post('/logout', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      
      // Sign out from Supabase
      await supabase.auth.signOut();
      
      // In production, you might want to blacklist the token
      // For now, we'll just return success
    }
    
    res.json({
      success: true,
      message: 'Logged out successfully',
    });
    
  } catch (error) {
    logger.error('Logout error', { error: error.message });
    res.status(500).json({ 
      error: 'An error occurred during logout' 
    });
  }
});

/**
 * Request password reset
 */
router.post('/reset-password', async (req, res) => {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.details[0].message 
      });
    }
    
    const { email } = value;
    
    // Send password reset email via Supabase
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/update-password`,
    });
    
    if (resetError) {
      logger.error('Password reset error', { error: resetError });
      return res.status(500).json({ 
        error: 'Failed to send reset email' 
      });
    }
    
    logger.info('Password reset requested', { email });
    
    // Always return success to prevent email enumeration
    res.json({
      success: true,
      message: 'If an account exists with this email, a reset link has been sent',
    });
    
  } catch (error) {
    logger.error('Reset password error', { error: error.message });
    res.status(500).json({ 
      error: 'An error occurred processing your request' 
    });
  }
});

/**
 * Update password with reset token
 */
router.post('/update-password', async (req, res) => {
  try {
    const { error, value } = updatePasswordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: error.details[0].message 
      });
    }
    
    const { token, newPassword } = value;
    
    // Verify token and update password via Supabase
    const { data, error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    if (updateError) {
      logger.error('Password update error', { error: updateError });
      return res.status(400).json({ 
        error: 'Invalid or expired reset token' 
      });
    }
    
    // Also update password hash in our database
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await supabase
      .from('users')
      .update({ 
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.user.id);
    
    logger.info('Password updated', { userId: data.user.id });
    
    res.json({
      success: true,
      message: 'Password updated successfully',
    });
    
  } catch (error) {
    logger.error('Update password error', { error: error.message });
    res.status(500).json({ 
      error: 'An error occurred updating your password' 
    });
  }
});

/**
 * Verify JWT token
 */
router.get('/verify', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get latest user data
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, tier, usage_limit, usage_count')
      .eq('id', decoded.id)
      .single();
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    res.json({
      success: true,
      valid: true,
      user,
    });
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Invalid or expired token',
        valid: false,
      });
    }
    
    logger.error('Token verification error', { error: error.message });
    res.status(500).json({ error: 'An error occurred' });
  }
});

export default router;