'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { QuickStatsGrid, PortfolioStats } from '@/components/dashboard/QuickStatsGrid';
import { LearningProgress, LearningProgressData } from '@/components/dashboard/LearningProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { useNavigation } from '@/hooks/useNavigation';

export default function DashboardPage() {
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 🔐 Clean Architecture: Dependency Injection via hooks
  const auth = useAuth();
  const { notifications, isLoading: notificationsLoading } = useNotificationStore();
  const nav = useNavigation();

  // 📊 Business Logic: Fetch portfolio data
  const fetchPortfolioData = async () => {
    if (!auth.isAuthenticated || !auth.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const summary = await CapitalCraftAPI.getMyPortfolio(auth.token);
      setPortfolioSummary(summary);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
      console.error('Error fetching portfolio:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Effect: Load data on auth change
  useEffect(() => {
    fetchPortfolioData();
  }, [auth.isAuthenticated, auth.token]);

  // 📊 Data Transformation: Convert portfolio to stats interface
  const portfolioStats: PortfolioStats = {
    totalValue: portfolioSummary?.total_portfolio_value,
    cashBalance: portfolioSummary?.cash_balance,
    holdingsCount: portfolioSummary?.holdings_count,
    totalPnL: portfolioSummary?.total_unrealized_pnl,
    totalPnLPercent: portfolioSummary?.total_unrealized_pnl_percent
  };

  // 📊 Data Transformation: Prepare learning progress data
  const learningProgressData: LearningProgressData = {
    totalContent: 4, // Based on your learning content system
    completedContent: notifications?.filter(n => n.type === 'education').length || 0,
    currentStreak: (notifications?.filter(n => n.type === 'education').length || 0) > 0 ? 1 : 0,
    recentAchievements: (notifications?.filter(n => n.type === 'education').length || 0) > 0 
      ? ['Educational Interaction', 'Portfolio Analysis'] 
      : [],
    availableContent: [] // Will be populated from learning API if needed
  };

  // Handle tab changes from dashboard
  const handleTabChange = (tab: string) => {
    if (tab === 'portfolio') {
      nav.goToPortfolio();
    } else if (tab === 'settings') {
      nav.goToSettings(); // Direct navigation to /settings page
    } else if (tab === 'notifications') {
      nav.goToNotifications(); // Direct navigation to /notifications page
    } else if (tab === 'dashboard') {
      // Already on dashboard, do nothing
    } else {
      // For other tabs, navigate to home and let it handle
      nav.goToHome();
    }
  };

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
      activeTab="dashboard"
      setActiveTab={handleTabChange}
    >
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* 🎯 Baby Step 1: Welcome Card */}
          <WelcomeCard
            userName={auth.user?.username}
            isAuthenticated={auth.isAuthenticated}
            loading={auth.isLoading}
          />
          
          {/* 📊 Baby Step 2: Quick Stats Grid */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Portfolio Overview
            </h2>
            <QuickStatsGrid
              stats={portfolioStats}
              loading={loading}
              currency="$"
            />
          </div>
          
          {/* 🏗️ Two Column Layout for Learning and Portfolio Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* 📚 Learning Progress Widget */}
            <LearningProgress
              progressData={learningProgressData}
              notifications={notifications ? notifications.map(n => ({
                type: n.type,
                title: n.title,
                trigger_type: n.triggerType
              })) : undefined}
              loading={notificationsLoading}
              onContentClick={(content) => {
                console.log('Learning content clicked:', content);
                // TODO: Navigate to learning content detail
              }}
              onViewAllContent={() => {
                console.log('View all learning content');
                // TODO: Navigate to learning center
              }}
            />
            
            {/* 🚀 Future: Portfolio Insights Widget */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Portfolio Insights
                </h3>
                <p className="text-sm text-gray-500">
                  Coming soon: AI-powered insights and recommendations for your portfolio
                </p>
              </div>
            </div>
            
          </div>
          
          {/* 🚨 Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error loading dashboard data
                  </h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error}
                  </p>
                  <button
                    onClick={fetchPortfolioData}
                    className="text-sm text-red-600 hover:text-red-700 font-medium mt-2"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </div>
    </AppLayout>
  );
}
