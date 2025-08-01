'use client';

import { DollarSign, TrendingUp, TrendingDown, PieChart } from 'lucide-react';

interface HeaderProps {
  summary: {
    cashBalance: number;
    totalPortfolioValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    holdingsCount: number;
  } | null;
  loading: boolean;
  onBuyClick: () => void;
  onSellClick: () => void;
}

export function Header({ summary, loading, onBuyClick, onSellClick }: HeaderProps) {
  if (loading || !summary) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="animate-pulse">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div className="flex space-x-2">
              <div className="h-8 bg-gray-200 rounded w-20"></div>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isProfitable = summary.totalUnrealizedPnl >= 0;

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-4">
      {/* Mobile Layout: Stack vertically */}
      <div className="flex flex-col space-y-4 md:hidden">
        {/* Portfolio Summary - Mobile Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <p className="text-xs text-gray-500">Cash</p>
              <p className="text-sm font-semibold text-gray-900">
                ${summary.cashBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <PieChart className="h-4 w-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Total</p>
              <p className="text-sm font-semibold text-gray-900">
                ${summary.totalPortfolioValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isProfitable ? (
              <TrendingUp className="h-4 w-4 text-green-600" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-600" />
            )}
            <div>
              <p className="text-xs text-gray-500">P&L</p>
              <div className="flex items-center space-x-1">
                <p className={`text-sm font-semibold ${
                  isProfitable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isProfitable ? '+' : ''}${Math.abs(summary.totalUnrealizedPnl).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </p>
                <span className={`text-xs ${
                  isProfitable ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({isProfitable ? '+' : ''}{summary.totalUnrealizedPnlPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-500">Holdings</p>
              <p className="text-sm font-semibold text-gray-900">{summary.holdingsCount}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Mobile Full Width */}
        <div className="flex space-x-3">
          <button 
            onClick={onBuyClick}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
          >
            Buy Stock
          </button>
          <button 
            onClick={onSellClick}
            className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            Sell Stock
          </button>
        </div>
      </div>

      {/* Desktop Layout: Original horizontal layout */}
      <div className="hidden md:flex md:items-center md:justify-between">
        {/* Left side - Portfolio Summary */}
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Cash Balance</p>
              <p className="text-lg font-semibold text-gray-900">
                ${summary.cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-sm text-gray-500">Total Value</p>
              <p className="text-lg font-semibold text-gray-900">
                ${summary.totalPortfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {isProfitable ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <div>
              <p className="text-sm text-gray-500">Total P&L</p>
              <div className="flex items-center space-x-2">
                <p className={`text-lg font-semibold ${
                  isProfitable ? 'text-green-600' : 'text-red-600'
                }`}>
                  {isProfitable ? '+' : ''}${summary.totalUnrealizedPnl.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className={`text-sm font-medium ${
                  isProfitable ? 'text-green-600' : 'text-red-600'
                }`}>
                  ({isProfitable ? '+' : ''}{summary.totalUnrealizedPnlPercent.toFixed(2)}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Quick Actions */}
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="text-sm text-gray-500">Holdings</p>
            <p className="text-lg font-semibold text-gray-900">{summary.holdingsCount}</p>
          </div>
          
          <div className="flex space-x-2">
            <button 
              onClick={onBuyClick}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              Buy Stock
            </button>
            <button 
              onClick={onSellClick}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Sell Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}