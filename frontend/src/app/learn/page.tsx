'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

/**
 * 📚 Learn Page
 * 
 * Dedicated page for educational content and investment learning.
 * Provides interactive lessons and educational resources.
 */
export default function LearnPage() {
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
      activeTab="learn"
      setActiveTab={() => {}} // Sidebar handles all navigation
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Learning Center</h1>
          <p className="text-gray-600">Expand your investment knowledge with educational content.</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C20.832 18.477 19.246 18 17.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Learning Center Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            Interactive lessons and educational content to improve your investing skills.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">📚 Planned Learning Modules:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Investment Fundamentals</li>
                <li>• Risk Management Strategies</li>
                <li>• Portfolio Diversification</li>
                <li>• Market Psychology & Behavior</li>
                <li>• Technical Analysis Basics</li>
                <li>• Financial Statement Analysis</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
