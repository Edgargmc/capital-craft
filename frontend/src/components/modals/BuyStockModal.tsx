'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { CapitalCraftAPI, Stock } from '@/lib/api';
import { StockAutocomplete } from '@/components/common/StockAutocomplete';

interface BuyStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
  availableCash: number;
}

export function BuyStockModal({ isOpen, onClose, onSuccess, userId, availableCash }: BuyStockModalProps) {
  const [symbol, setSymbol] = useState('');
  const [shares, setShares] = useState('');
  const [stockData, setStockData] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{symbol: string; name: string; sector: string} | null>(null);
  const [error, setError] = useState('');

  // Search for stock when symbol changes
  useEffect(() => {
    const searchStock = async () => {
      if (symbol.length >= 1) {
        setSearching(true);
        try {
          const data = await CapitalCraftAPI.getStock(symbol.toUpperCase());
          setStockData(data);
          setError('');
        } catch {
          setStockData(null);
          if (symbol.length >= 2) {
            setError('Stock not found');
          }
        } finally {
          setSearching(false);
        }
      } else {
        setStockData(null);
        setError('');
      }
    };

    const debounceTimer = setTimeout(searchStock, 500);
    return () => clearTimeout(debounceTimer);
  }, [symbol]);

  const totalCost = stockData && shares ? stockData.current_price * parseInt(shares || '0') : 0;
  const canAfford = totalCost <= availableCash;
  const isValidPurchase = stockData && shares && parseInt(shares) > 0 && canAfford;

  const handleBuy = async () => {
    if (!isValidPurchase) return;

    setLoading(true);
    try {
      await CapitalCraftAPI.buyStock(userId, symbol.toUpperCase(), parseInt(shares));
      onSuccess();
      onClose();
      // Reset form
      setSymbol('');
      setShares('');
      setStockData(null);
      setSelectedStock(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to buy stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSymbol('');
    setShares('');
    setStockData(null);
    setSelectedStock(null);
    setError('');
    onClose();
  };

  const handleStockSelect = (stock: {symbol: string; name: string; sector: string}) => {
    setSelectedStock(stock);
    setSymbol(stock.symbol);
  };

  const handleClearStock = () => {
    setSelectedStock(null);
    setSymbol('');
    setStockData(null);
    setShares(''); // Clear shares when stock is cleared
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(0,0,0,0.55)] flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Buy Stock</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stock Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Stock Symbol
            </label>
            <StockAutocomplete
              value={symbol}
              onSelect={handleStockSelect}
              onChange={setSymbol}
              onClear={handleClearStock}
              placeholder="Search AAPL, Microsoft, Tesla..."
              loading={searching}
            />
          </div>

          {/* Stock Info */}
          {(stockData || selectedStock) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">
                  {stockData?.symbol || selectedStock?.symbol || ''}
                </h3>
                {stockData?.current_price && (
                  <span className="text-green-600 font-semibold">
                    ${stockData.current_price.toFixed(2)}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">
                {stockData?.name || selectedStock?.name || ''}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stockData?.sector || selectedStock?.sector || ''}
              </p>
              {selectedStock && !stockData && (
                <p className="text-xs text-blue-600 mt-2">
                  Loading current price...
                </p>
              )}
            </div>
          )}

          {/* Shares Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Shares
            </label>
            <input
              type="number"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder={selectedStock ? "10" : "Select a stock first"}
              min="1"
              disabled={!selectedStock}
              className={`w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ${
                selectedStock 
                  ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' 
                  : 'bg-gray-50 cursor-not-allowed text-gray-500'
              }`}
            />
            {!selectedStock && (
              <p className="text-xs text-gray-500 mt-1">
                Please select a valid stock before entering the number of shares
              </p>
            )}
          </div>

          {/* Order Summary */}
          {stockData && shares && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Order Summary</h4>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className="font-semibold text-gray-900">{stockData?.symbol || ''}</span>  {/* <- MÁS OSCURO */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shares:</span>
                  <span className="font-semibold text-gray-900">{shares}</span>  {/* <- MÁS OSCURO */}
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price per share:</span>
                  <span className="font-semibold text-gray-900">${stockData.current_price?.toFixed(2) || '0.00'}</span>  {/* <- MÁS OSCURO */}
                </div>
                <div className="border-t border-blue-200 pt-2">
                  <div className="flex justify-between font-semibold text-gray-900">  {/* <- AGREGADO text-gray-900 */}
                    <span>Total Cost:</span>
                    <span>${totalCost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Insufficient Funds Warning */}
          {stockData && shares && !canAfford && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">
                Insufficient funds. You need ${(totalCost - availableCash).toFixed(2)} more.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleBuy}
            disabled={!isValidPurchase || loading}
            className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isValidPurchase && !loading
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {loading ? 'Buying...' : 'Buy Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}
