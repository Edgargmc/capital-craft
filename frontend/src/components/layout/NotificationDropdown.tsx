'use client';

import { useEffect, useRef } from 'react';
import { 
  X, 
  BookOpen, 
  Trophy, 
  TrendingUp, 
  Bell,
  ChevronRight,
  Check,
  Trash2
} from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { Notification, NotificationType } from '@/entities/Notification';

interface NotificationDropdownProps {
  onClose: () => void;
  userId: string;
}

export function NotificationDropdown({ onClose, userId }: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    isLoading,
    markAsRead,
    dismiss,
    usingMockData
  } = useNotificationStore();

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Get icon for notification type
  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case 'education':
        return <BookOpen className="h-5 w-5 text-blue-500" />;
      case 'achievement':
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 'market':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'system':
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  // Get time ago string
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    
    // Navigate to deep link if available
    if (notification.deepLink) {
      // In a real app, you'd use Next.js router
      console.log('Navigate to:', notification.deepLink);
      // router.push(notification.deepLink);
    }
  };

  // Handle mark all as read
  const handleMarkAllAsRead = async () => {
    if (!notifications) return;
    
    const unreadNotifications = notifications.filter(n => !n.isRead);
    for (const notification of unreadNotifications) {
      await markAsRead(notification.id);
    }
  };

  // Handle dismiss notification
  const handleDismiss = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation(); // Prevent triggering the click handler
    await dismiss(notificationId);
  };

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div 
      ref={dropdownRef}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Notification List */}
      <div className="max-h-[70vh] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`group px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.isRead ? 'bg-blue-50 hover:bg-blue-100' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className={`text-sm ${
                          !notification.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">
                            {getTimeAgo(notification.createdAt)}
                          </span>
                          {notification.priority === 'high' && (
                            <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded">
                              Important
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!notification.isRead && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200"
                            title="Mark as read"
                          >
                            <Check className="h-4 w-4 text-gray-500" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDismiss(e, notification.id)}
                          className="p-1 rounded hover:bg-gray-200"
                          title="Dismiss"
                        >
                          <Trash2 className="h-4 w-4 text-gray-500" />
                        </button>
                      </div>
                    </div>

                    {/* Deep link indicator */}
                    {notification.deepLink && (
                      <div className="flex items-center mt-2 text-blue-600 text-xs font-medium">
                        <span>View content</span>
                        <ChevronRight className="h-3 w-3 ml-0.5" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Bell className="h-12 w-12 text-gray-300 mb-2" />
            <p className="text-gray-500 text-center">No notifications yet</p>
            <p className="text-gray-400 text-sm text-center mt-1">
              We'll notify you when something important happens
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
          <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
            View all notifications
          </button>
        </div>
      )}

      {/* Mock data indicator (only in development) */}
      {usingMockData && process.env.NODE_ENV === 'development' && (
        <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200">
          <p className="text-xs text-yellow-800">
            ⚠️ Using mock data (API connection issue)
          </p>
        </div>
      )}
    </div>
  );
}