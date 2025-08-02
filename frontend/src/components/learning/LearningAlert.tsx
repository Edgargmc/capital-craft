import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, X, AlertTriangle } from 'lucide-react';

interface LearningAlertProps {
  trigger: 'volatility_basics' | 'market_psychology' | 'diversification';
  portfolioRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  volatilityScore: number;
  onDismiss: () => void;
  onLearnMore: () => void;
}

export const LearningAlert: React.FC<LearningAlertProps> = ({
  trigger,
  portfolioRisk,
  volatilityScore,
  onDismiss,
  onLearnMore
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Pequeña animación de entrada
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleLearnMore = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onLearnMore();
    }, 200);
  };

  const getTriggerContent = () => {
    switch (trigger) {
      case 'volatility_basics':
        return {
          title: "Your portfolio has high volatility",
          description: "Learn how to manage market volatility and protect your investments",
          icon: <TrendingUp className="w-5 h-5" />,
          color: "bg-orange-500",
          lightColor: "bg-orange-50",
          textColor: "text-orange-700"
        };
      case 'market_psychology':
        return {
          title: "Time to learn market psychology",
          description: "Your portfolio is down. Learn to make rational decisions in difficult times",
          icon: <AlertTriangle className="w-5 h-5" />,
          color: "bg-red-500",
          lightColor: "bg-red-50",
          textColor: "text-red-700"
        };
      default:
        return {
          title: "Learning opportunity",
          description: "Improve your investment knowledge",
          icon: <BookOpen className="w-5 h-5" />,
          color: "bg-blue-500",
          lightColor: "bg-blue-50",
          textColor: "text-blue-700"
        };
    }
  };

  const content = getTriggerContent();

  if (!isVisible) return null;

  return (
    <div className={`
      transform transition-all duration-500 ease-out
      ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
      ${isAnimating ? 'scale-95 opacity-50' : 'scale-100'}
    `}>
      <div className={`
        ${content.lightColor} border-l-4 border-l-orange-500 
        rounded-lg p-4 mb-4 shadow-sm hover:shadow-md 
        transition-shadow duration-200
      `}>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {/* Icon with pulse animation */}
            <div className={`
              ${content.color} text-white rounded-full p-2
              animate-pulse hover:animate-none transition-all duration-200
            `}>
              {content.icon}
            </div>
            
            <div className="flex-1">
              <h3 className={`${content.textColor} font-semibold text-sm mb-1`}>
                {content.title}
              </h3>
              <p className="text-gray-600 text-sm mb-3">
                {content.description}
              </p>
              
              {/* Portfolio risk badge */}
              <div className="flex items-center space-x-2 mb-3">
                <span className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${portfolioRisk === 'HIGH' ? 'bg-red-100 text-red-800' : 
                    portfolioRisk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-green-100 text-green-800'}
                `}>
                  Risk: {portfolioRisk}
                </span>
                <span className="text-xs text-gray-500">
                  Beta: {volatilityScore.toFixed(2)}
                </span>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={handleLearnMore}
                  className={`
                    ${content.color} text-white px-3 py-1.5 rounded-md text-sm
                    hover:opacity-90 transform hover:scale-105 
                    transition-all duration-200 font-medium
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                  `}
                >
                  <BookOpen className="w-4 h-4 inline mr-1" />
                  Learn now
                </button>
                <button
                  onClick={onDismiss}
                  className="
                    bg-gray-100 text-gray-700 px-3 py-1.5 rounded-md text-sm
                    hover:bg-gray-200 transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                  "
                >
                  Later
                </button>
              </div>
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="
              text-gray-400 hover:text-gray-600 
              hover:scale-110 transition-all duration-200
              focus:outline-none
            "
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

