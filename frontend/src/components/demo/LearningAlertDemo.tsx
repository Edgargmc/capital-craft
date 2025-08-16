/**
 * LearningAlertDemo - Test component for LearningAlert with dual approach
 * Demonstrates complex gradient styling, animations, and multiple states
 */

import React, { useState } from 'react';
import { LearningAlert } from '@/components/learning/LearningAlert';

interface LearningAlertDemoProps {
  useThemeSystem?: boolean;
}

export const LearningAlertDemo: React.FC<LearningAlertDemoProps> = ({ 
  useThemeSystem = false 
}) => {
  const [currentTrigger, setCurrentTrigger] = useState<'volatility_basics' | 'market_psychology' | 'diversification'>('volatility_basics');
  const [currentRisk, setCurrentRisk] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM');
  const [alertVisible, setAlertVisible] = useState(true);
  const [actionCount, setActionCount] = useState(0);

  const handleDismiss = () => {
    setActionCount(prev => prev + 1);
    setAlertVisible(false);
    console.log('🚫 Learning alert dismissed', { trigger: currentTrigger, useThemeSystem });
    // Re-show after 2 seconds for demo purposes
    setTimeout(() => setAlertVisible(true), 2000);
  };

  const handleLearnMore = () => {
    setActionCount(prev => prev + 1);
    console.log('📚 Learn More clicked!', { trigger: currentTrigger, useThemeSystem });
    alert(`Learning content for: ${currentTrigger.replace('_', ' ')} (Demo)`);
  };

  const mockVolatilityScore = currentRisk === 'HIGH' ? 2.5 : currentRisk === 'MEDIUM' ? 1.2 : 0.8;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-md font-medium text-gray-700">
          {useThemeSystem ? '🌟 Theme System' : '🔄 Legacy Styles'}
        </h4>
        <div className="text-xs text-gray-500">
          Actions: {actionCount}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3 bg-gray-50 rounded-lg p-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Learning Trigger:
          </label>
          <select
            value={currentTrigger}
            onChange={(e) => setCurrentTrigger(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="volatility_basics">Volatility Basics (Amber)</option>
            <option value="market_psychology">Market Psychology (Indigo)</option>
            <option value="diversification">Diversification (Emerald)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-2">
            Portfolio Risk:
          </label>
          <select
            value={currentRisk}
            onChange={(e) => setCurrentRisk(e.target.value as any)}
            className="px-3 py-1 border border-gray-300 rounded text-sm"
          >
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>
        </div>

        <button
          onClick={() => setAlertVisible(!alertVisible)}
          className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          {alertVisible ? 'Hide Alert' : 'Show Alert'}
        </button>
      </div>

      {/* Learning Alert */}
      {alertVisible && (
        <div className="min-h-[400px]">
          <LearningAlert
            trigger={currentTrigger}
            portfolioRisk={currentRisk}
            volatilityScore={mockVolatilityScore}
            onDismiss={handleDismiss}
            onLearnMore={handleLearnMore}
            useThemeSystem={useThemeSystem}
          />
        </div>
      )}

      {!alertVisible && (
        <div className="text-center text-gray-500 text-sm py-8">
          Alert dismissed. Will reappear in 2 seconds...
        </div>
      )}

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1">
        <div>Theme mode: <span className="font-semibold">{useThemeSystem ? 'New Theme' : 'Legacy'}</span></div>
        <div>Current trigger: <span className="font-mono">{currentTrigger}</span></div>
        <div>Portfolio risk: <span className="font-mono">{currentRisk}</span> (Beta: {mockVolatilityScore})</div>
        <div className="text-blue-600">
          💡 Features: Complex gradients, sparkle animations, hover effects, and responsive design
        </div>
      </div>
    </div>
  );
};