// src/components/portfolio/PortfolioDashboard.tsx - VERSIÓN COMPLETA
'use client';

import { useState, useEffect } from 'react';
import { PieChart } from 'lucide-react';
import { CapitalCraftAPI, PortfolioSummary } from '@/lib/api';
import { AppLayout } from '@/components/layout/AppLayout';
import  HoldingCard  from './HoldingCard';
import { BuyStockModal } from '@/components/modals/BuyStockModal';
import { SellStockModal } from '@/components/modals/SellStockModal';
import { LearningAlert } from '@/components/learning/LearningAlert';
import { LearningContentModal } from '@/components/modals/LearningContentModal';
import { RiskAnalysis } from '@/lib/api';
import { useNotificationStore } from '@/lib/stores/notificationStore';



interface PortfolioDashboardProps {
  userId: string;
}

export function PortfolioDashboard({ userId }: PortfolioDashboardProps) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [riskAnalysis, setRiskAnalysis] = useState<RiskAnalysis | null>(null);
  const [showLearningModal, setShowLearningModal] = useState(false);

  // Notification store
  const { fetchNotifications } = useNotificationStore();
  
  // State para modals
  const [showBuyModal, setShowBuyModal] = useState(false);
  const [showSellModal, setShowSellModal] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [summaryData, riskData] = await Promise.all([
        CapitalCraftAPI.getPortfolioSummary(userId),
        CapitalCraftAPI.getRiskAnalysis(userId)
      ]);
      setSummary(summaryData);
      setRiskAnalysis(riskData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh both portfolio and notifications after trade
  const handleTradeSuccess = async () => {
    console.log('🔄 Trade successful - refreshing portfolio and notifications');
    
    // Refresh portfolio data
    await fetchData();
    
    // Refresh notifications immediately to show new educational content
    await fetchNotifications(userId);
    
    console.log('✅ Portfolio and notifications refreshed');
  };
  
  useEffect(() => {
    fetchData();
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

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
        headerData={headerData} 
        headerLoading={loading}
        onBuyClick={() => setShowBuyModal(true)}
        onSellClick={() => setShowSellModal(true)}
      >
        <div className="p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Here&apos;s how your portfolio is performing today.</p>
          </div>
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
          {/* Holdings Section */}
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
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.values(summary.holdings).map((holding) => (
                <HoldingCard
                  key={holding.symbol}
                  symbol={holding.symbol}
                  shares={holding.shares}
                  averagePrice={holding.average_price}
                  currentPrice={holding.current_price}
                  currentValue={holding.current_value}
                  unrealizedPnl={holding.unrealized_pnl}
                  unrealizedPnlPercent={holding.unrealized_pnl_percent}
                />
              ))}
            </div>
          ) : null}

          {/* Refresh Button */}
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
      </AppLayout>

      {/* Modals */}
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