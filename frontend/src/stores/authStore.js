// frontend/src/stores/authStore.js
import { create } from 'zustand';
import apiService from '../services/api';
import { toast } from 'react-hot-toast';

const useAuthStore = create((set, get) => ({
  user: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  // Clear any errors
  clearError: () => set({ error: null }),

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.login(email, password);
      
      // Store token
      localStorage.setItem('token', response.token);
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.message === 'SUBSCRIPTION_REQUIRED' 
        ? 'Please choose a plan to continue'
        : error.message || 'Invalid email or password';
      
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false
      });
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Register user
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiService.register(userData);
      
      // Store token
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      
      set({
        user: response.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.message || 'Registration failed';
      set({
        error: errorMessage,
        isLoading: false
      });
      
      toast.error(errorMessage);
      throw error;
    }
  },

  // Verify authentication
  verifyAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return;
    }

    try {
      const response = await apiService.verifyToken();
      
      set({
        user: response.user,
        isAuthenticated: true,
        error: null
      });
      
      return response.user;
    } catch (error) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      set({
        user: null,
        isAuthenticated: false,
        error: null
      });
      
      if (error.message === 'SUBSCRIPTION_REQUIRED') {
        toast.error('Please choose a plan to continue using honestGPT');
      }
      
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      await apiService.logout();
    } catch (error) {
      // Continue with logout even if server request fails
      console.error('Logout error:', error);
    }
    
    // Clear local state
    localStorage.removeItem('token');
    localStorage.removeItem('serverLastAwake');
    
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
    
    toast.success('Logged out successfully');
  },

  // Update user data (after subscription change, etc.)
  updateUser: (userData) => {
    set(state => ({
      user: { ...state.user, ...userData }
    }));
  }
}));

export { useAuthStore };