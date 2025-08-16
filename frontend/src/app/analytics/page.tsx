'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

/**
 * 📊 Analytics Page
 * 
 * Dedicated page for advanced portfolio analytics and performance metrics.
 * Provides deep insights into portfolio performance and risk analysis.
 */
export default function AnalyticsPage() {
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
      activeTab="analytics"
      setActiveTab={() => {}} // Sidebar handles all navigation
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Deep dive into your portfolio performance and analytics.</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Advanced Analytics Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            Detailed portfolio analytics, performance metrics, and risk analysis tools.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">📈 Planned Analytics Features:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Performance Attribution Analysis</li>
                <li>• Risk-Adjusted Returns (Sharpe, Sortino)</li>
                <li>• Portfolio Correlation Matrix</li>
                <li>• Sector & Geographic Allocation</li>
                <li>• Historical Performance Tracking</li>
                <li>• Benchmark Comparisons</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
