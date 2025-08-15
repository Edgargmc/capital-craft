/**
 * AuthHttpInterceptor Unit Tests
 * 
 * @description Unit tests for HTTP interceptor with 401 detection and token refresh
 * @responsibility Single: Test HTTP interception, auth header injection, and retry logic
 * @principle Single Responsibility + Test-Driven Development
 * 
 * @layer Test Layer (Unit Tests)
 * @pattern Arrange-Act-Assert + Mock Pattern
 * 
 * @author Capital Craft Team
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

import { AuthHttpInterceptor, IAuthContext, interceptedFetch } from '../../../infrastructure/http/AuthHttpInterceptor';

/**
 * Mock Auth Context Implementation
 * @principle Test Double Pattern - Mock for testing
 */
class MockAuthContext implements IAuthContext {
  private token: string | null = 'valid-token';
  private refreshSuccess: boolean = true;
  private logoutCalled: boolean = false;

  setMockToken(token: string | null): void {
    this.token = token;
  }

  setRefreshSuccess(success: boolean): void {
    this.refreshSuccess = success;
  }

  wasLogoutCalled(): boolean {
    return this.logoutCalled;
  }

  async getToken(): Promise<string> {
    return this.token || '';
  }

  async ensureValidToken(): Promise<string | null> {
    if (!this.refreshSuccess) {
      return null;
    }
    return this.token;
  }

  async refreshTokenIfNeeded(): Promise<boolean> {
    if (!this.refreshSuccess) {
      return false;
    }
    this.token = 'refreshed-token';
    return true;
  }

  logout(): void {
    this.logoutCalled = true;
    this.token = null;
  }
}

/**
 * Mock fetch implementation
 */
function createMockFetch() {
  const mockFetch = jest.fn();
  
  // Helper to set response
  const setResponse = (status: number, body: any = {}, headers: Record<string, string> = {}) => {
    mockFetch.mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: jest.fn().mockResolvedValue(body),
      text: jest.fn().mockResolvedValue(JSON.stringify(body)),
      headers: new Map(Object.entries(headers))
    });
  };

  return { mockFetch, setResponse };
}

describe('AuthHttpInterceptor', () => {
  let interceptor: AuthHttpInterceptor;
  let mockAuthContext: MockAuthContext;

  beforeEach(() => {
    mockAuthContext = new MockAuthContext();
    interceptor = new AuthHttpInterceptor(mockAuthContext);
  });

  describe('intercept', () => {
    it('should add Authorization header for authenticated requests', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      const request = new Request('https://api.example.com/data');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer valid-token');
      expect(response.status).toBe(200);
    });

    it('should not add Authorization header when no token available', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });
      mockAuthContext.setMockToken(null);

      const request = new Request('https://api.example.com/data');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });

    it('should skip auth endpoints', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      const request = new Request('https://api.example.com/auth/login');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.not.objectContaining({
          headers: expect.objectContaining({
            'Authorization': expect.anything()
          })
        })
      );
    });

    it('should handle 401 response with successful token refresh and retry', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      
      // First call returns 401, second call returns 200
      setResponse(401, { error: 'Unauthorized' });
      setResponse(200, { success: true });

      const request = new Request('https://api.example.com/data');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(response.status).toBe(200);
      
      // Check that second call used refreshed token
      const secondCall = mockFetch.mock.calls[1][0];
      expect(secondCall.headers.get('Authorization')).toBe('Bearer refreshed-token');
    });

    it('should logout when token refresh fails', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(401, { error: 'Unauthorized' });
      mockAuthContext.setRefreshSuccess(false);

      const request = new Request('https://api.example.com/data');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockAuthContext.wasLogoutCalled()).toBe(true);
      expect(response.status).toBe(401);
    });

    it('should logout when retry also returns 401', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      
      // Both calls return 401
      setResponse(401, { error: 'Unauthorized' });
      setResponse(401, { error: 'Still unauthorized' });

      const request = new Request('https://api.example.com/data');

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockAuthContext.wasLogoutCalled()).toBe(true);
      expect(response.status).toBe(401);
    });

    it('should not retry already retried requests', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(401, { error: 'Unauthorized' });

      const request = new Request('https://api.example.com/data');
      // Mark request as already retried
      (request as any).__retried = true;

      // Act
      const response = await interceptor.intercept(request, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockAuthContext.wasLogoutCalled()).toBe(true);
      expect(response.status).toBe(401);
    });
  });

  describe('interceptedFetch', () => {
    it('should use interceptor when provided', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      // Act
      const response = await interceptedFetch('https://api.example.com/data', {}, interceptor, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer valid-token');
    });

    it('should use regular fetch when no interceptor provided', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      // Act
      const response = await interceptedFetch('https://api.example.com/data', {}, undefined, mockFetch);

      // Assert
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(Request),
        {}
      );
    });

    it('should handle POST requests with body', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(201, { created: true });

      const requestBody = { name: 'test' };

      // Act
      const response = await interceptedFetch(
        'https://api.example.com/data', 
        {
          method: 'POST',
          body: JSON.stringify(requestBody),
          headers: { 'Content-Type': 'application/json' }
        },
        interceptor,
        mockFetch
      );

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.method).toBe('POST');
      expect(calledRequest.body).toBe(JSON.stringify(requestBody));
      expect(calledRequest.headers.get('Content-Type')).toBe('application/json');
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer valid-token');
    });
  });

  describe('Edge Cases', () => {
    it('should handle network errors gracefully', async () => {
      // Arrange
      const mockFetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const request = new Request('https://api.example.com/data');

      // Act & Assert
      await expect(interceptor.intercept(request, mockFetch)).rejects.toThrow('Network error');
    });

    it('should handle malformed URLs', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      // Act
      const response = await interceptedFetch('not-a-valid-url', {}, interceptor, mockFetch);

      // Assert - Should still attempt the request
      expect(mockFetch).toHaveBeenCalled();
    });

    it('should preserve original request headers', async () => {
      // Arrange
      const { mockFetch, setResponse } = createMockFetch();
      setResponse(200, { success: true });

      // Act
      const response = await interceptedFetch(
        'https://api.example.com/data',
        {
          headers: {
            'Custom-Header': 'custom-value',
            'Content-Type': 'application/json'
          }
        },
        interceptor,
        mockFetch
      );

      // Assert
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const calledRequest = mockFetch.mock.calls[0][0];
      expect(calledRequest).toBeInstanceOf(Request);
      expect(calledRequest.headers.get('Custom-Header')).toBe('custom-value');
      expect(calledRequest.headers.get('Content-Type')).toBe('application/json');
      expect(calledRequest.headers.get('Authorization')).toBe('Bearer valid-token');
    });
  });
});
