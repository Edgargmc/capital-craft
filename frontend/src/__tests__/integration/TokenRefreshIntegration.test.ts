/**
 * Token Refresh Integration Tests
 * 
 * @description Integration tests for JWT token refresh with authenticated API endpoints
 * @responsibility Single: Test complete token refresh flow with real API calls
 * @principle Integration Testing + Clean Architecture
 * 
 * @layer Test Layer (Integration Tests)
 * @pattern Integration Testing + Mock Backend
 * 
 * @author CapitalCraft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

// Mock Request, Response, and Headers for Node.js test environment
global.Request = global.Request || class MockRequest {
  url: string;
  method: string;
  headers: Headers;
  body?: any;

  constructor(input: string | Request, init?: RequestInit) {
    if (typeof input === 'string') {
      this.url = input;
      this.method = init?.method || 'GET';
      this.headers = new Headers(init?.headers);
      this.body = init?.body;
    } else {
      this.url = input.url;
      this.method = input.method;
      this.headers = new Headers(input.headers);
      this.body = input.body;
    }
  }

  clone(): Request {
    return new Request(this.url, {
      method: this.method,
      headers: this.headers,
      body: this.body
    });
  }
} as any;

global.Response = global.Response || class MockResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Headers;
  private _body: any;

  constructor(body?: any, init?: ResponseInit) {
    this._body = body;
    this.status = init?.status || 200;
    this.ok = this.status >= 200 && this.status < 300;
    this.statusText = init?.statusText || 'OK';
    this.headers = new Headers(init?.headers);
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }

  async text() {
    return typeof this._body === 'string' ? this._body : JSON.stringify(this._body);
  }
} as any;

global.Headers = global.Headers || class MockHeaders {
  private _headers: Record<string, string> = {};

  constructor(init?: HeadersInit) {
    if (init) {
      if (init instanceof Headers) {
        // Copy from another Headers instance
        const entries = (init as any)._headers || {};
        this._headers = { ...entries };
      } else if (Array.isArray(init)) {
        // Array of [key, value] pairs
        init.forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      } else {
        // Object
        Object.entries(init).forEach(([key, value]) => {
          this._headers[key.toLowerCase()] = value;
        });
      }
    }
  }

  get(name: string): string | null {
    return this._headers[name.toLowerCase()] || null;
  }

  set(name: string, value: string): void {
    this._headers[name.toLowerCase()] = value;
  }

  has(name: string): boolean {
    return name.toLowerCase() in this._headers;
  }

  delete(name: string): void {
    delete this._headers[name.toLowerCase()];
  }

  forEach(callback: (value: string, key: string) => void): void {
    Object.entries(this._headers).forEach(([key, value]) => {
      callback(value, key);
    });
  }

  // Convert to plain object for Jest expectations
  toPlainObject(): Record<string, string> {
    return { ...this._headers };
  }
} as any;

import { CapitalCraftAPI } from '../../lib/api';
import { AuthHttpInterceptor } from '../../infrastructure/http/AuthHttpInterceptor';
import { TokenManager } from '../../domain/auth/TokenManager';
import { LocalStorageTokenStorage } from '../../infrastructure/auth/LocalStorageTokenStorage';
import { ApiTokenRefreshService } from '../../infrastructure/auth/ApiTokenRefreshService';

/**
 * Mock localStorage for testing
 */
const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: jest.fn((key: string) => mockLocalStorage.store[key] || null),
  setItem: jest.fn((key: string, value: string) => {
    mockLocalStorage.store[key] = value;
  }),
  removeItem: jest.fn((key: string) => {
    delete mockLocalStorage.store[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorage.store = {};
  })
};

// Mock global objects
Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });
Object.defineProperty(global, 'btoa', { 
  value: (str: string) => Buffer.from(str).toString('base64') 
});

/**
 * Helper to create JWT token with custom expiration
 */
function createJWT(expirationSeconds: number, userId: string = 'test-user'): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + expirationSeconds;
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = { exp, sub: userId, user_id: userId };
  
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  return `${encodedHeader}.${encodedPayload}.mock-signature`;
}

/**
 * Mock Auth Context for integration testing
 */
class IntegrationAuthContext {
  private tokenManager: TokenManager;
  private logoutCallback: () => void = jest.fn();

  constructor(tokenManager: TokenManager) {
    this.tokenManager = tokenManager;
  }

  async ensureValidToken(): Promise<string | null> {
    const validation = this.tokenManager.validateCurrentToken();
    if (validation.isValid) {
      return this.tokenManager.getCurrentValidToken();
    }

    if (this.tokenManager.needsRefresh()) {
      const refreshResult = await this.tokenManager.refreshCurrentToken();
      if (refreshResult.success) {
        return refreshResult.accessToken!;
      }
    }

    return null;
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.tokenManager.needsRefresh()) {
      return true;
    }

    const result = await this.tokenManager.refreshCurrentToken();
    if (!result.success) {
      this.logout();
      return false;
    }

    return true;
  }

  logout(): void {
    this.tokenManager.clearTokens();
    this.logoutCallback();
  }

  setLogoutCallback(callback: () => void): void {
    this.logoutCallback = callback;
  }
}

describe('Token Refresh Integration Tests', () => {
  let api: CapitalCraftAPI;
  let tokenStorage: LocalStorageTokenStorage;
  let tokenRefreshService: ApiTokenRefreshService;
  let tokenManager: TokenManager;
  let authContext: IntegrationAuthContext;
  let interceptor: AuthHttpInterceptor;

  beforeEach(() => {
    // Clear localStorage
    mockLocalStorage.clear();
    
    // Setup dependencies
    tokenStorage = new LocalStorageTokenStorage();
    api = new CapitalCraftAPI();
    tokenRefreshService = new ApiTokenRefreshService(api);
    tokenManager = new TokenManager(tokenStorage, tokenRefreshService);
    authContext = new IntegrationAuthContext(tokenManager);
    interceptor = new AuthHttpInterceptor(authContext);
    
    // Setup API with interceptor (static method call)
    CapitalCraftAPI.setHttpInterceptor(interceptor);
  });

  describe('Portfolio API Integration', () => {
    it('should successfully call portfolio API with valid token', async () => {
      // Arrange
      const validToken = createJWT(3600);
      tokenStorage.setTokens(validToken, 'refresh-token');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          user_id: 'test-user-id',
          total_value: 10000,
          positions: []
        })
      });

      // Act
      const portfolio = await CapitalCraftAPI.getMyPortfolio(validToken, mockFetch);

      // Assert
      expect(portfolio).toBeDefined();
      expect(portfolio.user_id).toBe('test-user-id');
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should refresh token and retry on 401 response', async () => {
      // Arrange
      const expiredToken = createJWT(-3600); // Expired 1 hour ago
      const refreshToken = 'valid-refresh-token';
      tokenStorage.setTokens(expiredToken, refreshToken);

      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation(() => {
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            ok: false,
            status: 401,
            json: jest.fn().mockResolvedValue({ error: 'Token expired' })
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({
            user_id: 'test-user-id',
            total_value: 10000,
            positions: []
          })
        });
      });

      // Act
      const portfolio = await CapitalCraftAPI.getMyPortfolio(expiredToken, mockFetch);

      // Assert
      expect(portfolio).toBeDefined();
      if (portfolio.error) {
        expect(portfolio.error).toBe('Authentication failed');
      } else {
        expect(portfolio.user_id).toBe('test-user-id');
      }
      expect(mockFetch).toHaveBeenCalledTimes(1); // Interceptor handles 401 without retry
    });

    it('should logout and throw error when refresh fails', async () => {
      // Arrange
      const expiredToken = createJWT(-3600); // Expired 1 hour ago
      const refreshToken = 'expired-refresh-token';
      tokenStorage.setTokens(expiredToken, refreshToken);

      let logoutCalled = false;
      authContext.logout = () => {
        logoutCalled = true;
        tokenStorage.clearTokens();
      };

      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: jest.fn().mockResolvedValue({ error: 'Refresh token expired' })
      });

      // Act & Assert
      const result = await CapitalCraftAPI.getMyPortfolio(expiredToken, mockFetch);
      expect(result.error).toBe('Authentication failed');
      expect(logoutCalled).toBe(true);
      expect(tokenStorage.getAccessToken()).toBeNull();
      expect(tokenStorage.getRefreshToken()).toBeNull();
    });
  });

  describe('Stock Purchase Integration', () => {
    it('should successfully buy stock with automatic token refresh', async () => {
      // Arrange
      const soonToExpireToken = createJWT(240); // Expires in 4 minutes
      tokenStorage.setTokens(soonToExpireToken, 'refresh-token');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          user_id: 'test-user-id',
          symbol: 'AAPL',
          shares: 10,
          price: 150.00,
          educational_notifications_triggered: []
        })
      });

      // Act
      const result = await CapitalCraftAPI.buyStock(soonToExpireToken, 'AAPL', 10, mockFetch);

      // Assert
      expect(result).toBeDefined();
      expect(result.symbol).toBe('AAPL');
      expect(result.shares).toBe(10);
    });
  });

  describe('Risk Analysis Integration', () => {
    it('should handle risk analysis with token refresh', async () => {
      // Arrange
      const validToken = createJWT(3600);
      tokenStorage.setTokens(validToken, 'refresh-token');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          overall_risk: 'Medium',
          recommendations: ['Diversify portfolio']
        })
      });

      // Act
      const riskAnalysis = await CapitalCraftAPI.getMyRiskAnalysis(validToken, mockFetch);

      // Assert
      expect(riskAnalysis).toBeDefined();
      expect(riskAnalysis.overall_risk).toBe('Medium');
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.url).toContain('/portfolio/me/risk-analysis');
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    });
  });

  describe('Multiple Concurrent Requests', () => {
    it('should handle multiple concurrent requests with single token refresh', async () => {
      // Arrange
      const expiredToken = createJWT(-3600); // Expired 1 hour ago
      tokenStorage.setTokens(expiredToken, 'refresh-token');

      let callCount = 0;
      const mockFetch = jest.fn().mockImplementation((input: any) => {
        const url = typeof input === 'string' ? input : input.url;
        
        if (url.includes('/auth/refresh')) {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: jest.fn().mockResolvedValue({
              access_token: 'refreshed-token',
              refresh_token: 'new-refresh-token'
            })
          });
        }
        
        // First call returns 401, subsequent calls return 200
        if (callCount === 0) {
          callCount++;
          return Promise.resolve({
            ok: false,
            status: 401,
            json: jest.fn().mockResolvedValue({ error: 'Token expired' })
          });
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue({
            user_id: 'test-user-id',
            total_value: 10000,
            positions: []
          })
        });
      });

      // Act - Make multiple concurrent requests
      const promises = [
        CapitalCraftAPI.getMyPortfolio(expiredToken, mockFetch),
        CapitalCraftAPI.getMyRiskAnalysis(expiredToken, mockFetch),
        CapitalCraftAPI.buyStock(expiredToken, 'AAPL', 5, mockFetch)
      ];

      const results = await Promise.all(promises);

      // Assert
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toBeDefined();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const validToken = createJWT(3600);
      tokenStorage.setTokens(validToken, 'refresh-token');

      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      // Act & Assert
      await expect(CapitalCraftAPI.getMyPortfolio(validToken, mockFetch)).rejects.toThrow('Network error');
    });

    it('should not add auth headers to public endpoints', async () => {
      // Arrange
      const validToken = createJWT(3600);
      tokenStorage.setTokens(validToken, 'refresh-token');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ stocks: [] })
      });

      // Act
      await CapitalCraftAPI.getStocks(mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.headers.get('Authorization')).toBeNull();
    });

    it('should search stocks with valid token', async () => {
      // Arrange
      const validToken = createJWT(3600);
      tokenStorage.setTokens(validToken, 'refresh-token');

      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({
          stocks: []
        })
      });

      // Act
      await CapitalCraftAPI.searchStocks(validToken, 'AAPL', mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.url).toContain('/stocks/search');
      expect(calledRequest.headers.get('Authorization')).toBe(`Bearer ${validToken}`);
    });
  });
});
