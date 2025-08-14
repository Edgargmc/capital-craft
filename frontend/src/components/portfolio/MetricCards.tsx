// src/components/portfolio/MetricCards.tsx
'use client';

import { TrendingUp, TrendingDown, DollarSign, PieChart, Wallet, HelpCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// Educational content for tooltips
const EDUCATIONAL_CONTENT = {
    pnl: {
      title: "P&L (Ganancias y Pérdidas)",
      explanation: "Muestra cuánto has ganado o perdido en tus inversiones en comparación con lo que pagaste originalmente.",
      interpretation: {
        positive: "Ganancia: Tus acciones valen más de lo que pagaste por ellas",
        negative: "Pérdida: Tus acciones valen menos de lo que pagaste por ellas",
        neutral: "Sin cambios: Tus acciones mantienen su valor original"
      },
      tip: "💡 Consejo: Las pérdidas no son reales hasta que vendes. El mercado fluctúa constantemente."
    }
  };

interface EducationalTooltipProps {
  metric: 'pnl';
  value: number;
  children: React.ReactNode;
}

const EducationalTooltip: React.FC<EducationalTooltipProps> = ({ metric, value, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const content = EDUCATIONAL_CONTENT[metric];
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getInterpretationLevel = (value: number): 'positive' | 'negative' | 'neutral' => {
    if (value > 0) return 'positive';
    if (value < 0) return 'negative';
    return 'neutral';
  };

  const interpretationLevel = getInterpretationLevel(value);
  const currentInterpretation = content.interpretation[interpretationLevel];

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: rect.left + rect.width / 2,
      y: rect.top
    });
    setIsVisible(true);
  };

  // Check if tooltip should appear below instead of above
  const shouldShowBelow = mousePosition.y < 300; // If element is within 300px of top

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
        style={{ position: 'relative', zIndex: 4 }}
      >
        {children}
      </div>

      {isVisible && createPortal(
        <div
          className="fixed z-[5000] pointer-events-none"
          style={{
            top: shouldShowBelow 
              ? `${mousePosition.y + 40}px` 
              : `${mousePosition.y - 10}px`,
            left: `${mousePosition.x}px`,
            transform: shouldShowBelow 
              ? 'translate(-50%, 0%)' 
              : 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-80 min-w-64">
            <h4 className="font-semibold text-sm mb-2 text-blue-300">
              {content.title}
            </h4>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              {content.explanation}
            </p>

            <div className="mb-3 p-2 bg-gray-800 rounded border-l-2 border-blue-400">
              <div className="text-xs font-medium text-blue-300 mb-1">
                Your P&L: ${value.toLocaleString()}
              </div>
              <div className="text-xs text-gray-300">
                {currentInterpretation}
              </div>
            </div>

            <div className="space-y-1 mb-3">
              {Object.entries(content.interpretation).map(([level, text]) => (
                <div
                  key={level}
                  className={`text-xs p-1 rounded ${
                    level === interpretationLevel
                      ? 'bg-blue-900 text-blue-200'
                      : 'text-gray-400'
                  }`}
                >
                  {text}
                </div>
              ))}
            </div>

            <div className="text-xs text-yellow-300 border-t border-gray-700 pt-2">
              {content.tip}
            </div>

            {/* Arrow pointing to the element */}
            <div className={`absolute ${shouldShowBelow ? 'bottom-full' : 'top-full'} left-1/2 transform -translate-x-1/2`}>
              <div className={`w-0 h-0 border-l-4 border-r-4 ${
                shouldShowBelow 
                  ? 'border-b-4 border-transparent border-b-gray-900' 
                  : 'border-t-4 border-transparent border-t-gray-900'
              }`}></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

interface MetricCardsProps {
  cashBalance: number;
  totalPortfolioValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  holdingsCount: number;
  loading?: boolean;
}

interface AnimatedNumberProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
}

const AnimatedNumber: React.FC<AnimatedNumberProps> = ({ 
  value, 
  duration = 1000, 
  decimals = 2, 
  prefix = '', 
  suffix = '' 
}) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const updateValue = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const currentValue = startValue + (difference * easedProgress);
      
      setDisplayValue(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(updateValue);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(updateValue);
  }, [value, duration]);

  return (
    <span>
      {prefix}{displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
      })}{suffix}
    </span>
  );
};

export function MetricCards({ 
  cashBalance, 
  totalPortfolioValue, 
  totalUnrealizedPnl, 
  totalUnrealizedPnlPercent, 
  holdingsCount,
  loading 
}: MetricCardsProps) {
  const [animatedCash, setAnimatedCash] = useState(0);
  const [animatedTotal, setAnimatedTotal] = useState(0);
  const [animatedPnl, setAnimatedPnl] = useState(0);
  const [animatedInvested, setAnimatedInvested] = useState(0);

  const investedAmount = totalPortfolioValue - cashBalance;
  const cashPercentage = totalPortfolioValue > 0 ? (cashBalance / totalPortfolioValue) * 100 : 0;
  const investedPercentage = totalPortfolioValue > 0 ? (investedAmount / totalPortfolioValue) * 100 : 0;

  useEffect(() => {
    if (loading) return;
    
    const duration = 1000;
    const steps = 60;
    const stepDuration = duration / steps;
    
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedCash(cashBalance * progress);
      setAnimatedTotal(totalPortfolioValue * progress);
      setAnimatedPnl(totalUnrealizedPnl * progress);
      setAnimatedInvested(investedAmount * progress);
      
      if (currentStep >= steps) {
        clearInterval(interval);
        setAnimatedCash(cashBalance);
        setAnimatedTotal(totalPortfolioValue);
        setAnimatedPnl(totalUnrealizedPnl);
        setAnimatedInvested(investedAmount);
      }
    }, stepDuration);
    
    return () => clearInterval(interval);
  }, [cashBalance, totalPortfolioValue, totalUnrealizedPnl, investedAmount, loading]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 shadow-xl animate-pulse">
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="w-16 h-4 bg-gray-200 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-gray-200 rounded mb-2"></div>
            <div className="w-12 h-3 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  const isProfitable = totalUnrealizedPnl >= 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Portfolio Value */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 rounded-lg bg-slate-50 border border-gray-100">
            <PieChart className="h-5 w-5 text-slate-600" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-medium">Total Value</p>
          </div>
        </div>
        <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 relative z-10">
          $<AnimatedNumber 
            value={animatedTotal} 
            duration={1000} 
            decimals={0} 
          />
        </div>
        <p className="text-gray-500 text-xs relative z-10">{holdingsCount} stocks</p>
      </div>

      {/* Available Cash */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 rounded-lg bg-emerald-50 border border-gray-100">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-medium">Available Cash</p>
          </div>
        </div>
        <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 relative z-10">
          $<AnimatedNumber 
            value={animatedCash} 
            duration={1000} 
            decimals={0} 
          />
        </div>
        <p className="text-gray-500 text-xs relative z-10">{cashPercentage.toFixed(1)}% of portfolio</p>
      </div>

      {/* Total P&L */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-50 to-rose-50 border border-gray-100">
            {totalUnrealizedPnl >= 0 ? (
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-rose-600" />
            )}
          </div>
          <div className="text-right">
            <EducationalTooltip metric="pnl" value={totalUnrealizedPnl}>
              <div className="flex items-center gap-1">
                <p className="text-gray-500 text-xs font-medium">Total P&L</p>
                <HelpCircle className="h-3 w-3 text-gray-400" />
              </div>
            </EducationalTooltip>
          </div>
        </div>
        <div className={`text-xl lg:text-2xl font-bold mb-1 relative z-10 ${isProfitable ? 'text-green-700' : 'text-red-700'}`}>
          {totalUnrealizedPnl >= 0 ? '+' : ''}$<AnimatedNumber 
            value={animatedPnl} 
            duration={1000} 
            decimals={0} 
          />
        </div>
        <p className={`text-gray-500 text-xs relative z-10 ${isProfitable ? 'text-green-600' : 'text-red-600'}`}>
          {totalUnrealizedPnl >= 0 ? '+' : ''}{totalUnrealizedPnlPercent.toFixed(2)}% return
        </p>
      </div>

      {/* Invested Amount */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-4 hover:shadow-2xl transition-all duration-300 group relative overflow-hidden">
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="p-2 rounded-lg bg-indigo-50 border border-gray-100">
            <DollarSign className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="text-right">
            <p className="text-gray-500 text-xs font-medium">Invested</p>
          </div>
        </div>
        <div className="text-xl lg:text-2xl font-bold text-gray-900 mb-1 relative z-10">
          $<AnimatedNumber 
            value={animatedInvested} 
            duration={1000} 
            decimals={0} 
          />
        </div>
        <p className="text-gray-500 text-xs relative z-10">{investedPercentage.toFixed(1)}% of portfolio</p>
      </div>
    </div>
  );
}
