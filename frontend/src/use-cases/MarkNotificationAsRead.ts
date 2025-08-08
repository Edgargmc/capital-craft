// src/use-cases/MarkNotificationAsRead.ts
// Use case for marking notifications as read

import { 
    Notification,
    Result,
    NotificationError,
    NotificationNotFoundError 
  } from '../entities/Notification';
  
  // Port - Repository interface
  export interface INotificationUpdateRepository {
    updateStatus(notificationId: string, status: 'read' | 'dismissed'): Promise<Result<Notification>>;
    findById(notificationId: string): Promise<Result<Notification | null>>;
  }
  
  // Port - Logger interface (reused from FetchNotifications)
  export interface ILogger {
    info(message: string, meta?: Record<string, unknown>): void;
    error(message: string, error?: Error, meta?: Record<string, unknown>): void;
    warn(message: string, meta?: Record<string, unknown>): void;
  }
  
  // Use Case Input
  export interface MarkAsReadRequest {
    notificationId: string;
    userId: string; // For authorization/logging
  }
  
  // Use Case Output
  export interface MarkAsReadResponse {
    notification: Notification;
    updatedAt: Date;
  }
  
  export class MarkNotificationAsReadUseCase {
    constructor(
      private readonly repository: INotificationUpdateRepository,
      private readonly logger: ILogger
    ) {}
  
    async execute(request: MarkAsReadRequest): Promise<Result<MarkAsReadResponse>> {
      this.logger.info('Marking notification as read', {
        notificationId: request.notificationId,
        userId: request.userId
      });
  
      // Input validation
      const validationResult = this.validateRequest(request);
      if (!validationResult.success) {
        this.logger.warn('Invalid mark as read request', {
          error: validationResult.error,
          request
        });
        return validationResult;
      }
  
      try {
        // Check if notification exists
        const existingResult = await this.repository.findById(request.notificationId);
        
        if (!existingResult.success) {
          this.logger.error('Error checking notification existence', undefined, {
            notificationId: request.notificationId,
            error: existingResult.error
          });
          return existingResult;
        }
  
        if (!existingResult.data) {
          const error = new NotificationNotFoundError(request.notificationId);
          this.logger.warn('Notification not found', {
            notificationId: request.notificationId,
            userId: request.userId
          });
          
          return {
            success: false,
            error: error.message,
            code: error.code
          };
        }
  
        const existingNotification = existingResult.data;
  
        // Business rule: Check if notification can be marked as read
        if (existingNotification.status === 'read') {
          this.logger.info('Notification already marked as read', {
            notificationId: request.notificationId
          });
          
          // Return success with current state (idempotent operation)
          return {
            success: true,
            data: {
              notification: existingNotification,
              updatedAt: new Date()
            }
          };
        }
  
        if (existingNotification.status === 'dismissed') {
          this.logger.warn('Cannot mark dismissed notification as read', {
            notificationId: request.notificationId,
            currentStatus: existingNotification.status
          });
          
          return {
            success: false,
            error: 'Cannot mark dismissed notification as read',
            code: 'INVALID_STATUS_TRANSITION'
          };
        }
  
        // Update notification status
        const updateResult = await this.repository.updateStatus(request.notificationId, 'read');
        
        if (!updateResult.success) {
          this.logger.error('Failed to update notification status', undefined, {
            notificationId: request.notificationId,
            error: updateResult.error
          });
          return updateResult;
        }
  
        const updatedNotification = updateResult.data;
  
        this.logger.info('Successfully marked notification as read', {
          notificationId: request.notificationId,
          userId: request.userId,
          previousStatus: existingNotification.status,
          newStatus: updatedNotification.status
        });
  
        return {
          success: true,
          data: {
            notification: updatedNotification,
            updatedAt: new Date()
          }
        };
  
      } catch (error) {
        const notificationError = error instanceof NotificationError 
          ? error 
          : new NotificationError(
              'Unexpected error marking notification as read',
              'MARK_READ_UNEXPECTED_ERROR',
              error instanceof Error ? error : undefined
            );
  
        this.logger.error('Unexpected error in MarkAsRead use case', notificationError, {
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
  
    private validateRequest(request: MarkAsReadRequest): Result<void> {
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
  
      return { success: true, data: undefined };
    }
  }