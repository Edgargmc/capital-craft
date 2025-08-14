// __tests__/use-cases/FetchNotifications.test.ts
// Tests for FetchNotifications use case - FIXED VERSION

import { FetchNotificationsUseCase } from '../../src/use-cases/FetchNotifications';
import { INotificationRepository } from '../../src/use-cases/FetchNotifications';
import { ILogger } from '../../src/use-cases/FetchNotifications';
import { NotificationList, Result } from '../../src/entities/Notification';

describe('FetchNotificationsUseCase', () => {
  let useCase: FetchNotificationsUseCase;
  let mockRepository: jest.Mocked<INotificationRepository>;
  let mockLogger: jest.Mocked<ILogger>;

  beforeEach(() => {
    // Create mocks
    mockRepository = {
      fetchByUserId: jest.fn()
    };

    mockLogger = {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    };

    useCase = new FetchNotificationsUseCase(mockRepository, mockLogger);
  });

  describe('successful execution', () => {
    const mockNotificationList: NotificationList = {
      items: [
        {
          id: '1',
          userId: 'demo',
          type: 'education',
          title: 'Educational Moment',
          message: 'Learn about investing',
          triggerType: 'educational_moment',
          deepLink: '/learn/1',
          isRead: false,
          status: 'pending',
          createdAt: '2025-08-05T00:45:11.372824',
          priority: 'medium'
        },
        {
          id: '2',
          userId: 'demo',
          type: 'system',
          title: 'Portfolio Alert',
          message: 'Risk level changed',
          triggerType: 'risk_change',
          deepLink: '/portfolio',
          isRead: true,
          status: 'read',
          createdAt: '2025-08-05T00:30:11.372824',
          priority: 'high'
        }
      ],
      totalCount: 2,
      unreadCount: 1,
      userId: 'demo'
    };

    it('should fetch notifications successfully', async () => {
      // Setup mock response
      mockRepository.fetchByUserId.mockResolvedValue({
        success: true,
        data: mockNotificationList
      });

      // Execute
      const result = await useCase.execute({ userId: 'demo' });

      // Assertions
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        // By default, only unread notifications are returned
        expect(result.data.notifications.items).toHaveLength(1);
        expect(result.data.notifications.totalCount).toBe(1);
        expect(result.data.notifications.items[0].isRead).toBe(false);
      }

      // Verify repository was called correctly
      expect(mockRepository.fetchByUserId).toHaveBeenCalledWith('demo');
      expect(mockRepository.fetchByUserId).toHaveBeenCalledTimes(1);

      // Verify logging
      expect(mockLogger.info).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });

    it('should handle empty notification list', async () => {
      const emptyList: NotificationList = {
        items: [],
        totalCount: 0,
        unreadCount: 0,
        userId: 'demo'
      };

      mockRepository.fetchByUserId.mockResolvedValue({
        success: true,
        data: emptyList
      });

      const result = await useCase.execute({ userId: 'demo' });

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.notifications.items).toHaveLength(0);
        expect(result.data.notifications.totalCount).toBe(0);
      }
    });
  });

  describe('error handling', () => {
    it('should handle repository errors', async () => {
      mockRepository.fetchByUserId.mockResolvedValue({
        success: false,
        error: 'Database connection failed',
        code: 'DB_ERROR'
      });

      const result = await useCase.execute({ userId: 'demo' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Database connection failed');
        expect(result.code).toBe('DB_ERROR');
      }

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should handle repository exceptions', async () => {
      mockRepository.fetchByUserId.mockRejectedValue(
        new Error('Network error')
      );

      const result = await useCase.execute({ userId: 'demo' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Unexpected error');
      }

      expect(mockLogger.error).toHaveBeenCalled();
    });

    it('should validate userId parameter', async () => {
      const result = await useCase.execute({ userId: '' });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('userId');
        expect(result.code).toBe('INVALID_USER_ID');
      }

      // Repository should not be called with invalid input
      expect(mockRepository.fetchByUserId).not.toHaveBeenCalled();
    });
  });

  describe('business logic', () => {
    it('should log execution details', async () => {
      const mockList: NotificationList = {
        items: [{
          id: '1',
          userId: 'demo',
          type: 'education',
          title: 'Test',
          message: 'Test',
          triggerType: 'educational_moment',
          isRead: false,
          status: 'pending',
          createdAt: '2025-08-05T00:45:11.372824',
          priority: 'medium'
        }],
        totalCount: 1,
        unreadCount: 1,
        userId: 'demo'
      };

      mockRepository.fetchByUserId.mockResolvedValue({
        success: true,
        data: mockList
      });

      await useCase.execute({ userId: 'demo' });

      // Check that info logging includes relevant details
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Fetching notifications'),
        expect.objectContaining({ userId: 'demo' })
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Successfully fetched'),
        expect.objectContaining({ 
          userId: 'demo',
          totalCount: 1
        })
      );
    });

    it('should measure execution time', async () => {
      // Mock a delay in repository call
      mockRepository.fetchByUserId.mockImplementation(
        () => new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: { items: [], totalCount: 0, unreadCount: 0, userId: 'demo' }
          }), 100)
        )
      );

      const startTime = Date.now();
      await useCase.execute({ userId: 'demo' });
      const endTime = Date.now();

      // Execution should take at least 100ms due to mock delay
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});