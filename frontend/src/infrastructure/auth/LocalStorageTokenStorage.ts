/**
 * LocalStorage Token Storage Implementation
 * 
 * @description Infrastructure layer implementation of token storage using localStorage
 * @responsibility Single: Handle token persistence in browser localStorage
 * @principle Single Responsibility + Dependency Inversion
 * 
 * @layer Infrastructure Layer (External Concerns)
 * @pattern Adapter Pattern for localStorage integration
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

import { ITokenStorage } from '../../domain/auth/TokenManager';

/**
 * LocalStorage implementation of token storage
 * 
 * @description Concrete implementation of ITokenStorage using browser localStorage
 * @principle Single Responsibility: Only handles localStorage token operations
 * @principle Liskov Substitution: Can replace any ITokenStorage implementation
 */
export class LocalStorageTokenStorage implements ITokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';

  /**
   * Retrieves access token from localStorage
   * 
   * @returns Access token or null if not found
   * 
   * @principle Single Responsibility: Only retrieves access token
   */
  getAccessToken(): string | null {
    try {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get access token from localStorage:', error);
      return null;
    }
  }

  /**
   * Retrieves refresh token from localStorage
   * 
   * @returns Refresh token or null if not found
   * 
   * @principle Single Responsibility: Only retrieves refresh token
   */
  getRefreshToken(): string | null {
    try {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Failed to get refresh token from localStorage:', error);
      return null;
    }
  }

  /**
   * Stores both access and refresh tokens in localStorage
   * 
   * @param accessToken - New access token to store
   * @param refreshToken - New refresh token to store
   * 
   * @principle Single Responsibility: Only stores tokens
   */
  setTokens(accessToken: string, refreshToken: string): void {
    try {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Failed to store tokens in localStorage:', error);
      throw new Error('Failed to store authentication tokens');
    }
  }

  /**
   * Removes all tokens from localStorage
   * 
   * @principle Single Responsibility: Only clears tokens
   */
  clearTokens(): void {
    try {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem('user'); // Also clear user data for complete logout
    } catch (error) {
      console.error('Failed to clear tokens from localStorage:', error);
    }
  }
}
