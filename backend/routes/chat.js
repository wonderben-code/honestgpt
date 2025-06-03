import express from 'express';
import { performWebSearch } from '../services/searchService.js';
import { calculateConfidence, detectTopic } from '../services/confidenceService.js';
import { generateAIResponse, generateNoResultsResponse } from '../services/aiService.js';
import { authenticateToken } from '../middleware/auth.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { trackUsage } from '../services/usageService.js';
import { getConversationContext } from '../services/conversationService.js';
import Joi from 'joi';
import winston from 'winston';

const router = express.Router();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'chat-routes' },
});

// Request validation schema
const chatRequestSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  conversationId: Joi.string().uuid().optional(),
  searchOnly: Joi.boolean().optional(),
});

// Apply authentication to all chat routes
router.use(authenticateToken);

// Apply rate limiting based on user tier
router.use(async (req, res, next) => {
  try {
    const tier = req.user.tier || 'free';
    let limiter;
    
    switch (tier) {
      case 'free':
        limiter = createRateLimiter(10, 30); // 10 requests per 30 days
        break;
      case 'pro':
        limiter = createRateLimiter(200, 30); // 200 per month
        break;
      case 'team':
        limiter = createRateLimiter(1000, 30); // 1000 per month
        break;
      default:
        limiter = createRateLimiter(10, 30);
    }
    
    limiter(req, res, next);
  } catch (error) {
    next(error);
  }
});

/**
 * Main chat endpoint - generates AI response with confidence scores
 */
router.post('/message', async (req, res) => {
  try {
    // Validate request
    const { error, value } = chatRequestSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ 
        error: 'Invalid request', 
        details: error.details[0].message 
      });
    }
    
    const { message, conversationId, searchOnly } = value;
    const userId = req.user.id;
    
    logger.info('Chat request received', { 
      userId, 
      messageLength: message.length,
      conversationId 
    });
    
    // Check usage limits
    const canProceed = await trackUsage(userId, 'chat');
    if (!canProceed.allowed) {
      return res.status(429).json({ 
        error: 'Usage limit exceeded',
        limit: canProceed.limit,
        used: canProceed.used,
        resetDate: canProceed.resetDate,
      });
    }
    
    // Step 1: Detect topic for better search and confidence calculation
    const topic = detectTopic(message);
    
    // Step 2: Perform web search
    const searchResults = await performWebSearch(message);
    
    if (!searchResults.success || searchResults.results.length === 0) {
      logger.warn('No search results found', { message: message.substring(0, 50) });
      
      if (searchOnly) {
        return res.json({
          success: false,
          message: 'No search results found',
          results: [],
        });
      }
      
      // Generate no-results response
      const response = generateNoResultsResponse(message);
      return res.json(response);
    }
    
    // Step 3: Calculate confidence based on search results
    const confidenceBreakdown = await calculateConfidence(
      searchResults.results,
      message,
      topic
    );
    
    // If search only mode, return search results with confidence
    if (searchOnly) {
      return res.json({
        success: true,
        searchResults: searchResults.results,
        confidence: confidenceBreakdown,
        metadata: searchResults.metadata,
      });
    }
    
    // Step 4: Get conversation context if conversationId provided
    let conversationContext = '';
    if (conversationId) {
      conversationContext = await getConversationContext(conversationId, userId);
    }
    
    // Step 5: Generate AI response
    const aiResponse = await generateAIResponse(
      message,
      searchResults.results,
      confidenceBreakdown,
      conversationContext
    );
    
    if (!aiResponse.success) {
      logger.error('AI response generation failed', { 
        error: aiResponse.error,
        userId 
      });
      return res.status(500).json({
        error: 'Failed to generate response',
        fallback: aiResponse.fallbackResponse,
      });
    }
    
    // Step 6: Save conversation to database
    if (conversationId) {
      await saveMessage(conversationId, userId, message, aiResponse.response);
    }
    
    // Step 7: Track token usage for billing
    await trackTokenUsage(userId, aiResponse.metadata);
    
    // Return complete response
    res.json({
      success: true,
      response: aiResponse.response,
      metadata: {
        ...aiResponse.metadata,
        topic,
        searchMetadata: searchResults.metadata,
      },
    });
    
  } catch (error) {
    logger.error('Chat endpoint error', { 
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    
    res.status(500).json({
      error: 'An error occurred processing your request',
      message: 'Please try again. If the problem persists, contact support.',
    });
  }
});

/**
 * Get conversation history
 */
router.get('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    const conversation = await getConversation(conversationId, userId);
    
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    
    res.json({
      success: true,
      conversation,
    });
    
  } catch (error) {
    logger.error('Get conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to retrieve conversation' });
  }
});

/**
 * Create new conversation
 */
router.post('/conversation', async (req, res) => {
  try {
    const userId = req.user.id;
    const { title } = req.body;
    
    const conversation = await createConversation(userId, title);
    
    res.json({
      success: true,
      conversation,
    });
    
  } catch (error) {
    logger.error('Create conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

/**
 * List user's conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    
    const conversations = await listConversations(userId, page, limit);
    
    res.json({
      success: true,
      conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
      },
    });
    
  } catch (error) {
    logger.error('List conversations error', { error: error.message });
    res.status(500).json({ error: 'Failed to list conversations' });
  }
});

/**
 * Delete conversation
 */
router.delete('/conversation/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    
    await deleteConversation(conversationId, userId);
    
    res.json({
      success: true,
      message: 'Conversation deleted',
    });
    
  } catch (error) {
    logger.error('Delete conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

/**
 * Export conversation
 */
router.get('/conversation/:conversationId/export', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { format = 'json' } = req.query;
    
    // Check if user has export permission (pro/team tier)
    if (!['pro', 'team'].includes(req.user.tier)) {
      return res.status(403).json({ 
        error: 'Export feature requires Pro or Team subscription' 
      });
    }
    
    const exportData = await exportConversation(conversationId, userId, format);
    
    if (format === 'json') {
      res.json(exportData);
    } else if (format === 'markdown') {
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="conversation-${conversationId}.md"`);
      res.send(exportData);
    } else {
      res.status(400).json({ error: 'Invalid export format' });
    }
    
  } catch (error) {
    logger.error('Export conversation error', { error: error.message });
    res.status(500).json({ error: 'Failed to export conversation' });
  }
});

// Placeholder functions - these would be implemented in separate service files
async function saveMessage(conversationId, userId, message, response) {
  // Implementation would save to database
}

async function trackTokenUsage(userId, metadata) {
  // Implementation would track usage for billing
}

async function getConversation(conversationId, userId) {
  // Implementation would fetch from database
}

async function createConversation(userId, title) {
  // Implementation would create in database
}

async function listConversations(userId, page, limit) {
  // Implementation would fetch from database with pagination
}

async function deleteConversation(conversationId, userId) {
  // Implementation would delete from database
}

async function exportConversation(conversationId, userId, format) {
  // Implementation would export conversation data
}

export default router;