/**
 * LearningProgress Component
 * 
 * @description Clean Architecture Component for tracking educational progress
 * @responsibility Single: Display learning progress and educational insights
 * @principle Single Responsibility + Educational Domain Focus
 * 
 * @layer Presentation Layer (UI Component)
 * @pattern Observer Pattern for learning state tracking
 * 
 * @author Capital Craft Team
 * @created 2025-08-14
 */

import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Trophy, 
  Target, 
  TrendingUp,
  CheckCircle,
  Clock,
  Star,
  ChevronRight,
  Lightbulb,
  BarChart3
} from 'lucide-react';

/**
 * Learning Content Interface (from backend)
 * @principle Interface Segregation - Educational domain
 */
export interface LearningContent {
  id: string;
  title: string;
  trigger_type: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_read_time: number;
  tags: string[];
  learning_objectives: string[];
}

/**
 * Learning Progress Data Interface
 * @principle Data Transfer Object pattern
 */
export interface LearningProgressData {
  totalContent: number;
  completedContent: number;
  currentStreak: number;
  recommendedNext?: LearningContent;
  recentAchievements: string[];
  availableContent: LearningContent[];
}

/**
 * Learning Progress Props Interface
 * @principle Dependency Inversion - Component depends on abstraction
 */
export interface LearningProgressProps {
  progressData?: LearningProgressData;
  notifications?: Array<{
    type: string;
    title: string;
    trigger_type?: string;
  }>;
  loading?: boolean;
  onContentClick?: (content: LearningContent) => void;
  onViewAllContent?: () => void;
}

/**
 * Progress Ring Component
 * @responsibility Single: Display circular progress indicator
 */
interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  className?: string;
}

function ProgressRing({ 
  progress, 
  size = 60, 
  strokeWidth = 6,
  className = "" 
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(229 231 235)" // gray-200
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgb(99 102 241)" // indigo-500
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-900">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  );
}

/**
 * Achievement Badge Component
 * @responsibility Single: Display individual achievement
 */
interface AchievementProps {
  title: string;
  isNew?: boolean;
}

function Achievement({ title, isNew = false }: AchievementProps) {
  return (
    <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
      isNew ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'
    }`}>
      <Trophy className={`w-4 h-4 ${isNew ? 'text-yellow-600' : 'text-gray-500'}`} />
      <span className={isNew ? 'text-yellow-800 font-medium' : 'text-gray-700'}>
        {title}
      </span>
      {isNew && (
        <span className="bg-yellow-200 text-yellow-800 text-xs px-1.5 py-0.5 rounded-full font-medium">
          New!
        </span>
      )}
    </div>
  );
}

/**
 * Learning Progress Main Component
 * @description Displays educational progress and recommendations
 * @principle Single Responsibility: Only handles learning progress display
 */
export function LearningProgress({
  progressData,
  notifications = [],
  loading = false,
  onContentClick,
  onViewAllContent
}: LearningProgressProps) {

  // 📊 Business Logic: Calculate progress from available data
  const calculateProgress = () => {
    if (progressData) {
      return progressData;
    }

    // Fallback: Infer progress from notifications
    const educationalNotifications = notifications.filter(n => n.type === 'education');
    const uniqueTriggers = new Set(educationalNotifications.map(n => n.trigger_type).filter(Boolean));
    
    return {
      totalContent: 4, // Based on your learning content system
      completedContent: uniqueTriggers.size,
      currentStreak: uniqueTriggers.size > 0 ? 1 : 0,
      recentAchievements: uniqueTriggers.size > 0 ? ['First Educational Interaction'] : [],
      availableContent: []
    };
  };

  const progress = calculateProgress();
  const progressPercentage = progress.totalContent > 0 
    ? (progress.completedContent / progress.totalContent) * 100 
    : 0;

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <BookOpen className="w-5 h-5 text-indigo-600" />
          <h3 className="text-lg font-semibold text-gray-900">Learning Progress</h3>
        </div>
        {onViewAllContent && (
          <button
            onClick={onViewAllContent}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            View all
          </button>
        )}
      </div>

      {/* Progress Overview */}
      <div className="flex items-center space-x-6 mb-6">
        <ProgressRing progress={progressPercentage} />
        
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900 mb-1">
            {progress.completedContent} / {progress.totalContent}
          </div>
          <p className="text-sm text-gray-600 mb-2">
            Learning modules completed
          </p>
          
          {progress.currentStreak > 0 && (
            <div className="flex items-center space-x-1 text-sm text-orange-600">
              <Star className="w-4 h-4" />
              <span>{progress.currentStreak} day learning streak</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="text-center p-3 bg-indigo-50 rounded-lg">
          <div className="text-lg font-semibold text-indigo-600">
            {progress.totalContent - progress.completedContent}
          </div>
          <div className="text-sm text-indigo-700">Remaining</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-semibold text-green-600">
            {progress.recentAchievements.length}
          </div>
          <div className="text-sm text-green-700">Achievements</div>
        </div>
      </div>

      {/* Recent Achievements */}
      {progress.recentAchievements.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Trophy className="w-4 h-4 mr-2 text-yellow-600" />
            Recent Achievements
          </h4>
          <div className="space-y-2">
            {progress.recentAchievements.slice(0, 2).map((achievement, index) => (
              <Achievement 
                key={index} 
                title={achievement} 
                isNew={index === 0} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Content */}
      {progress.recommendedNext && (
        <div className="border-t border-gray-100 pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <Lightbulb className="w-4 h-4 mr-2 text-indigo-600" />
            Recommended Next
          </h4>
          <div 
            onClick={() => onContentClick?.(progress.recommendedNext!)}
            className="p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-indigo-900 text-sm">
                  {progress.recommendedNext.title}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <Clock className="w-3 h-3 text-indigo-600" />
                  <span className="text-xs text-indigo-700">
                    {progress.recommendedNext.estimated_read_time} min read
                  </span>
                  <span className="text-xs bg-indigo-200 text-indigo-800 px-2 py-0.5 rounded-full">
                    {progress.recommendedNext.difficulty_level}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-indigo-600" />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {progress.completedContent === 0 && progress.recentAchievements.length === 0 && (
        <div className="text-center py-6 border-t border-gray-100">
          <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="text-sm font-medium text-gray-900 mb-2">
            Start Your Learning Journey
          </h4>
          <p className="text-sm text-gray-500 mb-4">
            Complete educational content to track your progress here
          </p>
          {onViewAllContent && (
            <button
              onClick={onViewAllContent}
              className="text-sm bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Explore Content
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Component Export
 * @pattern Named Export for better tree-shaking
 */
export default LearningProgress;