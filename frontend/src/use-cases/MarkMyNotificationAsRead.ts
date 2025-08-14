// src/use-cases/MarkMyNotificationAsRead.ts
// Application Business Rules - Authenticated notification marking as read
// Following Clean Architecture and SOLID principles

import { 
  Result,
  NotificationUpdateResult,
  NotificationError,
  Notification as DomainNotification 
} from '../entities/Notification';

// Port - Interface for authenticated notification repository
export interface IAuthenticatedNotificationUpdateRepository {
  markMyNotificationAsRead(notificationId: string): Promise<NotificationUpdateResult<DomainNotification>>;  // 🔔 NEW: Returns notification + unread count
}

// Port - Interface for logging (Dependency Inversion)
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

// Use Case Implementation - Following Single Responsibility Principle
export class MarkMyNotificationAsReadUseCase {
  constructor(
    private readonly notificationRepository: IAuthenticatedNotificationUpdateRepository,
    private readonly logger: ILogger
  ) {}

  async execute(notificationId: string): Promise<NotificationUpdateResult<DomainNotification>> {  // 🔔 NEW: Return notification + unread count
    this.logger.info('Marking my notification as read (authenticated)', { 
      notificationId 
    });

    // Input validation
    const validationResult = this.validateInput(notificationId);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      // Call authenticated repository method
      const result = await this.notificationRepository.markMyNotificationAsRead(notificationId);

      if (!result.success) {
        this.logger.error('Failed to mark my notification as read', undefined, { 
          notificationId,
          error: result.error,
          code: result.code 
        });
        return result;
      }

      this.logger.info('Successfully marked my notification as read', { 
        notificationId
      });

      return result;

    } catch (error) {
      this.logger.error('Unexpected error marking my notification as read', error as Error, {
        notificationId
      });
      
      return {
        success: false,
        error: 'Failed to mark notification as read due to unexpected error',
        code: 'UNEXPECTED_ERROR'
      };
    }
  }

  // Private validation method - Following Single Responsibility
  private validateInput(notificationId: string): Result<void> {
    if (!notificationId || typeof notificationId !== 'string') {
      return {
        success: false,
        error: 'Notification ID is required and must be a string',
        code: 'INVALID_NOTIFICATION_ID'
      };
    }

    if (notificationId.trim().length === 0) {
      return {
        success: false,
        error: 'Notification ID cannot be empty',
        code: 'EMPTY_NOTIFICATION_ID'
      };
    }

    return { success: true, data: undefined };
  }
}
