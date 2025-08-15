/**
 * Authentication HTTP Interceptor
 * 
 * @description Infrastructure layer HTTP interceptor for automatic token refresh and 401 handling
 * @responsibility Single: Intercept HTTP requests/responses for authentication
 * @principle Single Responsibility + Dependency Injection
 * 
 * @layer Infrastructure Layer (HTTP Interceptor)
 * @pattern Interceptor Pattern + Dependency Injection
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

/**
 * Authentication context interface for dependency injection
 * @principle Dependency Inversion: Depend on abstraction, not implementation
 */
export interface IAuthContext {
  /**
   * Ensure valid token, refresh if needed
   * @returns Valid token or null if refresh failed
   */
  ensureValidToken(): Promise<string | null>;

  /**
   * Refresh token if needed
   * @returns True if refresh successful
   */
  refreshTokenIfNeeded(): Promise<boolean>;

  /**
   * Logout user and clear tokens
   */
  logout(): void;

  /**
   * Get current token
   * @returns Current token or empty string
   */
  getToken(): Promise<string>;
}

/**
 * HTTP Interceptor Interface
 * @principle Interface Segregation - Single method for interception
 */
export interface IHttpInterceptor {
  /**
   * Intercept HTTP request
   * @param request - Request to intercept
   * @param fetchFn - The fetch function to use (defaults to global fetch)
   * @returns Promise resolving to response
   */
  intercept(request: Request, fetchFn: typeof fetch): Promise<Response>;
}

/**
 * Authentication HTTP Interceptor
 * 
 * @description Intercepts HTTP requests to add auth headers and handle 401 responses
 * @principle Single Responsibility: Only handles HTTP auth interception
 * @principle Dependency Injection: Uses injected auth context
 */
export class AuthHttpInterceptor implements IHttpInterceptor {
  private readonly authContext: IAuthContext;

  /**
   * Constructor
   * @param authContext - Authentication context for token management
   * @principle Dependency Injection
   */
  constructor(authContext: IAuthContext) {
    this.authContext = authContext;
  }

  /**
   * Intercepts HTTP requests to add authentication and handle token refresh
   * @param request - The HTTP request to intercept
   * @param fetchFn - The fetch function to use (defaults to global fetch)
   * @returns Promise resolving to the HTTP response
   */
  async intercept(request: Request, fetchFn: typeof fetch = fetch): Promise<Response> {
    // Skip auth endpoints to prevent infinite loops
    if (this.isAuthEndpoint(request.url)) {
      return fetchFn(request);
    }

    // Check if already retried before modifying
    if (this.isRetried(request)) {
      // Already retried, just make the request and logout if 401
      const modifiedRequest = await this.addAuthHeader(request);
      const response = await fetchFn(modifiedRequest);
      if (response.status === 401) {
        this.authContext.logout();
      }
      return response;
    }

    // Add Authorization header if token is available
    const modifiedRequest = await this.addAuthHeader(request);

    try {
      // Make the request
      const response = await fetchFn(modifiedRequest);

      // Handle 401 Unauthorized responses
      if (response.status === 401) {
        return this.handleUnauthorized(request, fetchFn);
      }

      return response;
    } catch (error) {
      // Re-throw network errors
      throw error;
    }
  }

  /**
   * Handles 401 Unauthorized responses by attempting token refresh and retry
   * @param request - The original request that received 401
   * @param fetchFn - The fetch function to use
   * @returns Promise resolving to the retry response or original 401
   */
  private async handleUnauthorized(request: Request, fetchFn: typeof fetch): Promise<Response> {
    try {
      // Attempt to refresh the token
      const refreshed = await this.authContext.refreshTokenIfNeeded();
      
      if (!refreshed) {
        // Token refresh failed, logout user
        this.authContext.logout();
        return new Response(JSON.stringify({ error: 'Authentication failed' }), {
          status: 401,
          statusText: 'Unauthorized'
        });
      }

      // Mark request as retried to prevent infinite loops
      this.markAsRetried(request);

      // Add the new token and retry the request
      const retryRequest = await this.addAuthHeader(request);
      const retryResponse = await fetchFn(retryRequest);

      // If retry also fails with 401, logout user
      if (retryResponse.status === 401) {
        this.authContext.logout();
      }

      return retryResponse;
    } catch (error) {
      // Token refresh failed, logout user
      this.authContext.logout();
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 401,
        statusText: 'Unauthorized'
      });
    }
  }

  /**
   * Add Authorization header to request if token is available
   * @param request - Original request
   * @returns Promise resolving to request with auth header
   */
  private async addAuthHeader(request: Request): Promise<Request> {
    const token = await this.authContext.ensureValidToken();
    
    if (!token) {
      return request;
    }

    // Clone the request and add Authorization header
    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);

    return new Request(request.url, {
      method: request.method,
      headers: headers,
      body: request.body,
      mode: request.mode,
      credentials: request.credentials,
      cache: request.cache,
      redirect: request.redirect,
      referrer: request.referrer,
      integrity: request.integrity
    });
  }

  /**
   * Check if URL is an auth endpoint
   * @param url - URL to check
   * @returns True if auth endpoint
   * 
   * @principle Single Responsibility: Only checks endpoint type
   */
  private isAuthEndpoint(url: string): boolean {
    return url.includes('/auth/') || url.includes('/stocks');
  }

  /**
   * Check if request has already been retried
   * @param request - Request to check
   * @returns True if already retried
   */
  private isRetried(request: Request): boolean {
    return (request as any).__retried === true;
  }

  /**
   * Mark request as retried to prevent infinite loops
   * @param request - Request to mark
   */
  private markAsRetried(request: Request): void {
    (request as any).__retried = true;
  }
}

/**
 * Intercepted Fetch Function
 * 
 * @description Helper function to use intercepted fetch with optional interceptor
 * @param url - URL to fetch
 * @param init - Fetch options
 * @param interceptor - Optional HTTP interceptor
 * @param fetchFn - The fetch function to use (defaults to global fetch)
 * @returns Promise resolving to response
 * 
 * @principle Single Responsibility: Only handles intercepted fetch
 */
export async function interceptedFetch(
  url: string | Request,
  init?: RequestInit,
  interceptor?: IHttpInterceptor,
  fetchFn: typeof fetch = fetch
): Promise<Response> {
  // Create request object
  const request = typeof url === 'string' ? new Request(url, init) : url;
  
  // Use interceptor if provided, otherwise use regular fetch
  if (interceptor) {
    return await interceptor.intercept(request, fetchFn);
  }
  
  return await fetchFn(request, init);
}
