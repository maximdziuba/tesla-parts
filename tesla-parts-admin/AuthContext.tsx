import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ApiService } from './services/api';

interface AuthContextType {
  accessToken: string | null;
  refreshToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  resetError: () => void;
  refreshAccessToken: () => Promise<void>; // New function
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [refreshToken, setRefreshToken] = useState<string | null>( // New state for refresh token
    localStorage.getItem('refreshToken')
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  useEffect(() => {
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }, [refreshToken]);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await ApiService.login(username, password);
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token); // Store refresh token
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err; // Re-throw to allow component to catch
    }
  };

  const logout = () => {
    setAccessToken(null);
    setRefreshToken(null); // Clear refresh token
  };

  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      throw new Error("No refresh token available");
    }
    try {
      const response = await ApiService.refreshToken(refreshToken);
      setAccessToken(response.access_token);
      setRefreshToken(response.refresh_token); // Update with new refresh token
    } catch (err: any) {
      console.error("Failed to refresh token:", err);
      logout(); // Logout if refresh fails
      throw err;
    }
  };

  const resetError = () => {
    setError(null);
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ accessToken, refreshToken, login, logout, isAuthenticated, error, resetError, refreshAccessToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
