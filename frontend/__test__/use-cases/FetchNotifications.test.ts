// __tests__/use-cases/FetchNotifications.test.ts

import { 
  FetchNotificationsUseCase,
  FetchNotificationsRequest,
  INotificationRepository,
  ILogger 
} from '../../src/use-cases/FetchNotifications';
import { 
  Notification, 
  NotificationList,
  NotificationError 
} from '../../src/entities/Notification';

// Mock implementations
class MockNotificationRepository implements INotificationRepository {
  constructor(private mockResult: any) {}

  async fetchByUserId(userId: string): Promise<any> {
    return this.mockResult;
  }
}

class MockLogger implements ILogger {
  public logs: Array<{ level: string; message: string; meta?: any; error?: Error }> = [];

  info(message: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'info', message, meta });
  }

  error(message: string, error?: Error, meta?: Record<string, any>): void {
    this.logs.push({ level: 'error', message, error, meta });
  }

  warn(message: string, meta?: Record<string, any>): void {
    this.logs.push({ level: 'warn', message, meta });
  }
}

describe('FetchNotificationsUseCase', () => {
  let mockLogger: MockLogger;
  
  const mockNotificationList: NotificationList = {
    notifications: [
      {
        id: '1',
        title: 'Educational Notification',
        message: 'Learn about investing',
        deepLink: '/learn/1',
        triggerType: 'educational_moment',
        status: 'pending',
        createdAt: new Date('2025-08-05T01:00:00.000Z'),
        sentAt: null
      },
      {
        id: '2',
        title: 'Portfolio Alert',
        message: 'High risk detected',
        deepLink: '/portfolio',
        triggerType: 'portfolio_alert',
        status: 'pending',
        createdAt: new Date('2025-08-05T00:30:00.000Z'),
        sentAt: null
      },
      {
        id: '3',
        title: 'Achievement',
        message: 'First trade completed',
        deepLink: '/achievements',
        triggerType: 'achievement',
        status: 'read',
        createdAt: new Date('2025-08-05T00:15:00.000Z'),
        sentAt: new Date('2025-08-05T00:16:00.000Z')
      }
    ],
    totalCount: 3,
    unreadCount: 2
  };

  beforeEach(() => {
    mockLogger = new MockLogger();
  });

  describe('successful execution', () => {
    it('should return all notifications when includeRead is true', async () => {
      const mockRepository = new MockNotificationRepository({
        success: true,
        data: mockNotificationList
      });

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user',
        includeRead: true
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notifications.totalCount).toBe(3);
        expect(result.data.notifications.notifications).toHaveLength(3);
        expect(result.data.lastFetchedAt).toBeInstanceOf(Date);
      }

      // Check logging
      expect(mockLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'info',
          message: 'Fetching notifications',
          meta: expect.objectContaining({ userId: 'test-user' })
        })
      );
    });

    it('should filter out read notifications when includeRead is false', async () => {
      const mockRepository = new MockNotificationRepository({
        success: true,
        data: mockNotificationList
      });

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user',
        includeRead: false
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notifications.totalCount).toBe(2); // Only pending notifications
        expect(result.data.notifications.unreadCount).toBe(2);
        expect(result.data.notifications.notifications.every(n => n.status === 'pending')).toBe(true);
      }
    });

    it('should apply limit when specified', async () => {
      const mockRepository = new MockNotificationRepository({
        success: true,
        data: mockNotificationList
      });

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user',
        includeRead: true,
        limit: 2
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notifications.notifications).toHaveLength(2);
        expect(result.data.notifications.totalCount).toBe(2);
      }
    });

    it('should sort notifications by priority (alerts first)', async () => {
      const mockRepository = new MockNotificationRepository({
        success: true,
        data: mockNotificationList
      });

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user',
        includeRead: true
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        const notifications = result.data.notifications.notifications;
        // Portfolio alert should be first (highest priority)
        expect(notifications[0].triggerType).toBe('portfolio_alert');
      }
    });
  });

  describe('validation errors', () => {
    it('should return error for empty userId', async () => {
      const mockRepository = new MockNotificationRepository({});
      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      
      const request: FetchNotificationsRequest = {
        userId: '',
        includeRead: true
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('userId is required');
        expect(result.code).toBe('INVALID_USER_ID');
      }

      // Check warning was logged
      expect(mockLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'warn',
          message: 'Invalid fetch notifications request'
        })
      );
    });

    it('should return error for negative limit', async () => {
      const mockRepository = new MockNotificationRepository({});
      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      
      const request: FetchNotificationsRequest = {
        userId: 'test-user',
        limit: -1
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('limit must be a positive number');
        expect(result.code).toBe('INVALID_LIMIT');
      }
    });
  });

  describe('repository errors', () => {
    it('should handle repository errors gracefully', async () => {
      const mockRepository = new MockNotificationRepository({
        success: false,
        error: 'Database connection failed',
        code: 'DB_ERROR'
      });

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database connection failed');
        expect(result.code).toBe('DB_ERROR');
      }

      // Check error was logged
      expect(mockLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'error',
          message: 'Repository error fetching notifications'
        })
      );
    });
  });

  describe('unexpected errors', () => {
    it('should handle unexpected errors and wrap them properly', async () => {
      const mockRepository: INotificationRepository = {
        fetchByUserId: jest.fn().mockRejectedValue(new Error('Unexpected network error'))
      };

      const useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
      const request: FetchNotificationsRequest = {
        userId: 'test-user'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unexpected error fetching notifications');
        expect(result.code).toBe('FETCH_UNEXPECTED_ERROR');
      }

      // Check error was logged
      expect(mockLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'error',
          message: 'Unexpected error in FetchNotifications use case'
        })
      );
    });
  });
});

// __tests__/use-cases/MarkNotificationAsRead.test.ts

import {
  MarkNotificationAsReadUseCase,
  MarkAsReadRequest,
  INotificationUpdateRepository
} from '../../src/use-cases/MarkNotificationAsRead';

class MockNotificationUpdateRepository implements INotificationUpdateRepository {
  constructor(
    private findResult: any,
    private updateResult: any
  ) {}

  async findById(id: string): Promise<any> {
    return this.findResult;
  }

  async updateStatus(id: string, status: 'read' | 'dismissed'): Promise<any> {
    return this.updateResult;
  }
}

describe('MarkNotificationAsReadUseCase', () => {
  let mockLogger: MockLogger;

  const mockNotification: Notification = {
    id: 'test-notification-id',
    title: 'Test Notification',
    message: 'Test message',
    deepLink: '/test',
    triggerType: 'educational_moment',
    status: 'pending',
    createdAt: new Date('2025-08-05T01:00:00.000Z'),
    sentAt: null
  };

  beforeEach(() => {
    mockLogger = new MockLogger();
  });

  describe('successful execution', () => {
    it('should mark pending notification as read', async () => {
      const updatedNotification = { ...mockNotification, status: 'read' as const };
      
      const mockRepository = new MockNotificationUpdateRepository(
        { success: true, data: mockNotification },
        { success: true, data: updatedNotification }
      );

      const useCase = new MarkNotificationAsReadUseCase(mockRepository, mockLogger);
      const request: MarkAsReadRequest = {
        notificationId: 'test-notification-id',
        userId: 'test-user'
      };

      const result = await useCase.execute(request);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.notification.status).toBe('read');
        expect(result.data.updatedAt).toBeInstanceOf(Date);
      }

      expect(mockLogger.logs).toContainEqual(
        expect.objectContaining({
          level: 'info',
          message: 'Successfully marked notification as read'
        })
      );
    });
  });
});