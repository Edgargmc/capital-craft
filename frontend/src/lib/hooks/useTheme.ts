/**
 * Theme Hook - Clean Architecture: Application Layer
 * Centralized theme management for consistent UI
 */

import { components, getLearningTheme, transitions } from '../theme';

export const useTheme = () => {
  const getCardStyles = (variant: 'base' | 'interactive' | 'elevated' = 'base') => {
    return components.card[variant];
  };

  const getButtonStyles = (variant: 'primary' | 'secondary' | 'ghost' = 'primary') => {
    return components.button[variant];
  };

  const getBadgeStyles = (variant: 'high' | 'medium' | 'low' | 'neutral' = 'neutral') => {
    return components.badge[variant];
  };

  const getRiskBadgeVariant = (risk: 'HIGH' | 'MEDIUM' | 'LOW') => {
    const variants = {
      'HIGH': 'high',
      'MEDIUM': 'medium', 
      'LOW': 'low'
    } as const;
    return getBadgeStyles(variants[risk]);
  };

  const getTransition = (speed: 'fast' | 'normal' | 'slow' | 'slowest' = 'normal') => {
    return transitions[speed];
  };

  return {
    card: getCardStyles,
    button: getButtonStyles,
    badge: getBadgeStyles,
    riskBadge: getRiskBadgeVariant,
    transition: getTransition,
    learningTheme: getLearningTheme
  };
};

// Re-export theme components for direct access
export { components, getLearningTheme, transitions } from '../theme';