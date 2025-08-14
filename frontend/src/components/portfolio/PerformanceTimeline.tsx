// src/components/portfolio/PerformanceTimeline.tsx
'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface PerformanceTimelineProps {
  loading?: boolean;
}

// Mock data generator for demonstration
const generateMockData = () => {
  const data = [];
  let baseValue = 0;
  
  for (let i = 0; i < 30; i++) {
    // Random walk with slight upward bias
    const change = (Math.random() - 0.45) * 200;
    baseValue += change;
    data.push({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000),
      value: baseValue
    });
  }
  
  return data;
};

export function PerformanceTimeline({ loading }: PerformanceTimelineProps) {
  const [data, setData] = useState<{ date: Date; value: number }[]>([]);
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    // Generate mock data
    const mockData = generateMockData();
    setData(mockData);

    // Animate the line drawing
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedProgress(easedProgress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [loading]);

  if (loading || data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xl animate-pulse">
        <div className="flex items-center justify-between mb-2">
          <div className="w-24 h-3 bg-gray-200 rounded"></div>
          <div className="w-12 h-3 bg-gray-200 rounded"></div>
        </div>
        <div className="w-full h-8 bg-gray-200 rounded"></div>
      </div>
    );
  }

  // Calculate chart dimensions and data
  const chartWidth = 200;
  const chartHeight = 40;
  const padding = 2;
  
  const values = data.map(d => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue || 1;
  
  // Create SVG path
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - minValue) / valueRange) * (chartHeight - padding * 2) - padding;
    return `${x},${y}`;
  }).join(' L ');
  
  const pathData = `M ${points}`;
  
  // Calculate performance metrics
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const totalChange = lastValue - firstValue;
  const isPositive = totalChange >= 0;
  
  // Calculate path length for animation
  const animatedPathLength = animatedProgress * 100;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-3 shadow-xl hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded bg-gray-50 border border-gray-100">
              <Activity className="h-3 w-3 text-gray-600" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-gray-900">30-Day Trend</h3>
            </div>
          </div>
          
          <div className="text-right">
            <div className={`flex items-center gap-1 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? (
                <TrendingUp className="h-2.5 w-2.5" />
              ) : (
                <TrendingDown className="h-2.5 w-2.5" />
              )}
              <span className="text-xs font-medium">
                {isPositive ? '+' : ''}${totalChange.toLocaleString('en-US', { 
                  minimumFractionDigits: 0, 
                  maximumFractionDigits: 0 
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg 
            width="100%" 
            height={chartHeight} 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="overflow-visible"
          >
            {/* Area under curve */}
            <defs>
              <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0.1"/>
                <stop offset="100%" stopColor={isPositive ? "#10b981" : "#ef4444"} stopOpacity="0"/>
              </linearGradient>
            </defs>
            
            <path
              d={`${pathData} L ${chartWidth},${chartHeight} L 0,${chartHeight} Z`}
              fill="url(#areaGradient)"
              style={{
                strokeDasharray: `${animatedPathLength}% ${100 - animatedPathLength}%`,
                transition: 'stroke-dasharray 0.1s ease-out'
              }}
            />
            
            {/* Main line */}
            <path
              d={pathData}
              fill="none"
              stroke={isPositive ? "#10b981" : "#ef4444"}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: `${animatedPathLength}% ${100 - animatedPathLength}%`,
                transition: 'stroke-dasharray 0.1s ease-out'
              }}
            />
            
            {/* End point */}
            {animatedProgress > 0.9 && (
              <circle
                cx={chartWidth}
                cy={chartHeight - ((lastValue - minValue) / valueRange) * (chartHeight - padding * 2) - padding}
                r="1.5"
                fill={isPositive ? "#10b981" : "#ef4444"}
                className="animate-pulse"
              />
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

export default PerformanceTimeline;
