# backend/app/use_cases/get_learning_content.py
from typing import Optional, List
from ..core.entities.learning_content import LearningContent
from ..infrastructure.content.content_repository import ContentRepositoryInterface


class GetLearningContent:
    """
    Use case: Get learning content based on triggers or filters
    Follows single responsibility principle - only handles content retrieval logic
    """
    
    def __init__(self, content_repository: ContentRepositoryInterface):
        """Dependency injection - repository abstraction"""
        self.content_repository = content_repository
    
    def execute(self, trigger: str) -> Optional[LearningContent]:
        """
        Get learning content for a specific trigger
        
        Args:
            trigger: Learning trigger type (volatility_basics, market_psychology, etc.)
            
        Returns:
            LearningContent entity or None if not found
        """
        try:
            content = self.content_repository.get_by_trigger(trigger)
            
            if content:
                # Business logic: Log content access (baby step)
                print(f"Content accessed: {content.title} (trigger: {trigger})")
                
            return content
            
        except Exception as e:
            print(f"Error retrieving content for trigger {trigger}: {e}")
            return None
    
    def execute_by_id(self, content_id: str) -> Optional[LearningContent]:
        """
        Get specific learning content by ID
        
        Args:
            content_id: Unique content identifier
            
        Returns:
            LearningContent entity or None if not found
        """
        try:
            return self.content_repository.get_by_id(content_id)
        except Exception as e:
            print(f"Error retrieving content {content_id}: {e}")
            return None
    
    def execute_list_all(self) -> List[LearningContent]:
        """
        Get all available learning content
        
        Returns:
            List of LearningContent entities
        """
        try:
            return self.content_repository.list_all()
        except Exception as e:
            print(f"Error listing all content: {e}")
            return []
    
    def execute_for_beginner(self) -> List[LearningContent]:
        """
        Business logic: Get beginner-friendly content
        
        Returns:
            List of beginner-level content
        """
        try:
            all_content = self.content_repository.list_all()
            return [
                content for content in all_content 
                if content.is_beginner_friendly
            ]
        except Exception as e:
            print(f"Error getting beginner content: {e}")
            return []
    
    def execute_quick_reads(self) -> List[LearningContent]:
        """
        Business logic: Get quick reading content (5 min or less)
        
        Returns:
            List of quick-read content
        """
        try:
            all_content = self.content_repository.list_all()
            return [
                content for content in all_content 
                if content.is_quick_read
            ]
        except Exception as e:
            print(f"Error getting quick reads: {e}")
            return []


class GetRecommendedContent:
    """
    Use case: Get personalized content recommendations
    Business logic for content recommendation
    """
    
    def __init__(self, content_repository: ContentRepositoryInterface):
        self.content_repository = content_repository
    
    def execute(self, user_level: str, available_time: int) -> List[LearningContent]:
        """
        Get recommended content based on user profile
        
        Args:
            user_level: User's experience level (beginner, intermediate, advanced)
            available_time: Available reading time in minutes
            
        Returns:
            List of recommended content
        """
        try:
            all_content = self.content_repository.list_all()
            
            # Filter by user level
            level_filtered = [
                content for content in all_content
                if content.difficulty_level == user_level
            ]
            
            # Filter by available time
            time_filtered = [
                content for content in level_filtered
                if content.estimated_read_time <= available_time
            ]
            
            # Sort by estimated read time (shortest first)
            return sorted(time_filtered, key=lambda x: x.estimated_read_time)
            
        except Exception as e:
            print(f"Error getting recommendations: {e}")
            return []
    
    def execute_next_steps(self, completed_content_id: str) -> List[LearningContent]:
        """
        Get suggested next content based on completed content
        
        Args:
            completed_content_id: ID of recently completed content
            
        Returns:
            List of suggested next content
        """
        try:
            completed_content = self.content_repository.get_by_id(completed_content_id)
            
            if not completed_content or not completed_content.next_suggested:
                return []
            
            # Get suggested content
            suggestions = []
            for suggested_id in completed_content.next_suggested:
                content = self.content_repository.get_by_id(suggested_id)
                if content:
                    suggestions.append(content)
            
            return suggestions
            
        except Exception as e:
            print(f"Error getting next steps for {completed_content_id}: {e}")
            return []


class ValidateContentPrerequisites:
    """
    Use case: Validate if user can access content based on prerequisites
    Business logic for learning path progression
    """
    
    def __init__(self, content_repository: ContentRepositoryInterface):
        self.content_repository = content_repository
    
    def execute(self, content_id: str, completed_content_ids: List[str]) -> bool:
        """
        Check if user meets prerequisites for content
        
        Args:
            content_id: Content user wants to access
            completed_content_ids: List of content user has completed
            
        Returns:
            True if prerequisites are met, False otherwise
        """
        try:
            content = self.content_repository.get_by_id(content_id)
            
            if not content:
                return False
            
            # No prerequisites = accessible
            if not content.prerequisites:
                return True
            
            # Check if all prerequisites are completed
            for prerequisite in content.prerequisites:
                if prerequisite not in completed_content_ids:
                    return False
            
            return True
            
        except Exception as e:
            print(f"Error validating prerequisites for {content_id}: {e}")
            return False