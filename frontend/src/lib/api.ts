// Dynamic API base depending on environment and client
const getApiBase = () => {
  // If explicitly set, use it
  if (process.env.NEXT_PUBLIC_API_BASE) {
    return process.env.NEXT_PUBLIC_API_BASE;
  }
  
  // Production
  if (process.env.NODE_ENV === 'production') {
    return 'https://capital-craft-production.up.railway.app';
  }
  
  // Development: check if we're on mobile/network
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // If accessing via IP address (mobile), use same IP for API
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return `http://${hostname}:8000`;
    }
  }
  
  // Default to localhost (desktop development)
  return 'http://localhost:8000';
};

const API_BASE = getApiBase();

  export interface Stock {
    symbol: string;
    name: string;
    current_price: number;
    sector: string;
    market_cap: number | null;
    pe_ratio: number | null;
    // Educational fields nuevos:
    eps?: number;
    beta?: number;
    dividend_yield?: number;
    book_value?: number;
    price_to_book?: number;
    // ... etc (todos los campos que tienes en backend)
  }

export interface Holding {
  symbol: string;
  shares: number;
  average_price: number;
}

export interface Portfolio {
  user_id: string;
  cash_balance: number;
  holdings: Record<string, Holding>;
  total_holdings: number;
  created_at: string;
}

export interface PortfolioSummary {
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

export interface LearningContent {
  id: string;
  title: string;
  content: string;
  trigger_type: string;
  difficulty_level: string;
  estimated_read_time: number;
  tags: string[];
  learning_objectives: string[];
  prerequisites: string[];
  next_suggested: string[];
  created_at: string;
  updated_at: string;
}

export interface RiskAnalysis {
  risk_level: 'LOW' | 'MEDIUM' | 'HIGH';
  volatility_score: number;
  learning_trigger: string | null;
  risk_factors: string[];
  recommendation: string;
}

export class CapitalCraftAPI {
  static async getPortfolio(userId: string): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}/portfolio/${userId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio');
    }
    return response.json();
  }

  static async getPortfolioSummary(userId: string): Promise<PortfolioSummary> {
    const response = await fetch(`${API_BASE}/portfolio/${userId}/summary`);
    if (!response.ok) {
      throw new Error('Failed to fetch portfolio summary');
    }
    return response.json();
  }

  static async buyStock(userId: string, symbol: string, shares: number): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}/portfolio/${userId}/buy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to buy stock');
    }
    return response.json();
  }

  static async sellStock(userId: string, symbol: string, shares: number): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}/portfolio/${userId}/sell`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to sell stock');
    }
    return response.json();
  }

  static async getStock(symbol: string): Promise<Stock> {
    const response = await fetch(`${API_BASE}/stock/${symbol}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stock data');
    }
    return response.json();
  }

  static async getRiskAnalysis(userId: string): Promise<RiskAnalysis> {
    const response = await fetch(`${API_BASE}/portfolio/${userId}/risk-analysis`);
    if (!response.ok) {
      throw new Error('Failed to fetch risk analysis');
    }
    const result = await response.json();
    return result.data; // Backend devuelve { success: true, data: {...} }
  }

  // Agregar método en CapitalCraftAPI class
static async getLearningContent(trigger: string): Promise<LearningContent> {
  const response = await fetch(`${API_BASE}/learning/content/${trigger}`);
  if (!response.ok) {
    throw new Error('Failed to fetch learning content');
  }
  const result = await response.json();
  return result.data;
}

  static async searchStocks(query: string, limit: number = 10): Promise<Stock[]> {
    const response = await fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    if (!response.ok) {
      throw new Error('Failed to search stocks');
    }
    const result = await response.json();
    return result.results || [];
  }
}

