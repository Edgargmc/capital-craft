from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.core.entities.stock import Stock
from decimal import Decimal
from app.use_cases.get_stock_data import GetStockDataUseCase
from app.use_cases.create_portfolio import CreatePortfolio
from app.use_cases.buy_stock import BuyStock 
from pydantic import BaseModel
from app.use_cases.get_portfolio_summary import GetPortfolioSummary
from pydantic import BaseModel
from app.use_cases.sell_stock import SellStock
import os 

app = FastAPI(title="Capital Craft")

# Agregar middleware CORS
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "Welcome to Capital Craft"}

@app.get("/stock/{symbol}")
def get_stock(symbol: str):
    try:
        use_case = GetStockDataUseCase()
        stock = use_case.execute(symbol)
        
        return {
            "symbol": stock.symbol,
            "name": stock.name,
            "current_price": float(stock.current_price),
            "sector": stock.sector,
            "market_cap": stock.market_cap,
            "pe_ratio": float(stock.pe_ratio) if stock.pe_ratio else None,
            "message": "Complete stock data with Clean Architecture!"
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
        get_stock_data = GetStockDataUseCase()
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
        get_stock_data = GetStockDataUseCase()
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
        get_stock_data = GetStockDataUseCase()
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

