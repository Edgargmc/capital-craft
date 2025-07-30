'use client';

import { useState } from 'react';
import { 
  LayoutDashboard, 
  PieChart, 
  Search, 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Settings, 
  MessageSquare,
  ChevronLeft,
  TrendingUp
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', name: 'Portfolio', icon: PieChart },
  { id: 'search', name: 'Stock Search', icon: Search },
  { id: 'learn', name: 'Learn', icon: BookOpen },
  { id: 'achievements', name: 'Achievements', icon: Trophy },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'feedback', name: 'Give Feedback', icon: MessageSquare },
];

export function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">Capital Craft</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded hover:bg-gray-800 transition-colors"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && <span className="text-sm font-medium">{item.name}</span>}
            </button>
          );
        })}
      </nav>

      {/* Secondary Navigation */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {!collapsed && (
                <span className={`text-sm font-medium ${
                  item.id === 'feedback' ? 'text-blue-400' : ''
                }`}>
                  {item.name}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}