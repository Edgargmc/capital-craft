"""
📁 FILE: use_cases/analyze_portfolio_risk.py

Clean fixed version - replace entire file content
"""
from dataclasses import dataclass
from decimal import Decimal
from typing import Optional
from datetime import datetime
from ..core.entities.portfolio import Portfolio
from ..core.entities.stock import Stock
from ..core.entities.notification import NotificationTriggerType
from ..core.interfaces.notification_repository import NotificationRepository
from ..use_cases.generate_notification import GenerateNotificationUseCase


@dataclass
class PortfolioRiskAnalysis:
    risk_level: str
    volatility_score: float
    learning_trigger: Optional[str]
    risk_factors: list[str]
    recommendation: str
    notifications_generated: int = 0  # NEW: Track notifications generated
    analysis_date: datetime = None  # NEW: Analysis timestamp
    
    def __post_init__(self):
        """Set analysis_date to current time if not provided"""
        if self.analysis_date is None:
            self.analysis_date = datetime.utcnow()


class AnalyzePortfolioRisk:
    """
    Use case: Analyze portfolio risk and determine learning triggers
    Enhanced: Now with automatic notification generation
    Follows SOLID principles - Single responsibility for risk analysis
    """
    
    def __init__(self, 
                 get_stock_data_use_case, 
                 notification_service: Optional[GenerateNotificationUseCase] = None,
                 notification_repository=None):
        self.get_stock_data_use_case = get_stock_data_use_case
        self.notification_service = notification_service  # NEW: Optional dependency
        self.notification_repository = notification_repository  # NEW: For duplicate detection
    
    async def execute(self, portfolio: Portfolio, user_id: str) -> PortfolioRiskAnalysis:
        """
        Analyze portfolio risk and determine contextual learning triggers
        Enhanced: Now generates notifications automatically
        
        Args:
            portfolio: Portfolio to analyze
            user_id: User ID for notification generation
        """
        volatility_score = self._calculate_portfolio_beta(portfolio)
        risk_level = self._determine_risk_level(volatility_score)
        learning_trigger = self._get_learning_trigger(risk_level, volatility_score)
        risk_factors = self._identify_risk_factors(portfolio, volatility_score)
        recommendation = self._get_recommendation(risk_level)
        
        # NEW: Generate notifications if service is available
        notifications_generated = 0
        if self.notification_service:
            notifications_generated = await self._generate_contextual_notifications(
                user_id, portfolio, risk_level, volatility_score, learning_trigger
            )
        
        return PortfolioRiskAnalysis(
            risk_level=risk_level,
            volatility_score=volatility_score,
            learning_trigger=learning_trigger,
            risk_factors=risk_factors,
            recommendation=recommendation,
            notifications_generated=notifications_generated
        )
    
    def execute_sync(self, portfolio: Portfolio) -> PortfolioRiskAnalysis:
        """
        Synchronous version for backward compatibility
        Maintains existing functionality without notifications
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
            recommendation=recommendation,
            notifications_generated=0
        )
    
    async def _generate_contextual_notifications(
        self,
        user_id: str,
        portfolio: Portfolio,
        risk_level: str,
        volatility_score: float,
        learning_trigger: Optional[str]
    ) -> int:
        """
        Generate contextual notifications based on portfolio analysis
        Baby step: Focus on most impactful triggers only
        Enhanced: Prevent duplicate notifications
        """
        notifications_count = 0
        
        # Check for recent similar notifications to prevent duplicates
        recent_notifications = await self._get_recent_notifications(user_id)
        
        # 1. Risk level change notification - enhanced to include MEDIUM
        if risk_level in ["HIGH", "MEDIUM"]:
            # Check if we already have a recent risk notification for this level
            has_recent_risk_notification = any(
                notif.trigger_type == NotificationTriggerType.RISK_CHANGE and 
                notif.trigger_data.get("new_risk_level") == risk_level
                for notif in recent_notifications
            )
            
            print(f"🔍 RISK DUPLICATE CHECK: risk_level={risk_level}, has_recent={has_recent_risk_notification}")
            print(f"🔍 Recent notifications check:")
            for notif in recent_notifications:
                print(f"  - Type: {notif.trigger_type} (is enum: {type(notif.trigger_type)})")
                print(f"  - Data: {notif.trigger_data}")
                print(f"  - Matches: {notif.trigger_type == NotificationTriggerType.RISK_CHANGE}")
            
            if not has_recent_risk_notification:
                print(f"✅ GENERATING new RISK_CHANGE notification for {risk_level}")
                notification = await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.RISK_CHANGE,
                    trigger_data={
                        "new_risk_level": risk_level,
                        "volatility_score": volatility_score,
                        "risk_level_changed": True
                    }
                )
                if notification:
                    notifications_count += 1
            else:
                print(f"🚫 SKIPPING duplicate RISK_CHANGE notification for {risk_level}")
        
        # 2. Educational moment based on learning trigger
        if learning_trigger:
            # Check if we already have a recent educational notification for this topic
            topic = self._get_topic_for_trigger(learning_trigger)
            has_recent_educational_notification = any(
                notif.trigger_type == NotificationTriggerType.EDUCATIONAL_MOMENT and 
                notif.trigger_data.get("topic") == topic
                for notif in recent_notifications
            )
            
            print(f"🔍 EDUCATIONAL DUPLICATE CHECK: topic={topic}, has_recent={has_recent_educational_notification}")
            
            if not has_recent_educational_notification:
                print(f"✅ GENERATING new EDUCATIONAL_MOMENT notification for {topic}")
                notification = await self.notification_service.execute(
                    user_id=user_id,
                    trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
                    trigger_data={
                        "topic": topic,
                        "topic_description": self._get_topic_description(learning_trigger),
                        "relevance_score": 0.9,  # High relevance from portfolio analysis
                        "content_slug": learning_trigger
                    }
                )
                if notification:
                    notifications_count += 1
            else:
                print(f"🚫 SKIPPING duplicate EDUCATIONAL_MOMENT notification for {topic}")
        
        # 3. Portfolio-specific notifications for individual holdings
        notifications_count += await self._generate_holding_notifications(
            user_id, portfolio
        )
        
        return notifications_count

    async def _get_recent_notifications(self, user_id: str, hours: int = 1):
        """Get recent notifications for the user to check for duplicates"""
        from datetime import datetime, timedelta, timezone
        
        if not self.notification_repository:
            # If no repository available, disable duplicate checking
            return []
        
        try:
            # Get notifications from the last N hours
            cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
            
            # Fetch recent notifications for the user
            recent_notifications = await self.notification_repository.get_user_notifications(
                user_id=user_id,
                status=None,  # Get all notifications regardless of status
                limit=50  # Check last 50 notifications 
            )
            
            # Filter by time and return only recent ones
            filtered_notifications = [
                notif for notif in recent_notifications
                if notif.created_at >= cutoff_time
            ]
            
            print(f"🔍 DUPLICATE CHECK: Found {len(recent_notifications)} total notifications, {len(filtered_notifications)} in last {hours}h")
            
            # Debug: Show what recent notifications we found
            for notif in filtered_notifications[-5:]:  # Show last 5
                print(f"  - {notif.trigger_type}: {notif.trigger_data} (created: {notif.created_at})")
            
            return filtered_notifications
            
        except Exception as e:
            print(f"⚠️ Error fetching recent notifications for duplicate check: {e}")
            # On error, allow generation (fail open)
            return []
    
    async def _generate_holding_notifications(
        self, 
        user_id: str, 
        portfolio: Portfolio
    ) -> int:
        """
        Generate notifications for individual stock holdings
        Baby step: Focus on high-impact individual stocks
        """
        notifications_count = 0
        
        for holding in portfolio.get_holdings():  
            try:
                # Get current stock data using use case
                stock_data = self.get_stock_data_use_case.execute(holding.symbol)
                
                # Check for significant individual stock volatility
                if stock_data.beta and float(stock_data.beta) > 1.5:
                    notification = await self.notification_service.execute(
                        user_id=user_id,
                        trigger_type=NotificationTriggerType.PORTFOLIO_CHANGE,
                        trigger_data={
                            "stock_symbol": holding.symbol,
                            "change_percent": 0.0,  # Placeholder - could calculate actual change
                            "min_abs_change_percent": 0.0,
                            "content_slug": "volatility_advanced",
                            "beta": float(stock_data.beta),
                            "holding_context": f"You own {holding.shares} shares"
                        }
                    )
                    if notification:
                        notifications_count += 1
                        
            except Exception:
                # Skip notification for stocks with data issues
                continue
        
        return notifications_count
    
    def _get_topic_for_trigger(self, learning_trigger: str) -> str:
        """Map learning trigger to user-friendly topic name"""
        topic_mapping = {
            "volatility_basics": "Market Volatility",
            "volatility_advanced": "Advanced Volatility Management", 
            "diversification_basics": "Portfolio Diversification"
        }
        return topic_mapping.get(learning_trigger, "Investment Fundamentals")
    
    def _get_topic_description(self, learning_trigger: str) -> str:
        """Get description for learning topic"""
        description_mapping = {
            "volatility_basics": "understanding how market ups and downs affect your investments",
            "volatility_advanced": "advanced strategies for managing high-risk, high-reward portfolios",
            "diversification_basics": "spreading risk across different investments"
        }
        return description_mapping.get(learning_trigger, "core investment principles")
    
    # Existing methods remain unchanged for backward compatibility
    def _calculate_portfolio_beta(self, portfolio: Portfolio) -> float:
        """Calculate weighted average beta using real stock data"""
        if not portfolio.get_holdings():
            return 0.0
        
        total_value = Decimal('0')
        weighted_beta_sum = Decimal('0')
        
        for holding in portfolio.get_holdings():
            try:
                # Get stock data with beta information using use case
                stock_data = self.get_stock_data_use_case.execute(holding.symbol)
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
        if volatility_score == 0.0:  # ← Add this for empty portfolios
            return "NONE"
        elif volatility_score > 1.3:
            return "HIGH"
        elif volatility_score > 0.8:
            return "MEDIUM"
        else:
            return "LOW"
    
    def _get_learning_trigger(self, risk_level: str, volatility_score: float) -> Optional[str]:
        """
        Enhanced: More aggressive learning trigger determination
        Baby step: Generate more educational moments for better engagement
        """
        # HIGH risk portfolios
        if risk_level == "HIGH":
            if volatility_score > 1.5:
                return "volatility_advanced"
            return "volatility_basics"
        
        # MEDIUM risk portfolios - now more triggers
        elif risk_level == "MEDIUM":
            if volatility_score > 1.1:  # Lowered threshold from 1.0
                return "diversification_basics"
            else:
                return "volatility_basics"  # NEW: Even moderate volatility gets education
        
        # LOW risk portfolios - new educational opportunities
        elif risk_level == "LOW":
            if volatility_score < 0.7:  # Very conservative
                return "investment_fundamentals"  # Use existing content for now
            else:
                return "investment_fundamentals"  # Use existing content for now
        
        return None  # No learning trigger for edge cases
        
    def _identify_risk_factors(self, portfolio: Portfolio, volatility_score: float) -> list[str]:
        """Identify specific risk factors for educational context"""
        factors = []
        
        if volatility_score > 1.3:
            factors.append("High portfolio volatility")
        
        if len(portfolio.get_holdings()) < 3:
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