'use client';

import { useSearchParams } from 'next/navigation';
import { PortfolioDashboard } from '@/components/portfolio/PortfolioDashboard';
import { WelcomeCard } from '@/components/dashboard/WelcomeCard';
import { QuickStatsGrid, PortfolioStats } from '@/components/dashboard/QuickStatsGrid';
import { LearningProgress, LearningProgressData } from '@/components/dashboard/LearningProgress';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { CapitalCraftAPI, PortfolioSummary, RiskAnalysis } from '@/lib/api';
import { useState, useEffect } from 'react';
import { useNavigation } from '@/hooks/useNavigation';
import HoldingCard from '@/components/portfolio/HoldingCard';
import { MetricCards } from '@/components/portfolio/MetricCards';
import PortfolioChart from '@/components/portfolio/PortfolioChart';
import PerformanceTimeline from '@/components/portfolio/PerformanceTimeline';
import PortfolioHealthScore from '@/components/portfolio/PortfolioHealthScore';
import TopPerformerBadge from '@/components/portfolio/TopPerformerBadge';
import { LearningAlert } from '@/components/learning/LearningAlert';
import { PieChart } from 'lucide-react';

export default function Home() {
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab') || 'portfolio';
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [showLearningModal, setShowLearningModal] = useState(false);
  
  const auth = useAuth();
  const { notifications, isLoading: notificationsLoading } = useNotificationStore();
  const nav = useNavigation();

  // Fetch portfolio data for all tabs
  const fetchPortfolioData = async () => {
    if (!auth.isAuthenticated || !auth.token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const [summaryData, riskData] = await Promise.all([
        CapitalCraftAPI.getMyPortfolio(auth.token),
        CapitalCraftAPI.getMyRiskAnalysis(auth.token)
      ]);
      
      setPortfolioSummary(summaryData);
      setRiskAnalysis(riskData?.risk_analysis || null);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch portfolio data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
  }, [auth.isAuthenticated, auth.token]);

  // Handle smooth tab changes with URL updates
  const handleTabChange = (newTab: string) => {
    if (newTab === 'dashboard') {
      nav.goToDashboard(); // Only dashboard is a separate page
    } else {
      // Update URL smoothly without page reload
      const newUrl = newTab === 'portfolio' ? '/' : `/?tab=${newTab}`;
      window.history.pushState({}, '', newUrl);
      // The URL change will trigger useSearchParams update automatically
    }
  };

  // Render content based on current tab
  const renderContent = () => {
    switch (tab) {
      case 'portfolio':
        // Render the complete portfolio content with all original components
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600">Here's how your portfolio is performing today.</p>
            </div>

            {/* Beautiful Metric Cards */}
            {portfolioSummary && (
              <MetricCards
                cashBalance={portfolioSummary.cash_balance}
                totalPortfolioValue={portfolioSummary.total_portfolio_value}
                totalUnrealizedPnl={portfolioSummary.total_unrealized_pnl}
                totalUnrealizedPnlPercent={portfolioSummary.total_unrealized_pnl_percent}
                holdingsCount={portfolioSummary.holdings_count}
                loading={loading}
              />
            )}

            {/* Holdings and Chart */}
            {portfolioSummary ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Section - Holdings and Educational Components (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Educational Components Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PortfolioHealthScore
                      holdings={portfolioSummary.holdings}
                      cashBalance={portfolioSummary.cash_balance}
                      totalPortfolioValue={portfolioSummary.total_portfolio_value}
                      totalPnl={portfolioSummary.total_unrealized_pnl}
                      investedAmount={portfolioSummary.total_portfolio_value - portfolioSummary.cash_balance}
                      loading={loading}
                    />
                    <TopPerformerBadge
                      holdings={portfolioSummary.holdings}
                      loading={loading}
                    />
                  </div>
                  
                  {/* Holdings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(portfolioSummary.holdings).map((holding) => (
                      <HoldingCard
                        key={holding.symbol}
                        symbol={holding.symbol}
                        shares={holding.shares}
                        averagePrice={holding.average_price}
                        currentPrice={holding.current_price || 0}
                        currentValue={holding.current_value || 0}
                        unrealizedPnl={holding.unrealized_pnl || 0}
                        unrealizedPnlPercent={holding.unrealized_pnl_percent || 0}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Chart Section - Right Column (1/3 width) */}
                <div className="lg:col-span-1 space-y-4">
                  {riskAnalysis?.learning_trigger && (
                    <div className="mb-6">
                      <LearningAlert
                        trigger={riskAnalysis.learning_trigger as 'volatility_basics' | 'market_psychology' | 'diversification'}
                        portfolioRisk={riskAnalysis.risk_level}
                        volatilityScore={riskAnalysis.volatility_score}
                        onDismiss={() => setRiskAnalysis(null)}
                        onLearnMore={() => setShowLearningModal(true)} 
                      />
                    </div>
                  )}
                  <PortfolioChart
                    cashBalance={portfolioSummary.cash_balance}
                    totalPortfolioValue={portfolioSummary.total_portfolio_value}
                    loading={loading}
                  />
                  <PerformanceTimeline loading={loading} />
                </div>
              </div>
            ) : null}
            
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : portfolioSummary && Object.keys(portfolioSummary.holdings).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Holdings Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start your investment journey by buying your first stock!
                </p>
                <button 
                  onClick={() => {/* TODO: Implement buy modal */}}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buy Your First Stock
                </button>
              </div>
            ) : null}

            {!loading && (
              <div className="text-center mt-8">
                <button 
                  onClick={fetchPortfolioData}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return <SettingsPage />;
      
      case 'notifications':
        return <NotificationsPage />;
      
      case 'dashboard':
        // Dashboard content for when accessed via /?tab=dashboard
        const portfolioStats: PortfolioStats = {
          totalValue: portfolioSummary?.total_portfolio_value,
          cashBalance: portfolioSummary?.cash_balance,
          holdingsCount: portfolioSummary?.holdings_count,
          totalPnL: portfolioSummary?.total_unrealized_pnl,
          totalPnLPercent: portfolioSummary?.total_unrealized_pnl_percent
        };

        const learningProgressData: LearningProgressData = {
          totalContent: 4,
          completedContent: notifications?.filter(n => n.type === 'education').length || 0,
          currentStreak: (notifications?.filter(n => n.type === 'education').length || 0) > 0 ? 1 : 0,
          recentAchievements: (notifications?.filter(n => n.type === 'education').length || 0) > 0 
            ? ['Educational Interaction', 'Portfolio Analysis'] 
            : [],
          availableContent: []
        };

        return (
          <div className="p-6">
            <div className="max-w-7xl mx-auto space-y-8">
              <WelcomeCard
                userName={auth.user?.username}
                isAuthenticated={auth.isAuthenticated}
                loading={auth.isLoading}
              />
              
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
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <LearningProgress
                  progressData={learningProgressData}
                  notifications={notifications ? notifications.map(n => ({
                    type: n.type,
                    title: n.title,
                    trigger_type: n.triggerType
                  })) : undefined}
                  loading={notificationsLoading}
                  onContentClick={(content) => console.log('Learning content clicked:', content)}
                  onViewAllContent={() => console.log('View all learning content')}
                />
                
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
            </div>
          </div>
        );
      
      case 'stock-search':
        return (
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
              <p className="text-gray-600">
                Advanced stock search and analysis tools will be available here.
              </p>
            </div>
          </div>
        );

      case 'learn':
        return (
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
              <p className="text-gray-600">
                Interactive lessons and educational content to improve your investing skills.
              </p>
            </div>
          </div>
        );

      case 'achievements':
        return (
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
              <p className="text-gray-600">
                Unlock badges and track your progress as you reach investment milestones.
              </p>
            </div>
          </div>
        );

      case 'analytics':
        return (
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
              <p className="text-gray-600">
                Detailed portfolio analytics, performance metrics, and risk analysis tools.
              </p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <p className="text-gray-600">The requested page does not exist.</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Page Not Found</h3>
              <p className="text-gray-600">
                Please check the URL and try again.
              </p>
            </div>
          </div>
        );
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
      activeTab={tab}
      setActiveTab={handleTabChange}
    >
      {renderContent()}
    </AppLayout>
  );
}