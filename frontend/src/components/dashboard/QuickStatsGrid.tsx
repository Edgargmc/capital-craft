/**
 * QuickStatsGrid Component
 * 
 * @description Clean Architecture Component for displaying portfolio statistics
 * @responsibility Single: Display key portfolio metrics in grid layout
 * @principle Single Responsibility + Interface Segregation + DRY
 * 
 * @layer Presentation Layer (UI Component)
 * @pattern Component Composition + Props Interface
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 */

import React from 'react';
import { 
  DollarSign, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  PieChart,
  AlertCircle
} from 'lucide-react';

/**
 * Portfolio Statistics Interface
 * @principle Interface Segregation - Only data this component needs
 */
export interface PortfolioStats {
  totalValue?: number;
  cashBalance?: number;
  holdingsCount?: number;
  totalPnL?: number;
  totalPnLPercent?: number;
}

/**
 * QuickStatsGrid Props Interface
 * @principle Dependency Inversion - Component depends on abstraction, not concretions
 */
export interface QuickStatsGridProps {
  stats: PortfolioStats;
  loading?: boolean;
  currency?: string;
}

/**
 * Individual Stat Card Interface
 * @principle Interface Segregation - Focused interface for each stat
 */
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    isPositive: boolean;
  };
  loading?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * StatCard Component
 * @responsibility Single: Display individual statistic with consistent styling
 * @principle Open/Closed: Easy to extend with new variants
 */
function StatCard({ 
  title, 
  value, 
  icon, 
  change, 
  loading = false,
  variant = 'default' 
}: StatCardProps) {
  
  // 🎨 Business Logic: Determine card styling based on variant
  const getVariantStyles = () => {
    const variants = {
      default: 'border-gray-200 bg-white',
      success: 'border-green-200 bg-green-50',
      warning: 'border-yellow-200 bg-yellow-50', 
      danger: 'border-red-200 bg-red-50'
    };
    return variants[variant];
  };

  const getIconColor = () => {
    const colors = {
      default: 'text-gray-600',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };
    return colors[variant];
  };

  if (loading) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 bg-white animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className={`border rounded-xl p-6 transition-all duration-200 hover:shadow-md ${getVariantStyles()}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-lg bg-gray-100 ${getIconColor()}`}>
          {icon}
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-2xl font-bold text-gray-900">
          {value}
        </div>
      </div>
      
      {change && (
        <div className={`flex items-center text-sm ${
          change.isPositive ? 'text-green-600' : 'text-red-600'
        }`}>
          {change.isPositive ? (
            <TrendingUp className="w-4 h-4 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 mr-1" />
          )}
          <span>
            {change.isPositive ? '+' : ''}{change.value}%
          </span>
        </div>
      )}
    </div>
  );
}

/**
 * QuickStatsGrid Main Component
 * @description Displays portfolio statistics in responsive grid
 * @principle Single Responsibility: Only handles stats display
 */
export function QuickStatsGrid({ 
  stats, 
  loading = false, 
  currency = '$' 
}: QuickStatsGridProps) {
  
  // 🔧 Business Logic: Format currency values
  const formatCurrency = (value?: number): string => {
    if (value === undefined || value === null) return `${currency}0.00`;
    return `${currency}${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // 🔧 Business Logic: Format percentage
  const formatPercentage = (value?: number): string => {
    if (value === undefined || value === null) return '0.00%';
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // 🔧 Business Logic: Determine P&L variant
  const getPnLVariant = (pnl?: number): 'success' | 'danger' | 'default' => {
    if (pnl === undefined || pnl === null) return 'default';
    if (pnl > 0) return 'success';
    if (pnl < 0) return 'danger';
    return 'default';
  };

  // 🔧 Business Logic: Check if user has portfolio
  const hasPortfolio = (stats.totalValue ?? 0) > 0 || (stats.holdingsCount ?? 0) > 0;

  // 📊 Data Transformation: Prepare stat cards data
  const statCards = [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(stats.totalValue),
      icon: <DollarSign className="w-5 h-5" />,
      variant: 'default' as const
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(stats.cashBalance),
      icon: <Wallet className="w-5 h-5" />,
      variant: 'default' as const
    },
    {
      title: 'Holdings',
      value: stats.holdingsCount ?? 0,
      icon: <PieChart className="w-5 h-5" />,
      variant: 'default' as const
    },
    {
      title: 'Total P&L',
      value: formatCurrency(stats.totalPnL),
      icon: stats.totalPnL && stats.totalPnL >= 0 ? 
        <TrendingUp className="w-5 h-5" /> : 
        <TrendingDown className="w-5 h-5" />,
      change: stats.totalPnLPercent ? {
        value: stats.totalPnLPercent,
        isPositive: stats.totalPnLPercent >= 0
      } : undefined,
      variant: getPnLVariant(stats.totalPnL)
    }
  ];

  // 🚨 Empty State: No portfolio data
  if (!loading && !hasPortfolio) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="col-span-full">
          <div className="border border-yellow-200 rounded-xl p-6 bg-yellow-50">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-yellow-600 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  No Portfolio Data
                </h3>
                <p className="text-sm text-yellow-700">
                  Start investing to see your portfolio statistics here
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => (
        <StatCard
          key={index}
          title={card.title}
          value={card.value}
          icon={card.icon}
          change={card.change}
          variant={card.variant}
          loading={loading}
        />
      ))}
    </div>
  );
}

/**
 * Component Export
 * @pattern Named Export for better tree-shaking
 */
export default QuickStatsGrid;