import React, { useState, useEffect } from 'react';
import { TrendingUp, BookOpen, X, Sparkles, GraduationCap, Brain, ArrowRight, Target, Zap } from 'lucide-react';

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
  const [isHovered, setIsHovered] = useState(false);
  const [sparkleAnimation, setSparkleAnimation] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 300);
    
    const sparkleInterval = setInterval(() => {
      setSparkleAnimation(prev => (prev + 1) % 3);
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(sparkleInterval);
    };
  }, []);

  const handleLearnMore = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onLearnMore();
    }, 400);
  };

  const getTriggerContent = () => {
    switch (trigger) {
      case 'volatility_basics':
        return {
          title: "Domina la Volatilidad del Mercado",
          subtitle: "Tu portafolio muestra señales de alta volatilidad",
          description: "Descubre estrategias institucionales para navegar la incertidumbre y optimizar tus decisiones de inversión con precisión.",
          icon: <TrendingUp className="w-6 h-6" />,
          secondaryIcon: <Target className="w-4 h-4" />,
          theme: "slate",
          accent: "text-slate-700",
          iconBg: "bg-slate-100",
          iconColor: "text-slate-700",
          buttonBg: "bg-slate-900 hover:bg-slate-800",
          borderColor: "border-slate-200",
          sparkleColor: "text-slate-400"
        };
      case 'market_psychology':
        return {
          title: "Psicología del Inversor Elite",
          subtitle: "Tu portafolio necesita inteligencia emocional",
          description: "Aprende los principios mentales que distinguen a los inversores institucionales. Desarrolla disciplina y claridad en tus decisiones.",
          icon: <Brain className="w-6 h-6" />,
          secondaryIcon: <Zap className="w-4 h-4" />,
          theme: "stone",
          accent: "text-stone-700",
          iconBg: "bg-stone-100",
          iconColor: "text-stone-700",
          buttonBg: "bg-stone-900 hover:bg-stone-800",
          borderColor: "border-stone-200",
          sparkleColor: "text-stone-400"
        };
      case 'diversification':
        return {
          title: "Maestría en Diversificación",
          subtitle: "Construye una base sólida y equilibrada",
          description: "Aprende las técnicas de asignación de activos que utilizan los gestores de patrimonio más exitosos a nivel global.",
          icon: <GraduationCap className="w-6 h-6" />,
          secondaryIcon: <Target className="w-4 h-4" />,
          theme: "zinc",
          accent: "text-zinc-700",
          iconBg: "bg-zinc-100",
          iconColor: "text-zinc-700",
          buttonBg: "bg-zinc-900 hover:bg-zinc-800",
          borderColor: "border-zinc-200",
          sparkleColor: "text-zinc-400"
        };
      default:
        return {
          title: "Oportunidad de Conocimiento Elite",
          subtitle: "Expande tu experiencia de inversión",
          description: "Descubre insights que podrían transformar tu enfoque de inversión para siempre.",
          icon: <GraduationCap className="w-6 h-6" />,
          secondaryIcon: <Target className="w-4 h-4" />,
          theme: "gray",
          accent: "text-gray-700",
          iconBg: "bg-gray-100",
          iconColor: "text-gray-700",
          buttonBg: "bg-gray-900 hover:bg-gray-800",
          borderColor: "border-gray-200",
          sparkleColor: "text-gray-400"
        };
    }
  };

  const content = getTriggerContent();

  if (!isVisible) return null;

  return (
    <div
      className={`
        transform transition-all duration-700 ease-out
        ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-8 opacity-0 scale-98'}
        ${isAnimating ? 'scale-98 opacity-90' : 'scale-100'}
        ${isHovered ? 'scale-[1.01] -translate-y-1' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`
        relative overflow-hidden
        bg-white
        border ${content.borderColor}
        rounded-2xl p-7 mb-6
        shadow-lg hover:shadow-xl
        transition-all duration-500 ease-out
        group
      `}>
        {/* Minimal animated elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <Sparkles className={`absolute top-5 right-6 w-4 h-4 ${content.sparkleColor} transition-all duration-1000 ${sparkleAnimation === 0 ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`} />
          <Sparkles className={`absolute bottom-6 left-8 w-3 h-3 ${content.sparkleColor} transition-all duration-1000 ${sparkleAnimation === 1 ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`} />
          <Sparkles className={`absolute top-1/2 right-1/4 w-3 h-3 ${content.sparkleColor} transition-all duration-1000 ${sparkleAnimation === 2 ? 'opacity-100 scale-100' : 'opacity-40 scale-90'}`} />
          
          {/* Subtle hover overlay */}
          <div className="absolute inset-0 bg-gray-50 opacity-0 group-hover:opacity-30 transition-opacity duration-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-start space-x-4">
              {/* Minimalist icon container */}
              <div className="relative">
                <div className={`
                  ${content.iconBg} ${content.iconColor} rounded-xl p-3
                  shadow-sm border border-gray-100
                  transform transition-all duration-400 ease-out
                  ${isHovered ? 'scale-105 shadow-md' : 'scale-100'}
                  relative overflow-hidden
                `}>
                  {content.icon}
                  
                  {/* Subtle secondary icon */}
                  <div className={`
                    absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-200
                    transform transition-all duration-400 ease-out
                    ${isHovered ? 'scale-110' : 'scale-100'}
                    ${content.accent}
                  `}>
                    {content.secondaryIcon}
                  </div>
                </div>
              </div>
              
              <div className="flex-1">
                {/* Clean typography */}
                <h3 className={`
                  font-semibold text-xl mb-1 leading-tight text-gray-900
                  transform transition-all duration-400 ease-out
                  ${isHovered ? 'text-gray-800' : ''}
                `}>
                  {content.title}
                </h3>
                
                <p className={`${content.accent} text-sm font-medium mb-3 opacity-80`}>
                  {content.subtitle}
                </p>
                
                <p className="text-gray-600 text-sm leading-relaxed mb-5">
                  {content.description}
                </p>
                
                {/* Clean metrics */}
                <div className="flex items-center space-x-3 mb-5">
                  <div className={`
                    px-3 py-1.5 rounded-lg text-xs font-semibold border
                    transform transition-all duration-300 ease-out hover:scale-105
                    ${portfolioRisk === 'HIGH' ? 'bg-red-50 text-red-700 border-red-200' : 
                      portfolioRisk === 'MEDIUM' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      'bg-emerald-50 text-emerald-700 border-emerald-200'}
                  `}>
                    Riesgo: {portfolioRisk}
                  </div>
                  <div className="bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 border border-gray-200">
                    Beta: {volatilityScore.toFixed(2)}
                  </div>
                </div>

                {/* Elegant action buttons */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleLearnMore}
                    className={`
                      ${content.buttonBg} text-white px-6 py-2.5 rounded-xl text-sm font-semibold
                      shadow-sm hover:shadow-md
                      transform hover:scale-105 active:scale-95
                      transition-all duration-300 ease-out
                      focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-50
                      relative overflow-hidden group
                    `}
                  >
                    <div className="relative flex items-center space-x-2">
                      <BookOpen className="w-4 h-4 transform group-hover:scale-110 transition-transform duration-300" />
                      <span>Comenzar Ahora</span>
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform duration-300" />
                    </div>
                  </button>
                  
                  <button
                    onClick={onDismiss}
                    className="
                      bg-gray-50 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium
                      border border-gray-200 hover:bg-gray-100
                      transform hover:scale-105
                      transition-all duration-300 ease-out
                      focus:outline-none focus:ring-2 focus:ring-gray-300
                    "
                  >
                    Más Tarde
                  </button>
                </div>
              </div>
            </div>
            
            {/* Minimalist close button */}
            <button
              onClick={onDismiss}
              className="
                text-gray-400 hover:text-gray-600 
                hover:scale-110
                transition-all duration-300 ease-out
                focus:outline-none p-1.5 rounded-lg
                hover:bg-gray-50
              "
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Refined progress indicator */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-gray-500 font-medium flex items-center space-x-1.5">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Progreso de Aprendizaje</span>
              </span>
              <span className={`${content.accent} font-semibold`}>
                ¿Listo para evolucionar?
              </span>
            </div>
            <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className={`
                h-full bg-gray-800 rounded-full
                transform transition-all duration-1200 ease-out
                ${isVisible ? 'w-3/4' : 'w-0'}
                relative
              `}>
                {/* Subtle progress shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 transform -skew-x-12 animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};