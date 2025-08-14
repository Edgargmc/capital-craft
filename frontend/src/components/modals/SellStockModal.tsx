'use client';

import { useState } from 'react';
import { X, TrendingDown } from 'lucide-react';
import { CapitalCraftAPI, Holding } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface SellStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  holdings: Record<string, Holding>;
}

export function SellStockModal({ isOpen, onClose, onSuccess, userId, holdings }: SellStockModalProps) {
  const [selectedStock, setSelectedStock] = useState('');
  const [shares, setShares] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = useAuth();
  const holding = selectedStock ? holdings[selectedStock] : null;
  const sellValue = holding && shares ? (holding.current_price || 0) * parseInt(shares || '0') : 0;
  const hasEnoughShares = holding && shares ? parseInt(shares) <= holding.shares : false;
  const isValidSale = holding && shares && parseInt(shares) > 0 && hasEnoughShares;

  const handleSell = async () => {
    
    if (!isValidSale || !selectedStock) {
      return;
    }

    setLoading(true);
    try {
      if (auth.isAuthenticated && auth.token) {
        await CapitalCraftAPI.sellMyStock(auth.token, selectedStock, parseInt(shares));
      } else {
        throw new Error('Please login to sell stocks');
      }
      
      onSuccess();
      onClose();
      setSelectedStock('');
      setShares('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sell stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedStock('');
    setShares('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  const holdingsList = Object.values(holdings);

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.55)] flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Sell Stock</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {holdingsList.length === 0 ? (
            <div className="text-center py-8">
              <TrendingDown className="h-12 w-12 text-gray-900 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Holdings to Sell</h3>
              <p className="text-gray-600">You need to buy stocks first before you can sell them.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Stock to Sell
                </label>
                <select
                  value={selectedStock}
                  onChange={(e) => {
                    setSelectedStock(e.target.value);
                    setShares('');
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                >
                  <option value="">Choose a stock...</option>
                  {holdingsList.map((holding) => (
                    <option key={holding.symbol} value={holding.symbol}>
                      {holding.symbol} - {holding.shares} shares @ ${holding.current_price?.toFixed(2) || '0.00'}
                    </option>
                  ))}
                </select>
              </div>
              {holding && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{holding.symbol}</h3>
                    <span className="text-blue-600 font-semibold">
                      ${holding.current_price?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Owned Shares</p>
                      <p className="text-black font-medium">{holding.shares}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Avg Price</p>
                      <p className="text-black font-medium">${holding.average_price?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Total Value</p>
                      <p className="text-black font-medium">${holding.current_value?.toFixed(2) || '0.00'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">P&L</p>
                      <p className={`text-black font-medium ${
                        (holding.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(holding.unrealized_pnl || 0) >= 0 ? '+' : ''}${(holding.unrealized_pnl || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {holding && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Shares to Sell
                  </label>
                  <input
                    type="number"
                    value={shares}
                    onChange={(e) => setShares(e.target.value)}
                    placeholder={`Max: ${holding.shares}`}
                    min="1"
                    max={holding.shares}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  />
                  <div className="flex justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => setShares(Math.floor(holding.shares / 2).toString())}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Sell Half
                    </button>
                    <button
                      type="button"
                      onClick={() => setShares(holding.shares.toString())}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Sell All
                    </button>
                  </div>
                </div>
              )}

              {holding && shares && (
                <div className="bg-red-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">Sale Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Stock:</span>
                      <span className="font-medium text-gray-800">{holding.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shares to sell:</span>
                      <span className="font-medium text-gray-800">{shares}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current price:</span>
                      <span className="font-medium text-gray-800">${holding.current_price?.toFixed(2) || '0.00'}</span>
                    </div>
                    <div className="border-t border-red-200 pt-2">
                      <div className="flex justify-between font-semibold">
                        <span className="font-medium text-gray-800">You&apos;ll Receive:</span>
                        <span className="font-medium text-gray-800">${sellValue?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Remaining shares:</span>
                      <span className="text-gray-600">
                        {holding.shares - parseInt(shares || '0')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {holding && shares && !hasEnoughShares && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">
                    You only have {holding.shares} shares available to sell.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
        {holdingsList.length > 0 && (
          <div className="flex-shrink-0 flex space-x-3 p-6 border-t border-gray-200">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSell}
              disabled={!isValidSale || loading}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isValidSale && !loading
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Selling...' : 'Sell Stock'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
