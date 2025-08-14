import React, { useState } from 'react';
import { Crown, TrendingDown, HelpCircle, TrendingUp } from 'lucide-react';
import { createPortal } from 'react-dom';

interface TopPerformerBadgeProps {
  holdings: Record<string, any>;
  loading?: boolean;
}

interface PerformerData {
  symbol: string;
  name?: string;
  pnlPercent: number;
  pnlAmount: number;
  currentValue: number;
  type: 'best' | 'worst';
}

const EducationalTooltip: React.FC<{ 
  children: React.ReactNode; 
  performer: PerformerData;
}> = ({ children, performer }) => {
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

  const getEducationalContent = () => {
    if (performer.type === 'best') {
      return {
        title: "🏆 Top Performer",
        explanation: `${performer.symbol} es tu mejor inversión con un ${performer.pnlPercent.toFixed(1)}% de ganancia. Las acciones exitosas suelen tener fundamentos sólidos, buen timing de entrada, o beneficiarse de tendencias del mercado.`,
        lessons: [
          "📈 Analiza qué hizo exitosa esta inversión",
          "🎯 Considera si mantener o tomar ganancias parciales",
          "📚 Estudia el sector y empresa para futuras decisiones"
        ],
        tip: "El éxito pasado no garantiza rendimientos futuros. Mantén un enfoque diversificado."
      };
    } else {
      return {
        title: "⚠️ Underperformer",
        explanation: `${performer.symbol} está perdiendo ${Math.abs(performer.pnlPercent).toFixed(1)}%. Las pérdidas son parte normal de invertir y pueden ser oportunidades de aprendizaje valiosas.`,
        lessons: [
          "🔍 Revisa si los fundamentos han cambiado",
          "⏰ Evalúa si es pérdida temporal o estructural",
          "📖 Aprende de los errores para mejorar futuras decisiones"
        ],
        tip: "No vendas por pánico. Analiza objetivamente antes de tomar decisiones."
      };
    }
  };

  const content = getEducationalContent();

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
              {content.title}
            </h4>

            <p className="text-xs text-gray-300 mb-3 leading-relaxed">
              {content.explanation}
            </p>

            <div className="space-y-1 mb-3">
              {content.lessons.map((lesson, index) => (
                <div key={index} className="text-xs text-gray-300">
                  {lesson}
                </div>
              ))}
            </div>

            <div className="text-xs text-yellow-300 border-t border-gray-700 pt-2">
              💡 {content.tip}
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

const TopPerformerBadge: React.FC<TopPerformerBadgeProps> = ({
  holdings,
  loading = false
}) => {
  const getTopPerformers = (): { best: PerformerData | null; worst: PerformerData | null } => {
    const holdingsArray = Object.values(holdings);
    
    if (holdingsArray.length === 0) {
      return { best: null, worst: null };
    }

    const sortedByPerformance = holdingsArray
      .filter(holding => holding.unrealized_pnl_percent !== undefined)
      .sort((a, b) => b.unrealized_pnl_percent - a.unrealized_pnl_percent);

    const best = sortedByPerformance.length > 0 ? {
      symbol: sortedByPerformance[0].symbol,
      pnlPercent: sortedByPerformance[0].unrealized_pnl_percent,
      pnlAmount: sortedByPerformance[0].unrealized_pnl,
      currentValue: sortedByPerformance[0].current_value,
      type: 'best' as const
    } : null;

    const worst = sortedByPerformance.length > 0 ? {
      symbol: sortedByPerformance[sortedByPerformance.length - 1].symbol,
      pnlPercent: sortedByPerformance[sortedByPerformance.length - 1].unrealized_pnl_percent,
      pnlAmount: sortedByPerformance[sortedByPerformance.length - 1].unrealized_pnl,
      currentValue: sortedByPerformance[sortedByPerformance.length - 1].current_value,
      type: 'worst' as const
    } : null;

    return { best, worst };
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Performance Highlights</h3>
        </div>
        <div className="space-y-2">
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
          <div className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  const { best, worst } = getTopPerformers();

  if (!best && !worst) {
    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-500">Performance Highlights</h3>
        </div>
        <p className="text-xs text-gray-500 text-center py-4">
          No hay holdings para analizar
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-center gap-2 mb-3">
        <Crown className="w-4 h-4 text-yellow-600" />
        <h3 className="text-sm font-medium text-gray-700">Performance Highlights</h3>
      </div>

      <div className="space-y-2">
        {/* Best Performer */}
        {best && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{best.symbol}</span>
                  <EducationalTooltip performer={best}>
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-emerald-600 transition-colors" />
                  </EducationalTooltip>
                </div>
                <span className="text-xs text-gray-600">Top Performer</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-emerald-600">
                +{best.pnlPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                +${Math.abs(best.pnlAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Worst Performer */}
        {worst && worst.pnlPercent < 0 && (
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-gray-800">{worst.symbol}</span>
                  <EducationalTooltip performer={worst}>
                    <HelpCircle className="w-3 h-3 text-gray-400 hover:text-red-600 transition-colors" />
                  </EducationalTooltip>
                </div>
                <span className="text-xs text-gray-600">Needs Attention</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold text-red-600">
                {worst.pnlPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">
                -${Math.abs(worst.pnlAmount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Single holding case */}
        {best && worst && best.symbol === worst.symbol && (
          <div className="text-center py-2">
            <span className="text-xs text-gray-500">
              Agrega más holdings para comparar performance
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopPerformerBadge;
