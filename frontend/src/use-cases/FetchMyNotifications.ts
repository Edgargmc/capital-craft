// src/use-cases/FetchMyNotifications.ts
// Application Business Rules - Authenticated notification fetching
// Following Clean Architecture and SOLID principles

import { 
  NotificationList, 
  Result,
  NotificationError 
} from '../entities/Notification';

// Port - Interface for authenticated notification repository
export interface IAuthenticatedNotificationRepository {
  fetchMyNotifications(): Promise<Result<NotificationList>>;
}

// Port - Interface for logging (Dependency Inversion)
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

// Use Case Input (simplified - no userId needed, extracted from JWT)
export interface FetchMyNotificationsRequest {
  includeRead?: boolean;
  limit?: number;
}

// Use Case Output
export interface FetchMyNotificationsResponse {
  notifications: NotificationList;
  lastFetchedAt: Date;
}

// Use Case Implementation - Following Single Responsibility Principle
export class FetchMyNotificationsUseCase {
  constructor(
    private readonly notificationRepository: IAuthenticatedNotificationRepository,
    private readonly logger: ILogger
  ) {}

  async execute(request: FetchMyNotificationsRequest = {}): Promise<Result<FetchMyNotificationsResponse>> {
    this.logger.info('Fetching my notifications (authenticated)', { 
      includeRead: request.includeRead,
      limit: request.limit 
    });

    // Input validation (simplified since no userId needed)
    const validationResult = this.validateRequest(request);
    if (!validationResult.success) {
      return {
        success: false,
        error: validationResult.error,
        code: validationResult.code
      };
    }

    try {
      // Call authenticated repository method
      const result = await this.notificationRepository.fetchMyNotifications();

      if (!result.success || !result.data) {
        this.logger.error('Failed to fetch my notifications', undefined, { 
          error: result.error,
          code: result.code 
        });
        return {
          success: false,
          error: result.error || 'No data received',
          code: result.code || 'NO_DATA'
        };
      }

      // 🔍 DEBUG: Log raw backend response structure
      this.logger.info('🔍 Raw backend response structure:', {
        hasData: !!result.data,
        dataType: typeof result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        isArray: Array.isArray(result.data),
        firstItemSample: Array.isArray(result.data) && result.data.length > 0 ? {
          id: result.data[0].id,
          isRead: result.data[0].isRead,
          type: typeof result.data[0].isRead
        } : null
      });

      // � DEBUG: Log raw data items before processing
      if (Array.isArray(result.data)) {
        this.logger.info('🔍 RAW BACKEND DATA (Array format):', {
          items: result.data.map(item => ({
            id: item.id,
            title: item.title?.substring(0, 30) + '...',
            isRead: item.isRead,
            type: typeof item.isRead,
            rawValue: JSON.stringify(item.isRead)
          }))
        });
      } else if (result.data && result.data.items) {
        this.logger.info('🔍 RAW BACKEND DATA (Object format):', {
          items: result.data.items.map((item: any) => ({
            id: item.id,
            title: item.title?.substring(0, 30) + '...',
            isRead: item.isRead,
            type: typeof item.isRead,
            rawValue: JSON.stringify(item.isRead)
          }))
        });
      }

      // �🔧 FIXED: Handle both array and object response structures
      let notificationList: NotificationList;
      
      if (Array.isArray(result.data)) {
        // Backend returned array directly (old format)
        notificationList = {
          items: result.data,
          totalCount: result.data.length,
          unreadCount: result.data.filter(n => !n.isRead).length,
          userId: 'demo' // Default user for compatibility
        };
      } else if (result.data && typeof result.data === 'object' && 'items' in result.data) {
        // Backend returned NotificationList object (new format)
        notificationList = result.data as NotificationList;
      } else {
        // Fallback for unexpected structure
        this.logger.error('Unexpected backend response structure', undefined, { 
          dataType: typeof result.data,
          dataKeys: result.data ? Object.keys(result.data) : []
        });
        return {
          success: false,
          error: 'Invalid response structure from backend',
          code: 'INVALID_STRUCTURE'
        };
      }

      const response: FetchMyNotificationsResponse = {
        notifications: notificationList,
        lastFetchedAt: new Date()
      };

      this.logger.info('Successfully fetched my notifications', { 
        count: notificationList.items?.length || 0,
        unreadCount: notificationList.unreadCount || 0  
      });

      return {
        success: true,
        data: response
      };

    } catch (error) {
      this.logger.error('Unexpected error fetching my notifications', error as Error);
      
      return {
        success: false,
        error: 'Failed to fetch notifications due to unexpected error',
        code: 'UNEXPECTED_ERROR'
      };
    }
  }

  // Private validation method - Following Single Responsibility
  private validateRequest(request: FetchMyNotificationsRequest): Result<void> {
    // Validate limit if provided
    if (request.limit !== undefined) {
      if (request.limit < 1 || request.limit > 100) {
        return {
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT'
        };
      }
    }

    return { success: true, data: undefined };
  }
}
