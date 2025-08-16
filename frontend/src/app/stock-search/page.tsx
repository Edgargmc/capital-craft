'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

/**
 * 🔍 Stock Search Page
 * 
 * Dedicated page for stock search and analysis functionality.
 * Provides tools to search, analyze, and add stocks to portfolio.
 */
export default function StockSearchPage() {
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
      activeTab="stock-search"
      setActiveTab={() => {}} // Sidebar handles all navigation
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Stock Search</h1>
          <p className="text-gray-600">Search and analyze stocks to add to your portfolio.</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Stock Search Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            Advanced stock search and analysis tools will be available here.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">🔍 Planned Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Real-time stock search and quotes</li>
                <li>• Technical analysis charts</li>
                <li>• Fundamental analysis data</li>
                <li>• Stock comparison tools</li>
                <li>• Watchlist management</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
