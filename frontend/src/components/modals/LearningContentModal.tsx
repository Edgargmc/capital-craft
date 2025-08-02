
import React, { useState, useEffect } from 'react';
import { X, Clock, Target, ArrowRight, BookOpen, CheckCircle } from 'lucide-react';
import { CapitalCraftAPI } from '@/lib/api';

interface LearningContent {
  id: string;
  title: string;
  content: string;
  trigger_type: string;
  difficulty_level: string;
  estimated_read_time: number;
  tags: string[];
  learning_objectives: string[];
  prerequisites: string[];
  next_suggested: string[];
}

interface LearningContentModalProps {
  isOpen: boolean;
  onClose: () => void;
  trigger: string;
  userId: string;
}

export const LearningContentModal: React.FC<LearningContentModalProps> = ({
  isOpen,
  onClose,
  trigger,
  userId
}) => {
  const [content, setContent] = useState<LearningContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (isOpen && trigger) {
      fetchContent();
    }
  }, [isOpen, trigger]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);
      
        const content = await CapitalCraftAPI.getLearningContent(trigger);
        if (!content) {
            throw new Error('Failed to fetch learning content');
        }
      
        setContent(content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    // TODO: Track completion in backend
    console.log(`Content completed: ${content?.id} by user: ${userId}`);
  };

  const renderMarkdown = (markdown: string) => {
    // Baby step: Simple markdown rendering
    // TODO: Use proper markdown parser like react-markdown
    return markdown
      .split('\n')
      .map((line, index) => {
        // Headers
        if (line.startsWith('# ')) {
          return (
            <h1 key={index} className="text-2xl font-bold text-gray-900 mb-4 mt-6">
              {line.substring(2)}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={index} className="text-xl font-semibold text-gray-800 mb-3 mt-5">
              {line.substring(3)}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={index} className="text-lg font-medium text-gray-700 mb-2 mt-4">
              {line.substring(4)}
            </h3>
          );
        }
        
        // Bold text (simple **text** pattern)
        if (line.includes('**')) {
          const parts = line.split('**');
          return (
            <p key={index} className="text-gray-600 mb-3 leading-relaxed">
              {parts.map((part, i) => 
                i % 2 === 1 ? <strong key={i} className="font-semibold text-gray-800">{part}</strong> : part
              )}
            </p>
          );
        }
        
        // Lists (simple - pattern)
        if (line.startsWith('- ')) {
          return (
            <li key={index} className="text-gray-600 mb-1 ml-4">
              {line.substring(2)}
            </li>
          );
        }
        
        // Regular paragraphs
        if (line.trim() && !line.startsWith('#')) {
          return (
            <p key={index} className="text-gray-600 mb-3 leading-relaxed">
              {line}
            </p>
          );
        }
        
        // Empty lines
        return <div key={index} className="mb-2"></div>;
      });
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {loading ? 'Loading...' : content?.title || 'Learning Content'}
              </h2>
              {content && (
                <div className="flex items-center space-x-4 mt-1">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(content.difficulty_level)}`}>
                    {content.difficulty_level}
                  </span>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {content.estimated_read_time} min read
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:scale-110 transition-all duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(85vh - 180px)' }}>

          {loading && (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading content...</span>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">Error: {error}</div>
              <button
                onClick={fetchContent}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          )}

          {content && !loading && (
            <div className="p-6">
              {/* Learning Objectives */}
              {content.learning_objectives.length > 0 && (
                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <Target className="w-5 h-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-900">What you&apos;ll learn:</h3>
                  </div>
                  <ul className="space-y-1">
                    {content.learning_objectives.map((objective, index) => (
                      <li key={index} className="text-blue-800 text-sm flex items-start">
                        <ArrowRight className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        {objective}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {content.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {content.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Main Content */}
              <div className="prose prose-gray max-w-none">
                {renderMarkdown(content.content)}
              </div>

              {/* Next Steps */}
              {content.next_suggested.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-8">
                  <h3 className="font-semibold text-green-900 mb-2">Next recommended topics:</h3>
                  <div className="flex flex-wrap gap-2">
                    {content.next_suggested.map((next, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-green-100 text-green-800 rounded-md text-sm font-medium cursor-pointer hover:bg-green-200 transition-colors"
                      >
                        {next.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
       {content && !loading && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 flex-shrink-0">
            <div className="flex justify-between items-center flex-wrap gap-3">
            <div className="text-sm text-gray-500">
                Continue learning to improve your investment skills
            </div>
            
            <div className="flex space-x-3 flex-shrink-0">
                {!isCompleted ? (
                <button
                    onClick={handleComplete}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center text-sm"
                >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                </button>
                ) : (
                <span className="bg-green-100 text-green-800 px-3 py-2 rounded-lg flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Completed!
                </span>
                )}
                
                <button
                onClick={onClose}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                Close
                </button>
            </div>
            </div>
        </div>
        )}
      </div>
    </div>
  );
};
