'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthContextType, User, LoginRequest, SignupRequest } from '@/types/auth';
import { apiClient } from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = apiClient.getAuthToken();
      if (savedToken) {
        setToken(savedToken);
        try {
          const response = await apiClient.getUserProfile();
          setUser(response.user);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          // Invalid token, remove it
          apiClient.removeAuthToken();
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginRequest): Promise<void> => {
    try {
      const response = await apiClient.login(credentials);
      const { token: newToken, username } = response;
      
      apiClient.setAuthToken(newToken);
      setToken(newToken);
      
      // Fetch full user profile after login
      const profileResponse = await apiClient.getUserProfile();
      setUser(profileResponse.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (userData: SignupRequest): Promise<void> => {
    try {
      await apiClient.signup(userData);
      // After successful signup, automatically log in
      await login({ email: userData.email, password: userData.password });
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = (): void => {
    apiClient.removeAuthToken();
    setToken(null);
    setUser(null);
  };

  const isAuthenticated = !!token && !!user;

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    login,
    signup,
    logout,
    isAuthenticated,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}