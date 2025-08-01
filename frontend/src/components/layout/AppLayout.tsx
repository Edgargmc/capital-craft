'use client';

import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface AppLayoutProps {
  children: React.ReactNode;
  headerData?: {
    cashBalance: number;
    totalPortfolioValue: number;
    totalUnrealizedPnl: number;
    totalUnrealizedPnlPercent: number;
    holdingsCount: number;
    holdings: Record<string, {
      symbol: string;
      shares: number;
      current_value: number;
      beta?: number;
    }>;
  } | null;
  headerLoading?: boolean;
  onBuyClick: () => void;
  onSellClick: () => void;
}

export function AppLayout({ 
  children, 
  headerData, 
  headerLoading = false, 
  onBuyClick,
  onSellClick
}: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header with mobile padding adjustment */}
        <div className="pt-12 md:pt-0">
          <Header 
            summary={headerData || null} 
            loading={headerLoading}
            onBuyClick={onBuyClick}
            onSellClick={onSellClick}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}