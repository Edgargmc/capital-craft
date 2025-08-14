// src/use-cases/MarkAllMyNotificationsAsRead.ts
// Application Business Rules - Authenticated bulk notification marking as read
// Following Clean Architecture and SOLID principles

import { 
  Result,
  NotificationError 
} from '../entities/Notification';

// Port - Interface for authenticated notification repository
export interface IAuthenticatedBulkNotificationRepository {
  markAllMyNotificationsAsRead(): Promise<Result<{ markedCount: number }>>;
}

// Port - Interface for logging (Dependency Inversion)
export interface ILogger {
  info(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

// Use Case Implementation - Following Single Responsibility Principle
export class MarkAllMyNotificationsAsReadUseCase {
  constructor(
    private readonly notificationRepository: IAuthenticatedBulkNotificationRepository,
    private readonly logger?: ILogger
  ) {}

  async execute(): Promise<Result<{ markedCount: number }>> {
    this.logger?.info('Marking all my notifications as read (authenticated)');

    try {
      // Call authenticated repository method
      const result = await this.notificationRepository.markAllMyNotificationsAsRead();

      if (!result.success) {
        this.logger?.error('Failed to mark all my notifications as read', undefined, { 
          error: result.error,
          code: result.code 
        });
        return result;
      }

      this.logger?.info('Successfully marked all my notifications as read');

      return result;

    } catch (error) {
      this.logger?.error('Unexpected error marking all my notifications as read', error as Error);
      
      return {
        success: false,
        error: 'Failed to mark all notifications as read due to unexpected error',
        code: 'UNEXPECTED_ERROR'
      };
    }
  }
}
