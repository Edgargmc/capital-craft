/**
 * 🚀 APP ROUTER SERVICE
 * 
 * Clean Architecture Implementation:
 * - Domain Layer: Navigation abstractions and business rules
 * - Infrastructure Layer: Next.js router implementation details
 * - Application Layer: Navigation use cases
 * 
 * SOLID Principles:
 * - Single Responsibility: Only handles navigation logic
 * - Open/Closed: Extensible for new navigation features
 * - Liskov Substitution: Can be replaced with different router implementations
 * - Interface Segregation: Specific navigation interfaces
 * - Dependency Inversion: Depends on abstractions, not Next.js directly
 */

import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { ROUTES, TABS, RouteValue, TabValue, isValidRoute, isValidTab, isProtectedRoute } from './routes';

// 🎯 Domain Layer - Navigation Interfaces
export interface INavigationService {
  navigate(route: RouteValue): Promise<void>;
  replace(route: RouteValue): Promise<void>;
  goBack(): void;
  refresh(): void;
  getCurrentRoute(): string;
}

export interface ITabNavigationService {
  switchTab(tab: TabValue): void;
  getCurrentTab(): TabValue | null;
}

export interface IRouteGuardService {
  canNavigate(route: RouteValue): boolean;
  getRedirectRoute(route: RouteValue): RouteValue | null;
}

// 🏗️ Application Layer - Navigation Use Cases
export class NavigationUseCases {
  constructor(
    private navigationService: INavigationService,
    private routeGuardService: IRouteGuardService
  ) {}

  async navigateWithGuard(route: RouteValue): Promise<boolean> {
    if (!this.routeGuardService.canNavigate(route)) {
      const redirectRoute = this.routeGuardService.getRedirectRoute(route);
      if (redirectRoute) {
        await this.navigationService.navigate(redirectRoute);
      }
      return false;
    }
    
    await this.navigationService.navigate(route);
    return true;
  }

  async navigateToAuth(): Promise<void> {
    await this.navigationService.navigate(ROUTES.AUTH);
  }

  async navigateToHome(): Promise<void> {
    await this.navigationService.navigate(ROUTES.HOME);
  }

  async navigateToDashboard(): Promise<void> {
    await this.navigateWithGuard(ROUTES.DASHBOARD);
  }
}

// 🔧 Infrastructure Layer - Next.js Router Implementation
export class NextJsNavigationService implements INavigationService {
  constructor(private router: AppRouterInstance) {}

  async navigate(route: RouteValue): Promise<void> {
    if (!isValidRoute(route)) {
      console.warn(`[AppRouter] Invalid route: ${route}`);
      return;
    }
    
    console.log(`[AppRouter] Navigating to: ${route}`);
    this.router.push(route);
  }

  async replace(route: RouteValue): Promise<void> {
    if (!isValidRoute(route)) {
      console.warn(`[AppRouter] Invalid route for replace: ${route}`);
      return;
    }
    
    console.log(`[AppRouter] Replacing with: ${route}`);
    this.router.replace(route);
  }

  goBack(): void {
    console.log(`[AppRouter] Going back`);
    this.router.back();
  }

  refresh(): void {
    console.log(`[AppRouter] Refreshing`);
    this.router.refresh();
  }

  getCurrentRoute(): string {
    if (typeof window !== 'undefined') {
      return window.location.pathname;
    }
    return '/';
  }
}

// 🛡️ Route Guard Implementation (Basic - will be enhanced later)
export class BasicRouteGuardService implements IRouteGuardService {
  constructor(private isAuthenticated: () => boolean) {}

  canNavigate(route: RouteValue): boolean {
    if (!isProtectedRoute(route)) {
      return true;
    }
    
    return this.isAuthenticated();
  }

  getRedirectRoute(route: RouteValue): RouteValue | null {
    if (isProtectedRoute(route) && !this.isAuthenticated()) {
      return ROUTES.AUTH;
    }
    
    return null;
  }
}

// 🎭 Tab Navigation Service (for internal navigation)
export class TabNavigationService implements ITabNavigationService {
  private currentTab: TabValue | null = null;
  private tabChangeCallback: ((tab: TabValue) => void) | null = null;

  setTabChangeCallback(callback: (tab: TabValue) => void): void {
    this.tabChangeCallback = callback;
  }

  switchTab(tab: TabValue): void {
    if (!isValidTab(tab)) {
      console.warn(`[TabNavigation] Invalid tab: ${tab}`);
      return;
    }

    console.log(`[TabNavigation] Switching to tab: ${tab}`);
    this.currentTab = tab;
    
    if (this.tabChangeCallback) {
      this.tabChangeCallback(tab);
    }
  }

  getCurrentTab(): TabValue | null {
    return this.currentTab;
  }
}

// 🎯 Main AppRouter Class (Facade Pattern)
export class AppRouter {
  private navigationService: INavigationService;
  private tabNavigationService: ITabNavigationService;
  private routeGuardService: IRouteGuardService;
  private navigationUseCases: NavigationUseCases;

  constructor(
    router: AppRouterInstance,
    isAuthenticated: () => boolean
  ) {
    // Dependency Injection
    this.navigationService = new NextJsNavigationService(router);
    this.routeGuardService = new BasicRouteGuardService(isAuthenticated);
    this.tabNavigationService = new TabNavigationService();
    this.navigationUseCases = new NavigationUseCases(
      this.navigationService,
      this.routeGuardService
    );
  }

  // 🚀 Public API - Simple and clean
  async navigate(route: RouteValue): Promise<void> {
    await this.navigationUseCases.navigateWithGuard(route);
  }

  async replace(route: RouteValue): Promise<void> {
    await this.navigationService.replace(route);
  }

  goBack(): void {
    this.navigationService.goBack();
  }

  refresh(): void {
    this.navigationService.refresh();
  }

  // Tab navigation
  switchTab(tab: TabValue, callback?: (tab: TabValue) => void): void {
    if (callback) {
      this.tabNavigationService.setTabChangeCallback(callback);
    }
    this.tabNavigationService.switchTab(tab);
  }

  getCurrentTab(): TabValue | null {
    return this.tabNavigationService.getCurrentTab();
  }

  getCurrentRoute(): string {
    return this.navigationService.getCurrentRoute();
  }

  // 🎯 Convenience methods
  async goToAuth(): Promise<void> {
    await this.navigationUseCases.navigateToAuth();
  }

  async goToHome(): Promise<void> {
    await this.navigationUseCases.navigateToHome();
  }

  async goToDashboard(): Promise<void> {
    await this.navigationUseCases.navigateToDashboard();
  }
}

// 🏭 Factory Pattern for easy instantiation
export const createAppRouter = (
  router: AppRouterInstance,
  isAuthenticated: () => boolean
): AppRouter => {
  return new AppRouter(router, isAuthenticated);
};
