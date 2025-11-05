-- 🗄️ Database Initialization for Microservices
-- Creates auth schema and tables for user authentication

-- Create auth schema
CREATE SCHEMA IF NOT EXISTS auth;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table for authentication (minimal auth data only)
CREATE TABLE IF NOT EXISTS auth.users (
    document_id VARCHAR(50) PRIMARY KEY,      -- User's document ID (primary identifier)
    password_hash VARCHAR(255) NOT NULL,     -- bcrypt hashed password
    
    -- Auth-related metadata only
    email_verified BOOLEAN DEFAULT TRUE,     -- Set to true when user completes registration
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Constraints
    CONSTRAINT valid_document_id CHECK (LENGTH(document_id) >= 3)
);

-- Verification tokens table (for email validation)
CREATE TABLE IF NOT EXISTS auth.verification_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_document_id VARCHAR(50) REFERENCES auth.users(document_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,         -- bcrypt hashed token
    token_type VARCHAR(20) NOT NULL,          -- 'email_verification', 'password_reset'
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_token_type CHECK (token_type IN ('email_verification', 'password_reset')),
    CONSTRAINT future_expiry CHECK (expires_at > created_at)
);

-- Sessions table (for JWT token management)
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_document_id VARCHAR(50) REFERENCES auth.users(document_id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,         -- JWT token hash for revocation
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Session metadata
    user_agent TEXT,
    ip_address INET,
    
    -- Constraints
    CONSTRAINT future_session_expiry CHECK (expires_at > created_at)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON auth.users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_active ON auth.users(is_active);

CREATE INDEX IF NOT EXISTS idx_verification_tokens_user_document_id ON auth.verification_tokens(user_document_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_expires ON auth.verification_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_type ON auth.verification_tokens(token_type);

CREATE INDEX IF NOT EXISTS idx_sessions_user_document_id ON auth.sessions(user_document_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON auth.sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_revoked ON auth.sessions(is_revoked);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION auth.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION auth.update_updated_at();

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION auth.cleanup_expired_tokens()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM auth.verification_tokens 
    WHERE expires_at < NOW() AND used_at IS NULL;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM auth.sessions 
    WHERE expires_at < NOW() OR is_revoked = TRUE;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Sample cleanup job (run periodically via cron or scheduled task)
-- SELECT auth.cleanup_expired_tokens();

-- Grant permissions to auth service user
GRANT USAGE ON SCHEMA auth TO auth_service_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA auth TO auth_service_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA auth TO auth_service_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA auth TO auth_service_user;

-- Insert a test user for development (password: "testpassword123")
INSERT INTO auth.users (
    document_id, 
    email, 
    password_hash, 
    full_name, 
    phone, 
    address,
    email_verified,
    is_active
) VALUES (
    'TEST123456',
    'test@eafit.edu.co',
    '$2a$10$rKvKhzrPGm5QN8/V7QK.R.YtXyh0oO7HPVxK2SQGKdUvnCJxsH9Yi',  -- bcrypt hash of "testpassword123"
    'Test User',
    '+57 300 123 4567',
    'Carrera 49 # 7 Sur - 50, Medellín',
    true,
    true
) ON CONFLICT (document_id) DO NOTHING;

-- Log successful initialization
DO $$
BEGIN
    RAISE NOTICE 'Auth database schema initialized successfully';
    RAISE NOTICE 'Test user created: document_id=TEST123456, email=test@eafit.edu.co';
END
$$;