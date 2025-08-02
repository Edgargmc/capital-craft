import os
import re
from typing import Dict, List, Optional
from datetime import datetime
from abc import ABC, abstractmethod
from ...core.entities.learning_content import LearningContent, ContentMetadata


class ContentRepositoryInterface(ABC):
    """
    Abstract repository following dependency inversion principle
    Allows for different content sources (files, database, CMS, etc.)
    """
    
    @abstractmethod
    def get_by_trigger(self, trigger: str) -> Optional[LearningContent]:
        """Get content that matches a learning trigger"""
        pass
    
    @abstractmethod
    def get_by_id(self, content_id: str) -> Optional[LearningContent]:
        """Get content by unique identifier"""
        pass
    
    @abstractmethod
    def list_all(self) -> List[LearningContent]:
        """List all available content"""
        pass


class MarkdownContentRepository(ContentRepositoryInterface):
    """
    Concrete repository: Read learning content from markdown files
    Baby step implementation - can be extended to database later
    """
    
    def __init__(self, content_directory: str = None):
        """Initialize with content directory path"""
        self.content_directory = content_directory or os.path.join(
            os.path.dirname(__file__), 
            "markdown_content"
        )
        self._content_cache: Dict[str, LearningContent] = {}
        self._load_content()
    
    def _load_content(self):
        """Load all markdown files into memory (baby step caching)"""
        if not os.path.exists(self.content_directory):
            os.makedirs(self.content_directory, exist_ok=True)
            return
        
        for filename in os.listdir(self.content_directory):
            if filename.endswith('.md'):
                content = self._parse_markdown_file(filename)
                if content:
                    self._content_cache[content.id] = content
    
    def _parse_markdown_file(self, filename: str) -> Optional[LearningContent]:
        """
        Parse markdown file with frontmatter
        Baby step: Simple regex parsing (can upgrade to proper parser later)
        """
        filepath = os.path.join(self.content_directory, filename)
        
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Extract frontmatter and content
            frontmatter, markdown_content = self._extract_frontmatter(content)
            
            if not frontmatter:
                return None
            
            # Calculate metadata
            word_count = len(markdown_content.split())
            estimated_read_time = max(1, round(word_count / 200))
            
            # Create LearningContent entity
            return LearningContent(
                id=frontmatter.get('id', filename.replace('.md', '')),
                title=frontmatter.get('title', 'Untitled'),
                content=markdown_content,
                trigger_type=frontmatter.get('trigger_type', 'general'),
                difficulty_level=frontmatter.get('difficulty_level', 'beginner'),
                estimated_read_time=estimated_read_time,
                tags=frontmatter.get('tags', []),
                learning_objectives=frontmatter.get('learning_objectives', []),
                prerequisites=frontmatter.get('prerequisites', []),
                next_suggested=frontmatter.get('next_suggested', []),
                created_at=datetime.now(),  # Baby step: use current time
                updated_at=datetime.now()
            )
            
        except Exception as e:
            print(f"Error parsing {filename}: {e}")
            return None
    
    def _extract_frontmatter(self, content: str) -> tuple[dict, str]:
        """
        Extract YAML frontmatter from markdown
        Baby step: Simple regex approach
        """
        # Pattern for frontmatter between --- delimiters
        pattern = r'^---\s*\n(.*?)\n---\s*\n(.*)$'
        match = re.match(pattern, content, re.DOTALL)
        
        if not match:
            return {}, content
        
        frontmatter_text, markdown_content = match.groups()
        
        # Baby step: Simple key-value parsing (upgrade to YAML later)
        frontmatter = {}
        for line in frontmatter_text.strip().split('\n'):
            if ':' in line:
                key, value = line.split(':', 1)
                key = key.strip()
                value = value.strip()
                
                # Handle lists (simple approach)
                if value.startswith('[') and value.endswith(']'):
                    # Parse simple list: [item1, item2, item3]
                    items = value[1:-1].split(',')
                    frontmatter[key] = [item.strip().strip('"\'') for item in items]
                else:
                    frontmatter[key] = value.strip('"\'')
        
        return frontmatter, markdown_content.strip()
    
    # Repository interface implementation
    def get_by_trigger(self, trigger: str) -> Optional[LearningContent]:
        """Get first content matching trigger type"""
        for content in self._content_cache.values():
            if content.matches_trigger(trigger):
                return content
        return None
    
    def get_by_id(self, content_id: str) -> Optional[LearningContent]:
        """Get content by ID"""
        return self._content_cache.get(content_id)
    
    def list_all(self) -> List[LearningContent]:
        """Get all content"""
        return list(self._content_cache.values())
    
    def list_by_difficulty(self, difficulty: str) -> List[LearningContent]:
        """Helper: Get content by difficulty level"""
        return [
            content for content in self._content_cache.values()
            if content.difficulty_level == difficulty
        ]
    
    def list_by_tag(self, tag: str) -> List[LearningContent]:
        """Helper: Get content by tag"""
        return [
            content for content in self._content_cache.values()
            if content.has_tag(tag)
        ]
    
    def refresh_content(self):
        """Reload content from filesystem"""
        self._content_cache.clear()
        self._load_content()


class ContentRepositoryFactory:
    """
    Factory for creating content repositories
    Follows dependency injection and factory patterns
    """
    
    @staticmethod
    def create_repository(repo_type: str = "markdown") -> ContentRepositoryInterface:
        """Create repository based on configuration"""
        if repo_type == "markdown":
            return MarkdownContentRepository()
        # Future: database, CMS, etc.
        # elif repo_type == "database":
        #     return DatabaseContentRepository()
        else:
            raise ValueError(f"Unknown repository type: {repo_type}")