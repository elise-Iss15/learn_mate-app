import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, tokenManager } from './api';
import { dbUtils } from './db';
import type { User } from './types';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          
          await dbUtils.clearAll();
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
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
        const currentState = get();
      
        if (!currentState.isAuthenticated) {
          set({ isLoading: true });
        }
        
        try {
          const accessToken = tokenManager.getAccessToken();
          const refreshToken = tokenManager.getRefreshToken();

          if (!accessToken && !refreshToken) {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
            });
            return;
          }

          if (!accessToken && refreshToken) {
            try {
              const tokens = await api.refreshAccessToken(refreshToken);
              tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
            } catch (refreshError) {
              tokenManager.clearTokens();
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
          }

          const user = await api.getCurrentUser();
          
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error) {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            try {
              const tokens = await api.refreshAccessToken(refreshToken);
              tokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
              
              const user = await api.getCurrentUser();
              set({
                user,
                isAuthenticated: true,
                isLoading: false,
              });
              return;
            } catch (refreshError) {
              tokenManager.clearTokens();
            }
          } else {
            tokenManager.clearTokens();
          }
          
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
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
