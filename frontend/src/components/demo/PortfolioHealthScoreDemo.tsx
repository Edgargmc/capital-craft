/**
 * PortfolioHealthScoreDemo - Test component for PortfolioHealthScore with dual approach
 * Demonstrates complex data visualization, animations, and educational tooltips
 */

import React, { useState } from 'react';
import PortfolioHealthScore from '@/components/portfolio/PortfolioHealthScore';

interface PortfolioHealthScoreDemoProps {
  useThemeSystem?: boolean;
}

export const PortfolioHealthScoreDemo: React.FC<PortfolioHealthScoreDemoProps> = ({ 
  useThemeSystem = false 
}) => {
  const [scenario, setScenario] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [isLoading, setIsLoading] = useState(false);

  // Mock data scenarios for different health scores
  const getScenarioData = (scenario: string) => {
    switch (scenario) {
      case 'excellent':
        return {
          holdings: {
            'AAPL': { symbol: 'AAPL', shares: 50, price: 150 },
            'MSFT': { symbol: 'MSFT', shares: 30, price: 300 },
            'GOOGL': { symbol: 'GOOGL', shares: 20, price: 2500 },
            'AMZN': { symbol: 'AMZN', shares: 15, price: 3000 },
            'TSLA': { symbol: 'TSLA', shares: 25, price: 200 },
            'META': { symbol: 'META', shares: 40, price: 300 },
            'NVDA': { symbol: 'NVDA', shares: 10, price: 500 },
            'JPM': { symbol: 'JPM', shares: 60, price: 150 }
          },
          cashBalance: 12000,
          totalPortfolioValue: 120000,
          totalPnl: 18000,
          investedAmount: 102000
        };
      case 'good':
        return {
          holdings: {
            'AAPL': { symbol: 'AAPL', shares: 100, price: 150 },
            'MSFT': { symbol: 'MSFT', shares: 50, price: 300 },
            'GOOGL': { symbol: 'GOOGL', shares: 20, price: 2500 },
            'TSLA': { symbol: 'TSLA', shares: 50, price: 200 },
            'META': { symbol: 'META', shares: 30, price: 300 }
          },
          cashBalance: 8000,
          totalPortfolioValue: 100000,
          totalPnl: 8000,
          investedAmount: 84000
        };
      case 'fair':
        return {
          holdings: {
            'AAPL': { symbol: 'AAPL', shares: 200, price: 150 },
            'TSLA': { symbol: 'TSLA', shares: 100, price: 200 },
            'CRYPTO': { symbol: 'BTC', shares: 2, price: 45000 }
          },
          cashBalance: 2000,
          totalPortfolioValue: 122000,
          totalPnl: -5000,
          investedAmount: 125000
        };
      case 'poor':
        return {
          holdings: {
            'MEME_STOCK': { symbol: 'GME', shares: 500, price: 20 }
          },
          cashBalance: 50000,
          totalPortfolioValue: 60000,
          totalPnl: -15000,
          investedAmount: 25000
        };
      default:
        return getScenarioData('good');
    }
  };

  const currentData = getScenarioData(scenario);

  const handleLoadingTest = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 3000);
  };

  const getScenarioDescription = (scenario: string) => {
    switch (scenario) {
      case 'excellent': return '8 holdings, 10% cash, +18% return';
      case 'good': return '5 holdings, 8% cash, +10% return';
      case 'fair': return '3 holdings, 1.6% cash, -4% return';
      case 'poor': return '1 holding, 83% cash, -60% return';
      default: return '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700">
          {useThemeSystem ? '🌟 Theme System' : '🔄 Legacy Styles'}
        </h4>
        <div className="text-xs text-gray-500">
          Interactive Health Score
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Portfolio Scenario:
          </label>
          <select
            value={scenario}
            onChange={(e) => setScenario(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="excellent">Excellent Health (80-100)</option>
            <option value="good">Good Health (60-79)</option>
            <option value="fair">Fair Health (40-59)</option>
            <option value="poor">Poor Health (0-39)</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            {getScenarioDescription(scenario)}
          </div>
        </div>

        <button
          onClick={handleLoadingTest}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Test Loading State'}
        </button>
      </div>

      {/* Portfolio Health Score Component */}
      <div className="flex justify-center">
        <div className="w-full max-w-sm">
          <PortfolioHealthScore
            holdings={currentData.holdings}
            cashBalance={currentData.cashBalance}
            totalPortfolioValue={currentData.totalPortfolioValue}
            totalPnl={currentData.totalPnl}
            investedAmount={currentData.investedAmount}
            loading={isLoading}
            useThemeSystem={useThemeSystem}
          />
        </div>
      </div>

      {/* Data Summary */}
      <div className="text-xs text-gray-500 space-y-1 bg-gray-50 rounded-lg p-3">
        <div><strong>Holdings:</strong> {Object.keys(currentData.holdings).length} stocks</div>
        <div><strong>Total Value:</strong> ${currentData.totalPortfolioValue.toLocaleString()}</div>
        <div><strong>Cash:</strong> ${currentData.cashBalance.toLocaleString()} ({((currentData.cashBalance / currentData.totalPortfolioValue) * 100).toFixed(1)}%)</div>
        <div><strong>P&L:</strong> ${currentData.totalPnl.toLocaleString()} ({((currentData.totalPnl / currentData.investedAmount) * 100).toFixed(1)}%)</div>
        <div className="text-blue-600 pt-1">
          💡 Features: Animated circular gauge, health level badges, educational tooltip, and factor breakdown
        </div>
      </div>
    </div>
  );
};