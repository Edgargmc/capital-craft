"""
SQLAlchemy Models - Infrastructure Layer
These models map domain entities to database tables
"""
import uuid
import os
from datetime import datetime
from decimal import Decimal
from typing import List

from sqlalchemy import Column, String, DECIMAL, DateTime, Boolean, Integer, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from sqlalchemy import TypeDecorator

from .config import Base


# UUID type that works with both PostgreSQL and SQLite
class UniversalUUID(TypeDecorator):
    """UUID type that adapts to the database backend"""
    impl = String
    cache_ok = True
    
    def load_dialect_impl(self, dialect):
        if dialect.name == 'postgresql':
            return dialect.type_descriptor(UUID(as_uuid=True))
        else:
            # SQLite and other databases use String
            return dialect.type_descriptor(String(36))


class UserModel(Base):
    """SQLAlchemy model for User entity"""
    __tablename__ = "users"
    
    # Primary key
    id = Column(UniversalUUID(), primary_key=True, default=uuid.uuid4)
    
    # User data
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    
    # Authentication
    provider = Column(String(50), nullable=False, default="local")  # local, google, github
    provider_id = Column(String(255), nullable=True)  # OAuth provider user ID
    password_hash = Column(String(255), nullable=True)  # Only for local auth
    
    # Profile
    avatar_url = Column(String(500), nullable=True)
    
    # Status
    is_active = Column(Boolean, nullable=False, default=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    portfolios = relationship("PortfolioModel", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("NotificationModel", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email={self.email}, provider={self.provider})>"


class PortfolioModel(Base):
    """SQLAlchemy model for Portfolio entity"""
    __tablename__ = "portfolios"
    
    # Primary key
    id = Column(UniversalUUID(), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to user
    user_id = Column(UniversalUUID(), ForeignKey("users.id"), nullable=False, index=True)
    
    # Financial data
    cash_balance = Column(DECIMAL(15, 2), nullable=False, default=Decimal('10000.00'))
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user = relationship("UserModel", back_populates="portfolios")
    holdings = relationship("HoldingModel", back_populates="portfolio", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Portfolio(id={self.id}, user_id={self.user_id}, cash_balance={self.cash_balance})>"


class HoldingModel(Base):
    """SQLAlchemy model for Holding entity"""
    __tablename__ = "holdings"
    
    # Primary key
    id = Column(UniversalUUID(), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to portfolio
    portfolio_id = Column(UniversalUUID(), ForeignKey("portfolios.id"), nullable=False, index=True)
    
    # Stock data
    symbol = Column(String(10), nullable=False, index=True)
    shares = Column(Integer, nullable=False)
    average_price = Column(DECIMAL(10, 2), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    portfolio = relationship("PortfolioModel", back_populates="holdings")
    
    # Constraints
    __table_args__ = (
        # Unique constraint: one holding per symbol per portfolio
        {'schema': None}  # Placeholder for unique constraint
    )
    
    def __repr__(self):
        return f"<Holding(id={self.id}, symbol={self.symbol}, shares={self.shares}, avg_price={self.average_price})>"


class NotificationModel(Base):
    """SQLAlchemy model for Notification entity"""
    __tablename__ = "notifications"
    
    # Primary key
    id = Column(UniversalUUID(), primary_key=True, default=uuid.uuid4)
    
    # Foreign key to user
    user_id = Column(UniversalUUID(), ForeignKey("users.id"), nullable=False, index=True)
    
    # Notification data
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    trigger_type = Column(String(50), nullable=False, index=True)
    
    # Status
    is_read = Column(Boolean, nullable=False, default=False, index=True)
    is_dismissed = Column(Boolean, nullable=False, default=False, index=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    read_at = Column(DateTime(timezone=True), nullable=True)
    dismissed_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    user = relationship("UserModel", back_populates="notifications")
    
    def __repr__(self):
        return f"<Notification(id={self.id}, title={self.title}, is_read={self.is_read})>"


# Add unique constraint for holdings after table definition
from sqlalchemy import UniqueConstraint
HoldingModel.__table_args__ = (
    UniqueConstraint('portfolio_id', 'symbol', name='uq_portfolio_symbol'),
)