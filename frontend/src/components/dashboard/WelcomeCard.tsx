/**
 * WelcomeCard Component
 * 
 * @description Clean Architecture Component following SOLID principles
 * @responsibility Single: Display personalized welcome message
 * @principle Single Responsibility + Dependency Inversion
 * 
 * @layer Presentation Layer (UI Component)
 * @pattern Component Pattern with Props Interface
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 */

import React from 'react';
import { User, Calendar, TrendingUp } from 'lucide-react';

/**
 * WelcomeCard Props Interface
 * @principle Interface Segregation - Only props this component needs
 */
export interface WelcomeCardProps {
  userName?: string;
  isAuthenticated: boolean;
  loading?: boolean;
  // Optional: could add lastLoginDate, streak, etc.
}

/**
 * WelcomeCard Component
 * 
 * @description Displays personalized welcome message following Clean Architecture
 * @principle Single Responsibility: Only handles welcome display logic
 * @principle Open/Closed: Easy to extend with more welcome features
 */
export function WelcomeCard({ 
  userName, 
  isAuthenticated, 
  loading = false 
}: WelcomeCardProps) {
  
  // 🔒 Business Logic: Determine welcome message based on auth state
  const getWelcomeMessage = () => {
    if (!isAuthenticated) {
      return {
        title: "Welcome to Capital Craft",
        subtitle: "Start your educational investment journey today"
      };
    }
    
    if (userName) {
      return {
        title: `Welcome back, ${userName}!`,
        subtitle: "Ready to continue growing your portfolio?"
      };
    }
    
    return {
      title: "Welcome to your Dashboard",
      subtitle: "Track your progress and learn as you invest"
    };
  };

  // 🎨 UI Logic: Get current time-based greeting
  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon"; 
    return "Good evening";
  };

  const { title, subtitle } = getWelcomeMessage();
  const timeGreeting = getTimeGreeting();

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-6 bg-white/20 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-white/20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Time-based greeting */}
          <div className="flex items-center mb-2">
            <Calendar className="w-4 h-4 mr-2 opacity-80" />
            <span className="text-sm opacity-90">{timeGreeting}</span>
          </div>
          
          {/* Main welcome message */}
          <h2 className="text-2xl font-bold mb-1">
            {title}
          </h2>
          
          <p className="text-indigo-100 text-sm mb-4">
            {subtitle}
          </p>
          
          {/* Quick action hint */}
          <div className="flex items-center text-sm opacity-90">
            <TrendingUp className="w-4 h-4 mr-2" />
            <span>Your learning journey continues</span>
          </div>
        </div>
        
        {/* User avatar placeholder */}
        <div className="ml-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <User className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Component Export
 * @pattern Named Export for better tree-shaking
 */
export default WelcomeCard;