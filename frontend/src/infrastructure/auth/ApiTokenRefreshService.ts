/**
 * API Token Refresh Service Implementation
 * 
 * @description Infrastructure layer implementation of token refresh using Capital Craft API
 * @responsibility Single: Handle token refresh via HTTP API calls
 * @principle Single Responsibility + Dependency Inversion
 * 
 * @layer Infrastructure Layer (External Concerns)
 * @pattern Adapter Pattern for API integration
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

import { ITokenRefreshService, TokenRefreshResult } from '../../domain/auth/TokenManager';
import { CapitalCraftAPI } from '../../lib/api';

/**
 * API implementation of token refresh service
 * 
 * @description Concrete implementation of ITokenRefreshService using Capital Craft API
 * @principle Single Responsibility: Only handles API token refresh operations
 * @principle Liskov Substitution: Can replace any ITokenRefreshService implementation
 */
export class ApiTokenRefreshService implements ITokenRefreshService {

  /**
   * Refreshes access token using the Capital Craft API
   * 
   * @param refreshToken - Refresh token to use for getting new access token
   * @returns Promise resolving to token refresh result
   * 
   * @principle Single Responsibility: Only handles token refresh API call
   * @principle Open/Closed: Extensible for different API error handling strategies
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    try {
      const response = await CapitalCraftAPI.refreshToken({ refresh_token: refreshToken });
      
      return {
        success: true,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
      };
    } catch (error) {
      // Handle different types of refresh failures
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        
        // Check if refresh token is expired/invalid
        if (errorMessage.includes('invalid') || 
            errorMessage.includes('expired') || 
            errorMessage.includes('unauthorized')) {
          return {
            success: false,
            error: error.message,
            refreshTokenExpired: true
          };
        }
        
        // Network or other API errors
        return {
          success: false,
          error: error.message,
          refreshTokenExpired: false
        };
      }
      
      // Unknown error type
      return {
        success: false,
        error: 'Unknown error during token refresh',
        refreshTokenExpired: false
      };
    }
  }
}
