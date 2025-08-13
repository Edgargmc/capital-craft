-- Capital Craft Database Initialization
-- This script runs when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create initial database structure
-- Note: Alembic will manage the actual schema migrations
-- This file ensures extensions and basic setup are ready

-- Create a simple health check table
CREATE TABLE IF NOT EXISTS db_health (
    id SERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    message TEXT DEFAULT 'Database initialized successfully'
);

-- Insert health check record
INSERT INTO db_health (message) VALUES ('Capital Craft PostgreSQL ready for migrations');