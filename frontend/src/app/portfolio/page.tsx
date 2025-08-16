'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * 📊 Portfolio Page
 * 
 * This page serves as the dedicated portfolio route (/portfolio)
 * Currently redirects to home (/) to maintain existing functionality
 * while providing a proper URL endpoint.
 */
export default function PortfolioPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page where portfolio content is actually rendered
    // This maintains backward compatibility while providing the /portfolio URL
    router.replace('/');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading portfolio...</p>
      </div>
    </div>
  );
}
