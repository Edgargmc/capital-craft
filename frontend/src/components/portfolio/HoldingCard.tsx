import { DollarSign, TrendingUp, TrendingDown } from 'lucide-react';

interface HoldingCardProps {
  symbol: string;
  shares: number;
  averagePrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnl: number;
  unrealizedPnlPercent: number;
}

export function HoldingCard({
  symbol,
  shares,
  averagePrice,
  currentPrice,
  currentValue,
  unrealizedPnl,
  unrealizedPnlPercent,
}: HoldingCardProps) {
  const isProfitable = unrealizedPnl >= 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-shadow text-red-600">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{symbol}</h3>
        <div className="flex items-center space-x-1">
          {isProfitable ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}>
            {unrealizedPnlPercent.toFixed(2)}%
          </span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Shares</p>
          <p className="font-semibold text-gray-900">{shares}</p>  {/* <- MÁS OSCURO */}
        </div>
        <div>
          <p className="text-gray-500">Current Price</p>
          <p className="font-semibold text-gray-900">${currentPrice.toFixed(2)}</p>  {/* <- MÁS OSCURO */}
        </div>
        <div>
          <p className="text-gray-500">Avg Price</p>
          <p className="font-semibold text-gray-900">${averagePrice.toFixed(2)}</p>  {/* <- MÁS OSCURO */}
        </div>
        <div>
          <p className="text-gray-500">Total Value</p>
          <p className="font-semibold text-gray-900">${currentValue.toFixed(2)}</p>  {/* <- MÁS OSCURO */}
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">P&L</span>
          <span className={`text-sm font-medium ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}>
            {isProfitable ? '+' : ''}${unrealizedPnl.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}