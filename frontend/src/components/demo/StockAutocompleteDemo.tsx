/**
 * StockAutocompleteDemo - Test component for StockAutocomplete with dual approach
 * Demonstrates autocomplete functionality with both legacy and theme system approaches
 */

import React, { useState } from 'react';
import { StockAutocomplete } from '@/components/common/StockAutocomplete';

interface StockAutocompleteProps {
  useThemeSystem?: boolean;
}

export const StockAutocompleteDemo: React.FC<StockAutocompleteProps> = ({ 
  useThemeSystem = false 
}) => {
  const [symbol, setSymbol] = useState('');
  const [selectedStock, setSelectedStock] = useState<{symbol: string; name: string; sector: string} | null>(null);

  const handleStockSelect = (stock: {symbol: string; name: string; sector: string}) => {
    setSelectedStock(stock);
    setSymbol(stock.symbol);
    console.log('📈 Stock selected:', stock);
  };

  const handleClear = () => {
    setSelectedStock(null);
    setSymbol('');
    console.log('🗑️ Selection cleared');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700">
          {useThemeSystem ? '🌟 Theme System' : '🔄 Legacy Styles'}
        </h4>
        <div className="text-xs text-gray-500">
          Try: AAPL, MSFT, GOOGL, TSLA
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Stock Symbol
          </label>
          <StockAutocomplete
            value={symbol}
            onSelect={handleStockSelect}
            onChange={setSymbol}
            onClear={handleClear}
            placeholder="Search Apple, Microsoft, Tesla..."
            useThemeSystem={useThemeSystem}
          />
        </div>

        {selectedStock && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 text-sm">Selected Stock:</h4>
            <div className="text-sm text-gray-600 mt-1">
              <div><strong>{selectedStock.symbol}</strong> - {selectedStock.name}</div>
              <div className="text-xs text-gray-500">{selectedStock.sector}</div>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          <div>Current value: <span className="font-mono">&quot;{symbol}&quot;</span></div>
          <div>Theme mode: <span className="font-semibold">{useThemeSystem ? 'New Theme' : 'Legacy'}</span></div>
        </div>
      </div>
    </div>
  );
};