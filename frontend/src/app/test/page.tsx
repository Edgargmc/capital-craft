'use client'; 

import React, { useState } from 'react';
import { Shield, Scale, Flame } from 'lucide-react';
import { useNotificationStore } from '@/lib/stores';


// Portfolio Risk Calculator (copy from your component)
interface Holding {
  symbol: string;
  shares: number;
  current_value: number;
  beta?: number;
}

interface PortfolioRisk {
  level: 'conservative' | 'balanced' | 'aggressive' | 'not-rated';
  avgBeta: number | null;
  label: string;
  color: string;
  bgColor: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

class PortfolioRiskCalculator {
  static calculate(holdings: Record<string, Holding>): PortfolioRisk {
    const holdingsArray = Object.values(holdings);
    
    if (holdingsArray.length === 0) {
      return {
        level: 'not-rated',
        avgBeta: null,
        label: 'Not Rated',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        icon: Scale,
        description: 'Add stocks to see portfolio risk assessment'
      };
    }

    let totalValue = 0;
    let weightedBetaSum = 0;

    holdingsArray.forEach(holding => {
      const value = holding.current_value;
      totalValue += value;
      const beta = holding.beta ?? 1.0;
      weightedBetaSum += beta * value;
    });

    const avgBeta = totalValue > 0 ? weightedBetaSum / totalValue : 1.0;

    if (avgBeta < 1.0) {
      return {
        level: 'conservative',
        avgBeta,
        label: 'Conservative',
        color: 'text-green-700',
        bgColor: 'bg-green-100',
        icon: Shield,
        description: 'Lower risk than market average. More stable, less volatile returns.'
      };
    } else if (avgBeta <= 1.3) {
      return {
        level: 'balanced',
        avgBeta,
        label: 'Balanced',
        color: 'text-blue-700',
        bgColor: 'bg-blue-100',
        icon: Scale,
        description: 'Moderate risk similar to market. Balanced volatility and growth potential.'
      };
    } else {
      return {
        level: 'aggressive',
        avgBeta,
        label: 'Aggressive',
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        icon: Flame,
        description: 'Higher risk than market. More volatile but potential for higher returns.'
      };
    }
  }
}

// Portfolio Risk Badge Test Component
const PortfolioRiskBadge: React.FC<{ holdings: Record<string, Holding> }> = ({ holdings }) => {
  const risk = PortfolioRiskCalculator.calculate(holdings);
  const Icon = risk.icon;

  return (
    <div className="flex items-center space-x-2">
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${risk.color} ${risk.bgColor} transition-colors duration-200`}>
        <Icon className="h-4 w-4 mr-1.5" />
        <span>{risk.label}</span>
        {risk.avgBeta && (
          <span className="ml-1 text-xs opacity-75">
            β{risk.avgBeta.toFixed(2)}
          </span>
        )}
      </div>
      
      <div className="relative group">
        <div className="cursor-help text-gray-400 hover:text-gray-600">
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-[60]">
          <div className="bg-gray-900 text-white p-3 rounded-lg shadow-xl max-w-64 text-sm">
            <div className="font-medium text-blue-300 mb-1">Portfolio Risk Level</div>
            <p className="text-gray-300 text-xs leading-relaxed">{risk.description}</p>
            {risk.avgBeta && (
              <div className="mt-2 pt-2 border-t border-gray-700">
                <span className="text-xs text-yellow-300">
                  💡 Beta {risk.avgBeta.toFixed(2)} vs Market Beta 1.0
                </span>
              </div>
            )}
            
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main Test Page Component
export default function TestPage() {
  // Test portfolios with different risk profiles
  const testPortfolios = {
    conservative: {
      "KO": { symbol: "KO", shares: 100, current_value: 6240, beta: 0.65 },
      "JNJ": { symbol: "JNJ", shares: 50, current_value: 7945, beta: 0.72 }
    },
    balanced: {
      "AAPL": { symbol: "AAPL", shares: 20, current_value: 3710, beta: 1.29 },
      "MSFT": { symbol: "MSFT", shares: 10, current_value: 4152, beta: 0.89 }
    },
    aggressive: {
      "TSLA": { symbol: "TSLA", shares: 15, current_value: 3731, beta: 2.31 },
      "NVDA": { symbol: "NVDA", shares: 5, current_value: 4376, beta: 1.68 }
    },
    mixed: {
      "KO": { symbol: "KO", shares: 50, current_value: 3120, beta: 0.65 },
      "AAPL": { symbol: "AAPL", shares: 10, current_value: 1855, beta: 1.29 },
      "TSLA": { symbol: "TSLA", shares: 5, current_value: 1244, beta: 2.31 }
    },
    empty: {}
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">🧪 Capital Craft - Test Lab</h1>
          <p className="text-gray-600 mt-1">Testing components in isolation before integration</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Portfolio Risk Badge Tests */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            🛡️ Portfolio Risk Badge Testing
          </h2>
          
          <div className="grid gap-6">
            {Object.entries(testPortfolios).map(([type, holdings]) => (
              <div key={type} className="bg-white rounded-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 capitalize mb-1">
                      {type} Portfolio
                    </h3>
                    <p className="text-sm text-gray-600">
                      Holdings: {Object.keys(holdings).join(', ') || 'None'}
                    </p>
                  </div>
                  <PortfolioRiskBadge holdings={holdings} />
                </div>
                
                {/* Portfolio Details */}
                {Object.keys(holdings).length > 0 && (
                  <div className="text-sm text-gray-600 bg-gray-50 rounded p-3">
                    <p className="font-medium mb-2">Stock Details:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.values(holdings).map(stock => (
                        <div key={stock.symbol} className="flex justify-between">
                          <span>{stock.symbol}:</span>
                          <span>β{stock.beta?.toFixed(2) || '1.00'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Future Tests Section */}
        <section className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-2">🚀 Future Test Areas</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Educational Tooltips Testing</li>
            <li>• Dividend Income Calculator</li>
            <li>• Stock Performance Indicators</li>
            <li>• Mobile Responsive Components</li>
            <li>• Loading States & Error Handling</li>
          </ul>
        </section>
        {/* NUEVA SECCIÓN - Zustand Store Test */}
        <ZustandStoreTest />

        {/* Risk Level Guide */}
        <section className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-3">📚 Risk Level Reference:</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-green-600" />
              <div>
                <div className="font-medium text-green-700">Conservative (β &lt; 1.0)</div>
                <div className="text-green-600">Lower volatility, stable returns</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Scale className="h-4 w-4 text-blue-600" />
              <div>
                <div className="font-medium text-blue-700">Balanced (β 1.0-1.3)</div>
                <div className="text-blue-600">Market-like volatility</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Flame className="h-4 w-4 text-red-600" />
              <div>
                <div className="font-medium text-red-700">Aggressive (β &gt; 1.3)</div>
                <div className="text-red-600">Higher volatility, growth potential</div>
              </div>
            </div>
          </div>
        </section>
        <NotificationBellTest />
      </div>
    </div>
  );
}

// 🔔 NotificationBell Test - Capital Craft Specific
const NotificationBellTest: React.FC = () => {
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'pass' | 'fail'>('idle');
  const [clickCount, setClickCount] = useState(0);
  const { notifications, getUnreadCount, fetchNotifications, isLoading, error } = useNotificationStore();

  const runNotificationBellTest = async () => {
    setTestResult('testing');
    
    try {
      // Test 1: Fetch notifications from your backend
      await fetchNotifications('test-user-123');
      
      // Small delay to ensure state updates
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Test 2: Validate results
      const hasNotifications = Array.isArray(notifications);
      const unreadCount = getUnreadCount();
      const hasValidUnreadCount = typeof unreadCount === 'number' && unreadCount >= 0;
      const noErrors = !error;
      
      // Final validation
      if (hasNotifications && hasValidUnreadCount && noErrors) {
        setTestResult('pass');
      } else {
        setTestResult('fail');
        console.log('❌ NotificationBell Test: FAILED');
      }
      
    } catch (testError) {
      setTestResult('fail');
      console.error('❌ NotificationBell Test Error:', testError);
    }
  };

  const handleMockBellClick = () => {
    setClickCount(prev => prev + 1);
  };

  const resetTest = () => {
    setTestResult('idle');
    setClickCount(0);
  };

  return (
    <section className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <span className="mr-2">🔔</span>
        NotificationBell Test
        <span className="ml-2 text-sm font-normal text-gray-500">(Capital Craft Core Feature)</span>
      </h2>

      {/* Test Status */}
      <div className="mb-4 p-3 rounded-lg border-2 border-dashed border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-600">Test Status:</span>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            testResult === 'idle' ? 'bg-gray-100 text-gray-600' :
            testResult === 'testing' ? 'bg-yellow-100 text-yellow-700' :
            testResult === 'pass' ? 'bg-green-100 text-green-700' :
            'bg-red-100 text-red-700'
          }`}>
            {testResult === 'idle' ? '⏳ Ready' :
             testResult === 'testing' ? '🔄 Testing...' :
             testResult === 'pass' ? '✅ PASSED' :
             '❌ FAILED'}
          </div>
        </div>
      </div>

      {/* Capital Craft Notification Data */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800 mb-2">Total Notifications</div>
          <div className="text-2xl font-bold text-blue-900">
            {notifications === null ? '🔄 Loading' : notifications?.length || 0}
          </div>
          <div className="text-xs text-blue-600 mt-1">From your backend API</div>
        </div>

        <div className="p-4 bg-red-50 rounded-lg">
          <div className="text-sm font-medium text-red-800 mb-2">Unread Count</div>
          <div className="text-2xl font-bold text-red-900">{getUnreadCount()}</div>
          <div className="text-xs text-red-600 mt-1">Badge number</div>
        </div>

        <div className="p-4 bg-purple-50 rounded-lg">
          <div className="text-sm font-medium text-purple-800 mb-2">Bell Clicks</div>
          <div className="text-2xl font-bold text-purple-900">{clickCount}</div>
          <div className="text-xs text-purple-600 mt-1">User interactions</div>
        </div>
      </div>

      {/* Mock NotificationBell Component */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="text-sm font-medium text-gray-700 mb-3">Mock NotificationBell Component:</div>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={handleMockBellClick}
            className="relative p-3 bg-white border-2 border-gray-300 rounded-full hover:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">🔔</span>
            {getUnreadCount() > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {getUnreadCount() > 9 ? '9+' : getUnreadCount()}
              </span>
            )}
          </button>
          
          {isLoading && (
            <div className="text-blue-600 text-sm">
              🔄 Loading notifications...
            </div>
          )}
          
          {error && (
            <div className="text-red-600 text-sm">
              ❌ Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Test Actions */}
      <div className="flex space-x-3">
        <button
          onClick={runNotificationBellTest}
          disabled={testResult === 'testing'}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
        >
          🔔 Test NotificationBell
        </button>
        
        <button
          onClick={resetTest}
          className="bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors font-medium"
        >
          🔄 Reset
        </button>
      </div>

      {/* Test Instructions */}
      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-sm text-green-800">
        <strong>🎯 NotificationBell Test Instructions:</strong>
        <ol className="mt-1 ml-4 list-decimal space-y-1">
          <li>Click &quot;Test NotificationBell&quot; button</li>
          <li>Watch notification data load from your Capital Craft backend</li>
          <li>Click the mock bell 🔔 to test interactions</li>
          <li>Check browser console (F12) for detailed logs</li>
          <li>Verify unread count badge appears correctly</li>
        </ol>
      </div>

      {/* What This Tests */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
        <strong>🔍 What This Tests (Capital Craft Specific):</strong>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li><strong>Notification System:</strong> Your core feature working end-to-end</li>
          <li><strong>Clean Architecture:</strong> Use cases and repositories functioning</li>
          <li><strong>Zustand Store:</strong> useNotificationStore hook integration</li>
          <li><strong>API Integration:</strong> Frontend ↔ Backend communication</li>
          <li><strong>Persistent Data:</strong> JSON/Mock repository responses</li>
        </ul>
      </div>
    </section>
  );
};

// Añadir este componente DENTRO de tu TestPage existente
const ZustandStoreTest: React.FC = () => {
  const { notifications, isLoading, error, fetchNotifications, clearError } = useNotificationStore();
  
  const handleTest = () => {
    // Test action call
    fetchNotifications('test-user-123');
  };

  return (
    <section className="mb-12">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        🗄️ Zustand Store Testing
      </h2>
      
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              Notification Store Status
            </h3>
            <p className="text-sm text-gray-600">
              Testing basic store functionality
            </p>
          </div>
          <button 
            onClick={handleTest}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Test Store
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">Loading State</div>
            <div className={`text-lg font-bold ${isLoading ? 'text-blue-600' : 'text-gray-400'}`}>
              {isLoading ? '⏳ Loading' : '✅ Ready'}
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">Error State</div>
            <div className={`text-lg font-bold ${error ? 'text-red-600' : 'text-gray-400'}`}>
              {error ? '❌ Error' : '✅ No Errors'}
            </div>
            {error && (
              <button 
                onClick={clearError}
                className="text-xs text-red-500 hover:text-red-700 mt-1"
              >
                Clear Error
              </button>
            )}
          </div>
          
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">Notifications</div>
            <div className="text-lg font-bold text-gray-600">
            {notifications === null ? '🔄 Not Loaded' : `📝 ${notifications?.length || 0} items`}
            </div>
          </div>
        </div>

        {/* Console Log Instructions */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
          <strong>💡 Testing Instructions:</strong>
          <ol className="mt-1 ml-4 list-decimal space-y-1">
            <li>Click &quot;Test Store&quot; button</li>
            <li>Open browser console (F12)</li>
            <li>Look for &quot;Testing Zustand store...&quot; logs</li>
            <li>Verify &quot;fetchNotifications called with userId: test-user-123&quot;</li>
          </ol>
        </div>
      </div>
    </section>
  );
};