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
  id?: string;
  portfolio_id?: string;
  symbol: string;
  shares: number;
  average_price: number;
  current_price?: number;  // Added from backend portfolio summary
  invested_value?: number; // Added from backend portfolio summary  
  current_value?: number;  // Added from backend portfolio summary
  unrealized_pnl?: number; // Added from backend portfolio summary
  unrealized_pnl_percent?: number; // Added from backend portfolio summary
  beta?: number; // For risk calculation
  created_at?: string;
  updated_at?: string;
  error?: string; // For when price data fails
}

export interface Portfolio {
  id?: string;
  user_id: string;
  cash_balance: number;
  created_at?: string;
  updated_at?: string;
  // Holdings are now loaded separately, not embedded
}

export interface PortfolioSummary {
  id?: string;
  user_id: string;
  cash_balance: number;
  total_invested: number;
  total_current_value: number;
  total_portfolio_value: number;
  total_unrealized_pnl: number;
  total_unrealized_pnl_percent: number;
  holdings_count: number;
  holdings: Record<string, Holding>;  // Backend returns object by symbol, not array
  created_at?: string;
  updated_at?: string;
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
  recommendations: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: User;
}

export interface User {
  id: string;
  email: string;
  username: string;
  provider: string;
  avatar_url?: string;
  is_active: boolean;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export class CapitalCraftAPI {

  static async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  static async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  static async refreshToken(refreshData: RefreshTokenRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Token refresh failed');
    }

    return response.json();
  }

  static async getCurrentUser(accessToken: string): Promise<User> {
    const response = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to get current user');
    }

    return response.json();
  }

  static async logout(): Promise<void> {
    const response = await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Logout failed');
    }
  }

  static getGoogleOAuthUrl(): string {
    return `${API_BASE}/auth/google`;
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

  static async getMyPortfolio(token: string): Promise<PortfolioSummary> {
    const response = await fetch(`${API_BASE}/portfolio/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch authenticated portfolio');
    }
    
    const portfolioData = await response.json();
    
    return portfolioData;
  }

  static async getMyRiskAnalysis(token: string): Promise<RiskAnalysis> {
    const response = await fetch(`${API_BASE}/portfolio/me/risk-analysis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch authenticated risk analysis');
    }
    
    return response.json();
  }

  static async buyMyStock(token: string, symbol: string, shares: number): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}/auth/portfolio/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to buy stock with authentication');
    }
    
    return response.json();
  }

  static async sellMyStock(token: string, symbol: string, shares: number): Promise<Portfolio> {
    const response = await fetch(`${API_BASE}/auth/portfolio/sell`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to sell stock with authentication');
    }
    
    return response.json();
  }
}
