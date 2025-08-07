// src/components/layout/NotificationBell.tsx
'use client';

import { Bell } from 'lucide-react';
import { useEffect } from 'react';
import { useNotificationStore } from '@/lib/stores/notificationStore';

interface NotificationBellProps {
  userId: string; // TODO: Obtener de auth store
  onClick: () => void;
}

export function NotificationBell({ userId, onClick }: NotificationBellProps) {
  const { 
    notifications, 
    isLoading, 
    fetchNotifications,
    unreadCount 
  } = useNotificationStore();

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    if (userId) {
      // Initial fetch
      fetchNotifications(userId);

      // Poll every 30 seconds for new notifications
      const interval = setInterval(() => {
        fetchNotifications(userId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  // Calculate unread count safely
  const displayCount = notifications 
    ? notifications.filter(n => !n.isRead).length 
    : 0;

  return (
    <button
      onClick={onClick}
      className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors group"
      aria-label={`Notifications ${displayCount > 0 ? `(${displayCount} unread)` : ''}`}
    >
      {/* Bell Icon */}
      <Bell 
        className={`h-5 w-5 transition-colors ${
          displayCount > 0 
            ? 'text-gray-700 group-hover:text-gray-900' 
            : 'text-gray-500 group-hover:text-gray-700'
        }`}
      />
      
      {/* Unread Badge */}
      {displayCount > 0 && (
        <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse-subtle">
          <span className="text-white text-xs font-bold">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        </span>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
          </span>
        </span>
      )}
    </button>
  );
}

// Mobile variant with different sizing
export function MobileNotificationBell({ userId, onClick }: NotificationBellProps) {
  const { 
    notifications, 
    isLoading, 
    fetchNotifications 
  } = useNotificationStore();

  useEffect(() => {
    if (userId) {
      fetchNotifications(userId);
      
      const interval = setInterval(() => {
        fetchNotifications(userId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  const displayCount = notifications 
    ? notifications.filter(n => !n.isRead).length 
    : 0;

  return (
    <button
      onClick={onClick}
      className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
      aria-label={`Notifications ${displayCount > 0 ? `(${displayCount} unread)` : ''}`}
    >
      <Bell className={`h-4 w-4 ${
        displayCount > 0 ? 'text-gray-700' : 'text-gray-500'
      }`} />
      
      {displayCount > 0 && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        </span>
      )}
    </button>
  );
}