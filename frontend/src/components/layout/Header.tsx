// src/components/layout/Header.tsx
'use client';

import { DollarSign, TrendingUp, TrendingDown, PieChart, Shield, Scale, Flame, Bell } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';
import { NotificationBell } from './NotificationBell';

// Portfolio Risk Calculator (from previous component)
interface Holding {
  symbol: string;
  shares: number;
  current_value: number;
  beta?: number;
}

interface PortfolioRisk {
  level: 'conservative' | 'balanced' | 'aggressive' | 'not-rated';
  avgBeta: number | null;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

class PortfolioRiskCalculator {
  static calculate(holdings: Record<string, Holding>): PortfolioRisk {
    const holdingsArray = Object.values(holdings);
    
    if (holdingsArray.length === 0) {
      return {
        level: 'not-rated',
        avgBeta: null,
        label: 'Not Rated',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: Scale,
        description: 'Add stocks to see portfolio risk assessment'
      };
    }

    let totalValue = 0;
    let weightedBetaSum = 0;

    holdingsArray.forEach(holding => {
      const value = holding.current_value;
      totalValue += value;
      const beta = holding.beta ?? 1.0;
      weightedBetaSum += beta * value;
    });

    const avgBeta = totalValue > 0 ? weightedBetaSum / totalValue : 1.0;

    if (avgBeta < 1.0) {
      return {
        level: 'conservative',
        avgBeta,
        label: 'Conservative',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: Shield,
        description: 'Lower risk than market average. More stable, less volatile returns.'
      };
    } else if (avgBeta <= 1.3) {
      return {
        level: 'balanced',
        avgBeta,
        label: 'Balanced',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: Scale,
        description: 'Moderate risk similar to market. Balanced volatility and growth potential.'
      };
    } else {
      return {
        level: 'aggressive',
        avgBeta,
        label: 'Aggressive',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: Flame,
        description: 'Higher risk than market. More volatile but potential for higher returns.'
      };
    }
  }
}

// Portfolio Risk Badge Component
interface PortfolioRiskBadgeProps {
  holdings: Record<string, { symbol: string; shares: number; current_value: number; beta?: number }>;
}

const PortfolioRiskBadge: React.FC<PortfolioRiskBadgeProps> = ({ holdings }) => {
  const risk = PortfolioRiskCalculator.calculate(holdings);
  const Icon = risk.icon;

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${risk.color} ${risk.bgColor} transition-colors duration-200`}>
        <Icon className="h-3 w-3 mr-1" />
        <span className="hidden sm:inline">{risk.label}</span>
        <span className="sm:hidden">{risk.label.slice(0, 4)}</span>
        {risk.avgBeta && (
          <span className="ml-1 text-xs opacity-75 hidden md:inline">
            β{risk.avgBeta.toFixed(2)}
          </span>
        )}
      </div>
      
      {/* Educational Tooltip */}
      <div className="relative group hidden lg:block">
        <div className="cursor-help text-gray-400 hover:text-gray-600">
          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60]">
          <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-64 text-sm">
            <div className="font-medium text-blue-300 mb-1">Portfolio Risk Level</div>
            <p className="text-gray-300 text-xs leading-relaxed">{risk.description}</p>
            {risk.avgBeta && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-xs text-yellow-300">
                  💡 Beta {risk.avgBeta.toFixed(2)} vs Market Beta 1.0
                </span>
              </div>
            )}
            
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Updated Header Props
interface HeaderProps {
  summary: {
    cashBalance: number;
    totalPortfolioValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    holdingsCount: number;
    holdings: Record<string, { symbol: string; shares: number; current_value: number; beta?: number }>;
  } | null;
  loading: boolean;
  onBuyClick: () => void;
  onSellClick: () => void;
  userId?: string; // NEW: Added userId prop
}

export function Header({ summary, loading, onBuyClick, onSellClick, userId = 'demo' }: HeaderProps) {
  const [showMobileNotifications, setShowMobileNotifications] = useState(false);
  const [showDesktopNotifications, setShowDesktopNotifications] = useState(false);
  const { fetchNotifications } = useNotificationStore();

  // Single fetch logic for all notification bells
  useEffect(() => {
    if (userId) {
      // Initial fetch
      fetchNotifications(userId);

      // Poll every 30 seconds  
      const interval = setInterval(() => {
        fetchNotifications(userId);
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [userId, fetchNotifications]);

  if (loading || !summary) {
    return (
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="animate-pulse">
          <div className="flex flex-col space-y-3 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div className="flex space-x-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded w-20"></div>
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

        {/* Risk Badge and Notifications - Mobile */}
        <div className="flex justify-between items-center">
          <PortfolioRiskBadge holdings={summary.holdings || {}} />
          <div className="relative">
            <NotificationBell 
              userId={userId}
              onClick={() => {
                console.log('🔔 Mobile NotificationBell clicked, current showMobileNotifications:', showMobileNotifications);
                setShowMobileNotifications(!showMobileNotifications);
              }}
            />
            {showMobileNotifications && (
              <>
                {console.log('📋 Rendering NotificationDropdown (mobile)')}
                <NotificationDropdown 
                  onClose={() => setShowMobileNotifications(false)}
                  userId={userId}
                />
              </>
            )}
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

          {/* Risk Badge - Desktop */}
          <PortfolioRiskBadge holdings={summary.holdings || {}} />
        </div>

        {/* Right side - Quick Actions + Notifications */}
        <div className="flex items-center space-x-3">
          {/* Notification Bell - Desktop */}

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
          <div className="relative">
            <NotificationBell 
              userId={userId}
              onClick={() => {
                console.log('🔔 Desktop NotificationBell clicked, current showDesktopNotifications:', showDesktopNotifications);
                setShowDesktopNotifications(!showDesktopNotifications);
              }}
            />
            {showDesktopNotifications && (
              <>
                {console.log('📋 Rendering NotificationDropdown (desktop)')}
                <NotificationDropdown 
                  onClose={() => setShowDesktopNotifications(false)}
                  userId={userId}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}