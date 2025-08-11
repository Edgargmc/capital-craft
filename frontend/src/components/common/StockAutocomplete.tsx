'use client';

import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

/**
 * Stock suggestion interface for autocomplete results
 * @interface StockSuggestion
 */
interface StockSuggestion {
  symbol: string;
  name: string;
  sector: string;
}

/**
 * Props interface for StockAutocomplete component
 * @interface StockAutocompleteProps
 */
interface StockAutocompleteProps {
  /** Current input value */
  value: string;
  /** Callback when stock is selected from dropdown */
  onSelect: (stock: StockSuggestion) => void;
  /** Callback when input value changes */
  onChange: (value: string) => void;
  /** Input placeholder text */
  placeholder?: string;
  /** Whether component is in loading state */
  loading?: boolean;
  /** Whether component is disabled */
  disabled?: boolean;
  /** Callback when selection is cleared */
  onClear?: () => void;
}

/**
 * Mock stock data for initial implementation
 * @constant MOCK_STOCKS
 */
const MOCK_STOCKS: StockSuggestion[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Communication Services' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'TSLA', name: 'Tesla Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'META', name: 'Meta Platforms Inc.', sector: 'Communication Services' },
  { symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financial Services' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
  { symbol: 'V', name: 'Visa Inc.', sector: 'Financial Services' },
  { symbol: 'PG', name: 'Procter & Gamble Company', sector: 'Consumer Staples' },
  { symbol: 'UNH', name: 'UnitedHealth Group Inc.', sector: 'Healthcare' },
  { symbol: 'HD', name: 'Home Depot Inc.', sector: 'Consumer Discretionary' },
  { symbol: 'MA', name: 'Mastercard Inc.', sector: 'Financial Services' },
  { symbol: 'BAC', name: 'Bank of America Corp.', sector: 'Financial Services' }
];

/**
 * Use case for searching stock suggestions (Real API implementation)
 * @class RealSearchStocksUseCase
 */
class RealSearchStocksUseCase {
  /**
   * Execute stock search using Capital Craft API
   * @param query - Search query (symbol or company name)
   * @param limit - Maximum number of results to return
   * @returns Promise<StockSuggestion[]> - Array of matching stocks
   */
  async execute(query: string, limit: number = 10): Promise<StockSuggestion[]> {
    if (!query.trim()) {
      return [];
    }

    try {
      // Import here to avoid circular dependencies
      const { CapitalCraftAPI } = await import('@/lib/api');
      
      const results = await CapitalCraftAPI.searchStocks(query.trim(), limit);
      
      // Convert API Stock objects to StockSuggestion format
      return results.map(stock => ({
        symbol: stock.symbol,
        name: stock.name,
        sector: stock.sector
      }));
      
    } catch (error) {
      console.error('Stock search failed:', error);
      
      // Graceful fallback to mock data for development
      if (process.env.NODE_ENV === 'development') {
        console.log('Falling back to mock data in development mode');
        return this.getMockFallback(query, limit);
      }
      
      throw error;
    }
  }
  
  /**
   * Fallback to mock data in development when API fails
   * @private
   */
  private getMockFallback(query: string, limit: number): StockSuggestion[] {
    const queryLower = query.toLowerCase();
    
    const filtered = MOCK_STOCKS.filter(stock => 
      stock.symbol.toLowerCase().includes(queryLower) ||
      stock.name.toLowerCase().includes(queryLower) ||
      stock.sector.toLowerCase().includes(queryLower)
    );

    return filtered.slice(0, limit);
  }
}

/**
 * Stock autocomplete dropdown component for symbol search
 * 
 * @component StockAutocomplete
 * @description Provides real-time stock symbol suggestions as user types.
 * Features keyboard navigation, debouncing, and Clean Architecture principles.
 * 
 * @param {StockAutocompleteProps} props - Component props
 * @returns {JSX.Element} Autocomplete dropdown component
 * 
 * @example
 * <StockAutocomplete 
 *   value={symbol}
 *   onSelect={(stock) => setSelectedStock(stock)}
 *   onChange={setSymbol}
 *   placeholder="Search AAPL, MSFT..."
 * />
 * 
 * @architecture
 * - Follows Clean Architecture principles with RealSearchStocksUseCase
 * - Uses debouncing (300ms) to reduce unnecessary API calls  
 * - Implements keyboard navigation (↑↓, Enter, Escape)
 * - Accessible with proper ARIA attributes
 * - Graceful fallback to mock data in development mode
 * 
 * @performance
 * - Debounced search to prevent excessive API calls
 * - Real-time backend integration via /stocks/search endpoint
 * - Efficient DOM updates with React hooks
 * - Error handling with user-friendly fallbacks
 */
export function StockAutocomplete({
  value,
  onSelect,
  onChange,
  placeholder = 'Search stocks...',
  loading = false,
  disabled = false,
  onClear
}: StockAutocompleteProps) {
  const [suggestions, setSuggestions] = useState<StockSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSuggestion | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchUseCase = useRef(new RealSearchStocksUseCase());

  /**
   * Search for stock suggestions with debouncing
   */
  useEffect(() => {
    const searchStocks = async () => {
      if (value.length < 1) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

      setSearchLoading(true);
      try {
        const results = await searchUseCase.current.execute(value, 10);
        setSuggestions(results);
        // Only show dropdown if input is focused
        if (document.activeElement === inputRef.current) {
          setShowDropdown(results.length > 0);
        }
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Stock search error:', error);
        setSuggestions([]);
        setShowDropdown(false);
      } finally {
        setSearchLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchStocks, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  /**
   * Handle input changes
   * @param inputValue - New input value
   */
  const handleInputChange = (inputValue: string) => {
    onChange(inputValue.toUpperCase());
  };

  /**
   * Handle stock selection from dropdown
   * @param stock - Selected stock suggestion
   */
  const handleStockSelect = (stock: StockSuggestion) => {
    setSelectedStock(stock);
    onSelect(stock);
    onChange(stock.symbol);
    setShowDropdown(false);
    setSelectedIndex(-1);
    // Blur input immediately to prevent reopening
    inputRef.current?.blur();
  };

  /**
   * Handle clearing the selected stock
   */
  const handleClearStock = () => {
    setSelectedStock(null);
    onChange('');
    if (onClear) {
      onClear();
    }
  };

  /**
   * Handle keyboard navigation
   * @param event - Keyboard event
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;

      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;

      case 'Enter':
        event.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleStockSelect(suggestions[selectedIndex]);
        }
        break;

      case 'Escape':
        event.preventDefault();
        setShowDropdown(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;

      case 'Tab':
        setShowDropdown(false);
        setSelectedIndex(-1);
        break;
    }
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* Input Field with Chip Inside */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-900" />
        
        {/* Selected Stock Chip - Inside Input */}
        {selectedStock ? (
          <div className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white flex items-center">
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              <span>{selectedStock.symbol}</span>
              <button
                onClick={handleClearStock}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5 transition-colors"
                aria-label={`Clear ${selectedStock.symbol} selection`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:cursor-not-allowed"
            aria-label="Stock symbol search"
            aria-haspopup="listbox"
            aria-activedescendant={
              selectedIndex >= 0 ? `stock-option-${selectedIndex}` : undefined
            }
          />
        )}
        
        {/* Loading Spinner */}
        {!selectedStock && (searchLoading || loading) && (
          <div className="absolute right-3 top-3">
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
        )}

        {/* Dropdown Arrow */}
        {!selectedStock && !searchLoading && !loading && suggestions.length > 0 && (
          <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
          aria-label="Stock suggestions"
        >
          {suggestions.map((stock, index) => (
            <div
              key={`${stock.symbol}-${index}`}
              id={`stock-option-${index}`}
              className={`px-4 py-3 cursor-pointer border-b border-gray-100 last:border-b-0 hover:bg-gray-50 ${
                index === selectedIndex ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => handleStockSelect(stock)}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 text-sm">
                      {stock.symbol}
                    </span>
                    <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                      {stock.sector}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-0.5 truncate">
                    {stock.name}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results Message */}
      {showDropdown && suggestions.length === 0 && value.length > 0 && !searchLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No stocks found for &quot;{value}&quot;
          </div>
        </div>
      )}
    </div>
  );
}