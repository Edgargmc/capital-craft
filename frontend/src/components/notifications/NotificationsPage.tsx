'use client';  // 🔧 Next.js Client Component directive

/**
 * 📄 NotificationsPage.tsx
 * 
 * REFACTORED: Component following SettingsPage pattern
 * Following Clean Architecture + SOLID principles
 * 
 * Responsibilities:
 * - Display all user notifications within app context
 * - Provide better UX than dropdown for managing notifications
 * - Extensible structure for future features
 */

import React, { useEffect } from 'react';
import { Bell, CheckCircle, X, Clock, AlertTriangle } from 'lucide-react';
import { useNotificationStore } from '../../lib/stores/notificationStore';
import { Notification } from '../../entities/Notification';

/**
 * Main notifications component (internal to app)
 * Single Responsibility: Display and manage all notifications
 */
export function NotificationsPage() {
  const {
    notifications,
    isLoading,
    isAuthenticated,
    fetchMyNotifications,
    markMyNotificationAsRead,
    dismissMyNotification
  } = useNotificationStore();

  // Fetch notifications on component mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchMyNotifications();
    }
  }, [isAuthenticated, fetchMyNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markMyNotificationAsRead(notificationId);
    } catch (error) {
      console.error('❌ Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await dismissMyNotification(notificationId);
    } catch (error) {
      console.error('❌ Error dismissing notification:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Please log in to access your notifications.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Notifications
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage your portfolio notifications and alerts
                </p>
              </div>
            </div>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">
              {notifications?.length || 0} total
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {isLoading ? (
            <NotificationsSkeleton />
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={handleMarkAsRead}
                  onDismiss={handleDismiss}
                />
              ))}
            </div>
          ) : (
            <EmptyNotificationsState />
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Individual notification card component
 * Single Responsibility: Display single notification with actions
 */
interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDismiss: (id: string) => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({
  notification,
  onMarkAsRead,
  onDismiss
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'education':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'system':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      // Handle different date formats that might come from backend
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date received:', dateString);
        return 'Recent'; // Fallback for invalid dates
      }
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('❌ Error formatting date:', dateString, error);
      return 'Recent'; // Fallback for any errors
    }
  };

  return (
    <div className={`bg-gray-50 rounded-lg border p-4 ${
      !notification.isRead ? 'ring-2 ring-blue-100 bg-blue-50' : ''
    }`}>
      <div className="flex items-start space-x-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className={`text-base font-medium ${
                !notification.isRead ? 'text-gray-900' : 'text-gray-700'
              }`}>
                {notification.title}
              </h3>
              <p className="text-gray-600 mt-1 text-sm">
                {notification.message}
              </p>
              <div className="flex items-center mt-2 space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(notification.createdAt)}</span>
                </div>
                {notification.priority === 'high' && (
                  <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-medium">
                    Important
                  </span>
                )}
                {!notification.isRead && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                    Unread
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-1 ml-4">
              {!notification.isRead && (
                <button
                  onClick={() => onMarkAsRead(notification.id)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title="Mark as read"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => onDismiss(notification.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Loading skeleton component
 * Single Responsibility: Show loading state
 */
const NotificationsSkeleton: React.FC = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-gray-50 rounded-lg border p-4">
        <div className="animate-pulse flex space-x-3">
          <div className="rounded-full bg-gray-200 h-5 w-5"></div>
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

/**
 * Empty state component
 * Single Responsibility: Show empty notifications state
 */
const EmptyNotificationsState: React.FC = () => (
  <div className="text-center py-12">
    <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-medium text-gray-900 mb-2">
      No notifications yet
    </h3>
    <p className="text-gray-600">
      When you have notifications, they'll appear here.
    </p>
  </div>
);
