'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';

export function SidebarDemo() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [themeMode, setThemeMode] = useState<'theme' | 'legacy'>('theme');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Theme Toggle Controls */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-lg p-4 border">
        <h3 className="text-sm font-semibold mb-2">🎨 Sidebar Theme Demo</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setThemeMode('theme')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              themeMode === 'theme'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🌟 Theme System
          </button>
          <button
            onClick={() => setThemeMode('legacy')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              themeMode === 'legacy'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            🔄 Legacy CSS
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          Active Tab: <span className="font-mono bg-gray-100 px-1 rounded">{activeTab}</span>
        </div>
      </div>

      {/* Sidebar Component Demo */}
      <div className="flex h-screen">
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          useThemeSystem={themeMode === 'theme'}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 p-8 ml-0 md:ml-0">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              🧭 Sidebar Theme Demo
            </h1>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Current Mode: {themeMode === 'theme' ? '🌟 Theme System' : '🔄 Legacy CSS'}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Features Tested:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✅ Navigation utilities (sidebar, item, itemActive)</li>
                    <li>✅ Header and collapse button styling</li>
                    <li>✅ Mobile responsive behavior</li>
                    <li>✅ Active/inactive state management</li>
                    <li>✅ Dual approach pattern implementation</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Test Actions:</h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>🔄 Switch between theme modes</li>
                    <li>📱 Test mobile menu (resize window)</li>
                    <li>🎯 Click different navigation items</li>
                    <li>📂 Toggle sidebar collapse (desktop)</li>
                    <li>🐛 Check debug indicators</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-2">
                🧪 Migration Status
              </h3>
              <p className="text-sm text-blue-800">
                Sidebar has been successfully migrated with dual approach pattern. 
                Navigation utilities from theme system are being applied while maintaining 
                backward compatibility with legacy CSS styles.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}