import React, { useState, useEffect } from 'react';
import { Shield, HelpCircle } from 'lucide-react';
import { createPortal } from 'react-dom';

interface PortfolioHealthScoreProps {
  holdings: Record<string, any>;
  cashBalance: number;
  totalPortfolioValue: number;
  totalPnl: number;
  investedAmount: number;
  loading?: boolean;
}

interface HealthScoreData {
  score: number;
  level: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  color: string;
  factors: {
    diversification: { score: number; weight: number; description: string };
    cashRatio: { score: number; weight: number; description: string };
    performance: { score: number; weight: number; description: string };
  };
}

const EducationalTooltip: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const shouldShowBelow = rect.top < 300;
    
    setMousePosition({
      x: rect.left + rect.width / 2,
      y: shouldShowBelow ? rect.bottom + 10 : rect.top - 10
    });
    setIsVisible(true);
  };

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
            top: `${mousePosition.y}px`,
            left: `${mousePosition.x}px`,
            transform: mousePosition.y > 300 ? 'translate(-50%, 0)' : 'translate(-50%, -100%)'
          }}
        >
          <div className="bg-gray-900 text-white p-4 rounded-lg shadow-xl max-w-80 min-w-64">
            <h4 className="font-semibold text-sm mb-2 text-blue-300">
              Portfolio Health Score
            </h4>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              Evalúa la salud general de tu portfolio considerando diversificación, 
              balance de efectivo y rendimiento. Un score alto indica un portfolio bien balanceado.
            </p>

            <div className="space-y-2 mb-3">
              <div className="text-xs">
                <span className="text-blue-300 font-medium">Diversificación (40%): </span>
                <span className="text-gray-300">Número de holdings diferentes</span>
              </div>
              <div className="text-xs">
                <span className="text-green-300 font-medium">Balance Efectivo (30%): </span>
                <span className="text-gray-300">Ratio óptimo de cash vs inversiones</span>
              </div>
              <div className="text-xs">
                <span className="text-purple-300 font-medium">Rendimiento (30%): </span>
                <span className="text-gray-300">P&L relativo a la inversión total</span>
              </div>
            </div>

            <div className="text-xs text-yellow-300 border-t border-gray-700 pt-2">
              💡 Un portfolio saludable reduce riesgo y maximiza oportunidades de crecimiento
            </div>

            <div className={`absolute ${mousePosition.y > 300 ? 'bottom-full' : 'top-full'} left-1/2 transform -translate-x-1/2`}>
              <div className={`w-0 h-0 border-l-4 border-r-4 ${mousePosition.y > 300 ? 'border-b-4 border-b-gray-900' : 'border-t-4 border-t-gray-900'} border-transparent`}></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

const PortfolioHealthScore: React.FC<PortfolioHealthScoreProps> = ({
  holdings,
  cashBalance,
  totalPortfolioValue,
  totalPnl,
  investedAmount,
  loading = false
}) => {
  const [animatedScore, setAnimatedScore] = useState(0);
  const [healthData, setHealthData] = useState<HealthScoreData | null>(null);

  const calculateHealthScore = (): HealthScoreData => {
    const holdingsArray = Object.values(holdings);
    const holdingsCount = holdingsArray.length;
    
    // Diversification Score (0-100, weight: 40%)
    const diversificationScore = Math.min(100, (holdingsCount / 8) * 100); // Optimal: 8+ holdings
    
    // Cash Ratio Score (0-100, weight: 30%)
    const cashRatio = cashBalance / totalPortfolioValue;
    const optimalCashRatio = 0.1; // 10% cash is optimal
    const cashScore = Math.max(0, 100 - Math.abs(cashRatio - optimalCashRatio) * 500);
    
    // Performance Score (0-100, weight: 30%)
    const pnlRatio = totalPnl / Math.max(investedAmount, 1);
    const performanceScore = Math.min(100, Math.max(0, (pnlRatio + 0.2) * 250)); // -20% to +20% range
    
    // Weighted total score
    const totalScore = Math.round(
      (diversificationScore * 0.4) + 
      (cashScore * 0.3) + 
      (performanceScore * 0.3)
    );
    
    let level: 'Poor' | 'Fair' | 'Good' | 'Excellent';
    let color: string;
    
    if (totalScore >= 80) {
      level = 'Excellent';
      color = 'text-emerald-600';
    } else if (totalScore >= 60) {
      level = 'Good';
      color = 'text-green-600';
    } else if (totalScore >= 40) {
      level = 'Fair';
      color = 'text-yellow-600';
    } else {
      level = 'Poor';
      color = 'text-red-600';
    }
    
    return {
      score: totalScore,
      level,
      color,
      factors: {
        diversification: {
          score: Math.round(diversificationScore),
          weight: 40,
          description: `${holdingsCount} holdings`
        },
        cashRatio: {
          score: Math.round(cashScore),
          weight: 30,
          description: `${(cashRatio * 100).toFixed(1)}% cash`
        },
        performance: {
          score: Math.round(performanceScore),
          weight: 30,
          description: `${(pnlRatio * 100).toFixed(1)}% return`
        }
      }
    };
  };

  useEffect(() => {
    if (!loading && Object.keys(holdings).length > 0) {
      const data = calculateHealthScore();
      setHealthData(data);
      
      // Animate score
      let start = 0;
      const end = data.score;
      const duration = 1500;
      const increment = end / (duration / 16);
      
      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setAnimatedScore(end);
          clearInterval(timer);
        } else {
          setAnimatedScore(Math.round(start));
        }
      }, 16);
      
      return () => clearInterval(timer);
    }
  }, [holdings, cashBalance, totalPortfolioValue, totalPnl, investedAmount, loading]);

  if (loading || !healthData) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-gray-400" />
            <h3 className="text-sm font-medium text-gray-500">Portfolio Health</h3>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="w-32 h-32 rounded-full bg-gray-100 animate-pulse"></div>
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 45; // radius = 45
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-600" />
          <h3 className="text-sm font-medium text-gray-700">Portfolio Health</h3>
          <EducationalTooltip>
            <HelpCircle className="w-4 h-4 text-gray-400 hover:text-indigo-600 transition-colors" />
          </EducationalTooltip>
        </div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gray-100 ${healthData.color}`}>
          {healthData.level}
        </span>
      </div>

      {/* Circular Gauge */}
      <div className="flex justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="rgb(243 244 246)"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke={healthData.score >= 80 ? 'rgb(16 185 129)' : 
                     healthData.score >= 60 ? 'rgb(34 197 94)' : 
                     healthData.score >= 40 ? 'rgb(234 179 8)' : 'rgb(239 68 68)'}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1500 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold text-gray-800">{animatedScore}</span>
            <span className="text-xs text-gray-500">/ 100</span>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        {Object.entries(healthData.factors).map(([key, factor]) => (
          <div key={key} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                key === 'diversification' ? 'bg-blue-400' :
                key === 'cashRatio' ? 'bg-green-400' : 'bg-purple-400'
              }`}></div>
              <span className="text-gray-600 capitalize">
                {key === 'cashRatio' ? 'Cash Balance' : 
                 key === 'diversification' ? 'Diversification' : 'Performance'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">{factor.description}</span>
              <span className="font-medium text-gray-700">{factor.score}/100</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioHealthScore;
