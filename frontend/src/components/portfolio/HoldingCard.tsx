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
    tip: "💡 Tip: Compara el P/E con empresas del mismo sector."
  },
  beta: {
    title: "Beta (Volatilidad vs Mercado)",
    explanation: "Mide qué tan volátil es la acción comparada con el mercado general.",
    interpretation: {
      low: "< 1.0: Menos volátil que el mercado (más estable)",
      medium: "≈ 1.0: Se mueve similar al mercado",
      high: "> 1.0: Más volátil que el mercado (más riesgo y potencial)"
    },
    tip: "💡 Tip: Beta alto = mayor riesgo pero posible mayor retorno."
  },
  dividend_yield: {
    title: "Dividend Yield (Rendimiento por Dividendos)",
    explanation: "Porcentaje anual que la empresa paga en dividendos vs el precio de la acción.",
    interpretation: {
      low: "< 2%: Enfoque en crecimiento, pocos dividendos",
      medium: "2-4%: Balance entre crecimiento y dividendos",
      high: "> 4%: Enfoque en ingresos, ideal para jubilados"
    },
    tip: "💡 Tip: Dividendos altos pueden indicar empresa madura o en problemas."
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
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02] hover:border-gray-300">
      {/* Header - Stock Info */}
      <div className="flex justify-between items-start mb-3">
        <div className="min-w-0 flex-1 mr-4">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-gray-900 truncate">{symbol}</h3>
            <span className="text-sm text-gray-500 whitespace-nowrap">{shares} shares</span>
          </div>
          {stockData?.name && (
            <p className="text-sm text-gray-600 truncate">{stockData.name}</p>
          )}
          {stockData?.sector && (
            <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block mt-1 truncate max-w-full">
              {stockData.sector}
            </p>
          )}
        </div>
        
        <div className="text-right flex-shrink-0">
          <div className="font-bold text-lg text-gray-900">
            ${currentPrice.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500">
            Avg: ${averagePrice.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Educational Metrics Row */}
      <div className="flex justify-end gap-2 mb-3 py-2 border-t border-gray-100">
        {loadingEducational ? (
          // Loading state for educational metrics
          <div className="flex gap-2 w-full">
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-1">Loading...</div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-1">Metrics...</div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="text-xs text-gray-400 mb-1">Data...</div>
              <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ) : (
          <>
            {/* P/E Ratio with Tooltip */}
            {peRatio && (
              <EducationalTooltip metric="pe_ratio" value={peRatio}>
                <div className="flex-1 text-center group min-w-0">
                  <div className="text-xs text-blue-600 font-medium mb-1">P/E</div>
                  <div className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded transition-colors duration-200 group-hover:bg-blue-100 truncate">
                    {peRatio.toFixed(1)}
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Beta with Tooltip */}
            {beta && (
              <EducationalTooltip metric="beta" value={beta}>
                <div className="flex-1 text-center group min-w-0">
                  <div className="text-xs text-orange-600 font-medium mb-1">Beta</div>
                  <div className="text-sm font-bold text-orange-700 bg-orange-50 px-2 py-1 rounded transition-colors duration-200 group-hover:bg-orange-100 truncate">
                    {beta.toFixed(2)}
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Dividend Yield with Tooltip */}
            {dividendYield && dividendYield > 0 && (
              <EducationalTooltip metric="dividend_yield" value={dividendYield}>
                <div className="flex-1 text-center group min-w-0">
                  <div className="text-xs text-purple-600 font-medium mb-1">Dividend</div>
                  <div className="text-sm font-bold text-purple-700 bg-purple-50 px-2 py-1 rounded transition-colors duration-200 group-hover:bg-purple-100 truncate">
                    {dividendYield.toFixed(1)}%
                  </div>
                </div>
              </EducationalTooltip>
            )}

            {/* Fallback when no educational data */}
            {!peRatio && !beta && (!dividendYield || dividendYield === 0) && (
              <div className="flex-1 text-center">
                <div className="text-xs text-gray-400">Educational</div>
                <div className="text-xs text-gray-400">Data N/A</div>
              </div>
            )}
          </>
        )}
      </div>

      {/* P&L Summary - Using your existing data */}
      <div className="flex justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm text-gray-600">Total Value</div>
          <div className="font-bold text-lg text-gray-700">${currentValue.toFixed(2)}</div>
        </div>
        <div className="text-right">
          <div className={`font-bold text-lg ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </div>
          <div className={`text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            ({isPositive ? '+' : ''}{unrealizedPnlPercent.toFixed(1)}%)
          </div>
        </div>
      </div>

      {/* Sell Button - You'll need to add onSell prop to your interface */}
      <button
        onClick={() => {
          // You'll need to pass onSell from PortfolioDashboard
          console.log(`Sell ${symbol}`);
        }}
        className="w-full bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
      >
        Sell Shares
      </button>
    </div>
  );
};

export default HoldingCard;