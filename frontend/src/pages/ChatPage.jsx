import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Send, Plus, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { chatAPI } from '../utils/api';
import { useAuthStore } from '../stores/authStore';
import MessageBubble from '../components/MessageBubble';
import ConversationList from '../components/ConversationList';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Load conversation when ID changes
  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    } else {
      setMessages([]);
      setCurrentConversation(null);
    }
  }, [conversationId]);

  const loadConversations = async () => {
    try {
      const data = await chatAPI.listConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadConversation = async (id) => {
    setIsLoading(true);
    try {
      const data = await chatAPI.getConversation(id);
      setCurrentConversation(data.conversation);
      setMessages(data.conversation.messages || []);
    } catch (error) {
      toast.error('Failed to load conversation');
      navigate('/chat');
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async () => {
    navigate('/chat');
    setMessages([]);
    setCurrentConversation(null);
    inputRef.current?.focus();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim() || isSending) return;
    
    const userMessage = input.trim();
    setInput('');
    setIsSending(true);
    
    // Add user message to UI immediately
    const tempUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, tempUserMessage]);
    
    try {
      // Send message to API
      const response = await chatAPI.sendMessage(userMessage, conversationId);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to get response');
      }
      
      // If this was a new conversation, navigate to it
      if (!conversationId && response.conversationId) {
        navigate(`/chat/${response.conversationId}`);
      }
      
      // Add AI response to messages
      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.response.mainResponse,
        confidence: response.response.confidence,
        confidenceLevel: response.response.confidenceLevel,
        shortResponse: response.response.shortResponse,
        sources: response.response.sources,
        factors: response.response.factors,
        biases: response.response.biases,
        controversies: response.response.controversies,
        limitations: response.response.limitations,
        metadata: response.metadata,
        created_at: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Reload conversations to show new/updated one
      loadConversations();
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== tempUserMessage.id));
      setInput(userMessage); // Restore input
      
      const errorMessage = error.response?.data?.error || 'Failed to send message';
      toast.error(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteConversation = async (id) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await chatAPI.deleteConversation(id);
      toast.success('Conversation deleted');
      
      if (conversationId === id) {
        navigate('/chat');
      }
      
      loadConversations();
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  return (
    <div className="flex h-screen pt-16">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-64' : 'w-0'} transition-all duration-300 bg-gray-900 text-white overflow-hidden flex flex-col`}>
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition"
          >
            <Plus size={20} />
            New Chat
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            conversations={conversations}
            currentId={conversationId}
            onSelect={(id) => navigate(`/chat/${id}`)}
            onDelete={handleDeleteConversation}
          />
        </div>
        
        <div className="p-4 border-t border-gray-800">
          <div className="text-sm text-gray-400">
            <div>Usage: {user?.usageCount || 0} / {user?.usageLimit || 10}</div>
            <div className="capitalize">Tier: {user?.tier || 'free'}</div>
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            {showSidebar ? <X size={20} /> : <Menu size={20} />}
          </button>
          
          <h1 className="text-lg font-semibold">
            {currentConversation?.title || 'New Conversation'}
          </h1>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner />
            </div>
          ) : messages.length === 0 ? (
            <EmptyState
              title="Start a conversation"
              description="Ask me anything! I'll search the web and provide transparent, confidence-rated answers."
              icon={Send}
            />
          ) : (
            <div className="max-w-4xl mx-auto space-y-6">
              {messages.map((message) => (
                <MessageBubble key={message.id} message={message} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t bg-white p-4">
          <form onSubmit={handleSendMessage} className="max-w-4xl mx-auto">
            <div className="flex gap-4">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                disabled={isSending}
                className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                maxLength={1000}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg px-6 py-3 flex items-center gap-2 transition"
              >
                {isSending ? (
                  <>
                    <LoadingSpinner size="small" color="white" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    Send
                  </>
                )}
              </button>
            </div>
            <div className="mt-2 text-sm text-gray-500 text-right">
              {input.length}/1000 characters
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}