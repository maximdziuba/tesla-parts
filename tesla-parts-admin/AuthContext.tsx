import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { ApiService } from './services/api';

interface AuthContextType {
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  error: string | null;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem('accessToken')
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
  }, [accessToken]);

  const login = async (username: string, password: string) => {
    try {
      setError(null);
      const response = await ApiService.login(username, password);
      setAccessToken(response.access_token);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
      throw err; // Re-throw to allow component to catch
    }
  };

  const logout = () => {
    setAccessToken(null);
  };

  const resetError = () => {
    setError(null);
  };

  const isAuthenticated = !!accessToken;

  return (
    <AuthContext.Provider value={{ accessToken, login, logout, isAuthenticated, error, resetError }}>
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
