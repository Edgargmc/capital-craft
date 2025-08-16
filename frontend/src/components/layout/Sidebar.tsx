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
  X,
  Bell
} from 'lucide-react';

import { useNavigation } from '@/hooks/useNavigation';
import { useTheme } from '@/lib/hooks/useTheme';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  useThemeSystem?: boolean; // ✅ MIGRATED: Default to theme system (true)
}

const navigation = [
  { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
  { id: 'portfolio', name: 'Portfolio', icon: PieChart },
  { id: 'stock-search', name: 'Stock Search', icon: Search },
  { id: 'learn', name: 'Learn', icon: BookOpen },
  { id: 'achievements', name: 'Achievements', icon: Trophy },
  { id: 'analytics', name: 'Analytics', icon: BarChart3 },
];

const secondaryNavigation = [
  { id: 'settings', name: 'Settings', icon: Settings },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'feedback', name: 'Give Feedback', icon: MessageSquare },
];

export function Sidebar({ activeTab, onTabChange, useThemeSystem = true }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const nav = useNavigation();
  const theme = useTheme();

  const handleTabChange = (tabId: string, href?: string) => {
    // Navigate to dedicated pages for each section
    switch (tabId) {
      case 'dashboard':
        nav.goToDashboard();
        break;
      case 'portfolio':
        nav.goToPortfolio();
        break;
      case 'stock-search':
        nav.legacyPush('/stock-search');
        break;
      case 'learn':
        nav.legacyPush('/learn');
        break;
      case 'achievements':
        nav.legacyPush('/achievements');
        break;
      case 'analytics':
        nav.legacyPush('/analytics');
        break;
      case 'settings':
        nav.legacyPush('/settings');
        break;
      case 'notifications':
        nav.legacyPush('/notifications');
        break;
      default:
        nav.legacyPush('/');
    }
    
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  const MobileMenuButton = () => {
    const buttonStyles = useThemeSystem
      ? theme.combine(
          'fixed top-4 left-4 z-50 p-2 rounded-lg md:hidden',
          'bg-gray-900 text-white shadow-lg',
          theme.transition('base'),
          mobileMenuOpen ? 'rotate-90' : ''
        )
      : `fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-900 text-white shadow-lg md:hidden transition-transform ${
          mobileMenuOpen ? 'rotate-90' : ''
        }`;

    return (
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className={buttonStyles}
      >
        {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        {/* Debug indicator */}
        {process.env.NODE_ENV === 'development' && (
          <span className="absolute -top-2 -right-2 text-[8px] bg-blue-500 text-white rounded px-1">
            {useThemeSystem ? '🌟' : '🔄'}
          </span>
        )}
      </button>
    );
  };

  const MobileOverlay = () => (
    mobileMenuOpen ? (
      <div 
        className="fixed inset-0 z-30 md:hidden"
        style={{ backgroundColor: '#000000a6' }}
        onClick={() => setMobileMenuOpen(false)}
      />
    ) : null
  );


  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => {
    const sidebarStyles = useThemeSystem
      ? theme.combine(
          theme.navigation.sidebar(),
          isMobile ? 'w-80' : collapsed ? 'w-16' : 'w-64'
        )
      : `bg-gray-900 text-white flex flex-col h-full ${
          isMobile ? 'w-80' : collapsed ? 'w-16' : 'w-64'
        } transition-all duration-300`;

    return (
    <div className={sidebarStyles}>
      <div className={useThemeSystem
        ? theme.combine(theme.navigation.header())
        : 'p-4 border-b border-gray-700'
      }>
        <div className="flex items-center justify-between">
          {(!collapsed || isMobile) && (
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold">Capital Craft</span>
              {/* Debug indicator */}
              {process.env.NODE_ENV === 'development' && (
                <span className="text-[8px] bg-blue-500 text-white rounded px-1">
                  {useThemeSystem ? '🌟' : '🔄'}
                </span>
              )}
            </div>
          )}
          {!isMobile && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={useThemeSystem
                ? theme.combine(theme.navigation.collapseButton())
                : 'p-1 rounded hover:bg-gray-800 transition-colors'
              }
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
              className={useThemeSystem
                ? theme.combine(
                    theme.navigation.item(),
                    isActive 
                      ? theme.navigation.itemActive()
                      : theme.navigation.itemInactive()
                  )
                : `w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
              }
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
              className={useThemeSystem
                ? theme.combine(
                    theme.navigation.item(),
                    isActive 
                      ? theme.navigation.itemActive()
                      : theme.navigation.itemInactive()
                  )
                : `w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-blue-600 text-white' 
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`
              }
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
  };

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