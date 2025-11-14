import { create } from 'zustand';
import { api, tokenManager } from './api';
import { dbUtils } from './db';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: User) => void;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'student' | 'teacher' | 'admin';
  first_name: string;
  last_name: string;
  grade_level?: number;
  preferred_language: string;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    try {
      const response = await api.login(email, password);
      const user = response.data.user;
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    try {
      const response = await api.register(data);
      const user = response.data.user;
      const { accessToken, refreshToken } = response.data;
      
      tokenManager.setTokens(accessToken, refreshToken);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.logout();
      
      // Clear all offline data
      await dbUtils.clearAll();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      // Even if logout fails, clear local state
      tokenManager.clearTokens();
      await dbUtils.clearAll();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  checkAuth: async () => {
    set({ isLoading: true });
    
    try {
      // Check if we have a token
      if (!tokenManager.hasValidToken()) {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
        return;
      }

      // Verify token by fetching current user
      const user = await api.getCurrentUser();
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      // Token invalid or expired
      tokenManager.clearTokens();
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  updateUser: (user: User) => {
    set({ user });
  },
}));
