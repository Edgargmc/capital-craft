import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, X, Sparkles, GraduationCap, Brain } from 'lucide-react';
import { useTheme } from '@/lib/hooks/useTheme';

interface LearningAlertProps {
  trigger: 'volatility_basics' | 'market_psychology' | 'diversification';
  portfolioRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  volatilityScore: number;
  onDismiss: () => void;
  onLearnMore: () => void;
  useThemeSystem?: boolean; // ✅ MIGRATED: Default to theme system (true)
}

export const LearningAlert: React.FC<LearningAlertProps> = ({
  trigger,
  portfolioRisk,
  volatilityScore,
  onDismiss,
  onLearnMore,
  useThemeSystem = true // ✅ MIGRATED: Default to theme system
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 200);
    return () => clearTimeout(timer);
  }, []);

  const handleLearnMore = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onLearnMore();
    }, 300);
  };

  const getTriggerContent = () => {
    switch (trigger) {
      case 'volatility_basics':
        return {
          title: "Master Market Volatility",
          subtitle: "Navigate market swings with confidence",
          description: "Discover advanced strategies to manage volatility and safeguard your wealth.",
          icon: <TrendingUp className="w-6 h-6" />,
          gradientFrom: "from-amber-600",
          gradientTo: "to-yellow-700",
          bgGradient: "from-amber-50/40 to-yellow-100/40",
          borderColor: "border-amber-300/40",
          textColor: "text-amber-900",
          accentColor: "bg-gradient-to-r from-amber-600 to-yellow-700",
          sparkleColor: "text-amber-400/50"
        };
      case 'market_psychology':
        return {
          title: "Master Investor Psychology",
          subtitle: "Harness emotional discipline in trading",
          description: "Learn mental frameworks to make confident, successful investment decisions.",
          icon: <Brain className="w-6 h-6" />,
          gradientFrom: "from-indigo-700",
          gradientTo: "to-blue-800",
          bgGradient: "from-indigo-50/40 to-blue-100/40",
          borderColor: "border-indigo-300/40",
          textColor: "text-indigo-900",
          accentColor: "bg-gradient-to-r from-indigo-700 to-blue-800",
          sparkleColor: "text-indigo-400/50"
        };
      default:
        return {
          title: "Elevate Your Investment Skills",
          subtitle: "Unlock expert-level insights",
          description: "Explore strategies to transform your approach to wealth-building.",
          icon: <GraduationCap className="w-6 h-6" />,
          gradientFrom: "from-emerald-600",
          gradientTo: "to-teal-700",
          bgGradient: "from-emerald-50/40 to-teal-100/40",
          borderColor: "border-emerald-300/40",
          textColor: "text-emerald-900",
          accentColor: "bg-gradient-to-r from-emerald-600 to-teal-700",
          sparkleColor: "text-emerald-400/50"
        };
    }
  };

  const content = getTriggerContent();

  // Theme styles with dual approach for this complex component
  const containerStyles = useThemeSystem
    ? theme.combine(
        'transform transition-all duration-1000 ease-in-out max-w-lg mx-auto',
        isVisible ? 'translate-y-0 opacity-100 scale-100 rotate-0' : 'translate-y-12 opacity-0 scale-95 rotate-1',
        isAnimating ? 'scale-95 opacity-50' : 'scale-100'
      )
    : `transform transition-all duration-1000 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100 scale-100 rotate-0' : 'translate-y-12 opacity-0 scale-95 rotate-1'}
        ${isAnimating ? 'scale-95 opacity-50' : 'scale-100'}
        max-w-lg mx-auto`;

  const mainCardStyles = useThemeSystem
    ? theme.combine(
        theme.card('interactive'),
        'relative overflow-hidden rounded-3xl p-6 mb-8 backdrop-blur-md',
        `bg-gradient-to-br ${content.bgGradient} border ${content.borderColor}`,
        'shadow-2xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)] transition-all duration-500 ease-in-out',
        isHovered ? 'scale-[1.03] -translate-y-1' : ''
      )
    : `relative overflow-hidden
        bg-gradient-to-br ${content.bgGradient}
        border ${content.borderColor}
        rounded-3xl p-6 mb-8
        shadow-2xl hover:shadow-[0_10px_30px_rgba(0,0,0,0.15)]
        transition-all duration-500 ease-in-out
        ${isHovered ? 'scale-[1.03] -translate-y-1' : ''}
        backdrop-blur-md`;

  const primaryButtonStyles = useThemeSystem
    ? theme.combine(
        theme.button('primary'),
        `${content.accentColor} text-white px-5 py-2 rounded-lg text-sm font-semibold`,
        'shadow-md hover:shadow-lg transform hover:scale-105 active:scale-95',
        'transition-all duration-300 ease-in-out relative overflow-hidden group',
        'focus:outline-none focus:ring-2 focus:ring-opacity-30 focus:ring-offset-2'
      )
    : `${content.accentColor} text-white px-5 py-2 rounded-lg text-sm font-semibold
        shadow-md hover:shadow-lg
        transform hover:scale-105 active:scale-95
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-opacity-30 focus:ring-offset-2 focus:ring-${content.gradientFrom.split('-')[1]}
        relative overflow-hidden group`;

  const secondaryButtonStyles = useThemeSystem
    ? theme.combine(
        theme.button('secondary'),
        'bg-white/70 backdrop-blur-sm text-gray-600 px-4 py-2 rounded-lg text-sm font-medium',
        'border border-gray-100 shadow-sm hover:shadow-md hover:bg-white/90 transform hover:scale-105',
        'transition-all duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-200'
      )
    : `bg-white/70 backdrop-blur-sm text-gray-600 px-4 py-2 rounded-lg text-sm font-medium
        border border-gray-100 shadow-sm hover:shadow-md
        hover:bg-white/90 transform hover:scale-105
        transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-gray-200`;

  const getRiskBadgeStyles = (risk: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (useThemeSystem) {
      const variant = risk === 'HIGH' ? 'error' : risk === 'MEDIUM' ? 'warning' : 'success';
      return theme.combine(theme.riskBadge(risk), 'px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm');
    }
    return `px-2.5 py-1 rounded-lg text-xs font-semibold
      ${risk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-100' : 
        risk === 'MEDIUM' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
        'bg-green-50 text-green-700 border-green-100'}
      border shadow-sm`;
  };

  if (!isVisible) return null;

  return (
    <div 
      className={containerStyles}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Debug indicator */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-8 right-0 text-xs text-gray-400 z-20">
          {useThemeSystem ? '🌟' : '🔄'}
        </div>
      )}
      <div className={mainCardStyles}>
        {/* Subtle animated sparkles */}
        <div className="absolute inset-0 pointer-events-none">
          <Sparkles className={`
            absolute top-3 right-4 w-4 h-4 ${content.sparkleColor}
            animate-[fadeInOut_2s_ease-in-out_infinite]
          `} style={{ animationDelay: '0s' }} />
          <Sparkles className={`
            absolute bottom-4 left-6 w-3 h-3 ${content.sparkleColor}
            animate-[fadeInOut_2s_ease-in-out_infinite]
          `} style={{ animationDelay: '0.5s' }} />
          <Sparkles className={`
            absolute top-1/3 right-1/3 w-2 h-2 ${content.sparkleColor}
            animate-[fadeInOut_2s_ease-in-out_infinite]
          `} style={{ animationDelay: '1s' }} />
        </div>

        {/* Gradient border glow */}
        <div className={`
          absolute inset-0 rounded-3xl
          bg-gradient-to-r ${content.gradientFrom} ${content.gradientTo}
          opacity-0 hover:opacity-20 transition-opacity duration-500
        `} />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start space-x-4">
              {/* Icon with gradient background */}
              <div className={`
                ${content.accentColor} text-white rounded-lg p-3
                shadow-md transition-all duration-300
                ${isHovered ? 'scale-110 rotate-3' : 'scale-100'}
                relative overflow-hidden
              `}>
                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-15 transition-opacity duration-300" />
                {content.icon}
              </div>

              <div className="flex-1">
                {/* Title with gradient text */}
                <h3 className={`
                  font-sans font-semibold text-xl mb-1.5 tracking-wide
                  bg-gradient-to-r ${content.gradientFrom} ${content.gradientTo}
                  bg-clip-text text-transparent
                `}>
                  {content.title}
                </h3>

                <p className={`${content.textColor} text-sm font-medium mb-2 opacity-90 tracking-tight`}>
                  {content.subtitle}
                </p>

                <p className="text-gray-600 text-sm leading-relaxed mb-4 font-light tracking-wide">
                  {content.description}
                </p>

                {/* Portfolio metrics */}
                <div className="flex items-center space-x-2 mb-5">
                  <div className={getRiskBadgeStyles(portfolioRisk)}>
                    Risk: {portfolioRisk}
                  </div>
                  <div className="bg-gray-50 px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-600 border border-gray-100 shadow-sm">
                    Beta: {volatilityScore.toFixed(2)}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleLearnMore}
                    className={primaryButtonStyles}
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <div className="relative flex items-center space-x-1.5">
                      <BookOpen className="w-4 h-4" />
                      <span>Start Learning</span>
                    </div>
                  </button>

                  <button
                    onClick={onDismiss}
                    className={secondaryButtonStyles}
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={onDismiss}
              className="
                text-gray-400 hover:text-gray-600
                hover:bg-gray-100/50
                p-1.5 rounded-full
                transition-all duration-300 ease-in-out
                hover:rotate-90
                focus:outline-none
              "
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="mt-4 pt-4 border-t border-gray-100/50">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-gray-500 tracking-tight">Your Learning Journey</span>
              <span className={`${content.textColor} font-semibold tracking-tight`}>Ready to Level Up?</span>
            </div>
            <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`
                h-full ${content.accentColor} rounded-full
                transition-all duration-1000 ease-in-out
                ${isVisible ? 'w-4/5' : 'w-0'}
              `} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};