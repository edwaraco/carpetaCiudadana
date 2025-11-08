-- 🗄️ Database Initialization for Auth Service
-- Creates minimal auth schema and table for user authentication

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Users table for authentication (minimal auth data only)
CREATE TABLE IF NOT EXISTS auth.users (
    citizen_id VARCHAR(50) PRIMARY KEY,      -- User's citizen ID (primary identifier)
    password_hash VARCHAR(255) NOT NULL,     -- bcrypt hashed password
    email_verified BOOLEAN DEFAULT TRUE,     -- Set to true when user completes registration
    
    CONSTRAINT valid_citizen_id CHECK (LENGTH(citizen_id) >= 6)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON auth.users(email_verified);

-- Grant permissions to auth service user
GRANT USAGE ON SCHEMA auth TO auth_service_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO auth_service_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO auth_service_user;

-- Insert a test user for development (password: "testpassword123")
INSERT INTO auth.users (
    citizen_id, 
    password_hash,
    email_verified
) VALUES (
    '123456',
    '$2a$10$rKvKhzrPGm5QN8/V7QK.R.YtXyh0oO7HPVxK2SQGKdUvnCJxsH9Yi',  -- bcrypt hash of "testpassword123"
    true
) ON CONFLICT (citizen_id) DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Auth database schema initialized successfully';
    RAISE NOTICE 'Test user created: citizen_id=123456';
END
$$;