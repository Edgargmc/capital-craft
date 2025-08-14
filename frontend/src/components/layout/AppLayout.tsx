'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Holding } from '@/lib/api';

interface AppLayoutProps {
  children: React.ReactNode;
  headerData?: {
    cashBalance: number;
    totalPortfolioValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    holdingsCount: number;
    holdings: Record<string, Holding>;
  } | null;
  headerLoading?: boolean;
  onBuyClick: () => void;
  onSellClick: () => void;
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
  
  // Use external activeTab/setActiveTab if provided, otherwise use internal state
  const currentActiveTab = activeTab;
  const handleTabChange = setActiveTab || setInternalActiveTab;

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={currentActiveTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-12 md:pt-0">
          <Header 
            summary={headerData || null} 
            loading={headerLoading}
            onBuyClick={onBuyClick}
            onSellClick={onSellClick}
            userId={userId}
            onNavigateToNotifications={onNavigateToNotifications}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}