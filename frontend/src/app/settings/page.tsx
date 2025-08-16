'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SettingsPage as SettingsComponent } from '@/components/settings/SettingsPage';
import { useAuth } from '@/contexts/AuthContext';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

/**
 * ⚙️ Settings Page
 * 
 * Dedicated page for user settings and preferences.
 * Provides account management and application configuration.
 */
export default function SettingsPage() {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  
  const auth = useAuth();
  const nav = useNavigation();

  // Fetch portfolio data for header
  const fetchPortfolioData = async () => {
    if (!auth.isAuthenticated || !auth.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const summaryData = await CapitalCraftAPI.getMyPortfolio(auth.token);
      setPortfolioSummary(summaryData);
    } catch (err) {
      console.error('Error fetching portfolio data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [auth.isAuthenticated, auth.token]);

  return (
    <AppLayout
      headerData={{
        cashBalance: portfolioSummary?.cash_balance || 0,
        totalPortfolioValue: portfolioSummary?.total_portfolio_value || 0,
        totalUnrealizedPnl: portfolioSummary?.total_unrealized_pnl || 0,
        totalUnrealizedPnlPercent: portfolioSummary?.total_unrealized_pnl_percent || 0,
        holdingsCount: portfolioSummary?.holdings_count || 0,
        holdings: portfolioSummary?.holdings || {}
      }}
      headerLoading={loading}
      onBuyClick={() => {/* TODO: Implement buy modal */}}
      onSellClick={() => {/* TODO: Implement sell modal */}}
      activeTab="settings"
      setActiveTab={() => {}} // Sidebar handles all navigation
    >
      <SettingsComponent />
    </AppLayout>
  );
}
