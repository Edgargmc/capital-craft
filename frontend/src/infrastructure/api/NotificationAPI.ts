// src/infrastructure/api/NotificationAPI.ts
// Infrastructure layer - External API communication

import {
  Notification,
  NotificationList,
  NotificationListEntity,
  NotificationListApiResponse,
  NotificationApiResponse,
  NotificationEntity,
  Result,
  NotificationError
} from '../../entities/Notification';

import { 
  INotificationRepository 
} from '../../use-cases/FetchNotifications';

import { 
  INotificationUpdateRepository 
} from '../../use-cases/MarkNotificationAsRead';

// Configuration interface
export interface NotificationAPIConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}

// Separate API response interfaces (if backend has different update responses)
interface UpdateNotificationApiResponse {
  success: boolean;
  data: NotificationApiResponse;
  message?: string;
}

// Main NotificationAPI class implementing both repository interfaces
export class NotificationAPI implements INotificationRepository, INotificationUpdateRepository {
  private readonly baseUrl: string;
  private readonly timeout: number;
  private readonly retries: number;

  constructor(config: NotificationAPIConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.timeout = config.timeout || 100000; // 10 seconds default
    this.retries = config.retries || 2;
  }

  // Implement INotificationRepository
  async fetchByUserId(userId: string): Promise<Result<NotificationList>> {
    const url = `${this.baseUrl}/users/${userId}/notifications`;
    
    try {
      const response = await this.fetchWithRetry(url);
      
      if (!response.ok) {
        return this.handleHttpError(response, 'fetch notifications');
      }

      // Parse JSON only once
      const jsonData = await response.json();
      console.log('📦 Raw API Response:', jsonData);
      
      // Validate API response structure
      if (!this.isValidNotificationListResponse(jsonData)) {
        console.error('❌ Invalid API response format:', jsonData);
        return {
          success: false,
          error: 'Invalid API response format',
          code: 'INVALID_API_RESPONSE'
        };
      }

      // Transform using entity layer
      const result = NotificationListEntity.fromApiResponse(jsonData);
      console.log('✅ Transformed result:', result);
      return result;

    } catch (error) {
      return this.handleNetworkError(error, 'fetch notifications');
    }
  }

  // Implement INotificationUpdateRepository
  async findById(_notificationId: string): Promise<Result<Notification | null>> {
    console.log(_notificationId);
    //_notificationId: string //TODO completar metodo
    // Note: Your backend doesn't have individual notification endpoint yet
    // For now, we'll fetch all notifications and filter
    // TODO: Add GET /notifications/{id} endpoint to backend
    
    try {
      // Extract userId from notificationId or use a different strategy
      // For now, this is a limitation that needs backend support
      return {
        success: false,
        error: 'findById not implemented - requires backend endpoint',
        code: 'NOT_IMPLEMENTED'
      };

      // Future implementation when backend supports it:
      // const url = `${this.baseUrl}/notifications/${notificationId}`;
      // const response = await this.fetchWithRetry(url);
      // ... handle response
      
    } catch (error) {
      return this.handleNetworkError(error, 'find notification by id');
    }
  }

  async updateStatus(
    notificationId: string, 
    status: 'read' | 'dismissed'
  ): Promise<Result<Notification>> {
    // Note: Your backend doesn't have update endpoint yet
    // This is a design decision point - do we add PATCH endpoint?
    
    const url = `${this.baseUrl}/notifications/${notificationId}`;
    
    try {
      const response = await this.fetchWithRetry(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status })
      });

      if (!response.ok) {
        return this.handleHttpError<Notification>(response, 'update notification status');
      }

      const apiResponse: UpdateNotificationApiResponse = await response.json();
      
      if (!apiResponse.success || !apiResponse.data) {
        return {
          success: false,
          error: apiResponse.message || 'Failed to update notification',
          code: 'UPDATE_FAILED'
        };
      }

      // Transform single notification response
      try {
        const notification = NotificationEntity.fromApiResponse(apiResponse.data);
        return {
          success: true,
          data: notification
        };
      } catch (entityError) {
        return {
          success: false,
          error: entityError instanceof Error ? entityError.message : 'Entity transformation failed',
          code: 'ENTITY_TRANSFORM_ERROR'
        };
      }

    } catch (error) {
      return this.handleNetworkError(error, 'update notification status');
    }
  }

  // HTTP utilities with retry logic
  private async fetchWithRetry(
    url: string, 
    options?: RequestInit,
    attempt: number = 1
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;

    } catch (error) {
      clearTimeout(timeoutId);

      // Retry logic for network errors
      if (attempt <= this.retries && this.isRetryableError(error)) {
        await this.delay(1000 * attempt); // Exponential backoff
        return this.fetchWithRetry(url, options, attempt + 1);
      }

      throw error;
    }
  }

  // Error handling utilities
  private async handleHttpError<T>(response: Response, operation: string): Promise<Result<T>> {
    let errorMessage = `HTTP ${response.status} - Failed to ${operation}`;
    let errorCode = `HTTP_${response.status}`;

    try {
      const errorBody = await response.json();
      if (errorBody.detail) {
        errorMessage = errorBody.detail;
      }
      if (errorBody.code) {
        errorCode = errorBody.code;
      }
    } catch {
      // Ignore JSON parsing errors, use default message
    }

    // Map specific HTTP status codes to domain errors
    switch (response.status) {
      case 404:
        return {
          success: false,
          error: 'Notifications not found',
          code: 'NOT_FOUND'
        };
      case 401:
        return {
          success: false,
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        };
      case 403:
        return {
          success: false,
          error: 'Access denied to notifications',
          code: 'FORBIDDEN'
        };
      case 429:
        return {
          success: false,
          error: 'Too many requests - please try again later',
          code: 'RATE_LIMITED'
        };
      case 500:
      case 502:
      case 503:
        return {
          success: false,
          error: 'Server error - please try again later',
          code: 'SERVER_ERROR'
        };
      default:
        return {
          success: false,
          error: errorMessage,
          code: errorCode
        };
    }
  }

  private handleNetworkError<T>(error: unknown, operation: string): Result<T> {
    if (error instanceof Error) {
      console.error(`🔴 Network error during ${operation}:`, error);
      
      // Network/timeout errors
      if (error.name === 'AbortError') {
        return {
          success: false,
          error: `Request timeout - ${operation} took too long`,
          code: 'TIMEOUT'
        };
      }

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return {
          success: false,
          error: `Network error - please check your connection`,
          code: 'NETWORK_ERROR'
        };
      }

      // Other errors
      return {
        success: false,
        error: `Unexpected error during ${operation}: ${error.message}`,
        code: 'UNEXPECTED_ERROR'
      };
    }

    return {
      success: false,
      error: `Unknown error during ${operation}`,
      code: 'UNKNOWN_ERROR'
    };
  }

  // Validation utilities
  private isValidNotificationListResponse(data: unknown): data is NotificationListApiResponse {
    return (
      data !== null &&
      typeof data === 'object' &&
      'success' in data &&
      typeof (data as Record<string, unknown>).success === 'boolean' &&
      'data' in data &&
      Array.isArray((data as Record<string, unknown>).data) &&
      'total_count' in data &&
      typeof (data as Record<string, unknown>).total_count === 'number' &&
      'user_id' in data &&
      typeof (data as Record<string, unknown>).user_id === 'string'
    );
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      // Retry on network errors, but NOT on timeouts (AbortError)
      return (
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
      );
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Factory function following your existing API pattern
export class CapitalCraftNotificationAPI {
  private static instance: NotificationAPI | null = null;
  
  static getInstance(config?: NotificationAPIConfig): NotificationAPI {
    if (!this.instance) {
      const defaultConfig: NotificationAPIConfig = {
        baseUrl: process.env.NEXT_PUBLIC_API_BASE || 
          (process.env.NODE_ENV === 'production' 
            ? 'https://capital-craft-production.up.railway.app'
            : 'http://localhost:8000'),
        timeout: 100000,
        retries: 2
      };
      
      this.instance = new NotificationAPI(config || defaultConfig);
    }
    
    return this.instance;
  }

  // Reset instance for testing
  static resetInstance(): void {
    this.instance = null;
  }
}

// Extension methods for your existing CapitalCraftAPI class
// These can be added to your existing lib/api.ts
export class NotificationAPIExtension {
  
  // Method to add to existing CapitalCraftAPI class
  static async getNotifications(userId: string): Promise<NotificationList> {
    const api = CapitalCraftNotificationAPI.getInstance();
    const result = await api.fetchByUserId(userId);
    
    if (!result.success || !result.data) {
      throw new NotificationError(result.error || 'Unknown error', result.code);
    }
    
    return result.data;
  }

  // Method to add to existing CapitalCraftAPI class  
  static async markNotificationAsRead(notificationId: string): Promise<Notification> {
    const api = CapitalCraftNotificationAPI.getInstance();
    const result = await api.updateStatus(notificationId, 'read');
    
    if (!result.success || !result.data) {
      throw new NotificationError(result.error || 'Unknown error', result.code);
    }
    
    return result.data;
  }

  // Method to add to existing CapitalCraftAPI class
  static async dismissNotification(notificationId: string): Promise<Notification> {
    const api = CapitalCraftNotificationAPI.getInstance();
    const result = await api.updateStatus(notificationId, 'dismissed');
    
    if (!result.success || !result.data) {
      throw new NotificationError(result.error || 'Unknown error', result.code);
    }
    
    return result.data;
  }
}