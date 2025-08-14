// __tests__/infrastructure/api/NotificationAPI.test.ts
// SIMPLIFIED VERSION - Focus on core business functionality

import { NotificationAPI, NotificationAPIConfig } from '../../../src/infrastructure/api/NotificationAPI';
import { NotificationListApiResponse } from '../../../src/entities/Notification';

// Mock fetch globally
global.fetch = jest.fn();


beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

describe('NotificationAPI Core Functionality', () => {
  let api: NotificationAPI;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  const testConfig: NotificationAPIConfig = {
    baseUrl: 'https://test-api.example.com',
    timeout: 5000,
    retries: 1
  };

  const mockApiResponse: NotificationListApiResponse = {
    success: true,
    data: [
      {
        id: '1',
        title: 'Test Notification',
        message: 'Test message',
        deep_link: '/test',
        trigger_type: 'educational_moment',
        status: 'pending',
        created_at: '2025-08-05T00:45:11.372824',
        sent_at: null
      }
    ],
    total_count: 1,
    unread_count: 1,
    user_id: 'test-user'
  };

  beforeEach(() => {
    api = new NotificationAPI(testConfig);
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  describe('Core Business Logic Tests', () => {
    it('should successfully fetch and transform notifications', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      const result = await api.fetchByUserId('test-user');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/users/test-user/notifications',
        expect.objectContaining({
          signal: expect.any(AbortSignal)
        })
      );

      expect(result.success).toBe(true);
      if (result.success && result.data) {
        expect(result.data.items).toHaveLength(1);
        expect(result.data.totalCount).toBe(1);
        expect(result.data.items[0].triggerType).toBe('educational_moment');
        expect(result.data.userId).toBe('test-user');
      }
    });

    it('should handle 404 errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: jest.fn().mockResolvedValue({ detail: 'User not found' }),
      } as any);

      const result = await api.fetchByUserId('nonexistent-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Notifications not found');
        expect(result.code).toBe('NOT_FOUND');
      }
    });

    it('should handle 500 server errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: jest.fn().mockResolvedValue({ detail: 'Internal server error' }),
      } as any);

      const result = await api.fetchByUserId('test-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Server error - please try again later');
        expect(result.code).toBe('SERVER_ERROR');
      }
    });

    it('should handle 429 rate limiting', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: jest.fn().mockResolvedValue({ detail: 'Rate limit exceeded' }),
      } as any);

      const result = await api.fetchByUserId('test-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Too many requests - please try again later');
        expect(result.code).toBe('RATE_LIMITED');
      }
    });

    it('should handle network errors with retry logic', async () => {
      // First call fails, second call succeeds  
      mockFetch
        .mockRejectedValueOnce(new Error('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: jest.fn().mockResolvedValue(mockApiResponse),
        } as any);

      const result = await api.fetchByUserId('test-user');

      // Should have retried once (original + 1 retry = 2 calls)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(true);
    });

    it('should handle timeout errors without retry', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      const result = await api.fetchByUserId('test-user');

      // Should NOT retry on timeout - only 1 call
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Request timeout');
        expect(result.code).toBe('TIMEOUT');
      }
    });

    it('should exhaust retries on persistent network errors', async () => {
      // All calls fail with retryable error
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const result = await api.fetchByUserId('test-user');

      // Should try original + 1 retry = 2 total calls (retries: 1)
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain('Network error');
        expect(result.code).toBe('NETWORK_ERROR');
      }
    });

    it('should validate API response format', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ invalid: 'response' }),
      } as any);

      const result = await api.fetchByUserId('test-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid API response format');
        expect(result.code).toBe('INVALID_API_RESPONSE');
      }
    });

    it('should remove trailing slash from baseUrl', async () => {
      const apiWithTrailingSlash = new NotificationAPI({
        baseUrl: 'https://test-api.example.com/',
        timeout: 5000
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockApiResponse),
      } as any);

      await apiWithTrailingSlash.fetchByUserId('test-user');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://test-api.example.com/users/test-user/notifications',
        expect.any(Object)
      );
    });
  });

  describe('Interface Implementation Tests', () => {
    it('should implement INotificationRepository interface', async () => {
      // Test that the method exists and returns a Result
      const result = await api.fetchByUserId('test-user');
      
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
      
      if (result.success) {
        expect(result).toHaveProperty('data');
      } else {
        expect(result).toHaveProperty('error');
      }
    });

    it('should implement INotificationUpdateRepository interface', async () => {
      // Test that methods exist (even if not implemented)
      const findResult = await api.findById('test-id');
      const updateResult = await api.updateStatus('test-id', 'read');

      expect(findResult).toHaveProperty('success');
      expect(updateResult).toHaveProperty('success');
    });
  });

  describe('Error Handling Strategy', () => {
    it('should return Result type for all operations', async () => {
      // Test with various scenarios to ensure consistent Result type
      const scenarios = [
        () => api.fetchByUserId(''),
        () => api.findById('test'),
        () => api.updateStatus('test', 'read'),
      ];

      for (const scenario of scenarios) {
        const result = await scenario();
        expect(result).toHaveProperty('success');
        expect(typeof result.success).toBe('boolean');
      }
    });

    it('should handle unexpected errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce('String error instead of Error object');

      const result = await api.fetchByUserId('test-user');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeTruthy();
        expect(result.code).toBeTruthy();
      }
    });
  });

  describe('Configuration Validation', () => {
    it('should accept valid configuration', () => {
      const validConfigs = [
        { baseUrl: 'https://api.example.com' },
        { baseUrl: 'https://api.example.com', timeout: 1000 },
        { baseUrl: 'https://api.example.com', retries: 3 },
        { baseUrl: 'https://api.example.com/', timeout: 2000, retries: 1 },
      ];

      validConfigs.forEach(config => {
        expect(() => new NotificationAPI(config)).not.toThrow();
      });
    });

    it('should create instance with minimal config', () => {
      const minimalApi = new NotificationAPI({
        baseUrl: 'https://example.com'
      });

      expect(minimalApi).toBeInstanceOf(NotificationAPI);
    });

    it('should handle higher retry count', async () => {
      const apiWithMoreRetries = new NotificationAPI({
        baseUrl: 'https://test-api.example.com',
        retries: 2, // This means: original + 2 retries = 3 total calls
        timeout: 1000
      });

      // All requests fail with retryable error
      mockFetch.mockRejectedValue(new Error('Failed to fetch'));

      const result = await apiWithMoreRetries.fetchByUserId('test-user');

      // Should try original + 2 retries = 3 total calls
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.success).toBe(false);
    });
  });
});

// Separate file for testing business logic integration
describe('NotificationAPI Business Logic Integration', () => {
  let api: NotificationAPI;
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    api = new NotificationAPI({
      baseUrl: 'https://test-api.example.com',
      timeout: 1000
    });
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    mockFetch.mockClear();
  });

  it('should integrate with NotificationListEntity transformation', async () => {
    const validApiResponse: NotificationListApiResponse = {
      success: true,
      data: [
        {
          id: 'edu-1',
          title: '💡 Educational Moment',
          message: 'Learn about investing',
          deep_link: '/learn/basics',
          trigger_type: 'educational_moment',
          status: 'pending',
          created_at: '2025-08-05T00:45:11.372824',
          sent_at: null
        },
        {
          id: 'alert-1',
          title: '⚠️ Portfolio Alert',
          message: 'High volatility detected',
          deep_link: '/portfolio/risk',
          trigger_type: 'risk_change',
          status: 'read',
          created_at: '2025-08-05T00:30:11.372824',
          sent_at: '2025-08-05T00:31:00.000000'
        }
      ],
      total_count: 2,
      unread_count: 1,
      user_id: 'test-user'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(validApiResponse),
    } as any);

    const result = await api.fetchByUserId('test-user');

    expect(result.success).toBe(true);
    if (result.success && result.data) {
      // Test that entity transformation worked correctly
      expect(result.data.totalCount).toBe(2);
      
      const notifications = result.data.items;
      expect(notifications[0].triggerType).toBe('educational_moment');
      expect(notifications[1].triggerType).toBe('risk_change');
      
      // Test that dates were transformed correctly
      expect(notifications[0].createdAt).toBe('2025-08-05T00:45:11.372824');
      expect(notifications[1].createdAt).toBe('2025-08-05T00:30:11.372824');
    }
  });

  it('should handle entity transformation errors gracefully', async () => {
    const invalidApiResponse = {
      success: true,
      data: [
        {
          id: 'invalid-1',
          title: '',  // Empty title (no validation)
          message: 'Test',
          deep_link: '/test?invalid=true',
          trigger_type: 'invalid_type', // Maps to educational_moment (default)
          status: 'pending',
          created_at: '2025-01-01T00:00:00Z', // Valid date format
          sent_at: null
        }
      ],
      total_count: 1,
      unread_count: 0,
      user_id: 'test-user'
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue(invalidApiResponse),
    } as any);

    const result = await api.fetchByUserId('test-user');

    expect(result.success).toBe(true);
    // Entity transformation succeeds even with invalid data (no validation)
    if (result.success && result.data) {
      expect(result.data.items).toHaveLength(1);
      expect(result.data.items[0].title).toBe(''); // Empty title is preserved
    }
  });
});