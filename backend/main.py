from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.core.entities.stock import Stock
from decimal import Decimal
from app.infrastructure.providers.provider_factory import ProviderFactory
from app.use_cases.get_portfolio_summary import GetPortfolioSummary
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.use_cases.search_stocks import SearchStocksUseCase
from app.use_cases.create_portfolio import CreatePortfolio
from app.use_cases.buy_stock import BuyStock 
from pydantic import BaseModel
from app.use_cases.sell_stock import SellStock
from app.use_cases.analyze_portfolio_risk import AnalyzePortfolioRisk
from app.use_cases.get_learning_content import GetLearningContent, GetRecommendedContent
from app.infrastructure.content.content_repository import ContentRepositoryFactory
from app.core.entities.learning_content import LearningContent

# Updated notification system imports with dependency injection
from app.use_cases.generate_notification import GenerateNotificationUseCase
from app.use_cases.mark_notification_as_read import MarkNotificationAsReadUseCase, NotificationNotFoundError, NotificationAlreadyDismissedError
from app.use_cases.dismiss_notification import DismissNotificationUseCase
from app.use_cases.mark_all_notifications_as_read import MarkAllNotificationsAsReadUseCase
from app.infrastructure.dependency_injection import (
    get_notification_repository,
    get_mark_notification_as_read_use_case,
    get_dismiss_notification_use_case,
    get_mark_all_notifications_as_read_use_case,
    get_generate_notification_use_case,
    get_portfolio_repository,
    get_get_or_create_portfolio_use_case
)
from app.core.interfaces.notification_repository import NotificationRepository
from app.core.interfaces.portfolio_repository import PortfolioRepository
from app.use_cases.get_or_create_portfolio import GetOrCreatePortfolioUseCase

# Authentication system imports
from app.api.auth import auth_router

import os 
from dotenv import load_dotenv


load_dotenv()


app = FastAPI(title="Capital Craft")

# Agregar middleware CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

stock_data_provider = ProviderFactory.create_provider()
# TO:
# Initialize notification system using dependency injection
notification_service = get_generate_notification_use_case()

# Enhanced portfolio risk analysis with notifications  
# Use GetStockDataUseCase wrapper for consistency
get_stock_data_for_risk = GetStockDataUseCase(stock_data_provider)
analyze_portfolio_risk_use_case = AnalyzePortfolioRisk(
    get_stock_data_for_risk, 
    notification_service
)# Initialize content repository and use cases
content_repository = ContentRepositoryFactory.create_repository("markdown")
get_learning_content_use_case = GetLearningContent(content_repository)
get_recommended_content_use_case = GetRecommendedContent(content_repository)

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include authentication router
app.include_router(auth_router)

@app.get("/")
def home():
    provider_type = os.getenv("STOCK_DATA_PROVIDER", "mock")
    return {
        "message": "Welcome to Capital Craft",
        "stock_data_provider": provider_type,
        "status": "ready"
    }

@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        use_case = GetStockDataUseCase(stock_data_provider)
        stock = use_case.execute(symbol)
        
        return {
            # Core data
            "symbol": stock.symbol,
            "name": stock.name,
            "current_price": float(stock.current_price),
            "sector": stock.sector,
            "market_cap": stock.market_cap,
            "pe_ratio": float(stock.pe_ratio) if stock.pe_ratio else None,
            
            # 🎯 Enhanced fundamental data
            "eps": float(stock.eps) if stock.eps else None,
            "book_value": float(stock.book_value) if stock.book_value else None,
            "price_to_book": float(stock.price_to_book) if stock.price_to_book else None,
            "profit_margin": float(stock.profit_margin) if stock.profit_margin else None,
            
            # 🎯 Dividend data
            "dividend_yield": float(stock.dividend_yield) if stock.dividend_yield else None,
            "dividend_per_share": float(stock.dividend_per_share) if stock.dividend_per_share else None,
            "is_dividend_stock": stock.is_dividend_stock,
            
            # 🎯 Risk & technical
            "week_52_high": float(stock.week_52_high) if stock.week_52_high else None,
            "week_52_low": float(stock.week_52_low) if stock.week_52_low else None,
            "beta": float(stock.beta) if stock.beta else None,
            "current_vs_52week_range": float(stock.current_vs_52week_range) if stock.current_vs_52week_range else None,
            
            # 🎯 Growth metrics
            "earnings_growth_yoy": float(stock.earnings_growth_yoy) if stock.earnings_growth_yoy else None,
            "revenue_growth_yoy": float(stock.revenue_growth_yoy) if stock.revenue_growth_yoy else None,
            
            # 🎯 Analyst data
            "analyst_target_price": float(stock.analyst_target_price) if stock.analyst_target_price else None,
            "analyst_rating_buy": stock.analyst_rating_buy,
            "analyst_rating_hold": stock.analyst_rating_hold,
            "analyst_rating_sell": stock.analyst_rating_sell,
            "analyst_sentiment": stock.analyst_sentiment,
            "upside_potential": float(stock.upside_potential) if stock.upside_potential else None,
            
            "message": "Enhanced stock data with educational metrics!"
        }
    except ValueError as e:
        return {"error": str(e)}

@app.get("/stocks/search")
def search_stocks(q: str = "", limit: int = 10):
    """
    Search stocks by symbol or company name
    
    Parameters:
    - q: Search query (symbol or company name)
    - limit: Maximum number of results (default: 10, max: 50)
    
    Returns: List of stocks with basic info (symbol, name, sector, current_price)
    """
    try:
        # Input validation
        if not q or not q.strip():
            return {"results": [], "query": q, "count": 0, "message": "Empty search query"}
        
        if limit < 1 or limit > 50:
            return {"error": "Limit must be between 1 and 50"}
        
        # Execute search using SearchStocksUseCase
        search_use_case = SearchStocksUseCase(stock_data_provider)
        stocks = search_use_case.execute(q.strip(), limit)
        
        # Convert to simplified response format for autocomplete
        results = []
        for stock in stocks:
            results.append({
                "symbol": stock.symbol,
                "name": stock.name,
                "sector": stock.sector,
                "current_price": float(stock.current_price) if stock.current_price else None
            })
        
        return {
            "results": results,
            "query": q.strip(),
            "count": len(results),
            "message": f"Found {len(results)} stocks matching '{q.strip()}'"
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")

class BuyStockRequest(BaseModel):
    symbol: str
    shares: int

# Baby Step 1: Repository replaces global dict 
# portfolios_db = {} # REMOVED - now using repository

from app.infrastructure.dependency_injection import (
    get_portfolio_repository, 
    get_stock_data_provider,
    get_get_or_create_portfolio_use_case,
    get_buy_stock_use_case,
    get_sell_stock_use_case,
    get_analyze_portfolio_risk_use_case
)
from app.infrastructure.auth.dependencies import get_current_user_id

# ✅ FIXED: Specific routes MUST come before generic routes
@app.get("/portfolio/me")
async def get_my_portfolio(
    current_user_id: str = Depends(get_current_user_id),
    get_or_create_portfolio: GetOrCreatePortfolioUseCase = Depends(get_get_or_create_portfolio_use_case)
):
    """Get current user's portfolio with calculated values - Authenticated endpoint"""
    try:
        # Use authenticated user_id from JWT token
        portfolio = await get_or_create_portfolio.execute(current_user_id)
        
        # ✅ NEW: Calculate current values using GetPortfolioSummary
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        portfolio_summary_use_case = GetPortfolioSummary(get_stock_data)
        summary = portfolio_summary_use_case.execute(portfolio)
        
        return summary
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/portfolio/me/risk-analysis")
async def get_my_portfolio_risk_analysis(
    current_user_id: str = Depends(get_current_user_id),
    get_or_create_portfolio: GetOrCreatePortfolioUseCase = Depends(get_get_or_create_portfolio_use_case),
    analyze_portfolio_risk_use_case: AnalyzePortfolioRisk = Depends(get_analyze_portfolio_risk_use_case)
):
    """Portfolio risk analysis for authenticated user - Clean Architecture"""
    try:
        # Get user's portfolio
        portfolio = await get_or_create_portfolio.execute(current_user_id)
        
        # Analyze portfolio risk
        risk_analysis = await analyze_portfolio_risk_use_case.execute(portfolio, current_user_id)
        
        # Educational trigger for learning opportunities
        if risk_analysis.learning_trigger:
            print(f"🎓 Learning opportunity triggered for user {current_user_id}: {risk_analysis.learning_trigger}")
        
        return {
            "user_id": portfolio.user_id,
            "portfolio_summary": {
                "cash_balance": float(portfolio.cash_balance),
                "total_holdings": len(portfolio.get_holdings()),
                "holdings": {
                    holding.symbol: {
                        "symbol": holding.symbol,
                        "shares": holding.shares,
                        "average_price": float(holding.average_price)
                    }
                    for holding in portfolio.get_holdings()
                }
            },
            "risk_analysis": {
                "risk_level": risk_analysis.risk_level,
                "volatility_score": risk_analysis.volatility_score,
                "learning_trigger": risk_analysis.learning_trigger,
                "risk_factors": risk_analysis.risk_factors,
                "recommendation": risk_analysis.recommendation,
                "notifications_generated": risk_analysis.notifications_generated,
            },
            "analysis_timestamp": risk_analysis.analysis_date.isoformat(),
            "educational_insights": risk_analysis.learning_trigger is not None
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio risk: {str(e)}")

@app.get("/portfolio/{user_id}")
async def get_portfolio(
    user_id: str,
    get_or_create_portfolio: GetOrCreatePortfolioUseCase = Depends(get_get_or_create_portfolio_use_case)
):
    """Get current portfolio - Clean Architecture with centralized logic"""
    try:
        # Use centralized get-or-create logic
        portfolio = await get_or_create_portfolio.execute(user_id)
        
        return {
            "user_id": portfolio.user_id,
            "cash_balance": float(portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in portfolio.get_holdings()
            },
            "total_holdings": len(portfolio.get_holdings()),
            "created_at": portfolio.created_at.isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/portfolio/{user_id}/buy")
async def buy_stock(
    user_id: str, 
    request: BuyStockRequest,
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
):
    """Clean Architecture: Buy stocks with centralized logic"""
    try:
        # ✅ CLEAN ARCHITECTURE: Use case handles everything internally
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        buy_stock_use_case = BuyStock(
            get_stock_data, 
            portfolio_repo,  # Repository injected
            notification_service  # Notifications injected
        )
        
        # Use new clean method - handles get/create/save internally
        updated_portfolio = await buy_stock_use_case.execute_with_user_id(
            user_id, 
            request.symbol, 
            request.shares
        )
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in updated_portfolio.get_holdings()
            },
            "total_holdings": len(updated_portfolio.get_holdings()),
            "transaction": {
                "action": "buy",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            },
            "educational_notifications_triggered": True  # NEW
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/portfolio/{user_id}/summary")
async def get_portfolio_summary(
    user_id: str,
    get_or_create_portfolio: GetOrCreatePortfolioUseCase = Depends(get_get_or_create_portfolio_use_case)
):
    """Get detailed portfolio summary with P&L analysis - Clean Architecture"""
    try:
        # Use centralized get-or-create logic
        portfolio = await get_or_create_portfolio.execute(user_id)
        
        # Get summary
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        portfolio_summary_use_case = GetPortfolioSummary(get_stock_data)
        summary = portfolio_summary_use_case.execute(portfolio)
        
        return summary
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

class SellStockRequest(BaseModel):
    symbol: str
    shares: int


# UPDATE: Enhanced sell endpoint with Clean Architecture
@app.post("/portfolio/{user_id}/sell")
async def sell_stock(
    user_id: str, 
    request: SellStockRequest,
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
):
    """Clean Architecture: Sell stocks with centralized logic"""
    try:
        # ✅ CLEAN ARCHITECTURE: Use case handles everything internally
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        sell_stock_use_case = SellStock(
            get_stock_data,
            portfolio_repo,  # Repository injected
            notification_service  # Notifications injected
        )
        
        # Use new clean method - handles get/save internally
        updated_portfolio = await sell_stock_use_case.execute_with_user_id(
            user_id, 
            request.symbol, 
            request.shares
        )
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in updated_portfolio.get_holdings()
            },
            "total_holdings": len(updated_portfolio.get_holdings()),
            "transaction": {
                "action": "sell",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            },
            "educational_notifications_triggered": True  # NEW
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")

@app.get("/learning/content/{trigger}")
def get_learning_content_by_trigger(trigger: str):
    """
    Get learning content for a specific trigger
    Baby step: Simple content retrieval
    """
    try:
        content = get_learning_content_use_case.execute(trigger)
        
        if not content:
            raise HTTPException(
                status_code=404, 
                detail=f"No learning content found for trigger: {trigger}"
            )
        
        return {
            "success": True,
            "data": {
                "id": content.id,
                "title": content.title,
                "content": content.content,  # Markdown content
                "trigger_type": content.trigger_type,
                "difficulty_level": content.difficulty_level,
                "estimated_read_time": content.estimated_read_time,
                "tags": content.tags,
                "learning_objectives": content.learning_objectives,
                "prerequisites": content.prerequisites,
                "next_suggested": content.next_suggested,
                "created_at": content.created_at.isoformat(),
                "updated_at": content.updated_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving learning content: {str(e)}"
        )

@app.get("/learning/content")
def list_all_learning_content():
    """
    Get all available learning content
    Useful for content discovery
    """
    try:
        content_list = get_learning_content_use_case.execute_list_all()
        
        return {
            "success": True,
            "data": [
                {
                    "id": content.id,
                    "title": content.title,
                    "trigger_type": content.trigger_type,
                    "difficulty_level": content.difficulty_level,
                    "estimated_read_time": content.estimated_read_time,
                    "tags": content.tags,
                    "learning_objectives": content.learning_objectives
                }
                for content in content_list
            ],
            "total_count": len(content_list)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error listing learning content: {str(e)}"
        )

@app.get("/learning/recommendations")
def get_learning_recommendations(
    user_level: str = "beginner", 
    available_time: int = 10
):
    """
    Get personalized learning content recommendations
    Query params: user_level (beginner/intermediate/advanced), available_time (minutes)
    """
    try:
        recommendations = get_recommended_content_use_case.execute(
            user_level=user_level,
            available_time=available_time
        )
        
        return {
            "success": True,
            "data": [
                {
                    "id": content.id,
                    "title": content.title,
                    "trigger_type": content.trigger_type,
                    "difficulty_level": content.difficulty_level,
                    "estimated_read_time": content.estimated_read_time,
                    "tags": content.tags,
                    "learning_objectives": content.learning_objectives
                }
                for content in recommendations
            ],
            "filters": {
                "user_level": user_level,
                "available_time": available_time
            },
            "total_count": len(recommendations)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting recommendations: {str(e)}"
        )

@app.get("/learning/quick-reads")
def get_quick_learning_content():
    """
    Get quick-read learning content (5 minutes or less)
    Perfect for busy users
    """
    try:
        quick_content = get_learning_content_use_case.execute_quick_reads()
        
        return {
            "success": True,
            "data": [
                {
                    "id": content.id,
                    "title": content.title,
                    "trigger_type": content.trigger_type,
                    "estimated_read_time": content.estimated_read_time,
                    "tags": content.tags,
                    "learning_objectives": content.learning_objectives
                }
                for content in quick_content
            ],
            "max_read_time": 5,
            "total_count": len(quick_content)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error getting quick reads: {str(e)}"
        )

# Portfolio risk analysis endpoint with Clean Architecture
@app.get("/portfolio/{user_id}/risk-analysis")
async def get_portfolio_risk_analysis(
    user_id: str,
    get_or_create_portfolio: GetOrCreatePortfolioUseCase = Depends(get_get_or_create_portfolio_use_case)
):
    """Portfolio risk analysis WITH automatic notifications - Clean Architecture"""
    try:
        # Use centralized get-or-create logic
        portfolio = await get_or_create_portfolio.execute(user_id)
        
        # Use async version with notification generation
        risk_analysis = await analyze_portfolio_risk_use_case.execute(portfolio, user_id)
        
        # Get recommended learning content based on trigger
        recommended_content = None
        if risk_analysis.learning_trigger:
            recommended_content = get_learning_content_use_case.execute(
                risk_analysis.learning_trigger
            )
        
        response_data = {
            "risk_level": risk_analysis.risk_level,
            "volatility_score": risk_analysis.volatility_score,
            "learning_trigger": risk_analysis.learning_trigger,
            "risk_factors": risk_analysis.risk_factors,
            "recommendation": risk_analysis.recommendation,
            "notifications_generated": risk_analysis.notifications_generated,
            "timestamp": "2025-08-01"
        }
        
        # Add learning content if available
        if recommended_content:
            response_data["recommended_content"] = {
                "id": recommended_content.id,
                "title": recommended_content.title,
                "estimated_read_time": recommended_content.estimated_read_time,
                "learning_objectives": recommended_content.learning_objectives
            }
        
        return {
            "success": True,
            "data": response_data
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio risk: {str(e)}")


# Updated endpoint for user notifications with dependency injection
@app.get("/users/{user_id}/notifications")
async def get_user_notifications(
    user_id: str, 
    limit: int = 10,
    repository: NotificationRepository = Depends(get_notification_repository)
):
    """
    Get user's notification history
    Updated to use Clean Architecture with dependency injection
    """
    try:
        notifications = await repository.get_user_notifications(
            user_id, limit=limit
        )
        
        return {
            "success": True,
            "data": [
                {
                    "id": notification.id,
                    "title": notification.title,
                    "message": notification.message,
                    "deep_link": notification.deep_link,
                    "trigger_type": notification.trigger_type.value,
                    "status": notification.status.value,
                    "created_at": notification.created_at.isoformat() if notification.created_at else None,
                    "sent_at": notification.sent_at.isoformat() if notification.sent_at else None,
                    "type": notification.notification_type,
                    "priority": notification.priority,
                    "isRead": notification.is_read,
                    "dismissed": notification.dismissed
                }
                for notification in notifications
            ],
            "total_count": len(notifications),
            "user_id": user_id
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving notifications: {str(e)}"
        )

# ADD new endpoint for manual notification sending (for testing)
@app.post("/users/{user_id}/notifications/test")
async def send_test_notification(user_id: str):
    """
    Send test notification (for development/testing)
    Baby step: Manual trigger for testing notifications
    """
    try:
        from app.core.entities.notification import NotificationTriggerType
        
        # Generate test notification
        test_notification = await notification_service.execute(
            user_id=user_id,
            trigger_type=NotificationTriggerType.EDUCATIONAL_MOMENT,
            trigger_data={
                "topic": "Investment Testing",
                "topic_description": "testing the notification system",
                "relevance_score": 1.0,
                "content_slug": "volatility_basics"
            }
        )
        
        if test_notification:
            return {
                "success": True,
                "message": "Test notification generated successfully",
                "notification": {
                    "id": test_notification.id,
                    "title": test_notification.title,
                    "message": test_notification.message
                }
            }
        else:
            return {
                "success": False,
                "message": "Failed to generate test notification"
            }
            
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error sending test notification: {str(e)}"
        )

# ========================================
# NOTIFICATION PERSISTENCE ENDPOINTS
# Following Clean Architecture + SOLID principles
# ========================================

@app.patch("/notifications/{notification_id}")
async def mark_notification_as_read(
    notification_id: str,
    use_case: MarkNotificationAsReadUseCase = Depends(get_mark_notification_as_read_use_case)
):
    """
    Mark notification as read
    Following Clean Architecture with dependency injection
    """
    try:
        success = await use_case.execute(notification_id)
        if success:
            return {
                "success": True,
                "message": "Notification marked as read",
                "notification_id": notification_id
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or already dismissed"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking notification as read: {str(e)}"
        )

@app.delete("/notifications/{notification_id}")
async def dismiss_notification(
    notification_id: str,
    use_case: DismissNotificationUseCase = Depends(get_dismiss_notification_use_case)
):
    """
    Dismiss notification permanently
    Following Clean Architecture with dependency injection
    """
    try:
        success = await use_case.execute(notification_id)
        if success:
            return {
                "success": True,
                "message": "Notification dismissed",
                "notification_id": notification_id
            }
        else:
            raise HTTPException(
                status_code=404,
                detail="Notification not found or cannot be dismissed"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error dismissing notification: {str(e)}"
        )

@app.post("/notifications/mark-all-read")
async def mark_all_notifications_as_read(
    request: dict,
    use_case: MarkAllNotificationsAsReadUseCase = Depends(get_mark_all_notifications_as_read_use_case)
):
    """
    Mark all notifications as read for a user
    Following Clean Architecture with dependency injection
    """
    try:
        user_id = request.get("userId")
        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="userId is required"
            )
        
        marked_count = await use_case.execute(user_id)
        return {
            "success": True,
            "message": f"Marked {marked_count} notifications as read",
            "user_id": user_id,
            "marked_count": marked_count
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error marking all notifications as read: {str(e)}"
        )

@app.get("/notifications/{notification_id}")
async def get_notification_by_id(
    notification_id: str,
    repository: NotificationRepository = Depends(get_notification_repository)
):
    """
    Get specific notification by ID
    Following Clean Architecture with dependency injection
    """
    try:
        notification = await repository.get_notification_by_id(notification_id)
        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "data": {
                "id": notification.id,
                "title": notification.title,
                "message": notification.message,
                "deep_link": notification.deep_link,
                "trigger_type": notification.trigger_type.value,
                "status": notification.status.value,
                "created_at": notification.created_at.isoformat() if notification.created_at else None,
                "sent_at": notification.sent_at.isoformat() if notification.sent_at else None,
                "type": notification.notification_type,
                "priority": notification.priority,
                "isRead": notification.is_read,
                "dismissed": notification.dismissed
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving notification: {str(e)}"
        )

# Enhanced Health check endpoint with Clean Architecture status
@app.get("/health")
def health_check():
    """
    Comprehensive health check with Clean Architecture and persistence status
    Shows all system components including repositories and use cases
    """
    try:
        # Check learning content system
        content_count = len(get_learning_content_use_case.execute_list_all())
        
        # Check notification system
        notification_system_healthy = True  # Always healthy with DI
        
        # Check portfolio repository type and health
        from app.infrastructure.dependency_injection import get_container
        container = get_container()
        portfolio_repo = container.get_portfolio_repository()
        portfolio_storage_type = type(portfolio_repo).__name__
        
        # Determine storage details
        if "Json" in portfolio_storage_type:
            storage_info = {
                "type": "JSON",
                "persistent": True,
                "location": getattr(portfolio_repo, 'data_directory', 'data/'),
                "per_user_files": True
            }
        else:
            storage_info = {
                "type": "Memory", 
                "persistent": False,
                "location": "RAM",
                "per_user_files": False
            }
        
        # Check data directory if JSON
        data_files_count = 0
        if "Json" in portfolio_storage_type:
            try:
                from pathlib import Path
                data_dir = Path(getattr(portfolio_repo, 'data_directory', 'data'))
                if data_dir.exists():
                    data_files_count = len(list(data_dir.glob("portfolios_*.json")))
            except Exception:
                data_files_count = 0
        
        return {
            "status": "healthy", 
            "service": "capital-craft-backend",
            "version": "2.0 - Clean Architecture + JSON Persistence",
            "features": [
                "portfolio_management", 
                "portfolio_persistence",
                "clean_architecture",
                "dependency_injection",
                "risk_analysis", 
                "learning_triggers",
                "learning_content_system",
                "notification_system",
                "educational_notifications"
            ],
            "architecture": {
                "pattern": "Clean Architecture",
                "principles": ["SOLID", "DRY", "Repository Pattern"],
                "layers": ["Entities", "Use Cases", "Infrastructure", "Frameworks"]
            },
            "storage": {
                "stock_data_provider": os.getenv("STOCK_DATA_PROVIDER", "mock"),
                "portfolio_storage": storage_info,
                "notification_storage": "JSON",
                "learning_content": "Markdown files"
            },
            "statistics": {
                "learning_content_available": content_count,
                "portfolio_files": data_files_count,
                "notification_system": "active" if notification_system_healthy else "inactive"
            },
            "environment": {
                "portfolio_storage_env": os.getenv("PORTFOLIO_STORAGE", "json (default)"),
                "cors_origins": os.getenv("CORS_ORIGINS", "http://localhost:3000")
            },
            "timestamp": "2025-08-10"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "capital-craft-backend", 
            "error": f"System issue: {str(e)}"
        }

# Authenticated buy endpoint - Clean Architecture + JWT
@app.post("/auth/portfolio/buy")
async def buy_stock_authenticated(
    request: BuyStockRequest,
    current_user_id: str = Depends(get_current_user_id),
    buy_stock_use_case: BuyStock = Depends(get_buy_stock_use_case)
):
    """Buy stocks for authenticated user - Clean Architecture"""
    try:
        # Use authenticated user_id from JWT token
        updated_portfolio = await buy_stock_use_case.execute_with_user_id(
            current_user_id,
            request.symbol,
            request.shares
        )
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in updated_portfolio.get_holdings()
            },
            "total_holdings": len(updated_portfolio.get_holdings()),
            "transaction": {
                "action": "buy",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            },
            "educational_notifications_triggered": True
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")

@app.post("/portfolio/{user_id}/buy")
async def buy_stock(
    user_id: str, 
    request: BuyStockRequest,
    portfolio_repo: PortfolioRepository = Depends(get_portfolio_repository)
):
    """Clean Architecture: Buy stocks with centralized logic"""
    try:
        # ✅ CLEAN ARCHITECTURE: Use case handles everything internally
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        buy_stock_use_case = BuyStock(
            get_stock_data, 
            portfolio_repo,  # Repository injected
            notification_service  # Notifications injected
        )
        
        # Use new clean method - handles get/create/save internally
        updated_portfolio = await buy_stock_use_case.execute_with_user_id(
            user_id, 
            request.symbol, 
            request.shares
        )
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in updated_portfolio.get_holdings()
            },
            "total_holdings": len(updated_portfolio.get_holdings()),
            "transaction": {
                "action": "buy",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            },
            "educational_notifications_triggered": True  # NEW
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

# Authenticated sell endpoint - Clean Architecture + JWT
@app.post("/auth/portfolio/sell")
async def sell_stock_authenticated(
    request: SellStockRequest,
    current_user_id: str = Depends(get_current_user_id),
    sell_stock_use_case: SellStock = Depends(get_sell_stock_use_case)
):
    """Sell stocks for authenticated user - Clean Architecture"""
    try:
        # Use authenticated user_id from JWT token
        updated_portfolio = await sell_stock_use_case.execute_with_user_id(
            current_user_id,
            request.symbol,
            request.shares
        )
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                holding.symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for holding in updated_portfolio.get_holdings()
            },
            "total_holdings": len(updated_portfolio.get_holdings()),
            "transaction": {
                "action": "sell",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            },
            "educational_notifications_triggered": True
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transaction failed: {str(e)}")