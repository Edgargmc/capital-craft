from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.entities.stock import Stock
from decimal import Decimal
from app.infrastructure.providers.provider_factory import ProviderFactory
from app.use_cases.get_portfolio_summary import GetPortfolioSummary
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.use_cases.create_portfolio import CreatePortfolio
from app.use_cases.buy_stock import BuyStock 
from pydantic import BaseModel
from app.use_cases.sell_stock import SellStock
from app.use_cases.analyze_portfolio_risk import AnalyzePortfolioRisk
from app.use_cases.get_learning_content import GetLearningContent, GetRecommendedContent
from app.infrastructure.content.content_repository import ContentRepositoryFactory
from app.core.entities.learning_content import LearningContent

import os 
from dotenv import load_dotenv


load_dotenv()


app = FastAPI(title="Capital Craft")

# Agregar middleware CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

stock_data_provider = ProviderFactory.create_provider()
analyze_portfolio_risk_use_case = AnalyzePortfolioRisk(stock_data_provider)
# Initialize content repository and use cases
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

class BuyStockRequest(BaseModel):
    symbol: str
    shares: int

# Global portfolios storage (temporary - later we'll use database)
portfolios_db = {}

@app.get("/portfolio/{user_id}")
def get_portfolio(user_id: str):
    """Get current portfolio"""
    try:
        # Get or create portfolio
        if user_id not in portfolios_db:
            create_portfolio_use_case = CreatePortfolio()
            portfolios_db[user_id] = create_portfolio_use_case.execute(user_id)
        
        portfolio = portfolios_db[user_id]
        
        return {
            "user_id": portfolio.user_id,
            "cash_balance": float(portfolio.cash_balance),
            "holdings": {
                symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for symbol, holding in portfolio.holdings.items()
            },
            "total_holdings": len(portfolio.holdings),
            "created_at": portfolio.created_at.isoformat()
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/portfolio/{user_id}/buy")
def buy_stock(user_id: str, request: BuyStockRequest):
    """Buy stocks for user portfolio"""
    try:
        # Get or create portfolio
        if user_id not in portfolios_db:
            create_portfolio_use_case = CreatePortfolio()
            portfolios_db[user_id] = create_portfolio_use_case.execute(user_id)
        
        current_portfolio = portfolios_db[user_id]
        
        # Execute buy
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        buy_stock_use_case = BuyStock(get_stock_data)
        updated_portfolio = buy_stock_use_case.execute(
            current_portfolio, 
            request.symbol, 
            request.shares
        )
        
        # Save updated portfolio
        portfolios_db[user_id] = updated_portfolio
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for symbol, holding in updated_portfolio.holdings.items()
            },
            "total_holdings": len(updated_portfolio.holdings),
            "transaction": {
                "action": "buy",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/portfolio/{user_id}/summary")
def get_portfolio_summary(user_id: str):
    """Get detailed portfolio summary with P&L analysis"""
    try:
        # Get or create portfolio
        if user_id not in portfolios_db:
            create_portfolio_use_case = CreatePortfolio()
            portfolios_db[user_id] = create_portfolio_use_case.execute(user_id)
        
        portfolio = portfolios_db[user_id]
        
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


@app.post("/portfolio/{user_id}/sell")
def sell_stock(user_id: str, request: SellStockRequest):
    """Sell stocks from user portfolio"""
    try:
        # Get portfolio (must exist to sell)
        if user_id not in portfolios_db:
            raise ValueError("Portfolio not found. Create portfolio first by buying stocks.")
        
        current_portfolio = portfolios_db[user_id]
        
        # Execute sell
        get_stock_data = GetStockDataUseCase(stock_data_provider)
        sell_stock_use_case = SellStock(get_stock_data)
        updated_portfolio = sell_stock_use_case.execute(
            current_portfolio, 
            request.symbol, 
            request.shares
        )
        
        # Save updated portfolio
        portfolios_db[user_id] = updated_portfolio
        
        return {
            "user_id": updated_portfolio.user_id,
            "cash_balance": float(updated_portfolio.cash_balance),
            "holdings": {
                symbol: {
                    "symbol": holding.symbol,
                    "shares": holding.shares,
                    "average_price": float(holding.average_price)
                }
                for symbol, holding in updated_portfolio.holdings.items()
            },
            "total_holdings": len(updated_portfolio.holdings),
            "transaction": {
                "action": "sell",
                "symbol": request.symbol.upper(),
                "shares": request.shares
            }
        }
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error: {str(e)}")
@app.get("/portfolio/{user_id}/risk-analysis")
async def get_portfolio_risk_analysis(user_id: str):
    """
    Get portfolio risk analysis with contextual learning triggers
    Baby step: Analyze volatility and provide learning recommendations
    """
    try:
        # Get or create portfolio (same pattern as your other endpoints)
        if user_id not in portfolios_db:
            create_portfolio_use_case = CreatePortfolio()
            portfolios_db[user_id] = create_portfolio_use_case.execute(user_id)
        
        portfolio = portfolios_db[user_id]
        
        # ✅ NEW: Analyze portfolio risk using our use case
        risk_analysis = analyze_portfolio_risk_use_case.execute(portfolio)
        
        return {
            "success": True,
            "data": {
                "risk_level": risk_analysis.risk_level,
                "volatility_score": risk_analysis.volatility_score,
                "learning_trigger": risk_analysis.learning_trigger,
                "risk_factors": risk_analysis.risk_factors,
                "recommendation": risk_analysis.recommendation,
                "timestamp": "2025-08-01"  # For frontend caching
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing portfolio risk: {str(e)}")


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

# ✅ ENHANCED HEALTH CHECK - Update your existing health check
@app.get("/health")
def health_check():
    """Enhanced health check with learning system status"""
    try:
        # Check if content repository is working
        content_count = len(get_learning_content_use_case.execute_list_all())
        
        return {
            "status": "healthy", 
            "service": "capital-craft-backend",
            "features": [
                "portfolio_management", 
                "risk_analysis", 
                "learning_triggers",
                "learning_content_system"  # NEW
            ],
            "provider": os.getenv("STOCK_DATA_PROVIDER", "mock"),
            "learning_content_available": content_count,  # NEW
            "timestamp": "2025-08-01"
        }
    except Exception as e:
        return {
            "status": "degraded",
            "service": "capital-craft-backend", 
            "error": f"Learning system issue: {str(e)}"
        }

# ✅ INTEGRATION WITH EXISTING RISK ANALYSIS - Enhance your existing endpoint
@app.get("/portfolio/{user_id}/risk-analysis")
async def get_portfolio_risk_analysis(user_id: str):
    """
    Enhanced: Portfolio risk analysis WITH learning content recommendations
    """
    try:
        # Existing risk analysis logic
        if user_id not in portfolios_db:
            create_portfolio_use_case = CreatePortfolio()
            portfolios_db[user_id] = create_portfolio_use_case.execute(user_id)
        
        portfolio = portfolios_db[user_id]
        risk_analysis = analyze_portfolio_risk_use_case.execute(portfolio)
        
        # ✅ NEW: Get recommended learning content based on trigger
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
            "timestamp": "2025-08-01"
        }
        
        # ✅ NEW: Add learning content if available
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




# ✅ BONUS: Health check with new feature
@app.get("/health")
def health_check():
    return {
        "status": "healthy", 
        "service": "capital-craft-backend",
        "features": ["portfolio_management", "risk_analysis", "learning_triggers", "Learning content"],
        "provider": os.getenv("STOCK_DATA_PROVIDER", "mock")
    }

