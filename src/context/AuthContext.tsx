import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client.ts';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'intern' | 'admin';
  status: 'active' | 'inactive';
  track?: string;
  phone?: string;
  github_profile?: string;
  avatar_url?: string;
  total_points?: number;
  created_at?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role?: 'intern' | 'admin';
    track?: string;
    phone?: string;
    github_profile?: string;
  }) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hackkro_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('hackkro_jwt_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('hackkro_jwt_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.get('/auth/me');
      setUser(response.data);
      localStorage.setItem('hackkro_user', JSON.stringify(response.data));
    } catch (err) {
      console.warn('[AuthContext] Failed to refresh profile:', err);
      // If unauthorized, clear
      localStorage.removeItem('hackkro_jwt_token');
      localStorage.removeItem('hackkro_user');
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  const login = async (email: string, password: string): Promise<User> => {
    const response = await apiClient.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('hackkro_jwt_token', receivedToken);
    localStorage.setItem('hackkro_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    // Fetch full profile with points
    try {
      const meRes = await apiClient.get('/auth/me', {
        headers: { Authorization: `Bearer ${receivedToken}` },
      });
      setUser(meRes.data);
      localStorage.setItem('hackkro_user', JSON.stringify(meRes.data));
      return meRes.data;
    } catch {
      return receivedUser;
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role?: 'intern' | 'admin';
    track?: string;
    phone?: string;
    github_profile?: string;
  }): Promise<User> => {
    const response = await apiClient.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('hackkro_jwt_token', receivedToken);
    localStorage.setItem('hackkro_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);
    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem('hackkro_jwt_token');
    localStorage.removeItem('hackkro_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user && token),
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
