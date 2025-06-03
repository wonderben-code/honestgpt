import { createClient } from '@supabase/supabase-js';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'conversation-service' },
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Get conversation context for AI response generation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID for verification
 * @returns {string} Conversation context
 */
export async function getConversationContext(conversationId, userId) {
  try {
    // Get last 5 messages for context
    const { data: messages, error } = await supabase
      .from('messages')
      .select('role, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error || !messages || messages.length === 0) {
      return '';
    }
    
    // Reverse to get chronological order
    messages.reverse();
    
    // Build context string
    const context = messages
      .map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
      .join('\n\n');
    
    return context;
  } catch (error) {
    logger.error('Error getting conversation context', { 
      error: error.message,
      conversationId 
    });
    return '';
  }
}

/**
 * Create a new conversation
 * @param {string} userId - User ID
 * @param {string} title - Conversation title
 * @returns {Object} New conversation
 */
export async function createConversation(userId, title = null) {
  try {
    const conversationTitle = title || `Conversation ${new Date().toLocaleDateString()}`;
    
    const { data, error } = await supabase
      .from('conversations')
      .insert({
        user_id: userId,
        title: conversationTitle,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    logger.info('Conversation created', { 
      conversationId: data.id,
      userId 
    });
    
    return data;
  } catch (error) {
    logger.error('Error creating conversation', { 
      error: error.message,
      userId 
    });
    throw error;
  }
}

/**
 * Save a message to conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID
 * @param {string} content - Message content
 * @param {Object} aiResponse - AI response data (optional)
 * @returns {Object} Saved message
 */
export async function saveMessage(conversationId, userId, content, aiResponse = null) {
  try {
    let actualConversationId = conversationId;
    
    // If no conversation ID, create new conversation
    if (!conversationId) {
      const conversation = await createConversation(userId);
      actualConversationId = conversation.id;
    }
    
    // Save user message
    const { data: userMessage, error: userError } = await supabase
      .from('messages')
      .insert({
        conversation_id: actualConversationId,
        user_id: userId,
        role: 'user',
        content: content,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (userError) {
      throw userError;
    }
    
    // Save AI response if provided
    let assistantMessage = null;
    if (aiResponse) {
      const { data: aiMessage, error: aiError } = await supabase
        .from('messages')
        .insert({
          conversation_id: actualConversationId,
          user_id: userId,
          role: 'assistant',
          content: aiResponse.mainResponse || aiResponse.content,
          confidence_score: aiResponse.confidence,
          confidence_level: aiResponse.confidenceLevel,
          sources: aiResponse.sources,
          confidence_factors: aiResponse.factors,
          biases: aiResponse.biases,
          controversies: aiResponse.controversies,
          limitations: aiResponse.limitations,
          metadata: aiResponse.metadata,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (aiError) {
        throw aiError;
      }
      
      assistantMessage = aiMessage;
    }
    
    // Update conversation updated_at
    await supabase
      .from('conversations')
      .update({ 
        updated_at: new Date().toISOString(),
        // Update title if it's the first message
        ...(userMessage && !conversationId && {
          title: content.substring(0, 50) + (content.length > 50 ? '...' : '')
        })
      })
      .eq('id', actualConversationId);
    
    return {
      conversationId: actualConversationId,
      userMessage,
      assistantMessage,
    };
    
  } catch (error) {
    logger.error('Error saving message', { 
      error: error.message,
      conversationId,
      userId 
    });
    throw error;
  }
}

/**
 * Get a conversation with messages
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID for verification
 * @returns {Object} Conversation with messages
 */
export async function getConversation(conversationId, userId) {
  try {
    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();
    
    if (convError || !conversation) {
      return null;
    }
    
    // Get messages
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    
    if (msgError) {
      throw msgError;
    }
    
    return {
      ...conversation,
      messages: messages || [],
    };
    
  } catch (error) {
    logger.error('Error getting conversation', { 
      error: error.message,
      conversationId,
      userId 
    });
    throw error;
  }
}

/**
 * List user's conversations
 * @param {string} userId - User ID
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {Array} List of conversations
 */
export async function listConversations(userId, page = 1, limit = 20) {
  try {
    const offset = (page - 1) * limit;
    
    const { data: conversations, error, count } = await supabase
      .from('conversations')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw error;
    }
    
    // Get last message for each conversation
    const conversationsWithLastMessage = await Promise.all(
      conversations.map(async (conv) => {
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, role, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        return {
          ...conv,
          lastMessage,
        };
      })
    );
    
    return {
      conversations: conversationsWithLastMessage,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    };
    
  } catch (error) {
    logger.error('Error listing conversations', { 
      error: error.message,
      userId 
    });
    throw error;
  }
}

/**
 * Delete a conversation
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID for verification
 */
export async function deleteConversation(conversationId, userId) {
  try {
    // Verify ownership
    const { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();
    
    if (!conversation) {
      throw new Error('Conversation not found or access denied');
    }
    
    // Delete conversation (messages will cascade delete)
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', conversationId);
    
    if (error) {
      throw error;
    }
    
    logger.info('Conversation deleted', { 
      conversationId,
      userId 
    });
    
  } catch (error) {
    logger.error('Error deleting conversation', { 
      error: error.message,
      conversationId,
      userId 
    });
    throw error;
  }
}

/**
 * Export conversation in different formats
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID for verification
 * @param {string} format - Export format (json, markdown, txt)
 * @returns {string|Object} Exported data
 */
export async function exportConversation(conversationId, userId, format = 'json') {
  try {
    const conversation = await getConversation(conversationId, userId);
    
    if (!conversation) {
      throw new Error('Conversation not found');
    }
    
    switch (format) {
      case 'json':
        return conversation;
        
      case 'markdown':
        return exportToMarkdown(conversation);
        
      case 'txt':
        return exportToText(conversation);
        
      default:
        throw new Error('Invalid export format');
    }
    
  } catch (error) {
    logger.error('Error exporting conversation', { 
      error: error.message,
      conversationId,
      userId,
      format 
    });
    throw error;
  }
}

/**
 * Export conversation to Markdown format
 */
function exportToMarkdown(conversation) {
  let markdown = `# ${conversation.title}\n\n`;
  markdown += `Created: ${new Date(conversation.created_at).toLocaleString()}\n\n`;
  markdown += '---\n\n';
  
  conversation.messages.forEach((message) => {
    if (message.role === 'user') {
      markdown += `## You\n\n${message.content}\n\n`;
    } else {
      markdown += `## honestGPT (${message.confidence_score || 'N/A'}% confident)\n\n`;
      markdown += `${message.content}\n\n`;
      
      if (message.sources && message.sources.length > 0) {
        markdown += '### Sources:\n\n';
        message.sources.forEach((source, idx) => {
          markdown += `${idx + 1}. [${source.title}](${source.url}) - ${source.quality} quality\n`;
        });
        markdown += '\n';
      }
    }
  });
  
  return markdown;
}

/**
 * Export conversation to plain text format
 */
function exportToText(conversation) {
  let text = `${conversation.title}\n`;
  text += `${'='.repeat(conversation.title.length)}\n\n`;
  text += `Created: ${new Date(conversation.created_at).toLocaleString()}\n\n`;
  
  conversation.messages.forEach((message) => {
    if (message.role === 'user') {
      text += `You: ${message.content}\n\n`;
    } else {
      text += `honestGPT (${message.confidence_score || 'N/A'}% confident): `;
      text += `${message.content}\n\n`;
    }
  });
  
  return text;
}