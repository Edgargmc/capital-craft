// src/components/portfolio/PortfolioDashboard.tsx - VERSIÓN COMPLETA
'use client';

import { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';
import { CapitalCraftAPI, PortfolioSummary, Holding } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import  HoldingCard  from './HoldingCard';
import { MetricCards } from './MetricCards';
import PortfolioChart from './PortfolioChart';
import PerformanceTimeline from './PerformanceTimeline';
import PortfolioHealthScore from './PortfolioHealthScore';
import TopPerformerBadge from './TopPerformerBadge';
import { BuyStockModal } from '@/components/modals/BuyStockModal';
import { SellStockModal } from '@/components/modals/SellStockModal';
import { LearningAlert } from '@/components/learning/LearningAlert';
import { LearningContentModal } from '@/components/modals/LearningContentModal';
import { SettingsPage } from '@/components/settings/SettingsPage';
import { NotificationsPage } from '@/components/notifications/NotificationsPage';
import { RiskAnalysis } from '@/lib/api';
import { useNotificationStore } from '@/lib/stores/notificationStore';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams } from 'next/navigation';

interface PortfolioDashboardProps {
  userId?: string;
  initialTab?: string;
}

export function PortfolioDashboard({ userId = "demo", initialTab = "portfolio" }: PortfolioDashboardProps) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [showLearningModal, setShowLearningModal] = useState(false);
  const [activeTab, setActiveTab] = useState(initialTab);
  
  const auth = useAuth();
  const { fetchNotifications } = useNotificationStore();
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);
  const searchParams = useSearchParams();

  // Sync activeTab with URL changes for smooth navigation
  useEffect(() => {
    const urlTab = searchParams.get('tab') || 'portfolio';
    if (urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (auth.isLoading) {
        setLoading(false);
        return;
      }
      
      if (auth.isAuthenticated && auth.token) {
        try {
          const [summaryData, riskData] = await Promise.all([
            CapitalCraftAPI.getMyPortfolio(auth.token),
            CapitalCraftAPI.getMyRiskAnalysis(auth.token)
          ]);
          
          setSummary(summaryData);
          setRiskAnalysis(riskData?.risk_analysis || null);
        } catch (riskError) {
          console.error('❌ Error fetching risk analysis:', riskError);
          // Still try to get portfolio data alone
          try {
            const summaryData = await CapitalCraftAPI.getMyPortfolio(auth.token);
            setSummary(summaryData);
            setRiskAnalysis(null);
          } catch (portfolioError) {
            console.error('❌ Error fetching portfolio:', portfolioError);
            throw portfolioError;
          }
        }
      } else {
        setSummary(null);
        setRiskAnalysis(null);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleTradeSuccess = async () => {
    await fetchData();
    await fetchNotifications(userId);
  };
  
  useEffect(() => {
    fetchData();
  }, [userId, auth.isLoading]);

  const headerData = summary ? {
    cashBalance: summary.cash_balance,
    totalPortfolioValue: summary.total_portfolio_value,
    totalUnrealizedPnl: summary.total_unrealized_pnl,
    totalUnrealizedPnlPercent: summary.total_unrealized_pnl_percent,
    holdingsCount: summary.holdings_count,
    holdings: summary.holdings,
  } : null;

  if (error) {
    return (
      <AppLayout
        headerData={null}
        headerLoading={false}
        onBuyClick={() => setShowBuyModal(true)}
        onSellClick={() => setShowSellModal(true)}
        userId={userId} 
      >
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-red-600 mb-4">Error: {error}</p>
            <button 
              onClick={fetchData}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      <AppLayout 
        headerData={{
          cashBalance: summary?.cash_balance || 0,
          totalPortfolioValue: summary?.total_portfolio_value || 0,
          totalUnrealizedPnl: summary?.total_unrealized_pnl || 0,
          totalUnrealizedPnlPercent: summary?.total_unrealized_pnl_percent || 0,
          holdingsCount: summary?.holdings_count || 0,
          holdings: summary?.holdings || {}
        }}
        headerLoading={loading}
        onBuyClick={() => setShowBuyModal(true)}
        onSellClick={() => setShowSellModal(true)}
        userId={userId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNavigateToNotifications={() => setActiveTab('notifications')} 
      >
        {activeTab === 'portfolio' ? (
          <div className="p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
              <p className="text-gray-600">Here&apos;s how your portfolio is performing today.</p>
            </div>

            {/* Beautiful Metric Cards */}
            {summary && (
              <MetricCards
                cashBalance={summary.cash_balance}
                totalPortfolioValue={summary.total_portfolio_value}
                totalUnrealizedPnl={summary.total_unrealized_pnl}
                totalUnrealizedPnlPercent={summary.total_unrealized_pnl_percent}
                holdingsCount={summary.holdings_count}
                loading={loading}
              />
            )}

            {/* Holdings and Chart */}
            {summary ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Section - Holdings and Educational Components (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Educational Components Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PortfolioHealthScore
                      holdings={summary.holdings}
                      cashBalance={summary.cash_balance}
                      totalPortfolioValue={summary.total_portfolio_value}
                      totalPnl={summary.total_unrealized_pnl}
                      investedAmount={summary.total_portfolio_value - summary.cash_balance}
                      loading={loading}
                    />
                    <TopPerformerBadge
                      holdings={summary.holdings}
                      loading={loading}
                    />
                  </div>
                  
                  {/* Holdings Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.values(summary.holdings).map((holding) => (
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
                    cashBalance={summary.cash_balance}
                    totalPortfolioValue={summary.total_portfolio_value}
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
            ) : summary && Object.keys(summary.holdings).length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Holdings Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start your investment journey by buying your first stock!
                </p>
                <button 
                  onClick={() => setShowBuyModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Buy Your First Stock
                </button>
              </div>
            ) : null}

            {!loading && (
              <div className="text-center mt-8">
                <button 
                  onClick={fetchData}
                  className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Refresh Data
                </button>
              </div>
            )}
          </div>
        ) : activeTab === 'settings' ? (
          <SettingsPage />
        ) : activeTab === 'notifications' ? (
          <NotificationsPage />
        ) : null}
      </AppLayout>

      <BuyStockModal
        isOpen={showBuyModal}
        onClose={() => setShowBuyModal(false)}
        onSuccess={handleTradeSuccess}
        userId={userId}
        availableCash={summary?.cash_balance || 0}
      />

      <SellStockModal
        isOpen={showSellModal}
        onClose={() => setShowSellModal(false)}
        onSuccess={handleTradeSuccess}
        userId={userId}
        holdings={summary?.holdings || {}}
      />

      <LearningContentModal 
        isOpen={showLearningModal}
        onClose={() => setShowLearningModal(false)}
        trigger={riskAnalysis?.learning_trigger || ''}
        userId={userId} 
      />
    </>
  );
}