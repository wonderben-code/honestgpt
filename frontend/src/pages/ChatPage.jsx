// frontend/src/pages/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, Plus, Download, Settings, Sparkles, 
  ChevronDown, ExternalLink, AlertCircle, 
  MessageSquare, Calendar, Search, Menu, X
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';

const Chat = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  
  // State
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showSources, setShowSources] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const convos = await apiService.getConversations();
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setMessages([]);
    setInput('');
  };

  const loadConversation = async (conversationId) => {
    try {
      const data = await apiService.getConversation(conversationId);
      setCurrentConversationId(conversationId);
      setMessages(data.messages);
      setSidebarOpen(false);
    } catch (error) {
      toast.error('Failed to load conversation');
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    
    // Add user message
    const newUserMessage = {
      id: Date.now(),
      role: 'user',
      content: userMessage,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await apiService.sendMessage(userMessage, currentConversationId);
      
      // Update conversation ID if new
      if (!currentConversationId) {
        setCurrentConversationId(response.conversationId);
        loadConversations(); // Refresh conversation list
      }
      
      // Add AI response
      const aiMessage = {
        id: response.message.id,
        role: 'assistant',
        content: response.message.content,
        confidenceScore: response.confidenceScore,
        sources: response.sources || [],
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update query count
      if (user) {
        updateUser({
          queries_used: (user.queries_used || 0) + 1
        });
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        toast.error(
          <div>
            <p className="font-semibold">Subscription Required</p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-2 text-sm underline"
            >
              View plans
            </button>
          </div>
        );
      } else if (error.message.includes('Query limit reached')) {
        toast.error(
          <div>
            <p className="font-semibold">Query Limit Reached</p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-2 text-sm underline"
            >
              Upgrade plan
            </button>
          </div>
        );
      } else {
        toast.error('Failed to send message. Please try again.');
      }
      
      // Remove user message on error
      setMessages(prev => prev.filter(m => m.id !== newUserMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 80) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const getConfidenceLabel = (score) => {
    if (score >= 80) return 'High Confidence';
    if (score >= 50) return 'Moderate Confidence';
    return 'Low Confidence';
  };

  // Query counter component
  const QueryCounter = () => {
    if (!user || !user.tier) return null;
    
    const remaining = user.queries_limit - user.queries_used;
    const percentage = (user.queries_used / user.queries_limit) * 100;
    
    return (
      <div className="p-4">
        <div className="glass rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Queries Remaining</span>
            <span className="text-sm font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              {remaining} / {user.queries_limit}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 rounded-full relative overflow-hidden ${
                percentage > 80 ? 'bg-gradient-to-r from-red-500 to-pink-500' : 
                percentage > 60 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' : 
                'bg-gradient-to-r from-green-500 to-emerald-500'
              }`}
              style={{ width: `${100 - percentage}%` }}
            >
              <div className="absolute inset-0 shimmer"></div>
            </div>
          </div>
          {percentage > 80 && (
            <p className="text-xs text-red-600 mt-2">
              Running low on queries. 
              <button onClick={() => navigate('/pricing')} className="underline ml-1 hover:text-red-700">
                Upgrade plan
              </button>
            </p>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="chat-container">
      <div className="chat-bg-pattern"></div>
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="mobile-sidebar-overlay md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              honestGPT
            </h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          <QueryCounter />
          
          <button
            onClick={startNewChat}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-4 py-3 font-medium flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg btn-glow"
          >
            <Plus className="h-5 w-5" />
            New Chat
          </button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Recent Conversations
          </h3>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  currentConversationId === conv.id 
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {conv.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(conv.last_message_at || conv.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col">
        {/* Chat Header */}
        <header className="glass border-b border-gray-100 px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Menu className="h-5 w-5 text-gray-600" />
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                {currentConversationId ? 'Chat' : 'New Conversation'}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                <Download className="h-5 w-5 text-gray-600 group-hover:text-purple-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors group">
                <Settings className="h-5 w-5 text-gray-600 group-hover:text-purple-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center mb-4">
                <Sparkles className="h-10 w-10 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Ask Anything
              </h2>
              <p className="text-gray-600 max-w-md">
                I'll search trusted sources and show you exactly how confident I am in my response.
              </p>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={message.id}
              className={`flex gap-4 message-enter ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
              )}
              
              <div className={`max-w-2xl ${message.role === 'user' ? 'order-1' : ''}`}>
                <div
                  className={`rounded-2xl px-5 py-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                      : 'glass shadow-md'
                  }`}
                  style={message.role === 'user' ? { borderBottomRightRadius: '0.5rem' } : { borderBottomLeftRadius: '0.5rem' }}
                >
                  <p className={`${message.role === 'user' ? 'text-white' : 'text-gray-800'} whitespace-pre-wrap`}>
                    {message.content}
                  </p>
                  
                  {/* Confidence Indicator */}
                  {message.role === 'assistant' && message.confidenceScore !== undefined && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="confidence-ring">
                          <svg viewBox="0 0 60 60">
                            <circle cx="30" cy="30" r="27" className="ring-bg" />
                            <circle
                              cx="30"
                              cy="30"
                              r="27"
                              className={`ring-fill ${getConfidenceColor(message.confidenceScore)}`}
                              strokeDasharray="169.65"
                              strokeDashoffset={169.65 - (169.65 * message.confidenceScore) / 100}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-sm font-bold ${
                              getConfidenceColor(message.confidenceScore) === 'high' ? 'text-green-600' :
                              getConfidenceColor(message.confidenceScore) === 'medium' ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {message.confidenceScore}%
                            </span>
                          </div>
                        </div>
                        <div>
                          <h4 className={`font-semibold ${
                            getConfidenceColor(message.confidenceScore) === 'high' ? 'text-green-600' :
                            getConfidenceColor(message.confidenceScore) === 'medium' ? 'text-yellow-600' :
                            'text-red-600'
                          }`}>
                            {getConfidenceLabel(message.confidenceScore)}
                          </h4>
                          <p className="text-sm text-gray-600">
                            Based on {message.sources?.length || 0} verified sources
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Sources */}
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowSources({ ...showSources, [message.id]: !showSources[message.id] })}
                        className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                      >
                        <Search className="h-4 w-4" />
                        View {message.sources.length} Sources
                        <ChevronDown className={`h-4 w-4 transition-transform ${showSources[message.id] ? 'rotate-180' : ''}`} />
                      </button>
                      
                      {showSources[message.id] && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {message.sources.map((source, idx) => (
                            <a
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="source-chip inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-full text-sm font-medium text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                            >
                              <div className="w-4 h-4 bg-gradient-to-br from-purple-400 to-indigo-400 rounded" />
                              {new URL(source.url).hostname.replace('www.', '')}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {message.role === 'user' && (
                <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg order-2">
                  <span className="text-white font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="typing-indicator">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="chat-input-wrapper glass rounded-2xl border-2 border-transparent focus-within:border-purple-500 p-1">
              <div className="flex items-end gap-2 p-2">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask anything... I'll search trusted sources and show my confidence level"
                  className="flex-1 resize-none bg-transparent outline-none text-gray-800 placeholder-gray-400 max-h-32"
                  rows="1"
                  disabled={isLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="send-button bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 rounded-xl hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Responses are generated with real-time web search from trusted sources
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Chat;