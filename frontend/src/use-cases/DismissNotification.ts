// src/use-cases/DismissNotification.ts
// Use case for dismissing notifications

import { 
    Notification,
    NotificationEntity,
    Result,
    NotificationError
  } from '../entities/Notification';
  
  // Reuse interfaces from MarkAsRead (DRY principle)
  export interface INotificationUpdateRepository {
    updateStatus(notificationId: string, status: 'read' | 'dismissed'): Promise<Result<Notification>>;
    findById(notificationId: string): Promise<Result<Notification | null>>;
  }
  
  export interface ILogger {
    info(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
  }
  
  // Use Case Input
  export interface DismissNotificationRequest {
    notificationId: string;
    userId: string;
    reason?: 'user_dismissed' | 'auto_expired' | 'not_relevant';
  }
  
  // Use Case Output
  export interface DismissNotificationResponse {
    notification: Notification;
    dismissedAt: Date;
    reason: string;
  }
  
  export class DismissNotificationUseCase {
    constructor(
      private readonly repository: INotificationUpdateRepository,
      private readonly logger: ILogger
    ) {}
  
    async execute(request: DismissNotificationRequest): Promise<Result<DismissNotificationResponse>> {
      this.logger.info('Dismissing notification', {
        notificationId: request.notificationId,
        userId: request.userId,
        reason: request.reason || 'user_dismissed'
      });
  
      // Validate input
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        return {
          success: false,
          error: validationResult.error,
          code: validationResult.code
        };
      }

      try {
        // Check if notification exists
        const existingResult = await this.repository.findById(request.notificationId);
        if (!existingResult.success || !existingResult.data) {
          return {
            success: false,
            error: existingResult.error || 'Notification not found',
            code: 'NOT_FOUND'
          };
        }

        const existingNotification = existingResult.data;

        // Business rule: Check if already dismissed
        if (existingNotification.status === 'dismissed') {
          return {
            success: false,
            error: 'Notification is already dismissed',
            code: 'ALREADY_DISMISSED'
          };
        }

        // Business rule: Check if notification can be dismissed
        const canDismissResult = this.validateDismissalRules(existingNotification);
        if (!canDismissResult.success) {
          return {
            success: false,
            error: canDismissResult.error,
            code: canDismissResult.code
          };
        }

        // Update notification status
        const updateResult = await this.repository.updateStatus(request.notificationId, 'dismissed');
        if (!updateResult.success || !updateResult.data) {
          return {
            success: false,
            error: updateResult.error || 'Failed to dismiss notification',
            code: 'UPDATE_FAILED'
          };
        }

        const dismissedNotification = updateResult.data;

        // Log success
        this.logger.info('Notification dismissed successfully', {
          notificationId: request.notificationId,
          previousStatus: existingNotification.status,
          userId: request.userId
        });

        // Return success response
        return {
          success: true,
          data: {
            notification: dismissedNotification,
            dismissedAt: new Date(),
            reason: request.reason || 'user_dismissed'
          }
        };

      } catch (error) {
        const notificationError = error instanceof NotificationError 
          ? error 
          : new NotificationError(
              'Unexpected error dismissing notification',
              'DISMISS_UNEXPECTED_ERROR',
              error instanceof Error ? error : undefined
            );
  
        this.logger.error('Unexpected error in DismissNotification use case', notificationError, {
          notificationId: request.notificationId,
          userId: request.userId
        });
  
        return {
          success: false,
          error: notificationError.message,
          code: notificationError.code
        };
      }
    }
  
    private validateRequest(request: DismissNotificationRequest): Result<void> {
      if (!request.notificationId || request.notificationId.trim() === '') {
        return {
          success: false,
          error: 'notificationId is required and cannot be empty',
          code: 'INVALID_NOTIFICATION_ID'
        };
      }
  
      if (!request.userId || request.userId.trim() === '') {
        return {
          success: false,
          error: 'userId is required and cannot be empty',
          code: 'INVALID_USER_ID'
        };
      }
  
      // Validate reason if provided
      if (request.reason) {
        const validReasons = ['user_dismissed', 'auto_expired', 'not_relevant'];
        if (!validReasons.includes(request.reason)) {
          return {
            success: false,
            error: `Invalid reason. Must be one of: ${validReasons.join(', ')}`,
            code: 'INVALID_DISMISS_REASON'
          };
        }
      }
  
      return { success: true, data: undefined };
    }
  
    private validateDismissalRules(notification: Notification): Result<void> {
      // Business rule: Use entity method to check if dismissal is allowed
      if (!NotificationEntity.canBeDismissed(notification)) {
        return {
          success: false,
          error: 'This notification cannot be dismissed',
          code: 'DISMISSAL_NOT_ALLOWED'
        };
      }
  
      // Business rule: High priority notifications require special handling
      if (NotificationEntity.isUrgent(notification)) {
        // Could add additional validation here
        // For now, allow dismissal but log it
        this.logger.warn('Dismissing urgent notification', {
          notificationId: notification.id,
          triggerType: notification.triggerType
        });
      }
  
      return { success: true, data: undefined };
    }
  }