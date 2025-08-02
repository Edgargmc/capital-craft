from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
from ..core.entities.portfolio import Portfolio
from ..core.entities.stock import Stock


@dataclass
class PortfolioRiskAnalysis:
    risk_level: str
    volatility_score: float
    learning_trigger: Optional[str]
    risk_factors: list[str]
    recommendation: str


class AnalyzePortfolioRisk:
    """
    Use case: Analyze portfolio risk and determine learning triggers
    Follows SOLID principles - Single responsibility for risk analysis
    """
    
    def __init__(self, stock_provider):
        self.stock_provider = stock_provider
    
    def execute(self, portfolio: Portfolio) -> PortfolioRiskAnalysis:
        """
        Analyze portfolio risk and determine contextual learning triggers
        
        Baby step: Focus on volatility-based triggers only
        """
        volatility_score = self._calculate_portfolio_beta(portfolio)
        risk_level = self._determine_risk_level(volatility_score)
        learning_trigger = self._get_learning_trigger(risk_level, volatility_score)
        risk_factors = self._identify_risk_factors(portfolio, volatility_score)
        recommendation = self._get_recommendation(risk_level)
        
        return PortfolioRiskAnalysis(
            risk_level=risk_level,
            volatility_score=volatility_score,
            learning_trigger=learning_trigger,
            risk_factors=risk_factors,
            recommendation=recommendation
        )
    
    def _calculate_portfolio_beta(self, portfolio: Portfolio) -> float:
        """Calculate weighted average beta using real stock data"""
        if not portfolio.holdings:
            return 1.0
        
        total_value = Decimal('0')
        weighted_beta_sum = Decimal('0')
        
        for symbol, holding in portfolio.holdings.items():
            try:
                # Get stock data with beta information
                stock_data = self.stock_provider.get_stock_data(symbol)
                current_value = holding.shares * stock_data.current_price
                total_value += current_value
                
                # Use real beta from stock data, fallback to 1.0
                beta = Decimal(str(stock_data.beta)) if stock_data.beta else Decimal('1.0')
                weighted_beta_sum += beta * current_value
                
            except Exception:
                # Fallback: use holding's average price and beta = 1.0
                current_value = holding.shares * holding.average_price
                total_value += current_value
                weighted_beta_sum += Decimal('1.0') * current_value
        
        return float(weighted_beta_sum / total_value) if total_value > 0 else 1.0
    
    def _determine_risk_level(self, volatility_score: float) -> str:
        """Simple but effective risk categorization"""
        if volatility_score > 1.3:
            return "HIGH"
        elif volatility_score > 0.8:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _get_learning_trigger(self, risk_level: str, volatility_score: float) -> Optional[str]:
        """Determine contextual learning trigger based on portfolio analysis"""
        if risk_level == "HIGH":
            if volatility_score > 1.5:
                return "volatility_advanced"  # More sophisticated content
            return "volatility_basics"
        elif risk_level == "MEDIUM" and volatility_score > 1.0:
            return "diversification_basics"
        
        return None  # No learning trigger for low-risk portfolios
    
    def _identify_risk_factors(self, portfolio: Portfolio, volatility_score: float) -> list[str]:
        """Identify specific risk factors for educational context"""
        factors = []
        
        if volatility_score > 1.3:
            factors.append("High portfolio volatility")
        
        if len(portfolio.holdings) < 3:
            factors.append("Limited diversification")
        
        # Could add more factors: sector concentration, individual stock weight, etc.
        return factors
    
    def _get_recommendation(self, risk_level: str) -> str:
        """Simple recommendation based on risk level"""
        recommendations = {
            "HIGH": "Consider learning about volatility management and diversification strategies",
            "MEDIUM": "Your portfolio has moderate risk. Learn about balancing growth and stability",
            "LOW": "Conservative portfolio. Consider learning about growth opportunities"
        }
        return recommendations.get(risk_level, "Continue learning about investment fundamentals")

