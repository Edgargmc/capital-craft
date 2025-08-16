/**
 * DebugQuickStats - Portfolio stats component using theme system by default
 * ✅ MIGRATED: Now uses theme system as default behavior (useThemeSystem=true)
 * Step by step reconstruction to find the exact cause
 */

import React from 'react';
import { DollarSign, Wallet, TrendingUp, PieChart } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface DebugStats {
  totalValue?: number;
  cashBalance?: number;
  holdingsCount?: number;
  totalPnL?: number;
}

interface DebugQuickStatsProps {
  stats: DebugStats;
  useThemeSystem?: boolean;
}

export const DebugQuickStats: React.FC<DebugQuickStatsProps> = ({ 
  stats, 
  useThemeSystem = true // 🌟 DEFAULT TO THEME SYSTEM 
}) => {
  const theme = useTheme();
  // Simple currency formatter
  const formatCurrency = (value?: number): string => {
    if (!value) return '$0.00';
    return `$${value.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  // Static stat cards data
  const statCards = [
    {
      title: 'Total Portfolio Value',
      value: formatCurrency(stats.totalValue),
      icon: <DollarSign className="w-5 h-5" />
    },
    {
      title: 'Cash Balance',
      value: formatCurrency(stats.cashBalance),
      icon: <Wallet className="w-5 h-5" />
    },
    {
      title: 'Holdings',
      value: stats.holdingsCount || 0,
      icon: <PieChart className="w-5 h-5" />
    },
    {
      title: 'Total P&L',
      value: formatCurrency(stats.totalPnL),
      icon: <TrendingUp className="w-5 h-5" />
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((card, index) => {
        const cardStyles = useThemeSystem
          ? theme.combine(theme.card('interactive'), 'p-6')
          : 'bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-200';

        return (
          <div 
            key={index}
            className={cardStyles}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-600">{card.title}</h3>
              <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                {card.icon}
              </div>
            </div>
            
            <div className="text-2xl font-bold text-gray-900">
              {card.value}
            </div>
            
            {/* Debug indicator */}
            <div className="mt-2 text-xs text-gray-400">
              {useThemeSystem ? '🌟 Theme (Default)' : '🔄 Legacy Mode'}
            </div>
          </div>
        );
      })}
    </div>
  );
};