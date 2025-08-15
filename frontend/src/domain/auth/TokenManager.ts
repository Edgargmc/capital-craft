/**
 * TokenManager Domain Service
 * 
 * @description Clean Architecture Domain Service for JWT token management
 * @responsibility Single: Handle token validation, refresh, and expiration logic
 * @principle Single Responsibility + Domain-Driven Design
 * 
 * @layer Domain Layer (Business Logic)
 * @pattern Domain Service Pattern for token operations
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 1.0.0
 */

/**
 * Token validation result interface
 * @principle Interface Segregation - Specific to token validation
 */
export interface TokenValidationResult {
  /** Whether the token is valid and not expired */
  isValid: boolean;
  /** Whether the token is expired but otherwise valid */
  isExpired: boolean;
  /** Time remaining until expiration in seconds (0 if expired) */
  timeUntilExpiration: number;
  /** Reason for invalidity if applicable */
  reason?: string;
}

/**
 * Token refresh result interface
 * @principle Interface Segregation - Specific to token refresh operations
 */
export interface TokenRefreshResult {
  /** Whether the refresh operation was successful */
  success: boolean;
  /** New access token if refresh succeeded */
  accessToken?: string;
  /** New refresh token if provided */
  refreshToken?: string;
  /** Error message if refresh failed */
  error?: string;
  /** Whether the refresh token itself is invalid/expired */
  refreshTokenExpired?: boolean;
}

/**
 * Token storage interface for dependency inversion
 * @principle Dependency Inversion - Abstract storage implementation
 */
export interface ITokenStorage {
  /** Get stored access token */
  getAccessToken(): string | null;
  /** Get stored refresh token */
  getRefreshToken(): string | null;
  /** Store new tokens */
  setTokens(accessToken: string, refreshToken: string): void;
  /** Clear all stored tokens */
  clearTokens(): void;
}

/**
 * Token refresh service interface for dependency inversion
 * @principle Dependency Inversion - Abstract API implementation
 */
export interface ITokenRefreshService {
  /** Refresh access token using refresh token */
  refreshToken(refreshToken: string): Promise<TokenRefreshResult>;
}

/**
 * TokenManager Domain Service
 * 
 * @description Handles all token-related business logic including validation,
 * expiration checking, and refresh coordination
 * 
 * @principle Single Responsibility: Only handles token management logic
 * @principle Dependency Inversion: Depends on abstractions, not concretions
 */
export class TokenManager {
  private readonly tokenStorage: ITokenStorage;
  private readonly refreshService: ITokenRefreshService;
  
  /** Buffer time in seconds before token expiration to trigger refresh */
  private readonly REFRESH_BUFFER_SECONDS = 300; // 5 minutes
  
  /**
   * Creates a new TokenManager instance
   * 
   * @param tokenStorage - Storage abstraction for tokens
   * @param refreshService - Service abstraction for token refresh
   * 
   * @principle Dependency Injection via constructor
   */
  constructor(tokenStorage: ITokenStorage, refreshService: ITokenRefreshService) {
    this.tokenStorage = tokenStorage;
    this.refreshService = refreshService;
  }

  /**
   * Validates the current access token
   * 
   * @returns Token validation result with expiration info
   * 
   * @principle Single Responsibility: Only validates tokens
   */
  validateCurrentToken(): TokenValidationResult {
    const token = this.tokenStorage.getAccessToken();
    
    if (!token) {
      return {
        isValid: false,
        isExpired: false,
        timeUntilExpiration: 0,
        reason: 'No token found'
      };
    }

    try {
      // Decode JWT payload (without verification - just for expiration check)
      const payload = this.decodeJWTPayload(token);
      
      if (!payload.exp) {
        return {
          isValid: false,
          isExpired: false,
          timeUntilExpiration: 0,
          reason: 'Token has no expiration'
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const timeUntilExpiration = payload.exp - now;
      const isExpired = timeUntilExpiration <= 0;

      return {
        isValid: !isExpired,
        isExpired,
        timeUntilExpiration: Math.max(0, timeUntilExpiration),
        reason: isExpired ? 'Token expired' : undefined
      };
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        timeUntilExpiration: 0,
        reason: 'Invalid token format'
      };
    }
  }

  /**
   * Checks if token needs refresh based on expiration buffer
   * 
   * @returns True if token should be refreshed proactively
   * 
   * @principle Single Responsibility: Only checks refresh necessity
   */
  needsRefresh(): boolean {
    const validation = this.validateCurrentToken();
    
    if (!validation.isValid) {
      return true;
    }

    // Refresh if within buffer time of expiration
    return validation.timeUntilExpiration <= this.REFRESH_BUFFER_SECONDS;
  }

  /**
   * Attempts to refresh the current access token
   * 
   * @returns Promise resolving to refresh result
   * 
   * @principle Single Responsibility: Coordinates token refresh
   * @principle Open/Closed: Extensible for different refresh strategies
   */
  async refreshCurrentToken(): Promise<TokenRefreshResult> {
    const refreshToken = this.tokenStorage.getRefreshToken();
    
    if (!refreshToken) {
      return {
        success: false,
        error: 'No refresh token available',
        refreshTokenExpired: true
      };
    }

    try {
      const result = await this.refreshService.refreshToken(refreshToken);
      
      if (result.success && result.accessToken) {
        // Store new tokens
        this.tokenStorage.setTokens(
          result.accessToken,
          result.refreshToken || refreshToken
        );
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown refresh error',
        refreshTokenExpired: true
      };
    }
  }

  /**
   * Clears all stored tokens (for logout)
   * 
   * @principle Single Responsibility: Only handles token cleanup
   */
  clearTokens(): void {
    this.tokenStorage.clearTokens();
  }

  /**
   * Gets current access token if valid
   * 
   * @returns Access token or null if invalid/expired
   * 
   * @principle Single Responsibility: Token retrieval with validation
   */
  getCurrentValidToken(): string | null {
    const validation = this.validateCurrentToken();
    
    if (validation.isValid) {
      return this.tokenStorage.getAccessToken();
    }
    
    return null;
  }

  /**
   * Decodes JWT payload without verification (for expiration check only)
   * 
   * @param token - JWT token to decode
   * @returns Decoded payload
   * 
   * @private
   * @principle Single Responsibility: Only decodes JWT structure
   */
  private decodeJWTPayload(token: string): any {
    const parts = token.split('.');
    
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    return JSON.parse(decoded);
  }
}
