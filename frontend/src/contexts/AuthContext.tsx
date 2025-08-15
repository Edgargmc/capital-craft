'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TokenManager } from '../domain/auth/TokenManager';
import { LocalStorageTokenStorage } from '../infrastructure/auth/LocalStorageTokenStorage';
import { ApiTokenRefreshService } from '../infrastructure/auth/ApiTokenRefreshService';

/**
 * User interface for authentication context
 * @principle Interface Segregation - Specific to user data
 */
interface User {
  id: string;
  email: string;
  username: string;
}

/**
 * Authentication context interface
 * @principle Interface Segregation - Specific to authentication operations
 * @principle Dependency Inversion - Abstract authentication operations
 */
interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: () => void;
  /** 
   * Refreshes token if needed and returns valid token
   * @returns Promise resolving to valid token or null if refresh failed
   */
  ensureValidToken: () => Promise<string | null>;
  /**
   * Checks if current token needs refresh
   * @returns True if token should be refreshed proactively
   */
  needsTokenRefresh: () => boolean;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Enhanced AuthProvider with automatic token refresh capabilities
 * 
 * @description Provides authentication state with automatic token management
 * @responsibility Single: Manage authentication state and token lifecycle
 * @principle Single Responsibility + Dependency Injection
 * 
 * @layer Presentation Layer (React Context)
 * @pattern Provider Pattern + Observer Pattern for auth state
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 2.0.0
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize TokenManager with dependency injection
  const [tokenManager] = useState(() => {
    const storage = new LocalStorageTokenStorage();
    const refreshService = new ApiTokenRefreshService();
    return new TokenManager(storage, refreshService);
  });

  /**
   * Loads authentication state from storage on mount
   * @principle Single Responsibility: Only handles initial auth state loading
   */
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token');
    const savedUser = localStorage.getItem('user');
    
    if (savedToken && savedUser) {
      try {
        // Validate token before setting auth state
        const validation = tokenManager.validateCurrentToken();
        
        if (validation.isValid) {
          setToken(savedToken);
          setUser(JSON.parse(savedUser));
        } else {
          // Token is invalid/expired, clear storage
          console.log('Stored token is invalid/expired, clearing auth state');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('refresh_token');
        }
      } catch (error) {
        console.error('Error loading auth from localStorage:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        localStorage.removeItem('refresh_token');
      }
    }
    
    setIsLoading(false);
  }, [tokenManager]);

  /**
   * Sets authentication state with new tokens
   * 
   * @param user - User data
   * @param token - Access token
   * @param refreshToken - Optional refresh token
   * 
   * @principle Single Responsibility: Only handles auth state setting
   */
  const setAuth = useCallback((user: User, token: string, refreshToken?: string) => {
    setUser(user);
    setToken(token);
    localStorage.setItem('access_token', token);
    localStorage.setItem('user', JSON.stringify(user));
    
    if (refreshToken) {
      localStorage.setItem('refresh_token', refreshToken);
    }
  }, []);

  /**
   * Clears authentication state and performs logout
   * 
   * @principle Single Responsibility: Only handles logout operations
   */
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    tokenManager.clearTokens();
    
    // Redirect to auth page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth';
    }
  }, [tokenManager]);

  /**
   * Ensures current token is valid, refreshing if necessary
   * 
   * @returns Promise resolving to valid token or null if refresh failed
   * 
   * @principle Single Responsibility: Only handles token validation/refresh
   * @principle Open/Closed: Extensible for different refresh strategies
   */
  const ensureValidToken = useCallback(async (): Promise<string | null> => {
    const currentToken = tokenManager.getCurrentValidToken();
    
    if (currentToken) {
      return currentToken;
    }

    // Token is invalid/expired, attempt refresh
    console.log('Token invalid/expired, attempting refresh...');
    
    try {
      const refreshResult = await tokenManager.refreshCurrentToken();
      
      if (refreshResult.success && refreshResult.accessToken) {
        console.log('Token refresh successful');
        
        // Update React state with new token
        setToken(refreshResult.accessToken);
        
        return refreshResult.accessToken;
      } else {
        console.log('Token refresh failed:', refreshResult.error);
        
        // Refresh failed, logout user
        logout();
        return null;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      logout();
      return null;
    }
  }, [tokenManager, logout]);

  /**
   * Checks if current token needs refresh based on expiration
   * 
   * @returns True if token should be refreshed proactively
   * 
   * @principle Single Responsibility: Only checks refresh necessity
   */
  const needsTokenRefresh = useCallback((): boolean => {
    return tokenManager.needsRefresh();
  }, [tokenManager]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    setAuth,
    logout,
    ensureValidToken,
    needsTokenRefresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to use authentication context
 * 
 * @returns Authentication context with token management capabilities
 * 
 * @throws Error if used outside AuthProvider
 * 
 * @principle Single Responsibility: Only provides auth context access
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
