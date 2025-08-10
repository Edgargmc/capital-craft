// src/use-cases/MarkAllNotificationsAsRead.ts
/**
 * Mark All Notifications As Read Use Case
 * 
 * @description Handles the business logic for marking all user notifications as read
 * @layer Application
 * @pattern Use Case Pattern
 * @dependencies Domain entities, Repository interfaces
 * 
 * @author Capital Craft Team
 * @created 2025-08-09
 */

import { Result } from '../entities/Notification';

/**
 * Repository interface for bulk notification operations
 * Following SOLID principles - Interface Segregation
 */
export interface IBulkNotificationRepository {
  markAllAsRead(userId: string): Promise<Result<{ markedCount: number }>>;
}

/**
 * Mark All Notifications As Read Use Case
 * 
 * @description Encapsulates business logic for bulk marking notifications as read
 * @example
 * ```typescript
 * const useCase = new MarkAllNotificationsAsReadUseCase(repository);
 * const result = await useCase.execute('user-123');
 * if (result.success) {
 *   console.log(`Marked ${result.data.markedCount} notifications as read`);
 * }
 * ```
 */
export class MarkAllNotificationsAsReadUseCase {
  constructor(
    private readonly repository: IBulkNotificationRepository
  ) {}

  /**
   * Execute the mark all notifications as read use case
   * 
   * @param userId - User identifier
   * @returns Promise<Result<{ markedCount: number }>>
   * 
   * @throws {Error} When userId is invalid
   * @throws {Error} When repository operation fails
   */
  async execute(userId: string): Promise<Result<{ markedCount: number }>> {
    // Domain validation
    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      return {
        success: false,
        error: 'Invalid userId provided',
        code: 'INVALID_USER_ID'
      };
    }

    try {
      // Delegate to repository layer
      const result = await this.repository.markAllAsRead(userId.trim());
      
      // Business logic: Log successful bulk operation
      if (result.success && result.data) {
        console.log(`✅ Marked ${result.data.markedCount} notifications as read for user: ${userId}`);
      }
      
      return result;
      
    } catch (error) {
      console.error('❌ Mark all notifications as read failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'BULK_OPERATION_FAILED'
      };
    }
  }
}

/**
 * Factory function for creating use case instances
 * Following Dependency Injection pattern
 */
export const createMarkAllNotificationsAsReadUseCase = (
  repository: IBulkNotificationRepository
): MarkAllNotificationsAsReadUseCase => {
  return new MarkAllNotificationsAsReadUseCase(repository);
};
