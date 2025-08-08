// src/lib/mockNotifications.ts

import { Notification } from '@/entities/Notification';

export const mockNotifications: Notification[] = [
  {
    id: 'notif-1',
    userId: 'demo',
    type: 'education',
    title: '🎯 First Stock Purchase!',
    message: 'Congratulations on buying your first stock! You\'ve taken the first step in your investment journey.',
    triggerType: 'first_stock',
    metadata: {
      stockSymbol: 'AAPL',
      conceptsCovered: ['stock ownership', 'market orders', 'portfolio basics']
    },
    deepLink: '/learn/first-stock',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    priority: 'high'
  },
  {
    id: 'notif-2',
    userId: 'demo',
    type: 'achievement',
    title: '🏆 Achievement Unlocked!',
    message: 'Portfolio Diversification - You now own 3 different stocks!',
    triggerType: 'portfolio_milestone',
    metadata: {
      achievementName: 'Diversified Investor',
      stocksOwned: 3
    },
    deepLink: '/achievements',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    priority: 'medium'
  },
  {
    id: 'notif-3',
    userId: 'demo',
    type: 'education',
    title: '📈 High Volatility Detected',
    message: 'Your portfolio has high beta (1.5). This means higher risk but potential for higher returns.',
    triggerType: 'high_volatility',
    metadata: {
      portfolioBeta: 1.5,
      riskLevel: 'aggressive',
      learningContent: 'volatility_basics'
    },
    deepLink: '/learn/volatility',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    priority: 'medium'
  },
  {
    id: 'notif-4',
    userId: 'demo',
    type: 'market',
    title: '💰 Dividend Stock Alert',
    message: 'KO pays regular dividends. Learn about passive income investing!',
    triggerType: 'dividend_stock',
    metadata: {
      stockSymbol: 'KO',
      dividendYield: 3.2,
      learningContent: 'dividend_basics'
    },
    deepLink: '/learn/dividends',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    priority: 'low'
  },
  {
    id: 'notif-5',
    userId: 'demo',
    type: 'system',
    title: '⚖️ Portfolio Risk Level Changed',
    message: 'Your portfolio risk has changed from BALANCED to HIGH. Review your strategy.',
    triggerType: 'risk_change',
    metadata: {
      previousRisk: 'BALANCED',
      currentRisk: 'HIGH',
      portfolioBeta: 1.45
    },
    deepLink: '/portfolio/risk-analysis',
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3 hours ago
    priority: 'high'
  },
  {
    id: 'notif-6',
    userId: 'demo',
    type: 'education',
    title: '💡 Learning Opportunity',
    message: 'Based on your recent trades, now is a great time to learn about P/E ratios and valuation.',
    triggerType: 'educational_moment',
    metadata: {
      learningContent: 'pe_ratio_basics',
      conceptsCovered: ['P/E Ratio', 'Valuation', 'Fundamental Analysis']
    },
    deepLink: '/learn/pe-ratio',
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
    priority: 'low'
  }
];

/**
 * Helper to check if we should use mock data based on error
 */
export const shouldUseMockData = (error: string | unknown): boolean => {
  // Use mock data when there's an API error
  if (!error) return false;
  
  return (
    error.includes('Invalid trigger_type') || 
    error.includes('Repository error') ||
    error.includes('404') ||
    error.includes('Network error') ||
    error.includes('Failed to fetch') ||
    error.includes('TIMEOUT')
  );
};

/**
 * Get mock notifications filtered by read status
 */
export const getMockNotificationsByStatus = (status: 'read' | 'unread' | 'all'): Notification[] => {
  switch (status) {
    case 'read':
      return mockNotifications.filter(n => n.isRead);
    case 'unread':
      return mockNotifications.filter(n => !n.isRead);
    case 'all':
    default:
      return mockNotifications;
  }
};

/**
 * Get mock notifications by type
 */
export const getMockNotificationsByType = (type: string): Notification[] => {
  return mockNotifications.filter(n => n.type === type);
};

/**
 * Get unread count from mock notifications
 */
export const getMockUnreadCount = (): number => {
  return mockNotifications.filter(n => !n.isRead).length;
};

/**
 * Simulate marking a notification as read
 */
export const markMockNotificationAsRead = (notificationId: string): Notification[] => {
  return mockNotifications.map(n => 
    n.id === notificationId ? { ...n, isRead: true } : n
  );
};

/**
 * Simulate dismissing a notification
 */
export const dismissMockNotification = (notificationId: string): Notification[] => {
  return mockNotifications.filter(n => n.id !== notificationId);
};