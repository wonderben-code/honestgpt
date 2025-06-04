const express = require('express');
const router = express.Router();
const { chatAuthMiddleware } = require('../middleware/auth');
const { pool } = require('../db/config');
const openai = require('../services/openaiService');
const searchService = require('../services/searchService');

// Send a message and get AI response
router.post('/message', chatAuthMiddleware, async (req, res) => {
  const { message, conversationId } = req.body;
  const userId = req.user.id;

  try {
    // Validate input
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Create or get conversation
    let convId = conversationId;
    if (!convId) {
      // Create new conversation
      const convResult = await pool.query(
        'INSERT INTO conversations (user_id, title, created_at) VALUES ($1, $2, NOW()) RETURNING id',
        [userId, message.substring(0, 100)]
      );
      convId = convResult.rows[0].id;
    }

    // Save user message
    await pool.query(
      'INSERT INTO messages (conversation_id, role, content, created_at) VALUES ($1, $2, $3, NOW())',
      [convId, 'user', message]
    );

    // Perform web search
    const searchResults = await searchService.search(message);

    // Generate AI response with search results
    const aiResponse = await openai.generateResponse(message, searchResults);

    // Calculate confidence score based on search results
    const confidenceScore = calculateConfidenceScore(searchResults, aiResponse);

    // Save AI response
    const aiMessageResult = await pool.query(
      `INSERT INTO messages (conversation_id, role, content, confidence_score, sources, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) 
       RETURNING id, content, confidence_score, sources`,
      [convId, 'assistant', aiResponse.content, confidenceScore, JSON.stringify(aiResponse.sources)]
    );

    // Log usage
    await pool.query(
      'INSERT INTO usage_logs (user_id, action, tokens_used, created_at) VALUES ($1, $2, $3, NOW())',
      [userId, 'chat_message', aiResponse.tokensUsed || 0]
    );

    res.json({
      conversationId: convId,
      message: aiMessageResult.rows[0],
      confidenceScore,
      sources: aiResponse.sources
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Get user's conversations
router.get('/conversations', chatAuthMiddleware, async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT c.id, c.title, c.created_at, c.updated_at,
              COUNT(m.id) as message_count,
              MAX(m.created_at) as last_message_at
       FROM conversations c
       LEFT JOIN messages m ON c.id = m.conversation_id
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC
       LIMIT 50`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get specific conversation with messages
router.get('/conversation/:id', chatAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  try {
    // Verify conversation belongs to user
    const convResult = await pool.query(
      'SELECT id, title, created_at FROM conversations WHERE id = $1 AND user_id = $2',
      [conversationId, userId]
    );

    if (convResult.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    // Get messages
    const messagesResult = await pool.query(
      'SELECT id, role, content, confidence_score, sources, created_at FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC',
      [conversationId]
    );

    res.json({
      conversation: convResult.rows[0],
      messages: messagesResult.rows.map(msg => ({
        ...msg,
        sources: msg.sources ? JSON.parse(msg.sources) : []
      }))
    });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Delete conversation
router.delete('/conversation/:id', chatAuthMiddleware, async (req, res) => {
  const userId = req.user.id;
  const conversationId = req.params.id;

  try {
    // Verify conversation belongs to user and delete
    const result = await pool.query(
      'DELETE FROM conversations WHERE id = $1 AND user_id = $2 RETURNING id',
      [conversationId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    res.json({ message: 'Conversation deleted successfully' });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
});

// Helper function to calculate confidence score
function calculateConfidenceScore(searchResults, aiResponse) {
  let score = 0;
  let factors = 0;

  // Factor 1: Number of quality sources
  if (searchResults && searchResults.length > 0) {
    const qualitySources = searchResults.filter(s => 
      s.url.includes('.gov') || 
      s.url.includes('.edu') || 
      s.url.includes('pubmed') ||
      s.url.includes('scholar')
    );
    score += (qualitySources.length / searchResults.length) * 30;
    factors++;
  }

  // Factor 2: Source consensus
  if (aiResponse.sources && aiResponse.sources.length > 2) {
    score += 25;
    factors++;
  }

  // Factor 3: Recency of sources
  const recentSources = searchResults.filter(s => {
    const date = new Date(s.publishedDate);
    const yearAgo = new Date();
    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
    return date > yearAgo;
  });
  if (recentSources.length > 0) {
    score += (recentSources.length / searchResults.length) * 20;
    factors++;
  }

  // Factor 4: AI response certainty
  const uncertainPhrases = ['might be', 'could be', 'possibly', 'unclear', 'uncertain'];
  const hasUncertainty = uncertainPhrases.some(phrase => 
    aiResponse.content.toLowerCase().includes(phrase)
  );
  if (!hasUncertainty) {
    score += 25;
    factors++;
  }

  // Calculate final score
  const finalScore = factors > 0 ? Math.round(score) : 50;
  return Math.min(100, Math.max(0, finalScore));
}

module.exports = router;