package database

import (
	"context"
	"fmt"
	"log"
	"time"

	"auth-service/internal/models"

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

// CreateUser creates a new user in the database with auth data and email
func (d *Database) CreateUser(ctx context.Context, citizenID, passwordHash, email string) (*models.User, error) {
	user := &models.User{
		CitizenID:     citizenID,
		PasswordHash:  passwordHash,
		EmailVerified: true,
		Email:         email,
	}

	query := `
		INSERT INTO auth.users (
			citizen_id, password_hash, email_verified, email
		) VALUES ($1, $2, $3, $4)
		RETURNING created_at, updated_at
	`

	row := d.pool.QueryRow(ctx, query,
		user.CitizenID, user.PasswordHash, user.EmailVerified, user.Email,
	)
	err := row.Scan(&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	log.Printf("INFO: Auth user created successfully: %s", user.CitizenID)
	return user, nil
}

// GetUserByDocumentID retrieves a user by document ID (auth data only)
func (d *Database) GetUserByCitizenID(ctx context.Context, citizenID string) (*models.User, error) {
	user := &models.User{}
	log.Printf("DEBUG: GetUserByCitizenID called with citizenID='%s'", citizenID)

	query := `
		SELECT citizen_id, password_hash, email_verified, email
		FROM auth.users
		WHERE citizen_id = $1
	`

	err := d.pool.QueryRow(ctx, query, citizenID).Scan(
		&user.CitizenID, &user.PasswordHash, &user.EmailVerified, &user.Email,
	)

	if err != nil {
		log.Printf("DEBUG: GetUserByCitizenID query failed for citizenID='%s': %v", citizenID, err)
		if err == pgx.ErrNoRows {
			return nil, fmt.Errorf("user not found")
		}
		return nil, fmt.Errorf("failed to get user: %w", err)
	}

	log.Printf("DEBUG: GetUserByCitizenID found user: citizenID='%s', email='%s'", user.CitizenID, user.Email)
	return user, nil
}

// ValidatePassword validates a user's password
func (d *Database) ValidatePassword(ctx context.Context, user *models.User, password string) error {
	if user.PasswordHash == "" {
		return fmt.Errorf("user password not set")
	}

	log.Printf("DEBUG: Comparing password for user %s: password='%s', hash='%s'", user.CitizenID, password, user.PasswordHash)
	err := bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return fmt.Errorf("invalid password")
	}

	return nil
}
