package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the auth system (minimal auth data only)
type User struct {
	DocumentID    string     `json:"document_id" db:"document_id"` // Primary identifier
	PasswordHash  string     `json:"-" db:"password_hash"`         // Never expose password hash in JSON
	EmailVerified bool       `json:"email_verified" db:"email_verified"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	LastLogin     *time.Time `json:"last_login" db:"last_login"`
}

// UserProfile represents full user profile data (stored in Identity Service)
type UserProfile struct {
	DocumentID string `json:"document_id"`
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
}

// VerificationToken represents a token for email verification or password reset
type VerificationToken struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserDocumentID string     `json:"user_document_id" db:"user_document_id"`
	TokenHash      string     `json:"-" db:"token_hash"` // Never expose token hash
	TokenType      string     `json:"token_type" db:"token_type"`
	ExpiresAt      time.Time  `json:"expires_at" db:"expires_at"`
	UsedAt         *time.Time `json:"used_at" db:"used_at"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
}

// Session represents a user session with JWT token information
type Session struct {
	ID             uuid.UUID `json:"id" db:"id"`
	UserDocumentID string    `json:"user_document_id" db:"user_document_id"`
	TokenHash      string    `json:"-" db:"token_hash"` // Never expose token hash
	ExpiresAt      time.Time `json:"expires_at" db:"expires_at"`
	CreatedAt      time.Time `json:"created_at" db:"created_at"`
	LastUsed       time.Time `json:"last_used" db:"last_used"`
	IsRevoked      bool      `json:"is_revoked" db:"is_revoked"`
	UserAgent      string    `json:"user_agent" db:"user_agent"`
	IPAddress      string    `json:"ip_address" db:"ip_address"`
}

// JWT Claims structure (for session tokens - minimal auth data)
type JWTClaims struct {
	DocumentID string    `json:"document_id"` // Primary user identifier
	SessionID  uuid.UUID `json:"session_id"`
	IssuedAt   int64     `json:"iat"`
	ExpiresAt  int64     `json:"exp"`
	NotBefore  int64     `json:"nbf"`
	Issuer     string    `json:"iss"`
}

// Registration request payload
type RegistrationRequest struct {
	DocumentID string `json:"document_id" validate:"required,min=3,max=50"`
	Email      string `json:"email" validate:"required,email,max=255"`
	FullName   string `json:"full_name" validate:"required,min=2,max=255"`
	Phone      string `json:"phone" validate:"max=50"`
	Address    string `json:"address" validate:"max=1000"`
}

// Password setting request (after email verification)
type SetPasswordRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=8,max=128"`
}

// Login request payload
type LoginRequest struct {
	DocumentID string `json:"document_id" validate:"required"`
	Password   string `json:"password" validate:"required"`
}

// Registration response
type RegistrationResponse struct {
	Success    bool   `json:"success"`
	Message    string `json:"message"`
	DocumentID string `json:"document_id,omitempty"` // Return the document_id as identifier
}

// Login response
type LoginResponse struct {
	Success    bool      `json:"success"`
	Message    string    `json:"message"`
	Token      string    `json:"token,omitempty"`
	ExpiresAt  time.Time `json:"expires_at,omitempty"`
	DocumentID string    `json:"document_id,omitempty"` // Only the user's document ID for session context
}

// Email verification response
type EmailVerificationResponse struct {
	Success bool         `json:"success"`
	Message string       `json:"message"`
	Token   string       `json:"token,omitempty"`
	User    *UserProfile `json:"user,omitempty"` // Full user profile data for form
}

// RabbitMQ message structures
type UserRegistrationEvent struct {
	EventID         uuid.UUID   `json:"event_id"`
	EventType       string      `json:"event_type"` // "user.registration.email"
	Timestamp       time.Time   `json:"timestamp"`
	UserDocumentID  string      `json:"user_document_id"` // Primary user identifier
	UserData        UserProfile `json:"user_data"`        // Full profile data for email
	Token           string      `json:"token"`            // Verification token
	VerificationURL string      `json:"verification_url"` // Complete frontend URL
	ExpiresAt       time.Time   `json:"expires_at"`       // Token expiration
	RoutingKey      string      `json:"routing_key"`      // "notifications.send"
}

type UserRegistrationCompleteEvent struct {
	EventID        uuid.UUID   `json:"event_id"`
	EventType      string      `json:"event_type"` // "user.registration.complete"
	Timestamp      time.Time   `json:"timestamp"`
	UserDocumentID string      `json:"user_document_id"` // Primary user identifier
	UserData       UserProfile `json:"user_data"`        // Full profile data
	RoutingKey     string      `json:"routing_key"`      // "notifications.send"
}

// Identity service request for ciudadano-registry-service
type IdentityRegistrationRequest struct {
	Cedula         int64  `json:"cedula"`         // document_id as number
	NombreCompleto string `json:"nombreCompleto"` // full_name
	Direccion      string `json:"direccion"`      // address
}

// Identity service response from ciudadano-registry-service
type IdentityRegistrationResponse struct {
	Success   bool                      `json:"success"`
	Message   string                    `json:"message"`
	Data      *IdentityRegistrationData `json:"data"`
	Timestamp string                    `json:"timestamp"`
}

type IdentityRegistrationData struct {
	ID                      string `json:"id"`
	Cedula                  int64  `json:"cedula"`
	NombreCompleto          string `json:"nombreCompleto"`
	Direccion               string `json:"direccion"`
	Email                   string `json:"email"`
	CarpetaID               string `json:"carpetaId"`
	Estado                  string `json:"estado"`
	FechaRegistroGovCarpeta string `json:"fechaRegistroGovCarpeta"`
	FechaCreacion           string `json:"fechaCreacion"`
	Activo                  bool   `json:"activo"`
}

// Error response structure
type ErrorResponse struct {
	Success bool   `json:"success"`
	Error   string `json:"error"`
	Message string `json:"message"`
	Code    string `json:"code,omitempty"`
}

// Health check response
type HealthResponse struct {
	Service   string    `json:"service"`
	Status    string    `json:"status"`
	Version   string    `json:"version"`
	Timestamp time.Time `json:"timestamp"`
	Database  string    `json:"database"`
	RabbitMQ  string    `json:"rabbitmq"`
}

// Token types constants
const (
	TokenTypeEmailVerification = "email_verification"
	TokenTypePasswordReset     = "password_reset"
)

// Event types constants
const (
	EventUserRegistrationEmail    = "user.registration.email"
	EventUserRegistrationComplete = "user.registration.complete"
	EventUserPasswordReset        = "user.password_reset"
)

// Routing keys for RabbitMQ events
const (
	RoutingKeyNotifications = "notifications.send"
)

// UserInfo represents basic user information for responses
type UserInfo struct {
	FullName   string `json:"full_name"`
	Email      string `json:"email"`
	DocumentID string `json:"document_id"`
}

// VerifyEmailResponse represents the response from email verification
type VerifyEmailResponse struct {
	Success     bool      `json:"success"`
	Message     string    `json:"message"`
	RedirectURL string    `json:"redirect_url"`
	UserInfo    *UserInfo `json:"user_info"`
}

// SetPasswordResponse represents the response from password setting
type SetPasswordResponse struct {
	Success   bool         `json:"success"`
	Message   string       `json:"message"`
	Token     string       `json:"token"`
	ExpiresAt time.Time    `json:"expires_at"`
	User      *UserProfile `json:"user"` // Full user profile
}
