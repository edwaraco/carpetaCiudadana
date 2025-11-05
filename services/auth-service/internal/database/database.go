package database

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"time"

	"auth-service/internal/models"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// Database represents the database connection and operations
type Database struct {
	pool *pgxpool.Pool
}

// NewDatabase creates a new database instance
func NewDatabase(databaseURL string) (*Database, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("failed to create database pool: %w", err)
	}

	// Test connection
	if err := pool.Ping(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("INFO: Database connection established successfully")

	return &Database{pool: pool}, nil
}

// Close closes the database connection
func (d *Database) Close() {
	d.pool.Close()
	log.Println("INFO: Database connection closed")
}

// Health checks database health
func (d *Database) Health(ctx context.Context) error {
	return d.pool.Ping(ctx)
}

// CreateUser creates a new user in the database with only auth data
func (d *Database) CreateUser(ctx context.Context, documentID, passwordHash string) (*models.User, error) {
	user := &models.User{
		DocumentID:    documentID,
		PasswordHash:  passwordHash,
		EmailVerified: true, // Set to true since user completed email verification
		IsActive:      true,
		CreatedAt:     time.Now(),
		UpdatedAt:     time.Now(),
	}

	query := `
		INSERT INTO auth.users (
			document_id, password_hash, email_verified, is_active, created_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING created_at, updated_at
	`

	err := d.pool.QueryRow(ctx, query,
		user.DocumentID, user.PasswordHash, user.EmailVerified, user.IsActive,
		user.CreatedAt, user.UpdatedAt,
	).Scan(&user.CreatedAt, &user.UpdatedAt)

	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("INFO: Auth user created successfully: %s", user.DocumentID)
	return user, nil
}

// GetUserByDocumentID retrieves a user by document ID (auth data only)
func (d *Database) GetUserByDocumentID(ctx context.Context, documentID string) (*models.User, error) {
	user := &models.User{}

	query := `
		SELECT document_id, password_hash, email_verified, is_active, 
			   created_at, updated_at, last_login
		FROM auth.users 
		WHERE document_id = $1 AND is_active = true
	`

	err := d.pool.QueryRow(ctx, query, documentID).Scan(
		&user.DocumentID, &user.PasswordHash, &user.EmailVerified, &user.IsActive,
		&user.CreatedAt, &user.UpdatedAt, &user.LastLogin,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	return user, nil
}

// GetUserByEmail is no longer needed - auth service doesn't store email
// Email lookups should be handled by Identity Service

// SetUserPassword is no longer needed - password is set during user creation

// ValidatePassword validates a user's password
func (d *Database) ValidatePassword(ctx context.Context, user *models.User, password string) error {
	if user.PasswordHash == "" {
		return fmt.Errorf("user password not set")
	}

	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password")
	}

	// Update last login
	query := `UPDATE auth.users SET last_login = NOW() WHERE document_id = $1`
	_, err = d.pool.Exec(ctx, query, user.DocumentID)
	if err != nil {
		log.Printf("WARN: Failed to update last login for user %s: %v", user.DocumentID, err)
	}

	return nil
}

// CreateVerificationToken creates a new verification token
func (d *Database) CreateVerificationToken(ctx context.Context, documentID string, tokenType string) (*models.VerificationToken, string, error) {
	// Generate random token
	tokenBytes := make([]byte, 32)
	if _, err := rand.Read(tokenBytes); err != nil {
		return nil, "", fmt.Errorf("failed to generate token: %w", err)
	}
	token := hex.EncodeToString(tokenBytes)

	// Hash the token for storage
	hashedToken, err := bcrypt.GenerateFromPassword([]byte(token), bcrypt.DefaultCost)
	if err != nil {
		return nil, "", fmt.Errorf("failed to hash token: %w", err)
	}

	// Create verification token record
	verificationToken := &models.VerificationToken{
		ID:             uuid.New(),
		UserDocumentID: documentID,
		TokenHash:      string(hashedToken),
		TokenType:      tokenType,
		ExpiresAt:      time.Now().Add(24 * time.Hour), // 24 hours expiration
		CreatedAt:      time.Now(),
	}

	query := `
		INSERT INTO auth.verification_tokens (
			id, user_document_id, token_hash, token_type, expires_at, created_at
		) VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id, created_at
	`

	err = d.pool.QueryRow(ctx, query,
		verificationToken.ID, verificationToken.UserDocumentID, verificationToken.TokenHash,
		verificationToken.TokenType, verificationToken.ExpiresAt, verificationToken.CreatedAt,
	).Scan(&verificationToken.ID, &verificationToken.CreatedAt)

	if err != nil {
		return nil, "", fmt.Errorf("failed to create verification token: %w", err)
	}

	log.Printf("INFO: Verification token created for user: %s", documentID)
	return verificationToken, token, nil
}

// ValidateVerificationToken validates and uses a verification token
func (d *Database) ValidateVerificationToken(ctx context.Context, token string, tokenType string) (*models.VerificationToken, error) {
	// First get all unexpired tokens of the specified type
	query := `
		SELECT id, user_document_id, token_hash, token_type, expires_at, used_at, created_at
		FROM auth.verification_tokens
		WHERE token_type = $1 AND expires_at > NOW() AND used_at IS NULL
	`

	rows, err := d.pool.Query(ctx, query, tokenType)
	if err != nil {
		return nil, fmt.Errorf("failed to query verification tokens: %w", err)
	}
	defer rows.Close()

	// Check each token hash
	for rows.Next() {
		var verificationToken models.VerificationToken
		err := rows.Scan(
			&verificationToken.ID, &verificationToken.UserDocumentID, &verificationToken.TokenHash,
			&verificationToken.TokenType, &verificationToken.ExpiresAt, &verificationToken.UsedAt,
			&verificationToken.CreatedAt,
		)
		if err != nil {
			continue
		}

		// Check if this token matches
		err = bcrypt.CompareHashAndPassword([]byte(verificationToken.TokenHash), []byte(token))
		if err == nil {
			// Token matches, mark as used
			updateQuery := `UPDATE auth.verification_tokens SET used_at = NOW() WHERE id = $1`
			_, err = d.pool.Exec(ctx, updateQuery, verificationToken.ID)
			if err != nil {
				log.Printf("WARN: Failed to mark token as used: %v", err)
			}

			log.Printf("INFO: Verification token validated for user: %s", verificationToken.UserDocumentID)
			return &verificationToken, nil
		}
	}

	return nil, fmt.Errorf("invalid or expired token")
}

// CreateSession creates a new user session
func (d *Database) CreateSession(ctx context.Context, documentID string, tokenHash, userAgent, ipAddress string, expiresAt time.Time) (*models.Session, error) {
	session := &models.Session{
		ID:             uuid.New(),
		UserDocumentID: documentID,
		TokenHash:      tokenHash,
		ExpiresAt:      expiresAt,
		CreatedAt:      time.Now(),
		LastUsed:       time.Now(),
		IsRevoked:      false,
		UserAgent:      userAgent,
		IPAddress:      ipAddress,
	}

	query := `
		INSERT INTO auth.sessions (
			id, user_document_id, token_hash, expires_at, created_at, last_used, 
			is_revoked, user_agent, ip_address
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id, created_at, last_used
	`

	err := d.pool.QueryRow(ctx, query,
		session.ID, session.UserDocumentID, session.TokenHash, session.ExpiresAt,
		session.CreatedAt, session.LastUsed, session.IsRevoked,
		session.UserAgent, session.IPAddress,
	).Scan(&session.ID, &session.CreatedAt, &session.LastUsed)

	if err != nil {
		return nil, fmt.Errorf("failed to create session: %w", err)
	}

	log.Printf("INFO: Session created for user: %s", documentID)
	return session, nil
}

// ValidateSession validates if a session is still valid
func (d *Database) ValidateSession(ctx context.Context, sessionID uuid.UUID) (*models.Session, error) {
	session := &models.Session{}

	query := `
		SELECT id, user_document_id, token_hash, expires_at, created_at, last_used,
			   is_revoked, user_agent, ip_address
		FROM auth.sessions
		WHERE id = $1 AND expires_at > NOW() AND is_revoked = false
	`

	err := d.pool.QueryRow(ctx, query, sessionID).Scan(
		&session.ID, &session.UserDocumentID, &session.TokenHash, &session.ExpiresAt,
		&session.CreatedAt, &session.LastUsed, &session.IsRevoked,
		&session.UserAgent, &session.IPAddress,
	)

	if err != nil {
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("session not found or expired")
		}
		return nil, fmt.Errorf("failed to validate session: %w", err)
	}

	// Update last used timestamp
	updateQuery := `UPDATE auth.sessions SET last_used = NOW() WHERE id = $1`
	_, err = d.pool.Exec(ctx, updateQuery, sessionID)
	if err != nil {
		log.Printf("WARN: Failed to update session last_used: %v", err)
	}

	return session, nil
}

// CleanupExpiredTokens removes expired tokens and sessions
func (d *Database) CleanupExpiredTokens(ctx context.Context) error {
	queries := []string{
		`DELETE FROM auth.verification_tokens WHERE expires_at < NOW() AND used_at IS NULL`,
		`DELETE FROM auth.sessions WHERE expires_at < NOW() OR is_revoked = true`,
	}

	for _, query := range queries {
		cmdTag, err := d.pool.Exec(ctx, query)
		if err != nil {
			log.Printf("WARN: Failed to cleanup expired records: %v", err)
			continue
		}
		if cmdTag.RowsAffected() > 0 {
			log.Printf("INFO: Cleaned up %d expired records", cmdTag.RowsAffected())
		}
	}

	return nil
}
