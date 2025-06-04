// frontend/src/services/api.js
import { toast } from 'react-hot-toast';

const API_BASE = import.meta.env.VITE_API_URL;
const WAKE_UP_TIMEOUT = 60000; // 60 seconds for Render wake-up
const NORMAL_TIMEOUT = 10000; // 10 seconds for normal requests

class APIService {
  constructor() {
    this.isWakingUp = false;
    this.hasWokenUp = this.checkIfServerAwake();
  }

  checkIfServerAwake() {
    const lastAwake = localStorage.getItem('serverLastAwake');
    if (!lastAwake) return false;
    
    // Consider server asleep if more than 15 minutes since last request
    const fifteenMinutes = 15 * 60 * 1000;
    return Date.now() - parseInt(lastAwake) < fifteenMinutes;
  }

  markServerAwake() {
    localStorage.setItem('serverLastAwake', Date.now().toString());
    this.hasWokenUp = true;
  }

  async makeRequest(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const isFirstRequest = !this.hasWokenUp;
    const timeout = isFirstRequest ? WAKE_UP_TIMEOUT : NORMAL_TIMEOUT;
    
    // Add auth header if token exists
    const token = localStorage.getItem('token');
    if (token) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`
      };
    }

    // Add content type for JSON requests
    if (options.body && !(options.body instanceof FormData)) {
      options.headers = {
        ...options.headers,
        'Content-Type': 'application/json'
      };
      if (typeof options.body !== 'string') {
        options.body = JSON.stringify(options.body);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Show wake-up message if needed
    let toastId;
    if (isFirstRequest && !this.isWakingUp) {
      this.isWakingUp = true;
      toastId = toast.loading(
        <div className="text-center">
          <div className="font-semibold">Waking up our servers...</div>
          <div className="text-sm text-gray-600 mt-1">
            This happens after 15 minutes of inactivity on our free tier.
            Please wait up to 60 seconds.
          </div>
        </div>,
        { duration: 60000 }
      );
    }

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      // Server is awake now
      if (isFirstRequest) {
        this.markServerAwake();
        this.isWakingUp = false;
        if (toastId) {
          toast.dismiss(toastId);
          toast.success('Connected! Thanks for your patience.');
        }
      }

      // Handle non-OK responses
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        
        // Special handling for subscription required
        if (response.status === 403 && error.requiresSubscription) {
          throw new Error('SUBSCRIPTION_REQUIRED');
        }
        
        throw new Error(error.message || error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        this.isWakingUp = false;
        if (toastId) toast.dismiss(toastId);
        
        if (isFirstRequest) {
          // Server took too long, but might still be waking up
          toast.error(
            <div>
              <div className="font-semibold">Server is taking longer than usual</div>
              <div className="text-sm mt-1">Please try again in a moment.</div>
            </div>
          );
        } else {
          toast.error('Request timed out. Please try again.');
        }
        throw new Error('Request timed out');
      }

      this.isWakingUp = false;
      if (toastId) toast.dismiss(toastId);
      throw error;
    }
  }

  // Auth endpoints
  async login(email, password) {
    return this.makeRequest('/auth/login', {
      method: 'POST',
      body: { email, password }
    });
  }

  async register(userData) {
    return this.makeRequest('/auth/register', {
      method: 'POST',
      body: userData
    });
  }

  async verifyToken() {
    return this.makeRequest('/auth/verify');
  }

  async logout() {
    return this.makeRequest('/auth/logout', {
      method: 'POST'
    });
  }

  // Chat endpoints
  async sendMessage(message, conversationId = null) {
    return this.makeRequest('/chat/message', {
      method: 'POST',
      body: { message, conversationId }
    });
  }

  async getConversations() {
    return this.makeRequest('/chat/conversations');
  }

  async getConversation(id) {
    return this.makeRequest(`/chat/conversation/${id}`);
  }

  async deleteConversation(id) {
    return this.makeRequest(`/chat/conversation/${id}`, {
      method: 'DELETE'
    });
  }

  // Payment endpoints
  async createCheckoutSession(priceId, tierName) {
    return this.makeRequest('/payment/create-checkout-session', {
      method: 'POST',
      body: { priceId, tierName }
    });
  }

  async getSubscription() {
    return this.makeRequest('/payment/subscription');
  }

  async cancelSubscription() {
    return this.makeRequest('/payment/cancel-subscription', {
      method: 'POST'
    });
  }

  // User endpoints
  async getProfile() {
    return this.makeRequest('/user/profile');
  }

  async updateProfile(data) {
    return this.makeRequest('/user/profile', {
      method: 'PUT',
      body: data
    });
  }

  async getUsage() {
    return this.makeRequest('/user/usage');
  }

  // Health check
  async checkHealth() {
    return this.makeRequest('/health');
  }
}

export default new APIService();