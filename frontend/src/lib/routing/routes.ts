/**
 * 🗺️ CENTRALIZED ROUTING CONSTANTS
 * 
 * Following Clean Architecture principles:
 * - Single Responsibility: Each route has one clear purpose
 * - Open/Closed: Easy to extend with new routes
 * - Dependency Inversion: Components depend on these abstractions
 */

// 🏠 Main Application Routes
export const ROUTES = {
  // Public routes
  HOME: '/',
  AUTH: '/auth',
  
  // Protected routes  
  DASHBOARD: '/dashboard',
  PORTFOLIO: '/portfolio',
  NOTIFICATIONS: '/notifications',
  SETTINGS: '/settings',
  
  // Utility routes
  TEST: '/test',
  THEME_TEST: '/theme-test'
} as const;

// 🎯 Tab-based Navigation (Internal routing)
export const TABS = {
  DASHBOARD: 'dashboard',
  PORTFOLIO: 'portfolio', 
  SEARCH: 'stock-search',
  LEARN: 'learn',
  ACHIEVEMENTS: 'achievements',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
  NOTIFICATIONS: 'notifications',
  FEEDBACK: 'feedback'
} as const;

// 🔐 Route Protection Levels
export const ROUTE_PROTECTION = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated',
  ADMIN: 'admin'
} as const;

// 📋 Route Metadata (for future route guards)
export const ROUTE_META = {
  [ROUTES.HOME]: { 
    protection: ROUTE_PROTECTION.PUBLIC,
    title: 'Capital Craft - Portfolio',
    description: 'Investment learning platform'
  },
  [ROUTES.AUTH]: { 
    protection: ROUTE_PROTECTION.PUBLIC,
    title: 'Login - Capital Craft',
    description: 'Sign in to your account'
  },
  [ROUTES.DASHBOARD]: { 
    protection: ROUTE_PROTECTION.AUTHENTICATED,
    title: 'Dashboard - Capital Craft',
    description: 'Your investment dashboard'
  },
  [ROUTES.PORTFOLIO]: { 
    protection: ROUTE_PROTECTION.AUTHENTICATED,
    title: 'Portfolio - Capital Craft',
    description: 'Manage your investments'
  },
  [ROUTES.NOTIFICATIONS]: { 
    protection: ROUTE_PROTECTION.AUTHENTICATED,
    title: 'Notifications - Capital Craft',
    description: 'Your learning notifications'
  },
  [ROUTES.SETTINGS]: { 
    protection: ROUTE_PROTECTION.AUTHENTICATED,
    title: 'Settings - Capital Craft',
    description: 'Account settings'
  }
} as const;

// 🎭 Type Safety
export type RouteKey = keyof typeof ROUTES;
export type RouteValue = typeof ROUTES[RouteKey];
export type TabKey = keyof typeof TABS;
export type TabValue = typeof TABS[TabKey];
export type ProtectionLevel = typeof ROUTE_PROTECTION[keyof typeof ROUTE_PROTECTION];

// 🔍 Utility Functions (Pure functions - no side effects)
export const isValidRoute = (route: string): route is RouteValue => {
  return Object.values(ROUTES).includes(route as RouteValue);
};

export const isValidTab = (tab: string): tab is TabValue => {
  return Object.values(TABS).includes(tab as TabValue);
};

export const getRouteProtection = (route: RouteValue): ProtectionLevel => {
  return ROUTE_META[route]?.protection || ROUTE_PROTECTION.PUBLIC;
};

export const isProtectedRoute = (route: RouteValue): boolean => {
  return getRouteProtection(route) !== ROUTE_PROTECTION.PUBLIC;
};
