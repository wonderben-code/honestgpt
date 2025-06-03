import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../utils/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      // Set authentication data
      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true, isLoading: false });
        // Set default auth header for all API requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },

      // Clear authentication
      clearAuth: () => {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        delete api.defaults.headers.common['Authorization'];
        localStorage.removeItem('auth-storage');
      },

      // Login
      login: async (email, password) => {
        try {
          const response = await api.post('/auth/login', { email, password });
          const { user, token } = response.data;
          
          get().setAuth(user, token);
          toast.success('Welcome back!');
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Login failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Register
      register: async (email, password, name, referralCode) => {
        try {
          const response = await api.post('/auth/register', {
            email,
            password,
            name,
            referralCode,
          });
          
          const { user, token } = response.data;
          get().setAuth(user, token);
          toast.success('Account created successfully!');
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Registration failed';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          // Continue with logout even if API call fails
        }
        
        get().clearAuth();
        toast.success('Logged out successfully');
      },

      // Check authentication status
      checkAuth: async () => {
        const token = get().token;
        
        if (!token) {
          set({ isLoading: false });
          return;
        }
        
        try {
          // Set auth header before checking
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          
          const response = await api.get('/auth/verify');
          if (response.data.valid) {
            set({ 
              user: response.data.user, 
              isAuthenticated: true, 
              isLoading: false 
            });
          } else {
            get().clearAuth();
          }
        } catch (error) {
          get().clearAuth();
        }
      },

      // Update user data
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData },
        }));
      },

      // Request password reset
      requestPasswordReset: async (email) => {
        try {
          await api.post('/auth/reset-password', { email });
          toast.success('Password reset link sent to your email');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to send reset email';
          toast.error(message);
          return { success: false, error: message };
        }
      },

      // Update password with token
      updatePassword: async (token, newPassword) => {
        try {
          await api.post('/auth/update-password', { token, newPassword });
          toast.success('Password updated successfully');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.error || 'Failed to update password';
          toast.error(message);
          return { success: false, error: message };
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);