// __tests__/entities/Notification.test.ts
// Unit tests for Notification entity business logic

import {
    Notification,
    NotificationEntity,
    NotificationListEntity,
    NotificationApiResponse,
    NotificationListApiResponse,
    NotificationValidationError,
    TriggerType,
    NotificationType
  } from '../../src/entities/Notification';

// Status type for testing
type NotificationStatus = 'pending' | 'sent' | 'read' | 'dismissed';
  
  describe('NotificationEntity', () => {
    const mockApiResponse: NotificationApiResponse = {
      id: '27f695b4-b586-43af-9a14-728f8b687732',
      title: '💡 Perfect time to learn about Dividend Investing',
      message: 'Based on your portfolio, now is a great time to understand how dividend stocks can provide steady income.',
      deep_link: '/learning/content/volatility_basics',
      trigger_type: 'educational_moment',
      status: 'pending',
      created_at: '2025-08-05T00:45:11.372824',
      sent_at: null
    };
  
    const mockNotification: Notification = {
      id: '27f695b4-b586-43af-9a14-728f8b687732',
      title: '💡 Perfect time to learn about Dividend Investing',
      message: 'Based on your portfolio, now is a great time to understand how dividend stocks can provide steady income.',
      deepLink: '/learning/content/volatility_basics',
      triggerType: 'educational_moment',
      status: 'pending',
      createdAt: new Date('2025-08-05T00:45:11.372824'),
      sentAt: null
    };
  
    describe('fromApiResponse', () => {
      it('should transform API response to domain entity correctly', () => {
        const result = NotificationEntity.fromApiResponse(mockApiResponse);
        
        expect(result).toEqual(mockNotification);
        expect(result.createdAt).toBeInstanceOf(Date);
      });
  
      it('should handle sent_at field correctly when present', () => {
        const apiResponseWithSentAt = {
          ...mockApiResponse,
          sent_at: '2025-08-05T01:00:00.000000'
        };
      
        const result = NotificationEntity.fromApiResponse(apiResponseWithSentAt);
        
        expect(result.sentAt).toBeInstanceOf(Date);
        
        // Fix: Compare the original ISO string instead of expecting specific timezone
        const expectedDate = new Date('2025-08-05T01:00:00.000000');
        expect(result.sentAt?.getTime()).toBe(expectedDate.getTime());
        
        // Alternative: Just check that it's a valid date with correct day
        expect(result.sentAt?.toISOString()).toMatch(/2025-08-05/);
      });
  
      it('should throw ValidationError for missing required fields', () => {
        const invalidResponse = { ...mockApiResponse, title: '' };
        
        expect(() => NotificationEntity.fromApiResponse(invalidResponse))
          .toThrow(NotificationValidationError);
      });
  
      it('should throw ValidationError for invalid trigger_type', () => {
        const invalidResponse = { ...mockApiResponse, trigger_type: 'invalid_type' };
        
        expect(() => NotificationEntity.fromApiResponse(invalidResponse))
          .toThrow(NotificationValidationError);
      });
  
      it('should throw ValidationError for invalid status', () => {
        const invalidResponse = { ...mockApiResponse, status: 'invalid_status' };
        
        expect(() => NotificationEntity.fromApiResponse(invalidResponse))
          .toThrow(NotificationValidationError);
      });
    });
  
    describe('Business Logic Methods', () => {
      describe('isUnread', () => {
        it('should return true for pending notifications', () => {
          const pendingNotification = { ...mockNotification, status: 'pending' as NotificationStatus };
          
          expect(NotificationEntity.isUnread(pendingNotification)).toBe(true);
        });
  
        it('should return false for read notifications', () => {
          const readNotification = { ...mockNotification, status: 'read' as NotificationStatus };
          
          expect(NotificationEntity.isUnread(readNotification)).toBe(false);
        });
  
        it('should return false for dismissed notifications', () => {
          const dismissedNotification = { ...mockNotification, status: 'dismissed' as NotificationStatus };
          
          expect(NotificationEntity.isUnread(dismissedNotification)).toBe(false);
        });
      });
  
      describe('canBeDismissed', () => {
        it('should return true for pending notifications', () => {
          const pendingNotification = { ...mockNotification, status: 'pending' as NotificationStatus };
          
          expect(NotificationEntity.canBeDismissed(pendingNotification)).toBe(true);
        });
  
        it('should return true for read notifications', () => {
          const readNotification = { ...mockNotification, status: 'read' as NotificationStatus };
          
          expect(NotificationEntity.canBeDismissed(readNotification)).toBe(true);
        });
  
        it('should return false for already dismissed notifications', () => {
          const dismissedNotification = { ...mockNotification, status: 'dismissed' as NotificationStatus };
          
          expect(NotificationEntity.canBeDismissed(dismissedNotification)).toBe(false);
        });
      });
  
      describe('isUrgent', () => {
        it('should return true for portfolio_alert notifications', () => {
          const alertNotification = { ...mockNotification, triggerType: 'portfolio_alert' as NotificationTriggerType };
          
          expect(NotificationEntity.isUrgent(alertNotification)).toBe(true);
        });
  
        it('should return false for educational_moment notifications', () => {
          expect(NotificationEntity.isUrgent(mockNotification)).toBe(false);
        });
  
        it('should return false for achievement notifications', () => {
          const achievementNotification = { ...mockNotification, triggerType: 'achievement' as NotificationTriggerType };
          
          expect(NotificationEntity.isUrgent(achievementNotification)).toBe(false);
        });
      });
  
      describe('getPriority', () => {
        it('should return high priority for portfolio_alert', () => {
          const alertNotification = { ...mockNotification, triggerType: 'portfolio_alert' as NotificationTriggerType };
          
          expect(NotificationEntity.getPriority(alertNotification)).toBe('high');
        });
  
        it('should return medium priority for achievement', () => {
          const achievementNotification = { ...mockNotification, triggerType: 'achievement' as NotificationTriggerType };
          
          expect(NotificationEntity.getPriority(achievementNotification)).toBe('medium');
        });
  
        it('should return low priority for educational_moment', () => {
          expect(NotificationEntity.getPriority(mockNotification)).toBe('low');
        });
      });
  
      describe('getTimeAgo', () => {
        beforeEach(() => {
          // Mock current time for consistent testing
          jest.useFakeTimers();
          jest.setSystemTime(new Date('2025-08-05T01:00:00.000Z'));
        });
  
        afterEach(() => {
          jest.useRealTimers();
        });
  
        it('should return "Just now" for very recent notifications', () => {
          const recentNotification = {
            ...mockNotification,
            createdAt: new Date('2025-08-05T00:59:45.000Z') // 15 seconds ago
          };
          
          expect(NotificationEntity.getTimeAgo(recentNotification)).toBe('Just now');
        });
  
        it('should return minutes for notifications within an hour', () => {
          const notification = {
            ...mockNotification,
            createdAt: new Date('2025-08-05T00:45:00.000Z') // 15 minutes ago
          };
          
          expect(NotificationEntity.getTimeAgo(notification)).toBe('15m ago');
        });
  
        it('should return hours for notifications within a day', () => {
          const notification = {
            ...mockNotification,
            createdAt: new Date('2025-08-04T23:00:00.000Z') // 2 hours ago
          };
          
          expect(NotificationEntity.getTimeAgo(notification)).toBe('2h ago');
        });
  
        it('should return days for notifications within a week', () => {
          const notification = {
            ...mockNotification,
            createdAt: new Date('2025-08-03T01:00:00.000Z') // 2 days ago
          };
          
          expect(NotificationEntity.getTimeAgo(notification)).toBe('2d ago');
        });
  
        it('should return formatted date for older notifications', () => {
          const oldNotification = {
            ...mockNotification,
            createdAt: new Date('2025-07-28T01:00:00.000Z') // 8 days ago
          };
          
          const result = NotificationEntity.getTimeAgo(oldNotification);
          expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/); // MM/DD/YYYY format
        });
      });
  
      describe('getIcon', () => {
        it('should return correct icon for educational_moment', () => {
          expect(NotificationEntity.getIcon(mockNotification)).toBe('💡');
        });
  
        it('should return correct icon for portfolio_alert', () => {
          const alertNotification = { ...mockNotification, triggerType: 'portfolio_alert' as NotificationTriggerType };
          
          expect(NotificationEntity.getIcon(alertNotification)).toBe('⚠️');
        });
  
        it('should return correct icon for achievement', () => {
          const achievementNotification = { ...mockNotification, triggerType: 'achievement' as NotificationTriggerType };
          
          expect(NotificationEntity.getIcon(achievementNotification)).toBe('🎉');
        });
      });
    });
  
    describe('toApiRequest', () => {
      it('should return only updatable fields', () => {
        const result = NotificationEntity.toApiRequest(mockNotification);
        
        expect(result).toEqual({
          id: mockNotification.id,
          status: mockNotification.status
        });
        
        // Should not include read-only fields
        expect(result).not.toHaveProperty('title');
        expect(result).not.toHaveProperty('message');
        expect(result).not.toHaveProperty('created_at');
      });
    });
  });
  
  describe('NotificationListEntity', () => {
    const mockListApiResponse: NotificationListApiResponse = {
      success: true,
      data: [
        {
          id: 'notification-1',
          title: 'Educational Notification',
          message: 'Learn about investing',
          deep_link: '/learn/1',
          trigger_type: 'educational_moment',
          status: 'pending',
          created_at: '2025-08-05T00:45:11.372824',
          sent_at: null
        },
        {
          id: 'notification-2',
          title: 'Portfolio Alert',
          message: 'Your portfolio needs attention',
          deep_link: '/portfolio',
          trigger_type: 'portfolio_alert',
          status: 'read',
          created_at: '2025-08-05T00:30:11.372824',
          sent_at: '2025-08-05T00:31:00.000000'
        }
      ],
      total_count: 2,
      user_id: 'demo'
    };

    const mockNotification: Notification = {
      id: '27f695b4-b586-43af-9a14-728f8b687732',
      title: '💡 Perfect time to learn about Dividend Investing',
      message: 'Based on your portfolio, now is a great time to understand how dividend stocks can provide steady income.',
      deepLink: '/learning/content/volatility_basics',
      triggerType: 'educational_moment',
      status: 'pending',
      createdAt: new Date('2025-08-05T00:45:11.372824'),
      sentAt: null
    };
  
    describe('fromApiResponse', () => {
      it('should successfully transform valid API response', () => {
        const result = NotificationListEntity.fromApiResponse(mockListApiResponse);
        
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.notifications).toHaveLength(2);
          expect(result.data.totalCount).toBe(2);
          expect(result.data.unreadCount).toBe(1); // Only first notification is pending
        }
      });
  
      it('should return error for invalid notification data', () => {
        const invalidResponse = {
          ...mockListApiResponse,
          data: [
            {
              ...mockListApiResponse.data[0],
              trigger_type: 'invalid_type'
            }
          ]
        };
  
        const result = NotificationListEntity.fromApiResponse(invalidResponse);
        
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toContain('Invalid trigger_type');
          expect(result.code).toBe('VALIDATION_ERROR');
        }
      });
    });
  
    describe('sortByPriority', () => {
      it('should sort notifications by priority then by recency', () => {
        const notifications: Notification[] = [
          {
            id: '1',
            title: 'Educational',
            message: 'Learn',
            deepLink: '/learn',
            triggerType: 'educational_moment',
            status: 'pending',
            createdAt: new Date('2025-08-05T01:00:00.000Z'),
            sentAt: null
          },
          {
            id: '2',
            title: 'Alert',
            message: 'Alert',
            deepLink: '/alert',
            triggerType: 'portfolio_alert',
            status: 'pending',
            createdAt: new Date('2025-08-05T00:30:00.000Z'),
            sentAt: null
          },
          {
            id: '3',
            title: 'Achievement',
            message: 'Congrats',
            deepLink: '/achievement',
            triggerType: 'achievement',
            status: 'pending',
            createdAt: new Date('2025-08-05T00:45:00.000Z'),
            sentAt: null
          }
        ];
  
        const sorted = NotificationListEntity.sortByPriority(notifications);
        
        // Should be: Alert (high priority), Achievement (medium), Educational (low)
        expect(sorted[0].triggerType).toBe('portfolio_alert');
        expect(sorted[1].triggerType).toBe('achievement');
        expect(sorted[2].triggerType).toBe('educational_moment');
      });
    });
  
    describe('filterByStatus', () => {
      it('should filter notifications by status correctly', () => {
        const notifications: Notification[] = [
          { ...mockNotification, id: '1', status: 'pending' },
          { ...mockNotification, id: '2', status: 'read' },
          { ...mockNotification, id: '3', status: 'pending' }
        ] as Notification[];
  
        const pending = NotificationListEntity.filterByStatus(notifications, 'pending');
        const read = NotificationListEntity.filterByStatus(notifications, 'read');
        
        expect(pending).toHaveLength(2);
        expect(read).toHaveLength(1);
        expect(pending.every(n => n.status === 'pending')).toBe(true);
        expect(read.every(n => n.status === 'read')).toBe(true);
      });
    });
  
    describe('filterByType', () => {
      it('should filter notifications by trigger type correctly', () => {
        const notifications: Notification[] = [
          { ...mockNotification, id: '1', triggerType: 'educational_moment' },
          { ...mockNotification, id: '2', triggerType: 'portfolio_alert' },
          { ...mockNotification, id: '3', triggerType: 'educational_moment' }
        ] as Notification[];
  
        const educational = NotificationListEntity.filterByType(notifications, 'educational_moment');
        const alerts = NotificationListEntity.filterByType(notifications, 'portfolio_alert');
        
        expect(educational).toHaveLength(2);
        expect(alerts).toHaveLength(1);
        expect(educational.every(n => n.triggerType === 'educational_moment')).toBe(true);
        expect(alerts.every(n => n.triggerType === 'portfolio_alert')).toBe(true);
      });
    });
  });