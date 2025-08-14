'use client';

import { ChevronRight, Bell, User } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { NotificationDropdown } from './NotificationDropdown';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardHeaderProps {
  userName?: string;
}

export function DashboardHeader({ userName = "Usuario" }: DashboardHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const { user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left side - Breadcrumb and Title */}
        <div className="flex items-center space-x-4">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <span className="hover:text-gray-700 cursor-pointer">Home</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">Dashboard</span>
          </nav>
        </div>

        {/* Right side - User info and Notifications */}
        <div className="flex items-center space-x-4">
          {/* User info */}
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="w-4 h-4" />
            <span>Hola, {userName}</span>
          </div>

          {/* Notifications */}
          <div className="relative">
            <NotificationBell 
              userId={user?.id || 'anonymous'}
              onClick={() => setShowNotifications(!showNotifications)}
            />
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <NotificationDropdown 
                  onClose={() => setShowNotifications(false)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
