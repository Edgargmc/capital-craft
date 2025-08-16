/**
 * Capital Craft Theme System - INCREMENTAL APPROACH
 * Clean Architecture: Infrastructure Layer (Theme Provider)
 * 
 * Strategy: Create utilities that EXTEND existing classes without breaking them
 */

// 🎨 Design Tokens (Incremental - Safe Approach)
export const tokens = {
  colors: {
    // Brand Primary
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    
    // Semantic Colors  
    success: '#22c55e',
    successLight: '#f0fdf4',
    successBorder: '#15803d',
    
    warning: '#f59e0b',
    warningLight: '#fffbeb', 
    warningBorder: '#b45309',
    
    error: '#ef4444',
    errorLight: '#fef2f2',
    errorBorder: '#b91c1c',
    
    // Neutrals (most commonly used)
    white: '#ffffff',
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827'
  },
  
  radius: {
    sm: '0.375rem',   // 6px
    base: '0.5rem',   // 8px
    md: '0.75rem',    // 12px
    lg: '1rem',       // 16px
    xl: '1.5rem'      // 24px
  },
  
  shadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
  },
  
  transition: {
    fast: '150ms ease-out',
    base: '300ms ease-out',
    slow: '500ms ease-out'
  }
} as const;

// 🧩 Component Builders (Incremental - Non-Breaking)
// These return strings that can be combined with existing classes

export const themeUtils = {
  // Card variants that can be mixed with existing classes
  card: {
    base: () => 'bg-white rounded-xl border border-gray-200 shadow-sm',
    hover: () => 'hover:shadow-md transition-all duration-300',
    interactive: () => 'bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300'
  },

  // Button variants (safe, non-breaking)
  button: {
    primary: () => 'bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300',
    secondary: () => 'bg-gray-50 hover:bg-gray-100 text-gray-600 font-medium border border-gray-200 rounded-xl transition-all duration-300',
    danger: () => 'bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300',
    success: () => 'bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-300'
  },

  // Badge variants
  badge: {
    success: () => 'bg-green-50 text-green-700 border-green-200 px-3 py-1.5 rounded-lg text-xs font-semibold border',
    warning: () => 'bg-yellow-50 text-yellow-700 border-yellow-200 px-3 py-1.5 rounded-lg text-xs font-semibold border',
    error: () => 'bg-red-50 text-red-700 border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold border',
    neutral: () => 'bg-gray-50 text-gray-600 border-gray-200 px-3 py-1.5 rounded-lg text-xs font-medium border'
  },

  // Transition utilities
  transition: {
    fast: () => 'transition-all duration-150 ease-out',
    base: () => 'transition-all duration-300 ease-out', 
    slow: () => 'transition-all duration-500 ease-out'
  },

  // Navigation utilities
  navigation: {
    sidebar: () => 'bg-gray-900 text-white flex flex-col h-full transition-all duration-300',
    item: () => 'w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors',
    itemActive: () => 'bg-blue-600 text-white',
    itemInactive: () => 'text-gray-300 hover:bg-gray-800 hover:text-white',
    header: () => 'p-4 border-b border-gray-700',
    collapseButton: () => 'p-1 rounded hover:bg-gray-800 transition-colors'
  }
};

// 🎯 Safe Utility Functions
export const cn = (...classes: (string | undefined | false)[]) => {
  return classes.filter(Boolean).join(' ');
};

// 🎭 Theme-aware component builder
export const buildComponent = (baseClasses: string, themeClasses?: string) => {
  return cn(baseClasses, themeClasses);
};

// 🚀 Type-safe theme access
export type ThemeTokens = typeof tokens;
export type ThemeUtils = typeof themeUtils;