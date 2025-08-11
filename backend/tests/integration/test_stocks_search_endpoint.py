"""
📁 FILE: tests/integration/test_stocks_search_endpoint.py

Integration test for /stocks/search endpoint using FastAPI TestClient
"""
import pytest
import sys
import os
from fastapi.testclient import TestClient

# Add the app directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from main import app


class TestStocksSearchEndpoint:
    """Integration tests for the /stocks/search endpoint"""
    
    @classmethod
    def setup_class(cls):
        """Setup test client"""
        cls.client = TestClient(app)
    
    def test_search_stocks_success_symbol_match(self):
        """Test successful search with symbol match"""
        # Act
        response = self.client.get("/stocks/search?q=AAPL&limit=5")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "results" in data
        assert "query" in data
        assert "count" in data
        assert "message" in data
        
        # Verify query handling
        assert data["query"] == "AAPL"
        assert data["count"] >= 1
        
        # Verify at least one result contains AAPL
        results = data["results"]
        assert len(results) >= 1
        aapl_found = any(stock["symbol"] == "AAPL" for stock in results)
        assert aapl_found, "AAPL should be found in results"
        
        # Verify result structure
        first_result = results[0]
        required_fields = ["symbol", "name", "sector", "current_price"]
        for field in required_fields:
            assert field in first_result, f"Field {field} missing from result"
    
    def test_search_stocks_success_company_name_match(self):
        """Test successful search with company name"""
        # Act
        response = self.client.get("/stocks/search?q=apple&limit=3")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        assert data["query"] == "apple"
        assert data["count"] >= 1
        
        # Should find Apple Inc. (AAPL)
        results = data["results"]
        apple_found = any(
            "apple" in stock["name"].lower() or stock["symbol"] == "AAPL" 
            for stock in results
        )
        assert apple_found, "Apple-related stock should be found"
    
    def test_search_stocks_success_sector_match(self):
        """Test successful search with sector match"""
        # Act
        response = self.client.get("/stocks/search?q=technology&limit=10")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        assert data["query"] == "technology"
        results = data["results"]
        
        # Should find multiple technology stocks
        if len(results) > 0:
            tech_stocks = [
                stock for stock in results 
                if "technolog" in stock["sector"].lower()
            ]
            assert len(tech_stocks) > 0, "Should find technology sector stocks"
    
    def test_search_stocks_empty_query(self):
        """Test search with empty query"""
        # Act
        response = self.client.get("/stocks/search?q=")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        assert data["results"] == []
        assert data["query"] == ""
        assert data["count"] == 0
        assert "empty search query" in data["message"].lower()
    
    def test_search_stocks_no_query_parameter(self):
        """Test search without query parameter"""
        # Act
        response = self.client.get("/stocks/search")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        assert data["results"] == []
        assert data["query"] == ""
        assert data["count"] == 0
    
    def test_search_stocks_limit_validation_too_small(self):
        """Test search with limit too small"""
        # Act
        response = self.client.get("/stocks/search?q=AAPL&limit=0")
        
        # Assert
        assert response.status_code == 200  # FastAPI returns 200 with error message
        data = response.json()
        
        assert "error" in data
        assert "limit must be between 1 and 50" in data["error"].lower()
    
    def test_search_stocks_limit_validation_too_large(self):
        """Test search with limit too large"""
        # Act
        response = self.client.get("/stocks/search?q=AAPL&limit=51")
        
        # Assert
        assert response.status_code == 200  # FastAPI returns 200 with error message
        data = response.json()
        
        assert "error" in data
        assert "limit must be between 1 and 50" in data["error"].lower()
    
    def test_search_stocks_valid_limits(self):
        """Test search with valid limit values"""
        # Test minimum limit
        response = self.client.get("/stocks/search?q=tech&limit=1")
        assert response.status_code == 200
        data = response.json()
        assert "error" not in data
        assert len(data["results"]) <= 1
        
        # Test maximum limit
        response = self.client.get("/stocks/search?q=tech&limit=50")
        assert response.status_code == 200
        data = response.json()
        assert "error" not in data
        assert len(data["results"]) <= 50
    
    def test_search_stocks_default_limit(self):
        """Test search uses default limit when not specified"""
        # Act
        response = self.client.get("/stocks/search?q=tech")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # Should not error and should limit results to reasonable number
        assert "error" not in data
        assert len(data["results"]) <= 10  # Default limit should be 10
    
    def test_search_stocks_no_results_invalid_symbol(self):
        """Test search with invalid/non-existent symbol"""
        # Act
        response = self.client.get("/stocks/search?q=INVALIDXYZ123&limit=5")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        assert data["query"] == "INVALIDXYZ123"
        assert data["count"] == 0
        assert data["results"] == []
        assert "found 0 stocks" in data["message"].lower()
    
    def test_search_stocks_response_format(self):
        """Test that response format matches specification"""
        # Act
        response = self.client.get("/stocks/search?q=AAPL&limit=3")
        
        # Assert
        assert response.status_code == 200
        data = response.json()
        
        # Test top-level structure
        expected_keys = ["results", "query", "count", "message"]
        for key in expected_keys:
            assert key in data, f"Missing key: {key}"
        
        # Test results structure
        if data["results"]:
            stock = data["results"][0]
            expected_stock_keys = ["symbol", "name", "sector", "current_price"]
            for key in expected_stock_keys:
                assert key in stock, f"Missing stock field: {key}"
            
            # Test field types
            assert isinstance(stock["symbol"], str)
            assert isinstance(stock["name"], str)
            assert isinstance(stock["sector"], str)
            assert isinstance(stock["current_price"], (float, int)) or stock["current_price"] is None
    
    def test_search_stocks_special_characters(self):
        """Test search handles special characters gracefully"""
        # Test URL encoding
        response = self.client.get("/stocks/search?q=A%26T&limit=3")  # A&T encoded
        assert response.status_code == 200
        
        # Test spaces (should be handled)
        response = self.client.get("/stocks/search?q=Apple+Inc&limit=3")
        assert response.status_code == 200
        
        # Test special characters
        response = self.client.get("/stocks/search?q=@#$%&limit=3")
        assert response.status_code == 200
        data = response.json()
        # Should return empty results, not error
        assert "error" not in data or data["count"] == 0
    
    def test_search_stocks_case_insensitive(self):
        """Test that search is case insensitive"""
        queries = ["aapl", "AAPL", "AaPl", "apple", "APPLE", "Apple"]
        
        responses = []
        for query in queries:
            response = self.client.get(f"/stocks/search?q={query}&limit=5")
            assert response.status_code == 200
            responses.append(response.json())
        
        # All should return results (assuming AAPL/Apple exists in mock data)
        # At least some should have results
        total_results = sum(len(resp["results"]) for resp in responses)
        assert total_results > 0, "At least some case variations should return results"
    
    def test_search_stocks_performance(self):
        """Basic performance test - endpoint should respond quickly"""
        import time
        
        start_time = time.time()
        response = self.client.get("/stocks/search?q=tech&limit=10")
        end_time = time.time()
        
        assert response.status_code == 200
        
        # Should respond in under 5 seconds (generous for mock provider)
        response_time = end_time - start_time
        assert response_time < 5.0, f"Response took too long: {response_time:.2f} seconds"


@pytest.mark.integration
class TestStocksSearchWithDifferentProviders:
    """Test search endpoint behavior with different provider configurations"""
    
    @classmethod
    def setup_class(cls):
        cls.client = TestClient(app)
    
    def test_search_with_mock_provider(self):
        """Test search works with mock provider (default in tests)"""
        response = self.client.get("/stocks/search?q=AAPL&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        # Mock provider should return AAPL
        assert data["count"] >= 1
        aapl_found = any(stock["symbol"] == "AAPL" for stock in data["results"])
        assert aapl_found


if __name__ == "__main__":
    # Allow running tests directly
    pytest.main([__file__])