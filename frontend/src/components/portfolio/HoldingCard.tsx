import React, { useState, useEffect } from 'react';
import { CapitalCraftAPI, Stock } from '@/lib/api';
import { createPortal } from 'react-dom';

// Educational Tooltip Component
const EDUCATIONAL_CONTENT = {
  pe_ratio: {
    title: "P/E Ratio (Price-to-Earnings)",
    explanation: "Compara el precio de la acción con sus ganancias anuales.",
    interpretation: {
      low: "< 15: Posiblemente infravalorada o empresa en problemas",
      medium: "15-25: Valuación razonable para la mayoría de empresas",
      high: "> 25: Puede estar sobrevalorada o ser una empresa de alto crecimiento"
    },
    tip: " Tip: Compara el P/E con empresas del mismo sector."
  },
  beta: {
    title: "Beta (Volatilidad vs Mercado)",
    explanation: "Mide qué tan volátil es la acción comparada con el mercado general.",
    interpretation: {
      low: "< 1.0: Menos volátil que el mercado (más estable)",
      medium: "≈ 1.0: Se mueve similar al mercado",
      high: "> 1.0: Más volátil que el mercado (más riesgo y potencial)"
    },
    tip: " Tip: Beta alto = mayor riesgo pero posible mayor retorno."
  },
  dividend_yield: {
    title: "Dividend Yield (Rendimiento por Dividendos)",
    explanation: "Porcentaje anual que la empresa paga en dividendos vs el precio de la acción.",
    interpretation: {
      low: "< 2%: Enfoque en crecimiento, pocos dividendos",
      medium: "2-4%: Balance entre crecimiento y dividendos",
      high: "> 4%: Enfoque en ingresos, ideal para jubilados"
    },
    tip: " Tip: Dividendos altos pueden indicar empresa madura o en problemas."
  }
};

interface EducationalTooltipProps {
  metric: 'pe_ratio' | 'beta' | 'dividend_yield';
  value: number;
  children: React.ReactNode;
}

const EducationalTooltip: React.FC<EducationalTooltipProps> = ({ metric, value, children }) => {
  const [isVisible, setIsVisible] = useState(false);
  const content = EDUCATIONAL_CONTENT[metric];
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const getInterpretationLevel = (metric: string, value: number): 'low' | 'medium' | 'high' => {
    switch (metric) {
      case 'pe_ratio':
        if (value < 15) return 'low';
        if (value <= 25) return 'medium';
        return 'high';
      case 'beta':
        if (value < 0.8) return 'low';
        if (value <= 1.2) return 'medium';
        return 'high';
      case 'dividend_yield':
        if (value < 2) return 'low';
        if (value <= 4) return 'medium';
        return 'high';
      default:
        return 'medium';
    }
  };

  const interpretationLevel = getInterpretationLevel(metric, value);
  const currentInterpretation = content.interpretation[interpretationLevel];

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: rect.left + rect.width / 2,
      y: rect.top
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
            top: `${mousePosition.y - 10}px`,
            left: `${mousePosition.x}px`,
            transform: 'translate(-50%, -100%)'
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
                Tu valor: {value.toFixed(metric === 'dividend_yield' ? 1 : 2)}
                {metric === 'dividend_yield' ? '%' : ''}
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

            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// Updated HoldingCard Props to match your existing interface
interface HoldingCardProps {
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

const HoldingCard: React.FC<HoldingCardProps> = ({
  symbol,
  shares,
  averagePrice,
  currentPrice,
  currentValue,
  unrealizedPnl,
  unrealizedPnlPercent
}) => {
  // State for educational data
  const [stockData, setStockData] = useState<Stock | null>(null);
  const [loadingEducational, setLoadingEducational] = useState(true);

  // Fetch educational data using your CapitalCraftAPI
  useEffect(() => {
    const fetchEducationalData = async () => {
      try {
        setLoadingEducational(true);
        // Using your CapitalCraftAPI class - this will use the correct API_BASE
        const data = await CapitalCraftAPI.getStock(symbol);
        setStockData(data);
      } catch (error) {
        console.error(`Failed to fetch educational data for ${symbol}:`, error);
      } finally {
        setLoadingEducational(false);
      }
    };

    fetchEducationalData();
  }, [symbol]);

  const isPositive = unrealizedPnl >= 0;

  // Educational metrics from real API data
  const peRatio = stockData?.pe_ratio;
  const beta = stockData?.beta;
  const dividendYield = stockData?.dividend_yield ? stockData.dividend_yield * 100 : null;

  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden group">
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-gray-100/30 to-transparent skew-x-12"></div>

      {/* Header - Stock Info */}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-xl text-gray-900 truncate">{symbol}</h3>
            <span className="text-sm text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full whitespace-nowrap">{shares} shares</span>
          </div>
          {stockData?.name && (
            <p className="text-sm text-gray-600 truncate mt-1">{stockData.name}</p>
          )}
          {stockData?.sector && (
            <p className="text-xs text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full inline-block mt-2 truncate max-w-full">
              {stockData.sector}
            </p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className="font-bold text-xl text-gray-900">
            ${(currentPrice || 0).toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            Avg: ${(averagePrice || 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Educational Metrics Row */}
      <div className="flex justify-center gap-3 mb-4 py-3 border-t border-gray-100 relative z-10">
        {loadingEducational ? (
          // Loading state for educational metrics
          <div className="flex gap-3 w-full">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-2">Loading...</div>
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-2">Metrics...</div>
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-2">Data...</div>
              <div className="h-8 bg-gray-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            {/* P/E Ratio with Tooltip */}
            {peRatio && (
              <EducationalTooltip metric="pe_ratio" value={peRatio}>
                <div className="flex-1 text-center group/metric min-w-0">
                  <div className="text-xs text-gray-600 font-semibold mb-2">P/E Ratio</div>
                  <div className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg transition-all duration-200 group-hover/metric:bg-gray-100 group-hover/metric:scale-105 shadow-sm truncate">
                    {peRatio.toFixed(1)}
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Beta with Tooltip */}
            {beta && (
              <EducationalTooltip metric="beta" value={beta}>
                <div className="flex-1 text-center group/metric min-w-0">
                  <div className="text-xs text-gray-600 font-semibold mb-2">Beta</div>
                  <div className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg transition-all duration-200 group-hover/metric:bg-gray-100 group-hover/metric:scale-105 shadow-sm truncate">
                    {beta.toFixed(2)}
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Dividend Yield with Tooltip */}
            {dividendYield && dividendYield > 0 && (
              <EducationalTooltip metric="dividend_yield" value={dividendYield}>
                <div className="flex-1 text-center group/metric min-w-0">
                  <div className="text-xs text-gray-600 font-semibold mb-2">Dividend</div>
                  <div className="text-sm font-bold text-gray-700 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg transition-all duration-200 group-hover/metric:bg-gray-100 group-hover/metric:scale-105 shadow-sm truncate">
                    {dividendYield.toFixed(1)}%
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Fallback when no educational data */}
            {!peRatio && !beta && (!dividendYield || dividendYield === 0) && (
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-400 mb-2">Educational</div>
                <div className="text-xs text-gray-400 bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">Data N/A</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* P&L Summary - Using your existing data */}
      <div className={`flex justify-between items-center mb-4 p-4 rounded-xl relative z-10 border ${
        isPositive 
          ? 'bg-green-50/50 border-green-200/50' 
          : 'bg-red-50/50 border-red-200/50'
      }`}>
        <div>
          <div className="text-sm text-gray-600 font-medium">Total Value</div>
          <div className="font-bold text-xl text-gray-900">${(currentValue || 0).toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-xl ${isPositive ? 'text-green-700' : 'text-red-700'}`}>
            {isPositive ? '+' : ''}${(unrealizedPnl || 0).toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ({isPositive ? '+' : ''}{(unrealizedPnlPercent || 0).toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Sell Button - You'll need to add onSell prop to your interface */}
      <button
        onClick={() => {
          // You'll need to pass onSell from PortfolioDashboard
          console.log(`Sell ${symbol}`);
        }}
        className="w-full bg-gray-800 hover:bg-gray-900 text-white py-3 px-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl relative z-10"
      >
        Sell Shares
      </button>
    </div>
  );
};

export default HoldingCard;