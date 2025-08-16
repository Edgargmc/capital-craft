// src/components/layout/NotificationBell.tsx
'use client';

import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { useTheme } from '@/lib/hooks/useTheme';

interface NotificationBellProps {
  userId: string; // TODO: Obtener de auth store
  onClick: () => void;
  useThemeSystem?: boolean; // MIGRATED: Default to theme system (true)
}

export function NotificationBell({ userId, onClick, useThemeSystem = true }: NotificationBellProps) {
  const { 
    notifications, 
    isLoading,
    getUnreadCount  // Changed to function
  } = useNotificationStore();
  const theme = useTheme();

  // No fetch logic - this is handled by the parent Header component

  // FIXED: Use backend count directly from store (no manual calculation)
  const unreadCount = getUnreadCount();  // Call function
  const displayCount = unreadCount || 0;

  // Theme styles with dual approach
  const buttonStyles = useThemeSystem
    ? theme.combine('relative p-2 rounded-lg transition-colors group', 'hover:bg-gray-100')
    : 'relative p-2 rounded-lg hover:bg-gray-100 transition-colors group';

  const getBellIconStyles = (hasNotifications: boolean) => {
    if (useThemeSystem) {
      return theme.combine(
        'h-5 w-5 transition-colors',
        hasNotifications 
          ? 'text-gray-700 group-hover:text-gray-900' 
          : 'text-gray-500 group-hover:text-gray-700'
      );
    }
    return `h-5 w-5 transition-colors ${
      hasNotifications 
        ? 'text-gray-700 group-hover:text-gray-900' 
        : 'text-gray-500 group-hover:text-gray-700'
    }`;
  };

  const badgeStyles = useThemeSystem
    ? theme.combine('bg-red-500 text-white', 'absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center animate-pulse-subtle')
    : 'absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center animate-pulse-subtle';
  
  return (
    <div className="relative">
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-8 -right-2 text-xs text-gray-400 z-10">
          {useThemeSystem ? '🌟' : '🔄'}
        </div>
      )}
      <button
        onClick={onClick}
        className={buttonStyles}
        aria-label={`Notifications ${displayCount > 0 ? `(${displayCount} unread)` : ''}`}
      >
      {/* Bell Icon */}
      <Bell 
        className={getBellIconStyles(displayCount > 0)}
      />
      
      {/* Unread Badge */}
      {displayCount > 0 && (
        <span className={badgeStyles}>
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
    </div>
  );
}

// Mobile variant with different sizing
export function MobileNotificationBell({ userId, onClick, useThemeSystem = false }: NotificationBellProps) {
  const { 
    notifications,
    getUnreadCount  // Changed to function
  } = useNotificationStore();
  const theme = useTheme();

  // FIXED: Use backend count directly from store (no manual calculation)
  const unreadCount = getUnreadCount();  // Call function
  const displayCount = unreadCount || 0;

  // Mobile theme styles with dual approach
  const mobileButtonStyles = useThemeSystem
    ? theme.combine('relative p-1.5 rounded-lg transition-colors', 'hover:bg-gray-100')
    : 'relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors';

  const getMobileBellIconStyles = (hasNotifications: boolean) => {
    if (useThemeSystem) {
      return theme.combine(
        'h-4 w-4',
        hasNotifications ? 'text-gray-700' : 'text-gray-500'
      );
    }
    return `h-4 w-4 ${hasNotifications ? 'text-gray-700' : 'text-gray-500'}`;
  };

  const mobileBadgeStyles = useThemeSystem
    ? theme.combine('bg-red-500 text-white', 'absolute -top-1 -right-1 h-4 w-4 rounded-full flex items-center justify-center')
    : 'absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center';

  return (
    <button
      onClick={onClick}
      className={mobileButtonStyles}
      aria-label={`Notifications ${displayCount > 0 ? `(${displayCount} unread)` : ''}`}
    >
      <Bell className={getMobileBellIconStyles(displayCount > 0)} />
      
      {displayCount > 0 && (
        <span className={mobileBadgeStyles}>
          <span className="text-white text-[10px] font-bold">
            {displayCount > 9 ? '9+' : displayCount}
          </span>
        </span>
      )}
    </button>
  );
}