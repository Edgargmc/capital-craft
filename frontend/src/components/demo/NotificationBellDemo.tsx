/**
 * NotificationBellDemo - Test component for NotificationBell with dual approach
 * Demonstrates notification states with both legacy and theme system approaches
 */

import React, { useState } from 'react';
import { NotificationBell, MobileNotificationBell } from '@/components/layout/NotificationBell';

interface NotificationBellDemoProps {
  useThemeSystem?: boolean;
}

export const NotificationBellDemo: React.FC<NotificationBellDemoProps> = ({ 
  useThemeSystem = false 
}) => {
  const [clickCount, setClickCount] = useState(0);

  const handleClick = () => {
    setClickCount(prev => prev + 1);
    console.log('🔔 Notification bell clicked!', { useThemeSystem, clickCount: clickCount + 1 });
  };

  // Mock user ID for testing
  const mockUserId = 'demo-user-123';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700">
          {useThemeSystem ? '🌟 Theme System' : '🔄 Legacy Styles'}
        </h4>
        <div className="text-xs text-gray-500">
          Clicks: {clickCount}
        </div>
      </div>

      <div className="space-y-6">
        {/* Desktop Version */}
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-3">Desktop NotificationBell</h5>
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-6">
            <NotificationBell
              userId={mockUserId}
              onClick={handleClick}
              useThemeSystem={useThemeSystem}
            />
          </div>
        </div>

        {/* Mobile Version */}
        <div>
          <h5 className="text-sm font-medium text-gray-600 mb-3">Mobile NotificationBell</h5>
          <div className="flex items-center justify-center bg-gray-50 rounded-lg p-6">
            <MobileNotificationBell
              userId={mockUserId}
              onClick={handleClick}
              useThemeSystem={useThemeSystem}
            />
          </div>
        </div>

        {/* Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>Theme mode: <span className="font-semibold">{useThemeSystem ? 'New Theme' : 'Legacy'}</span></div>
          <div>User ID: <span className="font-mono">{mockUserId}</span></div>
          <div className="text-blue-600">
            💡 Bell state is managed by NotificationStore (check console for debug info)
          </div>
        </div>
      </div>
    </div>
  );
};