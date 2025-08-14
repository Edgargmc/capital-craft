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
  TrendingUp,
  Menu,
  X
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleTabChange = (tabId: string) => {
    onTabChange(tabId);
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const MobileMenuButton = () => (
    <button
      onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      className={`fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white shadow-lg md:hidden transition-transform ${
        mobileMenuOpen ? 'rotate-90' : ''
      }`}
    >
      {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );

  const MobileOverlay = () => (
    mobileMenuOpen ? (
      <div 
        className="fixed inset-0 z-30 md:hidden"
        style={{ backgroundColor: '#000000a6' }}
        onClick={() => setMobileMenuOpen(false)}
      />
    ) : null
  );


  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`bg-gray-900 text-white flex flex-col h-full ${
      isMobile ? 'w-80' : collapsed ? 'w-16' : 'w-64'
    } transition-all duration-300`}>
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          {(!collapsed || isMobile) && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">Capital Craft</span>
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {(!collapsed || isMobile) && (
                <span className="text-sm font-medium">{item.name}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-700 space-y-2">
        {secondaryNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              {(!collapsed || isMobile) && (
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

      {isMobile && (
        <div className="p-4 border-t border-gray-700">
          <p className="text-xs text-gray-400 text-center">
            Capital Craft v1.0
          </p>
        </div>
      )}
    </div>
  );

  return (
    <>
      <MobileMenuButton />
      <MobileOverlay />
      
      <div className={`fixed top-0 left-0 h-full z-40 transform transition-transform duration-300 ease-in-out md:hidden ${
        mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent isMobile />
      </div>

      <div className="hidden md:flex">
        <SidebarContent />
      </div>
    </>
  );
}