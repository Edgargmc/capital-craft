/**
 * Theme Hook - INCREMENTAL APPROACH
 * Clean Architecture: Application Layer
 * Provides safe theme utilities that don't break existing styles
 */

import { tokens, themeUtils, cn, buildComponent } from '../theme';

export const useTheme = () => {
  // Safe component builders that can be mixed with existing classes
  const card = (variant: 'base' | 'hover' | 'interactive' = 'base') => {
    return themeUtils.card[variant]();
  };

  const button = (variant: 'primary' | 'secondary' | 'danger' | 'success' = 'primary') => {
    return themeUtils.button[variant]();
  };

  const badge = (variant: 'success' | 'warning' | 'error' | 'neutral' = 'neutral') => {
    return themeUtils.badge[variant]();
  };

  const transition = (speed: 'fast' | 'base' | 'slow' = 'base') => {
    return themeUtils.transition[speed]();
  };

  // Risk-specific badge mapping (for existing components)
  const riskBadge = (risk: 'HIGH' | 'MEDIUM' | 'LOW') => {
    const riskMap = {
      'HIGH': 'error',
      'MEDIUM': 'warning',
      'LOW': 'success'
    } as const;
    return badge(riskMap[risk]);
  };

  // Utility functions
  const combine = cn;
  const build = buildComponent;

  return {
    // Component builders
    card,
    button, 
    badge,
    transition,
    riskBadge,
    
    // Utility functions
    combine,
    build,
    
    // Direct token access
    tokens
  };
};

// Re-export utilities for direct use
export { tokens, themeUtils, cn, buildComponent } from '../theme';