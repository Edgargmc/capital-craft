/**
 * ThemeButton - Modern UI Button Component using Theme System
 * ✅ FULLY MIGRATED: Uses theme system exclusively for consistent styling
 * Features: Multiple variants, sizes, and accessibility support
 */

import React from 'react';
import { useTheme } from '@/lib/hooks/useTheme';

interface ThemeButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export const ThemeButton: React.FC<ThemeButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = ''
}) => {
  const theme = useTheme();

  // 🌟 Theme system styling
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm', 
    lg: 'px-6 py-3 text-base'
  };

  const buttonStyles = theme.combine(
    theme.button(variant),
    sizes[size],
    disabled && 'opacity-50 cursor-not-allowed',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    className
  );

  return (
    <button
      className={buttonStyles}
      onClick={onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  );
};

export default ThemeButton;