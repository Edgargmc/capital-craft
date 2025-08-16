/**
 * BuyStockModalDemo - Test component for BuyStockModal with dual approach
 * Demonstrates both legacy and theme system approaches working side by side
 */

import React, { useState } from 'react';
import { BuyStockModal } from '@/components/modals/BuyStockModal';

interface BuyStockModalDemoProps {
  useThemeSystem?: boolean;
}

export const BuyStockModalDemo: React.FC<BuyStockModalDemoProps> = ({ 
  useThemeSystem = false 
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for testing
  const mockUserId = 'demo-user-123';
  const mockAvailableCash = 10000.00;

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    console.log('🎉 Stock purchase successful!');
    alert('Stock purchase successful! (Demo)');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700">
          {useThemeSystem ? '🌟 Theme System' : '🔄 Legacy Styles'}
        </h4>
        <button
          onClick={handleOpenModal}
          className={
            useThemeSystem
              ? 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
              : 'bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
          }
        >
          Open Buy Modal
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>Available cash: <span className="font-semibold">${mockAvailableCash.toLocaleString()}</span></p>
        <p className="text-xs mt-1">
          Try searching for stocks like: AAPL, MSFT, TSLA, GOOGL
        </p>
      </div>

      <BuyStockModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
        userId={mockUserId}
        availableCash={mockAvailableCash}
        useThemeSystem={useThemeSystem}
      />
    </div>
  );
};