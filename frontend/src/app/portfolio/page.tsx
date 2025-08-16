'use client';

import { useSearchParams } from 'next/navigation';
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

/**
 * 📊 Portfolio Page - Dedicated Portfolio Route
 * 
 * This page provides the main portfolio functionality at /portfolio
 * with smooth tab-based navigation and no redirects.
 */
export default function PortfolioPage() {
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

  const handleTabChange = (newTab: string) => {
    // Use switchTab instead of updateTab - that's the correct method name
    nav.switchTab(newTab as any);
  };

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

  const renderContent = () => {
    switch (tab) {
      case 'portfolio':
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

      default:
        return (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Page Not Found</h3>
              <p className="text-gray-600">The requested tab does not exist.</p>
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
