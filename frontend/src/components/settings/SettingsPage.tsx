'use client';

import { useNavigation } from '@/hooks/useNavigation';
import { useAuth } from '@/contexts/AuthContext';
import { User, LogOut, Mail, Calendar } from 'lucide-react';

export function SettingsPage() {
  // NEW: Use centralized navigation
  const nav = useNavigation();
  const auth = useAuth();

  const handleLogout = () => {
    auth.logout();
    // NEW: Use centralized navigation instead of router.push('/auth')
    nav.goToAuth();
  };

  if (!auth.isAuthenticated || !auth.user) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md">
          Please log in to access settings.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <User className="w-6 h-6" />
            Account Settings
          </h1>
          <p className="text-gray-600 mt-1">Manage your Capital Craft account</p>
        </div>

        {/* User Information */}
        <div className="px-6 py-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Profile Information</h2>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Email</p>
                <p className="text-gray-900">{auth.user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <User className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Username</p>
                <p className="text-gray-900">{auth.user.username}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Calendar className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">User ID</p>
                <p className="text-gray-900 font-mono text-sm">{auth.user.id}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Session Management</h3>
              <p className="text-sm text-gray-600">Sign out of your Capital Craft account</p>
            </div>
            
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 mb-2">About Capital Craft</h3>
        <p className="text-sm text-blue-700">
          Capital Craft is your educational investment platform - "Duolingo for investments". 
          Practice trading with virtual money while learning real investment strategies.
        </p>
      </div>
    </div>
  );
}
