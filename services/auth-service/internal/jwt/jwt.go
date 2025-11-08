package jwt

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"auth-service/internal/models"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// JWTService handles JWT token operations
type JWTService struct {
	secret []byte
	issuer string
}

// NewJWTService creates a new JWT service
func NewJWTService(secret, issuer string) *JWTService {
	return &JWTService{
		secret: []byte(secret),
		issuer: issuer,
	}
}

// GenerateToken generates a JWT token for a user (session token)
func (j *JWTService) GenerateToken(user *models.User, sessionID uuid.UUID, email, folderID, fullName string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(24 * time.Hour) // 24 hours expiration

	// Create JWT claims for session token (minimal auth data only)
	claims := jwt.MapClaims{
		"citizen_id": user.CitizenID,
		"folder_id":  folderID,
		"email":      email,
		"full_name":  fullName,
		"session_id": sessionID.String(),
		"iat":        now.Unix(),
		"exp":        expiresAt.Unix(),
		"nbf":        now.Unix(),
		"iss":        j.issuer,
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString(j.secret)
	if err != nil {
		return "", time.Time{}, fmt.Errorf("failed to sign token: %w", err)
	}

	return tokenString, expiresAt, nil
}

// ValidateToken validates a JWT token and returns the claims
func (j *JWTService) ValidateToken(tokenString string) (*models.JWTClaims, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		// Validate signing method
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secret, nil
	})

	if err != nil {
		return nil, fmt.Errorf("failed to parse token: %w", err)
	}

	if !token.Valid {
		return nil, fmt.Errorf("invalid token")
	}

	// Extract claims
	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, fmt.Errorf("invalid token claims")
	}

	// Parse session ID
	sessionIDStr, ok := claims["session_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid session_id in token")
	}
	sessionID, err := uuid.Parse(sessionIDStr)
	if err != nil {
		return nil, fmt.Errorf("invalid session_id format: %w", err)
	}

	// Extract other claims
	citizenID, ok := claims["citizen_id"].(string)
	if !ok {
		return nil, fmt.Errorf("invalid citizen_id in token")
	}
	folderID, _ := claims["folder_id"].(string)
	email, _ := claims["email"].(string)
	issuer, _ := claims["iss"].(string)

	// Extract timestamps
	iat, _ := claims["iat"].(float64)
	exp, _ := claims["exp"].(float64)
	nbf, _ := claims["nbf"].(float64)

	jwtClaims := &models.JWTClaims{
		CitizenID: citizenID,
		FolderID:  folderID,
		Email:     email,
		SessionID: sessionID,
		IssuedAt:  int64(iat),
		ExpiresAt: int64(exp),
		NotBefore: int64(nbf),
		Issuer:    issuer,
	}

	return jwtClaims, nil
}

// HashToken creates a hash of the token for storage
func (j *JWTService) HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// GenerateVerificationToken generates a verification token for email verification
func (j *JWTService) GenerateVerificationToken(userProfile *models.UserProfile, verificationToken string, expiresAt time.Time) (string, error) {
	now := time.Now()

	// Create JWT claims for verification
	claims := jwt.MapClaims{
		"citizen_id":         userProfile.CitizenID,
		"email":              userProfile.Email,
		"full_name":          userProfile.FullName,
		"phone":              userProfile.Phone,
		"address":            userProfile.Address,
		"folder_id":          userProfile.FolderID,
		"verification_token": verificationToken,
		"iat":                now.Unix(),
		"exp":                expiresAt.Unix(),
		"nbf":                now.Unix(),
		"iss":                j.issuer,
		"purpose":            "email_verification",
	}

	// Create token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign token
	tokenString, err := token.SignedString(j.secret)
	if err != nil {
		return "", fmt.Errorf("failed to sign verification token: %w", err)
	}

	return tokenString, nil
}

// ValidateVerificationToken validates a verification JWT token
func (j *JWTService) ValidateVerificationToken(tokenString string) (*models.UserProfile, string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return j.secret, nil
	})

	if err != nil {
		return nil, "", fmt.Errorf("failed to parse verification token: %w", err)
	}

	if !token.Valid {
		return nil, "", fmt.Errorf("invalid verification token")
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		return nil, "", fmt.Errorf("invalid verification token claims")
	}

	// Validate purpose
	purpose, _ := claims["purpose"].(string)
	if purpose != "email_verification" {
		return nil, "", fmt.Errorf("invalid token purpose")
	}

	// Extract user data
	citizenID, ok := claims["citizen_id"].(string)
	if !ok {
		return nil, "", fmt.Errorf("invalid citizen_id in verification token")
	}
	email, _ := claims["email"].(string)
	fullName, _ := claims["full_name"].(string)
	phone, _ := claims["phone"].(string)
	address, _ := claims["address"].(string)
	folderID, _ := claims["folder_id"].(string)
	verificationToken, _ := claims["verification_token"].(string)

	userProfile := &models.UserProfile{
		CitizenID: citizenID,
		Email:     email,
		FullName:  fullName,
		Phone:     phone,
		Address:   address,
		FolderID:  folderID,
	}

	return userProfile, verificationToken, nil
}
