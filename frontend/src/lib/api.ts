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

/**
 * Enhanced CapitalCraftAPI with automatic authentication handling
 * 
 * @description API client with built-in token refresh and 401 handling
 * @responsibility Single: Handle all API communication with authentication
 * @principle Single Responsibility + Dependency Inversion
 * 
 * @layer Infrastructure Layer (API Client)
 * @pattern Facade Pattern + Interceptor Pattern
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 * @version 2.0.0
 */
export class CapitalCraftAPI {
  private static httpInterceptor: any = null;

  /**
   * Set HTTP interceptor for automatic authentication handling
   * @param interceptor - HTTP interceptor instance
   * @principle Dependency Injection
   */
  static setHttpInterceptor(interceptor: any): void {
    this.httpInterceptor = interceptor;
  }

  /**
   * Fetch wrapper with interceptor support
   * @param url - URL to fetch
   * @param options - Fetch options
   * @param fetchFn - Optional fetch function for testing
   * @returns Promise resolving to response
   */
  private static async fetch(url: string, options: RequestInit = {}, fetchFn: typeof fetch = fetch): Promise<Response> {
    if (this.httpInterceptor) {
      // Use intercepted fetch for automatic auth handling
      const { interceptedFetch } = await import('../infrastructure/http/AuthHttpInterceptor');
      return interceptedFetch(url, options, this.httpInterceptor, fetchFn);
    }
    
    // Use regular fetch
    return fetchFn(url, options);
  }

  static async login(credentials: LoginRequest, fetchFn?: typeof fetch): Promise<AuthResponse> {
    const response = await this.fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    }, fetchFn);

    if (!response.ok && response.status !== 401) {
      const error = await response.json().catch(() => ({ detail: 'Login failed' }));
      throw new Error(error.detail || 'Login failed');
    }

    return response.json();
  }

  static async register(userData: RegisterRequest, fetchFn?: typeof fetch): Promise<AuthResponse> {
    const response = await this.fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    }, fetchFn);

    if (!response.ok && response.status !== 401) {
      const error = await response.json().catch(() => ({ detail: 'Registration failed' }));
      throw new Error(error.detail || 'Registration failed');
    }

    return response.json();
  }

  static async refreshToken(refreshData: RefreshTokenRequest, fetchFn?: typeof fetch): Promise<AuthResponse> {
    const response = await this.fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(refreshData),
    }, fetchFn);

    if (!response.ok && response.status !== 401) {
      const error = await response.json().catch(() => ({ detail: 'Token refresh failed' }));
      throw new Error(error.detail || 'Token refresh failed');
    }

    return response.json();
  }

  static async getCurrentUser(accessToken: string, fetchFn?: typeof fetch): Promise<User> {
    const response = await this.fetch(`${API_BASE}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    }, fetchFn);

    if (!response.ok && response.status !== 401) {
      const error = await response.json().catch(() => ({ detail: 'Failed to get current user' }));
      throw new Error(error.detail || 'Failed to get current user');
    }

    return response.json();
  }

  static async logout(fetchFn?: typeof fetch): Promise<void> {
    const response = await this.fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
    }, fetchFn);

    if (!response.ok && response.status !== 401) {
      const error = await response.json().catch(() => ({ detail: 'Logout failed' }));
      throw new Error(error.detail || 'Logout failed');
    }
  }

  static getGoogleOAuthUrl(): string {
    return `${API_BASE}/auth/google`;
  }

  static async getStock(symbol: string, fetchFn?: typeof fetch): Promise<Stock> {
    const response = await this.fetch(`${API_BASE}/stock/${symbol}`, {}, fetchFn);
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch stock data');
    }
    return response.json();
  }

  static async getStocks(fetchFn?: typeof fetch): Promise<Stock[]> {
    const response = await this.fetch(`${API_BASE}/stocks`, {}, fetchFn);
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch stocks');
    }
    const result = await response.json();
    return result.results || [];
  }

  static async getRiskAnalysis(userId: string, fetchFn?: typeof fetch): Promise<RiskAnalysis> {
    const response = await this.fetch(`${API_BASE}/portfolio/${userId}/risk-analysis`, {}, fetchFn);
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch risk analysis');
    }
    const result = await response.json();
    return result.data;
  }

  static async getLearningContent(trigger: string, fetchFn?: typeof fetch): Promise<LearningContent> {
    const response = await this.fetch(`${API_BASE}/learning/content/${trigger}`, {}, fetchFn);
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch learning content');
    }
    const result = await response.json();
    return result.data;
  }

  static async searchStocks(token: string, query: string, fetchFn?: typeof fetch): Promise<Stock[]> {
    const response = await this.fetch(`${API_BASE}/stocks/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, fetchFn);
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to search stocks');
    }
    const result = await response.json();
    return result.results || [];
  }

  static async buyStock(token: string, symbol: string, shares: number, fetchFn?: typeof fetch): Promise<any> {
    const response = await this.fetch(`${API_BASE}/auth/portfolio/buy`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    }, fetchFn);
    
    if (!response.ok && response.status !== 401) {
      throw new Error(`Failed to buy stock: ${response.status} ${response.statusText}`);
    }
    
    return await response.json();
  }

  static async getMyPortfolio(token: string, fetchFn?: typeof fetch): Promise<any> {
    const response = await this.fetch(`${API_BASE}/portfolio/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, fetchFn);
    
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch portfolio');
    }
    
    return await response.json();
  }

  static async getMyRiskAnalysis(token: string, fetchFn?: typeof fetch): Promise<any> {
    const response = await this.fetch(`${API_BASE}/portfolio/me/risk-analysis`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }, fetchFn);
    
    if (!response.ok && response.status !== 401) {
      throw new Error('Failed to fetch risk analysis');
    }
    
    return await response.json();
  }

  static async sellMyStock(token: string, symbol: string, shares: number, fetchFn?: typeof fetch): Promise<Portfolio> {
    const response = await this.fetch(`${API_BASE}/auth/portfolio/sell`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ symbol, shares }),
    }, fetchFn);
    
    if (!response.ok && response.status !== 401) {
      throw new Error(`Failed to sell stock: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }
}
