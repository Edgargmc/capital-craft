// __tests__/entities/Notification.test.ts
// Unit tests for Notification entity business logic - FIXED VERSION

import {
  Notification,
  NotificationEntity,
  NotificationListEntity,
  NotificationApiResponse,
  NotificationListApiResponse,
  NotificationType,
  TriggerType,
  NotificationPriority
} from '../../src/entities/Notification';

describe('NotificationEntity', () => {
  const mockApiResponse: NotificationApiResponse = {
    id: '27f695b4-b586-43af-9a14-728f8b687732',
    title: '💡 Perfect time to learn about Dividend Investing',
    message: 'Based on your portfolio, now is a great time to understand how dividend stocks can provide steady income.',
    deep_link: '/learning/content/volatility_basics',
    trigger_type: 'educational_moment',
    status: 'pending',
    createdAt: '2025-08-05T00:45:11.372824',
    sent_at: null,
    isRead: false
  };

  describe('fromApiResponse', () => {
    it('should transform API response to domain entity correctly', () => {
      const result = NotificationEntity.fromApiResponse(mockApiResponse);
      
      // Check all transformed fields
      expect(result.id).toBe(mockApiResponse.id);
      expect(result.title).toBe(mockApiResponse.title);
      expect(result.message).toBe(mockApiResponse.message);
      expect(result.deepLink).toBe(mockApiResponse.deep_link);
      expect(result.triggerType).toBe('educational_moment');
      expect(result.type).toBe('education'); // educational_moment maps to education
      expect(result.isRead).toBe(false); // status 'pending' maps to isRead: false
      expect(result.createdAt).toBe(mockApiResponse.createdAt); // Should be ISO string
      expect(result.priority).toBe('medium'); // educational_moment has medium priority
      expect(result.userId).toBe('demo'); // Default user
      expect(result.metadata).toEqual({}); // Empty metadata for this response
    });

    it('should map status correctly to isRead', () => {
      // Test with 'read' status
      const readResponse = { ...mockApiResponse, status: 'read' as const, isRead: true };
      const readResult = NotificationEntity.fromApiResponse(readResponse);
      expect(readResult.isRead).toBe(true);

      // Test with 'pending' status
      const pendingResponse = { ...mockApiResponse, status: 'pending' as const, isRead: false };
      const pendingResult = NotificationEntity.fromApiResponse(pendingResponse);
      expect(pendingResult.isRead).toBe(false);

      // Test with 'sent' status
      const sentResponse = { ...mockApiResponse, status: 'sent' as const, isRead: false };
      const sentResult = NotificationEntity.fromApiResponse(sentResponse);
      expect(sentResult.isRead).toBe(false);
    });

    it('should map trigger types to notification types correctly', () => {
      const testCases = [
        { trigger: 'first_stock', expectedType: 'education' },
        { trigger: 'high_volatility', expectedType: 'education' },
        { trigger: 'educational_moment', expectedType: 'education' },
        { trigger: 'portfolio_milestone', expectedType: 'achievement' },
        { trigger: 'dividend_stock', expectedType: 'market' },
        { trigger: 'risk_change', expectedType: 'system' },
        { trigger: 'unknown_type', expectedType: 'system' } // Default fallback
      ];

      testCases.forEach(({ trigger, expectedType }) => {
        const response = { ...mockApiResponse, trigger_type: trigger };
        const result = NotificationEntity.fromApiResponse(response);
        expect(result.type).toBe(expectedType);
      });
    });

    it('should determine priority based on trigger type', () => {
      const testCases = [
        { trigger: 'first_stock', expectedPriority: 'high' },
        { trigger: 'risk_change', expectedPriority: 'high' },
        { trigger: 'high_volatility', expectedPriority: 'medium' },
        { trigger: 'educational_moment', expectedPriority: 'medium' },
        { trigger: 'portfolio_milestone', expectedPriority: 'medium' },
        { trigger: 'dividend_stock', expectedPriority: 'low' },
        { trigger: 'unknown_type', expectedPriority: 'low' } // Default
      ];

      testCases.forEach(({ trigger, expectedPriority }) => {
        const response = { ...mockApiResponse, trigger_type: trigger };
        const result = NotificationEntity.fromApiResponse(response);
        expect(result.priority).toBe(expectedPriority);
      });
    });

    it('should extract metadata from risk_change notifications', () => {
      const riskResponse: NotificationApiResponse = {
        ...mockApiResponse,
        title: '⚖️ Portfolio Risk: HIGH',
        trigger_type: 'risk_change',
        deep_link: '/learning/content/risk_management?level=HIGH',
        isRead: false
      };

      const result = NotificationEntity.fromApiResponse(riskResponse);
      
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.riskLevel).toBe('HIGH');
    });

    it('should handle invalid trigger types gracefully', () => {
      const invalidResponse = { ...mockApiResponse, trigger_type: 'completely_invalid', isRead: false };
      
      // Should not throw, but map to default
      const result = NotificationEntity.fromApiResponse(invalidResponse);
      expect(result.triggerType).toBe('educational_moment'); // Default fallback
      expect(result.type).toBe('system'); // Unknown types map to system
    });

    it('should handle empty title without throwing', () => {
      const invalidResponse = { ...mockApiResponse, title: '', isRead: false };
      
      // Current implementation doesn't validate, just transforms
      const result = NotificationEntity.fromApiResponse(invalidResponse);
      expect(result.title).toBe('');
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
        sent_at: null,
        isRead: false
      },
      {
        id: 'notification-2',
        title: 'Portfolio Alert',
        message: 'Your portfolio needs attention',
        deep_link: '/portfolio',
        trigger_type: 'risk_change',
        status: 'read',
        created_at: '2025-08-05T00:30:11.372824',
        sent_at: '2025-08-05T00:31:00.000000',
        isRead: true
      }
    ],
    total_count: 2,
    unread_count: 1,
    user_id: 'demo'
  };

  describe('fromApiResponse', () => {
    it('should successfully transform valid API response', () => {
      const result = NotificationListEntity.fromApiResponse(mockListApiResponse);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.items).toHaveLength(2);
        expect(result.data.totalCount).toBe(2);
        expect(result.data.userId).toBe('demo');
        
        // Check first notification
        expect(result.data.items[0].id).toBe('notification-1');
        expect(result.data.items[0].isRead).toBe(false);
        
        // Check second notification
        expect(result.data.items[1].id).toBe('notification-2');
        expect(result.data.items[1].isRead).toBe(true);
      }
    });

    it('should handle empty data array', () => {
      const emptyResponse: NotificationListApiResponse = {
        success: true,
        data: [],
        total_count: 0,
        unread_count: 0,
        user_id: 'demo'
      };

      const result = NotificationListEntity.fromApiResponse(emptyResponse);
      
      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.items).toHaveLength(0);
        expect(result.data.totalCount).toBe(0);
      }
    });

    it('should handle transformation errors gracefully', () => {
      // Create an invalid response that will cause transformation to fail
      const invalidResponse = {
        success: true,
        data: null as any, // This will cause map to fail
        total_count: 0,
        unread_count: 0,
        user_id: 'demo'
      };

      const result = NotificationListEntity.fromApiResponse(invalidResponse);
      
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(result.code).toBe('TRANSFORMATION_ERROR');
      }
    });
  });
});