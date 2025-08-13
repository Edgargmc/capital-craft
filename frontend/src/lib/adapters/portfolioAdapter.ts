import { Portfolio, PortfolioSummary, Holding } from '@/lib/api';

// Legacy interfaces that the frontend currently expects
export interface LegacyHolding {
  symbol: string;
  shares: number;
  average_price: number;
  current_price?: number;
  invested_value?: number;
  current_value?: number;
  unrealized_pnl?: number;
  unrealized_pnl_percent?: number;
}

export interface LegacyPortfolio {
  user_id: string;
  cash_balance: number;
  holdings: Record<string, LegacyHolding>;
  total_holdings: number;
  created_at: string;
}

export interface LegacyPortfolioSummary {
  user_id: string;
  cash_balance: number;
  total_invested: number;
  total_current_value: number;
  total_portfolio_value: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_percent: number;
  holdings_count: number;
  holdings: Record<string, {
    symbol: string;
    shares: number;
    average_price: number;
    current_price: number;
    invested_value: number;
    current_value: number;
    unrealized_pnl: number;
    unrealized_pnl_percent: number;
  }>;
  created_at: string;
}

/**
 * Portfolio Adapter - Converts new PostgreSQL structure to legacy frontend structure
 * This allows gradual migration without breaking existing components
 */
export class PortfolioAdapter {
  
  /**
   * Convert new Portfolio to legacy format
   */
  static toLegacyPortfolio(portfolio: Portfolio, holdings: Holding[] = []): LegacyPortfolio {
    const holdingsRecord: Record<string, LegacyHolding> = {};
    
    holdings.forEach(holding => {
      holdingsRecord[holding.symbol] = {
        symbol: holding.symbol,
        shares: holding.shares,
        average_price: holding.average_price,
      };
    });

    return {
      user_id: portfolio.user_id,
      cash_balance: portfolio.cash_balance,
      holdings: holdingsRecord,
      total_holdings: holdings.length,
      created_at: portfolio.created_at || new Date().toISOString(),
    };
  }

  /**
   * Convert new PortfolioSummary to legacy format
   */
  static toLegacyPortfolioSummary(summary: PortfolioSummary): LegacyPortfolioSummary {
    const holdingsRecord: Record<string, any> = {};
    
    // Convert holdings array to Record format
    if (Array.isArray(summary.holdings)) {
      summary.holdings.forEach(holding => {
        holdingsRecord[holding.symbol] = {
          symbol: holding.symbol,
          shares: holding.shares,
          average_price: holding.average_price,
          current_price: 0, // Will be populated by backend
          invested_value: 0,
          current_value: 0,
          unrealized_pnl: 0,
          unrealized_pnl_percent: 0,
        };
      });
    }

    return {
      user_id: summary.user_id,
      cash_balance: summary.cash_balance,
      total_invested: summary.total_invested,
      total_current_value: summary.total_current_value,
      total_portfolio_value: summary.total_portfolio_value,
      total_unrealized_pnl: summary.total_unrealized_pnl,
      total_unrealized_pnl_percent: summary.total_unrealized_pnl_percent,
      holdings_count: summary.holdings_count,
      holdings: holdingsRecord,
      created_at: summary.created_at || new Date().toISOString(),
    };
  }

  /**
   * Convert holdings array to legacy Record format
   */
  static holdingsArrayToRecord(holdings: Holding[]): Record<string, LegacyHolding> {
    const record: Record<string, LegacyHolding> = {};
    
    holdings.forEach(holding => {
      record[holding.symbol] = {
        symbol: holding.symbol,
        shares: holding.shares,
        average_price: holding.average_price,
      };
    });

    return record;
  }
}
