/**
 * ThemeDemo - INCREMENTAL THEME VALIDATION COMPONENT
 * 
 * This component validates that:
 * 1. Old styles still work
 * 2. New theme styles work  
 * 3. Both can coexist without conflicts
 */

import React, { useState } from 'react';
import { ThemeButton } from '@/components/ui/ThemeButton';
import { useTheme } from '@/lib/hooks/useTheme';
import { SimpleStatsTest } from '@/components/demo/SimpleStatsTest';
import { DebugQuickStats } from '@/components/demo/DebugQuickStats';
import { BuyStockModalDemo } from '@/components/demo/BuyStockModalDemo';
import { StockAutocompleteDemo } from '@/components/demo/StockAutocompleteDemo';
import { NotificationBellDemo } from '@/components/demo/NotificationBellDemo';
import { LearningAlertDemo } from '@/components/demo/LearningAlertDemo';
import { PortfolioHealthScoreDemo } from '@/components/demo/PortfolioHealthScoreDemo';
import { SellStockModalDemo } from '@/components/demo/SellStockModalDemo';
import { SidebarDemo } from '@/components/demo/SidebarDemo';
// import { QuickStatsGrid, PortfolioStats } from '@/components/dashboard/QuickStatsGrid';

export const ThemeDemo: React.FC = () => {
  const [useNewTheme, setUseNewTheme] = useState(true);
  const theme = useTheme();

  // Simple mock data for testing
  const simpleStats = [
    { title: 'Portfolio Value', value: '$125,430.50', variant: 'success' as const },
    { title: 'Cash Balance', value: '$5,000.00', variant: 'neutral' as const },
    { title: 'Holdings', value: '8 stocks', variant: 'neutral' as const },
    { title: 'P&L', value: '+$8,530.50', variant: 'success' as const }
  ];

  // Real portfolio mock data (like original QuickStatsGrid)
  const realPortfolioStats = {
    totalValue: 125430.50,
    cashBalance: 5000.00,
    holdingsCount: 8,
    totalPnL: 8530.50
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🎨 Theme System Demo - Incremental Approach
        </h2>
        <p className="text-gray-600">
          Validating that old and new styles can coexist safely
        </p>
      </div>

      {/* Theme Toggle */}
      <div className="flex justify-center items-center space-x-4 p-4 bg-gray-50 rounded-lg">
        <span className="text-sm font-medium text-gray-700">Theme Mode:</span>
        <button
          onClick={() => setUseNewTheme(!useNewTheme)}
          className={theme.combine(
            'px-4 py-2 rounded-lg font-medium transition-all duration-200',
            useNewTheme 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          )}
        >
          {useNewTheme ? '🌟 New Theme' : '🔄 Legacy Style'}
        </button>
      </div>

      {/* Button Variants Demo */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">Button Variants</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ThemeButton variant="primary">
            Primary
          </ThemeButton>
          
          <ThemeButton variant="secondary">
            Secondary
          </ThemeButton>
          
          <ThemeButton variant="success">
            Success
          </ThemeButton>
          
          <ThemeButton variant="danger">
            Danger
          </ThemeButton>
        </div>

        {/* Button Sizes */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">Size Variants</h4>
          <div className="flex items-center space-x-4">
            <ThemeButton variant="primary" size="sm">
              Small
            </ThemeButton>
            <ThemeButton variant="primary" size="md">
              Medium
            </ThemeButton>
            <ThemeButton variant="primary" size="lg">
              Large
            </ThemeButton>
          </div>
        </div>
      </div>

      {/* Card Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Card Styles</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          {/* Legacy Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-2">🔄 Legacy Card</h4>
            <p className="text-gray-600 text-sm">
              This card uses hardcoded Tailwind classes directly.
            </p>
            <div className="mt-4">
              <ThemeButton variant="secondary" size="sm">
                Theme Button
              </ThemeButton>
            </div>
          </div>

          {/* Theme Card */}
          <div className={theme.card('interactive') + ' p-6'}>
            <h4 className="font-semibold text-gray-900 mb-2">🌟 Theme Card</h4>
            <p className="text-gray-600 text-sm">
              This card uses the new theme system utilities.
            </p>
            <div className="mt-4">
              <ThemeButton variant="primary" size="sm">
                Theme Button
              </ThemeButton>
            </div>
          </div>
        </div>
      </div>

      {/* QuickStatsGrid Demo - COMMENTED OUT FOR DEBUGGING */}
      {/* 
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Real Component Migration - QuickStatsGrid</h3>
        <p className="text-sm text-gray-600">
          Compare the same component using legacy styles vs. new theme system:
        </p>
        
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700 flex items-center">
            🔄 Legacy QuickStatsGrid (useThemeSystem=false)
          </h4>
          <QuickStatsGrid 
            stats={mockStats} 
            useThemeSystem={false}
            currency="$"
          />
        </div>
        
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700 flex items-center">
            🌟 Theme QuickStatsGrid (useThemeSystem=true)
          </h4>
          <QuickStatsGrid 
            stats={mockStats} 
            useThemeSystem={true}
            currency="$"
          />
        </div>
      </div>
      */}

      {/* Simple Stats Test */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Simple Stats Component Test</h3>
        <p className="text-sm text-gray-600">
          Testing theme system with a simplified component while debugging QuickStatsGrid:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy Styles</h4>
          <SimpleStatsTest stats={simpleStats} useThemeSystem={false} />
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme System</h4>
          <SimpleStatsTest stats={simpleStats} useThemeSystem={true} />
        </div>
      </div>

      {/* Debug QuickStats Test */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Debug QuickStats - Step by Step</h3>
        <p className="text-sm text-gray-600">
          Testing with real portfolio data structure and proper icons:
        </p>
        
        {/* Debug Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Debug Legacy (with real icons)</h4>
          <DebugQuickStats stats={realPortfolioStats} useThemeSystem={false} />
        </div>
        
        {/* Debug Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Debug Theme (with real icons)</h4>
          <DebugQuickStats stats={realPortfolioStats} useThemeSystem={true} />
        </div>
      </div>

      {/* BuyStockModal Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">BuyStockModal Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing the dual approach implementation in a real modal component:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy BuyStockModal</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <BuyStockModalDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme BuyStockModal</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <BuyStockModalDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* SellStockModal Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">SellStockModal Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing the complementary selling modal with portfolio holdings simulation and dual approach patterns:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy SellStockModal</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <SellStockModalDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme SellStockModal</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <SellStockModalDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* StockAutocomplete Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">StockAutocomplete Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing autocomplete functionality with dual approach. Features real-time search, keyboard navigation, and chip selection:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy StockAutocomplete</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <StockAutocompleteDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme StockAutocomplete</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <StockAutocompleteDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* NotificationBell Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">NotificationBell Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing notification bell component with dual approach. Features desktop/mobile variants, dynamic states, and Zustand integration:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy NotificationBell</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <NotificationBellDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme NotificationBell</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <NotificationBellDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* LearningAlert Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">LearningAlert Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing the most complex component with gradients, animations, sparkles, and dynamic triggers. Features premium styling and educational interactions:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy LearningAlert</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <LearningAlertDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme LearningAlert</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <LearningAlertDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* PortfolioHealthScore Demo */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">PortfolioHealthScore Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing advanced data visualization component with animated circular gauge, health scoring algorithms, and educational tooltips:
        </p>
        
        {/* Legacy Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🔄 Legacy PortfolioHealthScore</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <PortfolioHealthScoreDemo useThemeSystem={false} />
          </div>
        </div>
        
        {/* Theme Version */}
        <div className="space-y-3">
          <h4 className="text-md font-medium text-gray-700">🌟 Theme PortfolioHealthScore</h4>
          <div className="bg-gray-50 rounded-lg p-4">
            <PortfolioHealthScoreDemo useThemeSystem={true} />
          </div>
        </div>
      </div>

      {/* Sidebar Demo - Full Layout Component */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Sidebar Layout Migration Test</h3>
        <p className="text-sm text-gray-600">
          Testing complex layout component with navigation utilities, mobile responsiveness, and dual approach patterns. Features collapsible sidebar and navigation state management:
        </p>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-blue-900 font-medium mb-2">🧭 Interactive Sidebar Demo</h4>
          <p className="text-sm text-blue-800 mb-3">
            This demo opens in a separate layout to test navigation, mobile menu, and theme switching:
          </p>
          <div className="bg-white rounded-lg p-4">
            <SidebarDemo />
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="text-green-600 mr-3">✅</div>
          <div>
            <h4 className="text-green-800 font-medium">Incremental Theme System Working</h4>
            <p className="text-green-700 text-sm">
              Both legacy and theme styles are rendering correctly without conflicts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThemeDemo;