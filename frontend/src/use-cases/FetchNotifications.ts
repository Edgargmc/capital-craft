// src/use-cases/FetchNotifications.ts
// Application Business Rules - Orchestrates entities and external dependencies

import { 
    NotificationList, 
    Result,
    NotificationError 
  } from '../entities/Notification';
  
  // Port - Interface que debe implementar la infrastructure layer
  export interface INotificationRepository {
    fetchByUserId(userId: string): Promise<Result<NotificationList>>;
  }
  
  // Port - Interface para logging (Dependency Inversion)
  export interface ILogger {
    info(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
  }
  
  // Use Case Input
  export interface FetchNotificationsRequest {
    userId: string;
    includeRead?: boolean;
    limit?: number;
  }
  
  // Use Case Output
  export interface FetchNotificationsResponse {
    notifications: NotificationList;
    lastFetchedAt: Date;
  }
  
  // Use Case Implementation
  export class FetchNotificationsUseCase {
    constructor(
      private readonly notificationRepository: INotificationRepository,
      private readonly logger: ILogger
    ) {}
  
    async execute(request: FetchNotificationsRequest): Promise<Result<FetchNotificationsResponse>> {
      this.logger.info('Fetching notifications', { 
        userId: request.userId,
        includeRead: request.includeRead,
        limit: request.limit 
      });
  
      // Input validation
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        this.logger.warn('Invalid fetch notifications request', { 
          error: validationResult.error,
          request 
        });
        return {
          success: false,
          error: validationResult.error,
          code: validationResult.code
        };
      }
  
      try {
                // Fetch from repository
        const repositoryResult = await this.notificationRepository.fetchByUserId(request.userId);
        console.log("repositoryResult: ", repositoryResult);
        
        if (!repositoryResult.success) {
          this.logger.error('Repository error fetching notifications', undefined, {
            userId: request.userId,
            error: repositoryResult.error
          });
          return {
            success: false,
            error: repositoryResult.error,
            code: repositoryResult.code
          };
        }

        if (!repositoryResult.data) {
          this.logger.error('Repository returned no data', undefined, {
            userId: request.userId
          });
          return {
            success: false,
            error: 'No notifications data received from repository',
            code: 'NO_DATA'
          };
        }

        let notifications = repositoryResult.data;

        // Apply business rules for filtering
        if (!request.includeRead) {
          notifications = this.filterUnreadOnly(notifications);
        }

        // Apply limit if specified
        if (request.limit && request.limit > 0) {
          notifications = this.limitResults(notifications, request.limit);
        }

        // Sort by business priority
        notifications = this.sortByBusinessPriority(notifications);

        const response: FetchNotificationsResponse = {
          notifications,
          lastFetchedAt: new Date()
        };

        this.logger.info('Successfully fetched notifications', {
          userId: request.userId,
          totalCount: notifications.totalCount
        });
  
        return {
          success: true,
          data: response
        };
  
      } catch (error) {
        const notificationError = error instanceof NotificationError 
          ? error 
          : new NotificationError(
              'Unexpected error fetching notifications',
              'FETCH_UNEXPECTED_ERROR',
              error instanceof Error ? error : undefined
            );
  
        this.logger.error('Unexpected error in FetchNotifications use case', notificationError, {
          userId: request.userId
        });
  
        return {
          success: false,
          error: notificationError.message,
          code: notificationError.code
        };
      }
    }
  
    // Business rule: Validate request parameters
    private validateRequest(request: FetchNotificationsRequest): Result<void> {
      if (!request.userId || request.userId.trim() === '') {
        return {
          success: false,
          error: 'userId is required and cannot be empty',
          code: 'INVALID_USER_ID'
        };
      }
  
      if (request.limit !== undefined && request.limit < 0) {
        return {
          success: false,
          error: 'limit must be a positive number',
          code: 'INVALID_LIMIT'
        };
      }
  
      return { success: true, data: undefined };
    }
  
        // Business rule: Filter to unread notifications only
    private filterUnreadOnly(notifications: NotificationList): NotificationList {
      const unreadNotifications = notifications.items.filter(item => !item.isRead);

      return {
        items: unreadNotifications,
        totalCount: unreadNotifications.length,
        unreadCount: unreadNotifications.length,
        userId: notifications.userId
      };
    }

    // Business rule: Limit results for performance
    private limitResults(notifications: NotificationList, limit: number): NotificationList {
      const limitedNotifications = notifications.items.slice(0, limit);

      return {
        items: limitedNotifications,
        totalCount: limitedNotifications.length,
        unreadCount: limitedNotifications.filter(n => !n.isRead).length,
        userId: notifications.userId
      };
    }

    // Business rule: Sort by business priority (urgent first, then recency)
    private sortByBusinessPriority(notifications: NotificationList): NotificationList {
      const sortedNotifications = [...notifications.items].sort((a, b) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        
        if (priorityDiff !== 0) return priorityDiff;
        
        // Then by creation date (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      return {
        ...notifications,
        items: sortedNotifications
      };
    }
  }