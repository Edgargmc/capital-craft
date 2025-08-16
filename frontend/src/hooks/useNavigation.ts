/**
 * 🎣 USE NAVIGATION HOOK
 * 
 * Clean Architecture Hook:
 * - Presentation Layer: React hook interface
 * - Application Layer: Navigation use cases
 * - Infrastructure Layer: AppRouter service
 * 
 * SOLID Principles:
 * - Single Responsibility: Only provides navigation interface
 * - Open/Closed: Extensible for new navigation methods
 * - Interface Segregation: Clean, focused API
 * - Dependency Inversion: Depends on abstractions
 */

'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AppRouter, createAppRouter } from '@/lib/routing/AppRouter';
import { ROUTES, TABS, RouteValue, TabValue } from '@/lib/routing/routes';
import { useMemo } from 'react';

// 🎯 Navigation Hook Interface
export interface UseNavigationReturn {
  // Route navigation
  navigate: (route: RouteValue) => Promise<void>;
  replace: (route: RouteValue) => Promise<void>;
  goBack: () => void;
  refresh: () => void;
  
  // Tab navigation
  switchTab: (tab: TabValue, callback?: (tab: TabValue) => void) => void;
  getCurrentTab: () => TabValue | null;
  
  // Convenience methods
  goToAuth: () => Promise<void>;
  goToHome: () => Promise<void>;
  goToDashboard: () => Promise<void>;
  goToPortfolio: () => Promise<void>;
  goToSettings: () => Promise<void>;
  goToNotifications: () => Promise<void>;
  
  // State
  getCurrentRoute: () => string;
  
  // Constants (for easy access)
  ROUTES: typeof ROUTES;
  TABS: typeof TABS;
  
  // 🔄 MIGRATION HELPERS - Backward compatibility
  // These allow gradual migration from existing router.push() calls
  legacyPush: (url: string) => void;
  legacyReplace: (url: string) => void;
}

/**
 * 🚀 Main Navigation Hook
 * 
 * Usage:
 * ```tsx
 * const nav = useNavigation();
 * 
 * // New centralized way
 * await nav.navigate(nav.ROUTES.DASHBOARD);
 * nav.switchTab(nav.TABS.PORTFOLIO);
 * 
 * // Legacy compatibility (during migration)
 * nav.legacyPush('/dashboard');
 * ```
 */
export const useNavigation = (): UseNavigationReturn => {
  const nextRouter = useRouter();
  const auth = useAuth();
  
  // 🏭 Create AppRouter instance with dependency injection
  const appRouter = useMemo(() => {
    return createAppRouter(
      nextRouter,
      () => auth.isAuthenticated
    );
  }, [nextRouter, auth.isAuthenticated]);

  return {
    // 🎯 Core navigation methods
    navigate: async (route: RouteValue) => {
      await appRouter.navigate(route);
    },
    
    replace: async (route: RouteValue) => {
      await appRouter.replace(route);
    },
    
    goBack: () => {
      appRouter.goBack();
    },
    
    refresh: () => {
      appRouter.refresh();
    },
    
    // 🎭 Tab navigation
    switchTab: (tab: TabValue, callback?: (tab: TabValue) => void) => {
      appRouter.switchTab(tab, callback);
    },
    
    getCurrentTab: () => {
      return appRouter.getCurrentTab();
    },
    
    // 🎯 Convenience methods
    goToAuth: async () => {
      await appRouter.goToAuth();
    },
    
    goToHome: async () => {
      await appRouter.goToHome();
    },
    
    goToDashboard: async () => {
      await appRouter.goToDashboard();
    },
    
    goToPortfolio: async () => {
      await appRouter.navigate(ROUTES.PORTFOLIO);
    },
    
    goToSettings: async () => {
      await appRouter.navigate(ROUTES.SETTINGS);
    },
    
    goToNotifications: async () => {
      await appRouter.navigate(ROUTES.NOTIFICATIONS);
    },
    
    // 📍 State methods
    getCurrentRoute: () => {
      return appRouter.getCurrentRoute();
    },
    
    // 📋 Constants for easy access
    ROUTES,
    TABS,
    
    // 🔄 MIGRATION HELPERS - Backward compatibility
    // These allow existing code to work while we migrate
    legacyPush: (url: string) => {
      console.warn(`[useNavigation] Legacy push detected: ${url}. Consider migrating to nav.navigate()`);
      nextRouter.push(url);
    },
    
    legacyReplace: (url: string) => {
      console.warn(`[useNavigation] Legacy replace detected: ${url}. Consider migrating to nav.replace()`);
      nextRouter.replace(url);
    }
  };
};

// 🎯 Specialized hooks for specific use cases
export const useRouteNavigation = () => {
  const nav = useNavigation();
  
  return {
    navigate: nav.navigate,
    replace: nav.replace,
    goBack: nav.goBack,
    refresh: nav.refresh,
    getCurrentRoute: nav.getCurrentRoute,
    ROUTES: nav.ROUTES
  };
};

export const useTabNavigation = () => {
  const nav = useNavigation();
  
  return {
    switchTab: nav.switchTab,
    getCurrentTab: nav.getCurrentTab,
    TABS: nav.TABS
  };
};

// 🔄 Migration helper hook - for components being migrated
export const useLegacyNavigation = () => {
  const nav = useNavigation();
  
  return {
    // Keep existing interface during migration
    push: nav.legacyPush,
    replace: nav.legacyReplace,
    back: nav.goBack,
    refresh: nav.refresh,
    
    // Encourage migration to new interface
    migrate: {
      navigate: nav.navigate,
      ROUTES: nav.ROUTES
    }
  };
};
