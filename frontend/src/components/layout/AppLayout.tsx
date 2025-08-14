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
}

export function AppLayout({ 
  children, 
  headerData, 
  headerLoading = false, 
  onBuyClick,
  onSellClick,
  userId
}: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="pt-12 md:pt-0">
          <Header 
            summary={headerData || null} 
            loading={headerLoading}
            onBuyClick={onBuyClick}
            onSellClick={onSellClick}
            userId={userId}
          />
        </div>
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}