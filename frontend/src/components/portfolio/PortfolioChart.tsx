// src/components/portfolio/PortfolioChart.tsx
'use client';

import { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';

interface PortfolioChartProps {
  cashBalance: number;
  totalPortfolioValue: number;
  loading?: boolean;
}

export function PortfolioChart({ cashBalance, totalPortfolioValue, loading }: PortfolioChartProps) {
  const [animatedCashPercentage, setAnimatedCashPercentage] = useState(0);
  const [animatedStocksPercentage, setAnimatedStocksPercentage] = useState(0);

  const stocksValue = totalPortfolioValue - cashBalance;
  const cashPercentage = totalPortfolioValue > 0 ? (cashBalance / totalPortfolioValue) * 100 : 0;
  const stocksPercentage = totalPortfolioValue > 0 ? (stocksValue / totalPortfolioValue) * 100 : 0;

  // Animate percentages
  useEffect(() => {
    if (loading) return;
    
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedCashPercentage(cashPercentage * progress);
      setAnimatedStocksPercentage(stocksPercentage * progress);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedCashPercentage(cashPercentage);
        setAnimatedStocksPercentage(stocksPercentage);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [cashPercentage, stocksPercentage, loading]);

  // SVG donut chart calculations
  const size = 160;
  const strokeWidth = 16;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  const cashOffset = circumference - (animatedCashPercentage / 100) * circumference;
  const stocksOffset = circumference - (animatedStocksPercentage / 100) * circumference;

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
        {/* Shine effect */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse">
            <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      
      <div className="relative z-10">
        <div className="flex items-center mb-3">
          <PieChart className="h-4 w-4 text-gray-600 mr-2" />
          <h3 className="text-base font-semibold text-gray-900">Portfolio Distribution</h3>
        </div>

        <div className="flex flex-col items-center">
          {/* SVG Donut Chart */}
          <div className="relative">
            <svg width={size} height={size} className="transform -rotate-90">
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#f3f4f6"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              
              {/* Stocks segment */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#10b981"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={stocksOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
              
              {/* Cash segment */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke="#6366f1"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={cashOffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
                transform={`rotate(${(stocksPercentage / 100) * 360} ${size / 2} ${size / 2})`}
              />
            </svg>
            
            {/* Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-lg font-bold text-gray-900">
                ${totalPortfolioValue.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500">Total Value</div>
            </div>
          </div>

          {/* Legend */}
          <div className="mt-4 space-y-2 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-emerald-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Stocks</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  ${stocksValue.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {animatedStocksPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-indigo-500 rounded-full mr-3"></div>
                <span className="text-sm font-medium text-gray-700">Cash</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  ${cashBalance.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500">
                  {animatedCashPercentage.toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PortfolioChart;
