import { CapitalCraftAPI, Stock } from '@/lib/api';

/**
 * Real implementation of SearchStocksUseCase using Capital Craft API
 * 
 * @class RealSearchStocksUseCase
 * @description Production use case that connects to the backend /stocks/search endpoint
 * 
 * Architecture:
 * - Implements Clean Architecture principles  
 * - Uses dependency injection pattern
 * - Follows SOLID principles (Single Responsibility)
 * - Error handling with graceful fallbacks
 * 
 * @example
 * const useCase = new RealSearchStocksUseCase();
 * const results = await useCase.execute("apple", 5);
 * console.log(results); // [Stock[], Stock[], ...]
 */
export class RealSearchStocksUseCase {
  /**
   * Execute stock search using real API
   * 
   * @param token - Authentication token
   * @param query - Search query (symbol or company name)
   * @param limit - Maximum number of results to return
   * @returns Promise<Stock[]> - Array of matching stocks
   * 
   * @throws {Error} If API request fails or query is invalid
   * 
   * Business Rules:
   * - Query must be at least 1 character
   * - Limit must be between 1 and 50
   * - Results include full Stock objects with current prices
   * - API handles symbol/name/sector matching on backend
   */
  async execute(token: string, query: string, limit: number = 10): Promise<Stock[]> {
    // Input validation
    if (!query || !query.trim()) {
      throw new Error("Search query cannot be empty");
    }

    if (limit < 1 || limit > 50) {
      throw new Error("Limit must be between 1 and 50");
    }

    try {
      // Call backend API
      const results = await CapitalCraftAPI.searchStocks(token, query.trim());
      
      return results;
    } catch (error) {
      // Enhanced error handling with user-friendly messages
      if (error instanceof Error) {
        if (error.message.includes('Failed to search stocks')) {
          throw new Error('Stock search service is temporarily unavailable. Please try again.');
        }
        if (error.message.includes('fetch')) {
          throw new Error('Network error. Please check your connection and try again.');
        }
        throw error;
      }
      
      throw new Error('An unexpected error occurred during stock search.');
    }
  }
}

/**
 * Factory function to create search use case instances
 * 
 * @function createSearchStocksUseCase
 * @returns {RealSearchStocksUseCase} Configured use case instance
 * 
 * @description This factory pattern allows for easy testing and mocking.
 * In tests, we can inject a MockSearchStocksUseCase instead.
 */
export function createSearchStocksUseCase(): RealSearchStocksUseCase {
  return new RealSearchStocksUseCase();
}