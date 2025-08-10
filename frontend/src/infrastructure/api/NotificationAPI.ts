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

import { 
  IBulkNotificationRepository 
} from '../../use-cases/MarkAllNotificationsAsRead';

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

// Main NotificationAPI class implementing all repository interfaces
export class NotificationAPI implements INotificationRepository, INotificationUpdateRepository, IBulkNotificationRepository {
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
  async findById(notificationId: string): Promise<Result<Notification | null>> {
    try {
      const url = `${this.baseUrl}/notifications/${notificationId}`;
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        if (response.status === 404) {
          return {
            success: true,
            data: null
          };
        }
        return this.handleHttpError<Notification | null>(response, 'find notification by id');
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success || !apiResponse.data) {
        return {
          success: false,
          error: 'Notification not found',
          code: 'NOT_FOUND'
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
          error: `Entity transformation failed: ${entityError}`,
          code: 'TRANSFORMATION_ERROR'
        };
      }
      
    } catch (error) {
      return this.handleNetworkError(error, 'find notification by id');
    }
  }

  async updateStatus(
    notificationId: string, 
    status: 'read' | 'dismissed'
  ): Promise<Result<Notification>> {
    try {
      let url: string;
      let method: string;
      
      // Use appropriate endpoint based on status
      if (status === 'read') {
        url = `${this.baseUrl}/notifications/${notificationId}`;
        method = 'PATCH';
      } else if (status === 'dismissed') {
        url = `${this.baseUrl}/notifications/${notificationId}`;
        method = 'DELETE';
      } else {
        return {
          success: false,
          error: `Invalid status: ${status}`,
          code: 'INVALID_STATUS'
        };
      }
      
      const response = await this.fetchWithRetry(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        return this.handleHttpError<Notification>(response, 'update notification status');
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.message || 'Failed to update notification',
          code: 'UPDATE_FAILED'
        };
      }

      // For successful update, fetch the updated notification
      const updatedNotificationResult = await this.findById(notificationId);
      
      if (!updatedNotificationResult.success || !updatedNotificationResult.data) {
        // If we can't fetch the updated notification, return success with basic info
        return {
          success: true,
          data: {
            id: notificationId,
            status: status === 'read' ? 'read' : 'dismissed',
            isRead: status === 'read'
          } as Notification
        };
      }

      return {
        success: true,
        data: updatedNotificationResult.data
      };
      
    } catch (error) {
      return this.handleNetworkError(error, 'update notification status');
    }
  }

  /**
   * Mark all notifications as read for a user
   * New method for bulk operations
   */
  async markAllAsRead(userId: string): Promise<Result<{ markedCount: number }>> {
    try {
      const url = `${this.baseUrl}/notifications/mark-all-read`;
      const response = await this.fetchWithRetry(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId })
      });

      if (!response.ok) {
        return this.handleHttpError<{ markedCount: number }>(response, 'mark all notifications as read');
      }

      const apiResponse = await response.json();
      
      if (!apiResponse.success) {
        return {
          success: false,
          error: apiResponse.message || 'Failed to mark all notifications as read',
          code: 'BULK_UPDATE_FAILED'
        };
      }

      return {
        success: true,
        data: {
          markedCount: apiResponse.marked_count || 0
        }
      };
      
    } catch (error) {
      return this.handleNetworkError(error, 'mark all notifications as read');
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