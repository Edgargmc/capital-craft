'use client';

import { useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    // Add any additional logic here when tabs change
  };

  return (
    <div className="h-screen flex bg-gray-50">
      <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardHeader userName="Usuario" />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Dashboard
                </h1>
                <p className="text-gray-600">
                  Vista general de tu actividad de inversión y progreso educativo
                </p>
              </div>
              
              {/* Placeholder content area */}
              <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100">
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Dashboard en Construcción
                  </h3>
                  <p className="text-gray-500 max-w-md mx-auto">
                    Esta página será el centro de comando de tu experiencia educativa de inversión. 
                    Aquí podrás ver resúmenes, progreso y métricas clave.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
