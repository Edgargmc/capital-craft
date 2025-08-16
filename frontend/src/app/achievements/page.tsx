'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

/**
 * 🏆 Achievements Page
 * 
 * Dedicated page for tracking investment milestones and accomplishments.
 * Provides gamification elements and progress tracking.
 */
export default function AchievementsPage() {
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
      activeTab="achievements"
      setActiveTab={() => {}} // Sidebar handles all navigation
    >
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Achievements</h1>
          <p className="text-gray-600">Track your investment milestones and accomplishments.</p>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Achievements Coming Soon</h3>
          <p className="text-gray-600 mb-6">
            Unlock badges and track your progress as you reach investment milestones.
          </p>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 text-left">
              <h4 className="font-medium text-gray-900 mb-2">🏆 Planned Achievement Categories:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• First Investment Badge</li>
                <li>• Portfolio Milestones ($1K, $10K, $100K)</li>
                <li>• Diversification Achievements</li>
                <li>• Learning Progress Badges</li>
                <li>• Consistency Streaks</li>
                <li>• Risk Management Awards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
