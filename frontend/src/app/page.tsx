'use client';

import { PortfolioDashboard } from '@/components/portfolio/PortfolioDashboard';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const auth = useAuth();

  return (
    <main>
      {auth.isAuthenticated ? (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 mb-4 rounded-md text-sm">
          ✅ Logged in as: <strong>{auth.user?.email}</strong>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-2 mb-4 rounded-md text-sm">
          ⚠️ Not logged in - <a href="/auth" className="underline">Login here</a>
        </div>
      )}
      
      <PortfolioDashboard />
    </main>
  );
}