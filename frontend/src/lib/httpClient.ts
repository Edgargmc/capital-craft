/**
 * HTTP Client Setup and Configuration
 * 
 * @description Setup module for HTTP client with authentication interceptor
 * @responsibility Single: Initialize and configure HTTP client with auth
 * @principle Single Responsibility + Dependency Injection
 * 
 * @layer Infrastructure Layer (HTTP Client Setup)
 * @pattern Factory Pattern + Adapter Pattern
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

import { AuthHttpInterceptor, IAuthContext } from '../infrastructure/http/AuthHttpInterceptor';
import { CapitalCraftAPI } from './api';

/**
 * Initializes HTTP interceptor with authentication context
 * 
 * @description Sets up automatic 401 handling and token refresh for all API calls
 * @param authContext - Authentication context for token management
 * 
 * @principle Single Responsibility: Only handles HTTP client setup
 * @principle Dependency Injection: Injects auth context into interceptor
 */
export function initializeHttpClient(authContext: IAuthContext): void {
  // Create HTTP interceptor with auth context
  const interceptor = new AuthHttpInterceptor(authContext);
  
  // Configure API client to use interceptor
  CapitalCraftAPI.setHttpInterceptor(interceptor);
  
  console.log('HTTP client initialized with authentication interceptor');
}

/**
 * Adapter to make AuthContext compatible with IAuthContext interface
 * 
 * @description Adapts React AuthContext to infrastructure layer interface
 * @param authContext - React authentication context
 * @returns Adapted auth context for interceptor
 * 
 * @principle Adapter Pattern: Adapts presentation layer to infrastructure layer
 * @principle Interface Segregation: Only exposes needed auth operations
 */
export function createAuthContextAdapter(authContext: {
  isAuthenticated: boolean;
  ensureValidToken: () => Promise<string | null>;
  logout: () => void;
}): IAuthContext {
  return {
    isAuthenticated: authContext.isAuthenticated,
    ensureValidToken: authContext.ensureValidToken,
    logout: authContext.logout,
  };
}
