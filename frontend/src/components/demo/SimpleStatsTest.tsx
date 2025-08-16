/**
 * SimpleStatsTest - Simplified component to test theme system
 * This is a minimal version to isolate the JSON parsing issue
 */

import React from 'react';
import { useTheme } from '@/lib/hooks/useTheme';

interface SimpleStats {
  title: string;
  value: string;
  variant?: 'success' | 'warning' | 'error' | 'neutral';
}

interface SimpleStatsTestProps {
  stats: SimpleStats[];
  useThemeSystem?: boolean;
}

export const SimpleStatsTest: React.FC<SimpleStatsTestProps> = ({ 
  stats, 
  useThemeSystem = false 
}) => {
  const theme = useTheme();

  return (
    <div className="grid grid-cols-2 gap-4">
      {stats.map((stat, index) => {
        const cardStyles = useThemeSystem 
          ? theme.card('interactive') + ' p-4'
          : 'bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all duration-200';

        const badgeStyles = useThemeSystem && stat.variant
          ? theme.badge(stat.variant)
          : 'bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs';

        return (
          <div key={index} className={cardStyles}>
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">{stat.title}</h4>
              <span className={badgeStyles}>
                {useThemeSystem ? '🌟' : '🔄'}
              </span>
            </div>
            <div className="mt-2 text-xl font-bold text-gray-800">
              {stat.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};