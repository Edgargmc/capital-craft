/**
 * HTTP Client Provider Component
 * 
 * @description Presentation layer component that initializes HTTP interceptor with auth context
 * @responsibility Single: Setup HTTP client with authentication interceptor
 * @principle Single Responsibility + Dependency Injection
 * 
 * @layer Presentation Layer (React Component)
 * @pattern Provider Pattern + Dependency Injection
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { initializeHttpClient, createAuthContextAdapter } from '../../lib/httpClient';

/**
 * HTTP Client Provider Props
 * @principle Interface Segregation - Specific to provider needs
 */
interface HttpClientProviderProps {
  children: React.ReactNode;
}

/**
 * HTTP Client Provider Component
 * 
 * @description Initializes HTTP interceptor when auth context is ready
 * @param props - Component props with children
 * @returns JSX element with children
 * 
 * @principle Single Responsibility: Only handles HTTP client initialization
 * @principle Dependency Injection: Uses auth context for interceptor setup
 */
export function HttpClientProvider({ children }: HttpClientProviderProps) {
  const auth = useAuth();

  /**
   * Initialize HTTP interceptor when auth context is ready
   * @principle Single Responsibility: Only handles interceptor setup
   */
  useEffect(() => {
    // Wait for auth context to finish loading
    if (auth.isLoading) {
      return;
    }

    // Create adapter for auth context
    const authAdapter = createAuthContextAdapter({
      isAuthenticated: auth.isAuthenticated,
      ensureValidToken: auth.ensureValidToken,
      logout: auth.logout,
    });

    // Initialize HTTP client with interceptor
    initializeHttpClient(authAdapter);

    console.log('🔧 HTTP interceptor initialized with auth context');
  }, [auth.isLoading, auth.isAuthenticated, auth.ensureValidToken, auth.logout]);

  return <>{children}</>;
}
