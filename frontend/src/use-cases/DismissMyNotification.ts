// src/use-cases/DismissMyNotification.ts
// Application Business Rules - Authenticated notification dismissal
// Following Clean Architecture and SOLID principles

import { 
  Result,
  NotificationUpdateResult,
  NotificationError,
  Notification as DomainNotification 
} from '../entities/Notification';

// Port - Interface for authenticated notification repository
export interface IAuthenticatedNotificationDismissRepository {
  dismissMyNotification(notificationId: string): Promise<NotificationUpdateResult<DomainNotification>>;
}

// Port - Interface for logging (Dependency Inversion)
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

// Use Case Implementation - Following Single Responsibility Principle
export class DismissMyNotificationUseCase {
  constructor(
    private readonly notificationRepository: IAuthenticatedNotificationDismissRepository,
    private readonly logger: ILogger
  ) {}

  async execute(notificationId: string): Promise<NotificationUpdateResult<DomainNotification>> {
    this.logger.info('Dismissing my notification (authenticated)', { 
      notificationId 
    });

    // Input validation
    const validationResult = this.validateInput(notificationId);
    if (!validationResult.success) {
      return validationResult;
    }

    try {
      // Call authenticated repository method
      const result = await this.notificationRepository.dismissMyNotification(notificationId);

      if (!result.success) {
        this.logger.error('Failed to dismiss my notification', undefined, { 
          notificationId,
          error: result.error,
          code: result.code 
        });
        return result;
      }

      this.logger.info('Successfully dismissed my notification', { 
        notificationId
      });

      return result;

    } catch (error) {
      this.logger.error('Unexpected error dismissing my notification', error as Error, {
        notificationId
      });
      
      return {
        success: false,
        error: 'Failed to dismiss notification due to unexpected error',
        code: 'UNEXPECTED_ERROR'
      };
    }
  }

  // Private validation method - Following Single Responsibility
  private validateInput(notificationId: string): NotificationUpdateResult<DomainNotification> {
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
