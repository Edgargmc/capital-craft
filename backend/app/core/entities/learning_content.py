from dataclasses import dataclass
from typing import List, Optional
from datetime import datetime


@dataclass
class LearningContent:
    """
    Entity: Learning content for contextual education
    Follows domain-driven design principles
    """
    id: str
    title: str
    content: str  # Markdown content
    trigger_type: str  # volatility_basics, market_psychology, etc.
    difficulty_level: str  # beginner, intermediate, advanced
    estimated_read_time: int  # minutes
    tags: List[str]
    created_at: datetime
    updated_at: datetime
    
    # Educational metadata
    learning_objectives: List[str]
    prerequisites: List[str] = None
    next_suggested: List[str] = None
    
    def __post_init__(self):
        """Validation and defaults"""
        if self.prerequisites is None:
            self.prerequisites = []
        if self.next_suggested is None:
            self.next_suggested = []
    
    @property
    def is_beginner_friendly(self) -> bool:
        """Helper method for content filtering"""
        return self.difficulty_level == "beginner"
    
    @property
    def is_quick_read(self) -> bool:
        """Helper method for time-based recommendations"""
        return self.estimated_read_time <= 5
    
    def matches_trigger(self, trigger: str) -> bool:
        """Check if content matches learning trigger"""
        return self.trigger_type == trigger
    
    def has_tag(self, tag: str) -> bool:
        """Check if content has specific tag"""
        return tag.lower() in [t.lower() for t in self.tags]


@dataclass
class ContentMetadata:
    """
    Value object: Metadata extracted from markdown files
    Used for content discovery and organization
    """
    filename: str
    frontmatter: dict
    word_count: int
    
    @property
    def estimated_read_time(self) -> int:
        """Calculate reading time based on word count (200 words/min average)"""
        return max(1, round(self.word_count / 200))


# Example content structure for reference
EXAMPLE_CONTENT = {
    "id": "volatility_basics_001",
    "title": "Understanding Market Volatility",
    "trigger_type": "volatility_basics",
    "difficulty_level": "beginner",
    "tags": ["volatility", "risk", "fundamentals"],
    "learning_objectives": [
        "Understand what market volatility means",
        "Learn how Beta measures stock volatility",
        "Discover strategies to manage volatile investments"
    ],
    "prerequisites": [],
    "next_suggested": ["diversification_basics", "risk_management"]
}