# Database Migration Roadmap: PostgreSQL + User Management

**Date:** 2025-08-12  
**Objective:** Migrate from JSON to PostgreSQL with user authentication system  
**Approach:** Clean Architecture + SOLID + Baby Steps  

## 🏗️ Architecture Analysis

### ✅ Current Strengths
- **Repository Pattern** already implemented (`PortfolioRepository` interface)
- **Dependency Injection** mature with feature flags 
- **Clean Architecture** established (Domain → Application → Infrastructure)
- **Testing** with mocks already working
- **Gradual migration** proven (Memory → JSON successfully)

## 🗄️ PostgreSQL Schema Design

### Core Tables
```sql
-- Users (new primary entity)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL for OAuth users
    username VARCHAR(100) UNIQUE NOT NULL,
    provider VARCHAR(50) DEFAULT 'local', -- 'local', 'google', 'github'
    provider_id VARCHAR(255), -- OAuth provider user ID
    avatar_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(provider, provider_id)
);

-- Portfolios (migrate existing structure)
CREATE TABLE portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    cash_balance DECIMAL(15,2) NOT NULL DEFAULT 10000.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Holdings (separate from embedded JSON)
CREATE TABLE holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(10) NOT NULL,
    shares INTEGER NOT NULL CHECK (shares > 0),
    average_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(portfolio_id, symbol)
);

-- Notifications (migrate existing system)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    trigger_type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    is_dismissed BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    dismissed_at TIMESTAMP WITH TIME ZONE
);

-- OAuth Sessions (for Google/GitHub login)
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    access_token VARCHAR(500),
    refresh_token VARCHAR(500),
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 Implementation Roadmap (Fresh Start - No Migration)

### **Phase 1: Foundation Setup (1-2 days)**
**🎯 Goal:** Database infrastructure ready

**Tasks:**
1. **PostgreSQL Setup:**
   - Docker Compose with PostgreSQL
   - Database initialization scripts
   - Connection pool setup (SQLAlchemy + asyncpg)
   - Alembic for migrations

2. **New Domain Entities:**
   - `User` entity (with OAuth support)
   - Enhanced `Portfolio` with `user_id`
   - `Holding` entity (extracted from Portfolio)

3. **Database Recreation System:**
   - `reset_database.py` script
   - `seed_database.py` with sample data
   - `docker-compose.yml` with database reset command

**Testing:** Unit tests for new entities

---

### **Phase 2: Authentication System (2-3 days)**
**🎯 Goal:** Complete user management with OAuth

**Authentication Options:**
1. **Google OAuth 2.0** (Recommended)
   - Fast implementation
   - No password management
   - Better UX
2. **Traditional email/password** (Backup)
3. **Hybrid approach** (both options)

**Tasks:**
1. **OAuth Integration:**
   - Google OAuth setup
   - JWT token management
   - Session handling

2. **Repository Implementation:**
   - `PostgresUserRepository`
   - `PostgresSessionRepository`

3. **Use Cases:**
   - `AuthenticateWithGoogle`
   - `CreateUserFromOAuth`
   - `RefreshToken`
   - `LogoutUser`

4. **API Endpoints:**
   - `GET /auth/google` - initiate OAuth
   - `GET /auth/google/callback` - handle callback
   - `POST /auth/refresh` - refresh token
   - `POST /auth/logout` - logout

**Testing:** Integration tests for auth flows

---

### **Phase 3: Portfolio System (2-3 days)**
**🎯 Goal:** Full portfolio management with real users

**Tasks:**
1. **Repository Implementation:**
   - `PostgresPortfolioRepository`
   - `PostgresHoldingRepository`

2. **Enhanced Use Cases:**
   - `CreatePortfolioForUser`
   - `BuyStockWithAuth` 
   - `SellStockWithAuth`
   - `GetUserPortfolio`

3. **API Updates:**
   - Add JWT middleware
   - Update all portfolio endpoints
   - User-specific data isolation

**Testing:** Integration tests with real database

---

### **Phase 4: Notifications Migration (1-2 days)**
**🎯 Goal:** User-specific notifications

**Tasks:**
1. **PostgresNotificationRepository**
2. **Enhanced notification system** with user context
3. **Real-time updates** per authenticated user

---

### **Phase 5: Production Ready (1-2 days)**
**🎯 Goal:** Deploy-ready system

**Tasks:**
1. **Performance optimization:** indexes, query optimization
2. **Security hardening:** rate limiting, input validation
3. **Monitoring:** health checks, metrics
4. **Database management:** backup, restore procedures

## 🔄 Database Recreation System

### **Reset Database Script (`scripts/reset_db.py`):**
```python
# Complete database reset with fresh schema
# Drop all tables → Create schema → Run migrations → Seed data
```

### **Docker Compose Enhancement:**
```yaml
services:
  postgres:
    # Volume management for easy reset
  backend:
    # Database reset command
```

### **Seed Data (`scripts/seed_db.py`):**
- Sample users (Google OAuth + local)
- Demo portfolios with holdings
- Educational notifications
- Test scenarios

## 🔐 Authentication Strategy Recommendation

### **Google OAuth First Approach:**

**Pros:**
- ✅ No password management complexity
- ✅ Faster user onboarding
- ✅ Better security (Google handles auth)
- ✅ Users already have Google accounts
- ✅ Mobile-friendly

**Implementation:**
- Google OAuth 2.0 with PKCE
- JWT tokens for API access
- Refresh token rotation
- Secure session management

**Fallback:**
- Guest mode for demo purposes
- Optional email/password later

## 🧪 Testing Strategy

### **Database Testing:**
- **Test Containers:** PostgreSQL in Docker for tests
- **Fixtures:** Reusable test data setup
- **Transaction Isolation:** Rollback between tests
- **Performance Tests:** Query optimization validation

### **Authentication Testing:**
- **OAuth Mock:** Google OAuth simulation
- **JWT Validation:** Token lifecycle tests
- **Security Tests:** Authorization boundary tests

## 💻 Tech Stack

- **Database:** PostgreSQL 15+ with UUID support
- **ORM:** SQLAlchemy 2.0 (async)
- **Driver:** asyncpg (fastest Python PostgreSQL driver)
- **Migrations:** Alembic
- **Authentication:** Google OAuth 2.0 + JWT
- **Container:** Docker + Docker Compose
- **Testing:** pytest-asyncio + testcontainers

## 🎯 Success Metrics

1. **Zero Breaking Changes** for existing Clean Architecture
2. **Sub-200ms** API response times
3. **100% Test Coverage** for new authentication layer
4. **One-command** database reset/setup
5. **OAuth Login** working end-to-end

## 📋 Next Steps Decision Points

1. **Authentication Priority:** Google OAuth first vs hybrid?
2. **Database Reset Frequency:** Development vs production considerations
3. **Frontend Changes:** Login UI, state management updates
4. **Deployment Strategy:** Local development → staging → production

---

**🎯 This roadmap ensures a clean, scalable, production-ready system while maintaining all Clean Architecture and SOLID principles established in the current codebase.**