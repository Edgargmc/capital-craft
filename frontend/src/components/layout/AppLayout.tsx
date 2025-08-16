'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BuyStockModal } from '@/components/modals/BuyStockModal';
import { SellStockModal } from '@/components/modals/SellStockModal';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI } from '@/lib/api';

export interface HeaderData {
  cashBalance: number;
  totalPortfolioValue: number;
  totalUnrealizedPnl: number;
  totalUnrealizedPnlPercent: number;
  holdingsCount: number;
  holdings: Record<string, any>;
}

interface AppLayoutProps {
  children: React.ReactNode;
  headerData: HeaderData | null;
  headerLoading?: boolean;
  onBuyClick?: () => void;
  onSellClick?: () => void;
  userId?: string;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  onNavigateToNotifications?: () => void;
}

export function AppLayout({
  children,
  headerData,
  headerLoading = false,
  onBuyClick,
  onSellClick,
  userId,
  activeTab = 'dashboard',
  setActiveTab,
  onNavigateToNotifications
}: AppLayoutProps) {
  const [internalActiveTab, setInternalActiveTab] = useState('dashboard');
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  
  const auth = useAuth();
  const { fetchNotifications } = useNotificationStore();
  
  // Use external activeTab/setActiveTab if provided, otherwise use internal state
  const currentActiveTab = activeTab;
  const handleTabChange = setActiveTab || setInternalActiveTab;

  const handleTradeSuccess = async () => {
    // Refresh portfolio data by calling parent's refresh if available
    if (onBuyClick || onSellClick) {
      // Trigger a data refresh - this will be handled by the parent component
      window.location.reload(); // Temporary solution, can be improved with proper state management
    }
    
    // Refresh notifications
    if (auth.user?.id) {
      await fetchNotifications(auth.user.id);
    }
  };

  const handleBuyClick = () => {
    console.log(' AppLayout: Opening Buy Modal');
    setShowBuyModal(true);
  };

  const handleSellClick = () => {
    console.log(' AppLayout: Opening Sell Modal');
    setShowSellModal(true);
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={currentActiveTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-12 md:pt-0">
          <Header 
            summary={headerData || null} 
            loading={headerLoading}
            onBuyClick={handleBuyClick}
            onSellClick={handleSellClick}
            userId={userId}
            onNavigateToNotifications={onNavigateToNotifications}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Global Modals - Available on all pages */}
      <BuyStockModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onSuccess={handleTradeSuccess}
        userId={auth.user?.id || "demo"}
        availableCash={headerData?.cashBalance || 0}
      />

      <SellStockModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        onSuccess={handleTradeSuccess}
        userId={auth.user?.id || "demo"}
        holdings={headerData?.holdings || {}}
      />
    </div>
  );
}