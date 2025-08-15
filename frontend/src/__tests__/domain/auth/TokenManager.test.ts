/**
 * TokenManager Unit Tests
 * 
 * @description Comprehensive unit tests for TokenManager domain service
 * @responsibility Single: Test token validation, refresh, and expiration logic
 * @principle Single Responsibility + Test-Driven Development
 * 
 * @layer Test Layer (Unit Tests)
 * @pattern Arrange-Act-Assert + Mock Pattern
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

import { 
  TokenManager, 
  ITokenStorage, 
  ITokenRefreshService, 
  TokenValidationResult,
  TokenRefreshResult 
} from '../../../domain/auth/TokenManager';

/**
 * Mock Token Storage Implementation
 * @principle Test Double Pattern - Mock for testing
 */
class MockTokenStorage implements ITokenStorage {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
  }

  // Test helpers
  setMockAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  setMockRefreshToken(token: string | null): void {
    this.refreshToken = token;
  }
}

/**
 * Mock Token Refresh Service Implementation
 * @principle Test Double Pattern - Mock for testing
 */
class MockTokenRefreshService implements ITokenRefreshService {
  private shouldSucceed: boolean = true;
  private mockResponse: TokenRefreshResult = {
    success: true,
    accessToken: 'new-access-token',
    refreshToken: 'new-refresh-token'
  };

  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    if (!this.shouldSucceed) {
      return {
        success: false,
        error: 'Mock refresh failed',
        refreshTokenExpired: true
      };
    }

    return this.mockResponse;
  }

  // Test helpers
  setMockSuccess(success: boolean): void {
    this.shouldSucceed = success;
  }

  setMockResponse(response: TokenRefreshResult): void {
    this.mockResponse = response;
  }
}

/**
 * Helper function to create JWT token with custom expiration
 * @param expirationSeconds - Seconds from now when token expires
 * @returns Base64 encoded JWT token
 */
function createMockJWT(expirationSeconds: number): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expirationSeconds;
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { exp, sub: 'test-user' };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}

describe('TokenManager', () => {
  let tokenManager: TokenManager;
  let mockStorage: MockTokenStorage;
  let mockRefreshService: MockTokenRefreshService;

  /**
   * Setup before each test
   * @principle Arrange-Act-Assert - Arrange phase
   */
  beforeEach(() => {
    mockStorage = new MockTokenStorage();
    mockRefreshService = new MockTokenRefreshService();
    tokenManager = new TokenManager(mockStorage, mockRefreshService);
  });

  describe('validateCurrentToken', () => {
    it('should return invalid when no token exists', () => {
      // Arrange
      mockStorage.setMockAccessToken(null);

      // Act
      const result = tokenManager.validateCurrentToken();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.reason).toBe('No token found');
      expect(result.timeUntilExpiration).toBe(0);
    });

    it('should return valid for non-expired token', () => {
      // Arrange - Token expires in 1 hour
      const validToken = createMockJWT(3600);
      mockStorage.setMockAccessToken(validToken);

      // Act
      const result = tokenManager.validateCurrentToken();

      // Assert
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
      expect(result.timeUntilExpiration).toBeGreaterThan(3500);
      expect(result.reason).toBeUndefined();
    });

    it('should return expired for expired token', () => {
      // Arrange - Token expired 1 hour ago
      const expiredToken = createMockJWT(-3600);
      mockStorage.setMockAccessToken(expiredToken);

      // Act
      const result = tokenManager.validateCurrentToken();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(true);
      expect(result.timeUntilExpiration).toBe(0);
      expect(result.reason).toBe('Token expired');
    });

    it('should return invalid for malformed token', () => {
      // Arrange
      mockStorage.setMockAccessToken('invalid-token');

      // Act
      const result = tokenManager.validateCurrentToken();

      // Assert
      expect(result.isValid).toBe(false);
      expect(result.isExpired).toBe(false);
      expect(result.reason).toBe('Invalid token format');
    });
  });

  describe('needsRefresh', () => {
    it('should return true for expired token', () => {
      // Arrange
      const expiredToken = createMockJWT(-3600);
      mockStorage.setMockAccessToken(expiredToken);

      // Act
      const needsRefresh = tokenManager.needsRefresh();

      // Assert
      expect(needsRefresh).toBe(true);
    });

    it('should return true for token expiring within buffer time', () => {
      // Arrange - Token expires in 2 minutes (within 5-minute buffer)
      const soonToExpireToken = createMockJWT(120);
      mockStorage.setMockAccessToken(soonToExpireToken);

      // Act
      const needsRefresh = tokenManager.needsRefresh();

      // Assert
      expect(needsRefresh).toBe(true);
    });

    it('should return false for token with plenty of time left', () => {
      // Arrange - Token expires in 1 hour
      const validToken = createMockJWT(3600);
      mockStorage.setMockAccessToken(validToken);

      // Act
      const needsRefresh = tokenManager.needsRefresh();

      // Assert
      expect(needsRefresh).toBe(false);
    });

    it('should return true when no token exists', () => {
      // Arrange
      mockStorage.setMockAccessToken(null);

      // Act
      const needsRefresh = tokenManager.needsRefresh();

      // Assert
      expect(needsRefresh).toBe(true);
    });
  });

  describe('refreshCurrentToken', () => {
    it('should successfully refresh token', async () => {
      // Arrange
      mockStorage.setMockRefreshToken('valid-refresh-token');
      mockRefreshService.setMockSuccess(true);
      mockRefreshService.setMockResponse({
        success: true,
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token'
      });

      // Act
      const result = await tokenManager.refreshCurrentToken();

      // Assert
      expect(result.success).toBe(true);
      expect(result.accessToken).toBe('new-access-token');
      expect(mockStorage.getAccessToken()).toBe('new-access-token');
      expect(mockStorage.getRefreshToken()).toBe('new-refresh-token');
    });

    it('should fail when no refresh token exists', async () => {
      // Arrange
      mockStorage.setMockRefreshToken(null);

      // Act
      const result = await tokenManager.refreshCurrentToken();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('No refresh token available');
      expect(result.refreshTokenExpired).toBe(true);
    });

    it('should handle refresh service failure', async () => {
      // Arrange
      mockStorage.setMockRefreshToken('valid-refresh-token');
      mockRefreshService.setMockSuccess(false);

      // Act
      const result = await tokenManager.refreshCurrentToken();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Mock refresh failed');
      expect(result.refreshTokenExpired).toBe(true);
    });

    it('should handle refresh service exception', async () => {
      // Arrange
      mockStorage.setMockRefreshToken('valid-refresh-token');
      const mockRefreshServiceWithError = {
        refreshToken: jest.fn().mockRejectedValue(new Error('Network error'))
      };
      const tokenManagerWithError = new TokenManager(mockStorage, mockRefreshServiceWithError);

      // Act
      const result = await tokenManagerWithError.refreshCurrentToken();

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
      expect(result.refreshTokenExpired).toBe(true);
    });
  });

  describe('getCurrentValidToken', () => {
    it('should return token when valid', () => {
      // Arrange
      const validToken = createMockJWT(3600);
      mockStorage.setMockAccessToken(validToken);

      // Act
      const token = tokenManager.getCurrentValidToken();

      // Assert
      expect(token).toBe(validToken);
    });

    it('should return null when token is expired', () => {
      // Arrange
      const expiredToken = createMockJWT(-3600);
      mockStorage.setMockAccessToken(expiredToken);

      // Act
      const token = tokenManager.getCurrentValidToken();

      // Assert
      expect(token).toBeNull();
    });

    it('should return null when no token exists', () => {
      // Arrange
      mockStorage.setMockAccessToken(null);

      // Act
      const token = tokenManager.getCurrentValidToken();

      // Assert
      expect(token).toBeNull();
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens from storage', () => {
      // Arrange
      mockStorage.setMockAccessToken('access-token');
      mockStorage.setMockRefreshToken('refresh-token');

      // Act
      tokenManager.clearTokens();

      // Assert
      expect(mockStorage.getAccessToken()).toBeNull();
      expect(mockStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete token refresh flow', async () => {
      // Arrange - Token expiring soon
      const soonToExpireToken = createMockJWT(120);
      mockStorage.setMockAccessToken(soonToExpireToken);
      mockStorage.setMockRefreshToken('valid-refresh-token');

      // Act & Assert - Check needs refresh
      expect(tokenManager.needsRefresh()).toBe(true);

      // Act - Refresh token
      const refreshResult = await tokenManager.refreshCurrentToken();

      // Assert - Refresh successful
      expect(refreshResult.success).toBe(true);
      expect(mockStorage.getAccessToken()).toBe('new-access-token');

      // Act & Assert - No longer needs refresh
      const newValidToken = createMockJWT(3600);
      mockStorage.setMockAccessToken(newValidToken);
      expect(tokenManager.needsRefresh()).toBe(false);
    });
  });
});
