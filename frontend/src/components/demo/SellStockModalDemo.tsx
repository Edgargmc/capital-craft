/**
 * SellStockModalDemo - Theme System Validation Component
 * Tests SellStockModal with dual approach pattern
 */

import React, { useState } from 'react';
import { SellStockModal } from '@/components/modals/SellStockModal';

interface SellStockModalDemoProps {
  useThemeSystem?: boolean;
}

export const SellStockModalDemo: React.FC<SellStockModalDemoProps> = ({ 
  useThemeSystem = true 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Mock holdings data for testing
  const mockHoldings = {
    'AAPL': {
      symbol: 'AAPL',
      shares: 10,
      average_price: 150.00,
      current_price: 175.50,
      current_value: 1755.00,
      unrealized_pnl: 255.00,
      unrealized_pnl_percent: 17.0,
      beta: 1.2
    },
    'MSFT': {
      symbol: 'MSFT',
      shares: 5,
      average_price: 300.00,
      current_price: 320.75,
      current_value: 1603.75,
      unrealized_pnl: 103.75,
      unrealized_pnl_percent: 6.9,
      beta: 0.9
    },
    'GOOGL': {
      symbol: 'GOOGL',
      shares: 2,
      average_price: 2500.00,
      current_price: 2650.25,
      current_value: 5300.50,
      unrealized_pnl: 300.50,
      unrealized_pnl_percent: 6.0,
      beta: 1.1
    }
  };

  const handleSuccess = () => {
    console.log('🎉 Demo: Sell transaction successful!');
    setIsOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-gray-900">
            {useThemeSystem ? '🌟 Theme' : '🔄 Legacy'} SellStockModal
          </h4>
          <p className="text-sm text-gray-600">
            Test selling from portfolio with {mockHoldings ? Object.keys(mockHoldings).length : 0} holdings
          </p>
        </div>
        
        <button
          onClick={() => setIsOpen(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Open Sell Modal
        </button>
      </div>

      {/* Portfolio Preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="text-xs text-gray-600 mb-2">Mock Portfolio Holdings:</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {Object.values(mockHoldings).map((holding) => (
            <div key={holding.symbol} className="bg-white rounded p-2">
              <div className="font-medium">{holding.symbol}</div>
              <div className="text-gray-600">{holding.shares} shares</div>
              <div className={`text-xs ${holding.unrealized_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {holding.unrealized_pnl >= 0 ? '+' : ''}${holding.unrealized_pnl.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <SellStockModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onSuccess={handleSuccess}
        userId="demo"
        holdings={mockHoldings}
        useThemeSystem={useThemeSystem}
      />
    </div>
  );
};

export default SellStockModalDemo;