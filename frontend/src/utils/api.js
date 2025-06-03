import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Token is set by auth store when user logs in
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
            toast.error('Session expired. Please login again.');
          }
          break;
        case 403:
          toast.error('You do not have permission to perform this action');
          break;
        case 429:
          // Rate limit exceeded
          const resetDate = error.response.data?.resetDate;
          if (resetDate) {
            const date = new Date(resetDate).toLocaleDateString();
            toast.error(`Usage limit exceeded. Resets on ${date}`);
          } else {
            toast.error('Too many requests. Please try again later.');
          }
          break;
        case 500:
          toast.error('Server error. Please try again later.');
          break;
        default:
          // Let specific error handlers deal with other statuses
          break;
      }
    } else if (error.request) {
      // Request made but no response
      toast.error('Network error. Please check your connection.');
    } else {
      // Error in request configuration
      toast.error('An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// Chat API endpoints
export const chatAPI = {
  sendMessage: async (message, conversationId = null) => {
    const response = await api.post('/chat/message', {
      message,
      conversationId,
    });
    return response.data;
  },

  searchOnly: async (query) => {
    const response = await api.post('/chat/message', {
      message: query,
      searchOnly: true,
    });
    return response.data;
  },

  getConversation: async (conversationId) => {
    const response = await api.get(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  createConversation: async (title) => {
    const response = await api.post('/chat/conversation', { title });
    return response.data;
  },

  listConversations: async (page = 1, limit = 20) => {
    const response = await api.get('/chat/conversations', {
      params: { page, limit },
    });
    return response.data;
  },

  deleteConversation: async (conversationId) => {
    const response = await api.delete(`/chat/conversation/${conversationId}`);
    return response.data;
  },

  exportConversation: async (conversationId, format = 'json') => {
    const response = await api.get(`/chat/conversation/${conversationId}/export`, {
      params: { format },
    });
    return response.data;
  },
};

// User API endpoints
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/user/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/user/profile', data);
    return response.data;
  },

  getUsageStats: async () => {
    const response = await api.get('/user/usage');
    return response.data;
  },

  createApiKey: async (name) => {
    const response = await api.post('/user/api-keys', { name });
    return response.data;
  },

  listApiKeys: async () => {
    const response = await api.get('/user/api-keys');
    return response.data;
  },

  deleteApiKey: async (keyId) => {
    const response = await api.delete(`/user/api-keys/${keyId}`);
    return response.data;
  },

  getReferralStats: async () => {
    const response = await api.get('/user/referrals');
    return response.data;
  },
};

// Payment API endpoints
export const paymentAPI = {
  createCheckoutSession: async (tier) => {
    const response = await api.post('/payment/create-checkout-session', { tier });
    return response.data;
  },

  createPortalSession: async () => {
    const response = await api.post('/payment/create-portal-session');
    return response.data;
  },

  getSubscription: async () => {
    const response = await api.get('/payment/subscription');
    return response.data;
  },

  cancelSubscription: async () => {
    const response = await api.post('/payment/cancel-subscription');
    return response.data;
  },
};

export default api;