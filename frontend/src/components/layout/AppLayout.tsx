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
  } | null;
  headerLoading?: boolean;
  onBuyClick: () => void;  // <- NUEVO
  onSellClick: () => void; // <- NUEVO
}

export function AppLayout({ 
  children, 
  headerData, 
  headerLoading = false, 
  onBuyClick,   // <- AGREGAR
  onSellClick   // <- AGREGAR
}: AppLayoutProps) {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header 
          summary={headerData} 
          loading={headerLoading}
          onBuyClick={onBuyClick}    // <- PASAR
          onSellClick={onSellClick}  // <- PASAR
        />
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}