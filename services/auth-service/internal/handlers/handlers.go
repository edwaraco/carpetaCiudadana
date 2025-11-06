package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strconv"
	"time"

	"auth-service/config"
	"auth-service/internal/database"
	"auth-service/internal/jwt"
	"auth-service/internal/models"
	"auth-service/internal/rabbitmq"

	"github.com/google/uuid"
	"github.com/labstack/echo/v4"
	"golang.org/x/crypto/bcrypt"
)

// Handlers holds all the handler dependencies
type Handlers struct {
	db         *database.Database
	jwtService *jwt.JWTService
	publisher  *rabbitmq.Publisher
	config     *config.Config
}

// NewHandlers creates a new handlers instance
func NewHandlers(db *database.Database, jwtService *jwt.JWTService, publisher *rabbitmq.Publisher, cfg *config.Config) *Handlers {
	return &Handlers{
		db:         db,
		jwtService: jwtService,
		publisher:  publisher,
		config:     cfg,
	}
}

// HealthCheck returns the health status of the auth service
func (h *Handlers) HealthCheck(c echo.Context) error {
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	health := &models.HealthResponse{
		Service:   "auth-service",
		Status:    "healthy",
		Version:   "1.0.0",
		Timestamp: time.Now(),
		Database:  "healthy",
		RabbitMQ:  "healthy",
	}

	// Check database health
	if err := h.db.Health(ctx); err != nil {
		health.Database = "unhealthy"
		health.Status = "degraded"
		log.Printf("WARN: Database health check failed: %v", err)
	}

	// Check RabbitMQ health
	if err := h.publisher.Health(); err != nil {
		health.RabbitMQ = "unhealthy"
		health.Status = "degraded"
		log.Printf("WARN: RabbitMQ health check failed: %v", err)
	}

	statusCode := http.StatusOK
	if health.Status != "healthy" {
		statusCode = http.StatusServiceUnavailable
	}

	return c.JSON(statusCode, health)
}

// Register handles user registration
func (h *Handlers) Register(c echo.Context) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse request
	var req models.RegistrationRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid request body",
			Message: "Failed to parse registration request",
		})
	}

	// Basic validation
	if req.DocumentID == "" || req.Email == "" || req.FullName == "" {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Missing required fields",
			Message: "DocumentID, Email, and FullName are required",
		})
	}

	log.Printf("INFO: Registration request received for: %s (%s)", req.Email, req.DocumentID)

	// Check if user already exists (check database for completed registrations only)
	existingUser, err := h.db.GetUserByDocumentID(ctx, req.DocumentID)
	if err == nil && existingUser != nil {
		return c.JSON(http.StatusConflict, &models.ErrorResponse{
			Success: false,
			Error:   "User already exists",
			Message: "A user with this document ID already exists",
		})
	}

	// Generate verification token with user data (DO NOT store user in DB yet)
	tokenExpiresAt := time.Now().Add(24 * time.Hour)

	// Create temporary user profile data for token
	tempUserProfile := &models.UserProfile{
		DocumentID: req.DocumentID,
		Email:      req.Email,
		FullName:   req.FullName,
	}

	// Generate JWT verification token with user profile data embedded (user not stored anywhere yet)
	plainToken := uuid.New().String() // Simple token for verification
	jwtToken, err := h.jwtService.GenerateVerificationToken(tempUserProfile, plainToken, tokenExpiresAt)
	if err != nil {
		log.Printf("ERROR: Failed to generate JWT verification token: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to generate verification token",
			Message: "Internal server error",
		})
	}

	// Generate frontend verification URL (points directly to frontend password form)
	verificationURL := fmt.Sprintf("%s/set-password?token=%s", h.config.FrontendBaseURL, jwtToken)

	// Publish user registration event to RabbitMQ (with user profile data)
	registrationEvent := &models.UserRegistrationEvent{
		EventID:         uuid.New(),
		EventType:       models.EventUserRegistrationEmail,
		Timestamp:       time.Now(),
		UserDocumentID:  req.DocumentID,
		UserData:        *tempUserProfile,
		Token:           jwtToken,
		VerificationURL: verificationURL,
		ExpiresAt:       tokenExpiresAt,
		RoutingKey:      models.RoutingKeyUserRegistrationEmail,
	}

	if err := h.publisher.PublishUserRegistrationEvent(registrationEvent); err != nil {
		log.Printf("ERROR: Failed to publish registration event: %v", err)
		// Don't fail the request if RabbitMQ is down, but log the error
	}

	response := &models.RegistrationResponse{
		Success:    true,
		Message:    "Registration initiated. Please check your email for verification link.",
		DocumentID: req.DocumentID,
	}

	log.Printf("INFO: User registration initiated successfully (user NOT stored anywhere yet): %s", req.DocumentID)
	return c.JSON(http.StatusCreated, response)
}

// VerifyEmail handler removed - verification now happens directly in frontend
// Users click email link -> frontend extracts token -> frontend calls set-password
// No intermediate verification endpoint needed

// SetPassword handles password setting after email verification
func (h *Handlers) SetPassword(c echo.Context) error {
	ctx, cancel := context.WithTimeout(context.Background(), 15*time.Second)
	defer cancel()

	// Parse JSON request
	var req models.SetPasswordRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid request body",
			Message: "Failed to parse password setting request",
		})
	}

	if req.Token == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Missing required fields",
			Message: "Token and password are required",
		})
	}

	if len(req.Password) < 8 {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Password too short",
			Message: "Password must be at least 8 characters long",
		})
	}

	// Validate JWT verification token and extract user profile data
	userProfile, _, err := h.jwtService.ValidateVerificationToken(req.Token)
	if err != nil {
		log.Printf("WARN: Invalid verification token during password set: %v", err)
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid or expired token",
			Message: "The verification token is invalid or has expired",
		})
	}

	log.Printf("INFO: Valid verification token received for user: %s (%s)", userProfile.Email, userProfile.DocumentID)

	// Step 1: Call Identity Service to store user profile data
	_, err = h.callIdentityService(userProfile.DocumentID, userProfile.FullName, userProfile.Address)
	if err != nil {
		log.Printf("ERROR: Identity service registration failed: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Identity registration failed",
			Message: "Unable to register your identity in the system. Please try again later.",
		})
	}

	log.Printf("INFO: Identity service registered user profile: %s", userProfile.DocumentID)

	// Step 2: Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("ERROR: Failed to hash password: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to process password",
			Message: "An error occurred while processing your password. Please try again",
		})
	}

	// Step 3: Create auth record with only document_id + password_hash
	authUser, err := h.db.CreateUser(ctx, userProfile.DocumentID, string(hashedPassword))
	if err != nil {
		log.Printf("ERROR: Failed to create auth user: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to create auth user",
			Message: "An error occurred while creating your account. Please try again",
		})
	}

	log.Printf("INFO: Auth user created successfully: %s", authUser.DocumentID)

	// Step 4: Create session for immediate login
	sessionID := uuid.New()
	tokenHash := h.jwtService.HashToken(req.Token)
	expiresAt := time.Now().Add(24 * time.Hour)

	session, err := h.db.CreateSession(ctx, authUser.DocumentID, tokenHash, c.Request().UserAgent(), c.RealIP(), expiresAt)
	if err != nil {
		log.Printf("WARN: Failed to create session: %v", err)
	} else {
		log.Printf("INFO: Session created successfully: %s", session.ID)
	}

	// Step 5: Generate JWT session token
	jwtToken, jwtExpiresAt, err := h.jwtService.GenerateToken(authUser, sessionID)
	if err != nil {
		log.Printf("ERROR: Failed to generate JWT token: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to generate session token",
			Message: "Registration completed but failed to generate login token",
		})
	}

	// Step 6: Publish user registration complete event
	completeEvent := &models.UserRegistrationCompleteEvent{
		EventID:        uuid.New(),
		EventType:      models.EventUserRegistrationComplete,
		Timestamp:      time.Now(),
		UserDocumentID: authUser.DocumentID,
		UserData:       *userProfile, // Send full profile data
		RoutingKey:     models.RoutingKeyUserRegistrationComplete,
	}

	if err := h.publisher.PublishUserRegistrationCompleteEvent(completeEvent); err != nil {
		log.Printf("ERROR: Failed to publish registration complete event: %v", err)
	}

	// Return success response with full user profile
	response := &models.SetPasswordResponse{
		Success:   true,
		Message:   "Registration completed successfully! Welcome to the system.",
		Token:     jwtToken,
		ExpiresAt: jwtExpiresAt,
		User:      userProfile, // Return full user profile from token
	}

	log.Printf("INFO: User registration completed successfully: %s", authUser.DocumentID)
	return c.JSON(http.StatusOK, response)
}

// Login handles user login
func (h *Handlers) Login(c echo.Context) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	// Parse request
	var req models.LoginRequest
	if err := c.Bind(&req); err != nil {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid request body",
			Message: "Failed to parse login request",
		})
	}

	if req.DocumentID == "" || req.Password == "" {
		return c.JSON(http.StatusBadRequest, &models.ErrorResponse{
			Success: false,
			Error:   "Missing credentials",
			Message: "DocumentID and Password are required",
		})
	}

	log.Printf("INFO: Login attempt for document ID: %s", req.DocumentID)

	// Get user by document ID
	user, err := h.db.GetUserByDocumentID(ctx, req.DocumentID)
	if err != nil {
		log.Printf("WARN: User not found for document ID: %s", req.DocumentID)
		return c.JSON(http.StatusUnauthorized, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid credentials",
			Message: "Document ID or password is incorrect",
		})
	}

	// Validate password
	if err := h.db.ValidatePassword(ctx, user, req.Password); err != nil {
		log.Printf("WARN: Invalid password for user: %s", user.DocumentID)
		return c.JSON(http.StatusUnauthorized, &models.ErrorResponse{
			Success: false,
			Error:   "Invalid credentials",
			Message: "Document ID or password is incorrect",
		})
	}

	// Check if email is verified
	if !user.EmailVerified {
		return c.JSON(http.StatusForbidden, &models.ErrorResponse{
			Success: false,
			Error:   "Email not verified",
			Message: "Please verify your email before logging in",
		})
	}

	// Create session
	sessionID := uuid.New()
	dummyToken := "login-session-" + sessionID.String()
	tokenHash := h.jwtService.HashToken(dummyToken)
	expiresAt := time.Now().Add(24 * time.Hour)

	session, err := h.db.CreateSession(ctx, user.DocumentID, tokenHash, c.Request().UserAgent(), c.RealIP(), expiresAt)
	if err != nil {
		log.Printf("ERROR: Failed to create session: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to create session",
			Message: "Internal server error",
		})
	}

	// Generate JWT token
	jwtToken, jwtExpiresAt, err := h.jwtService.GenerateToken(user, session.ID)
	if err != nil {
		log.Printf("ERROR: Failed to generate JWT token: %v", err)
		return c.JSON(http.StatusInternalServerError, &models.ErrorResponse{
			Success: false,
			Error:   "Failed to generate token",
			Message: "Internal server error",
		})
	}

	// For login, we would need to call Identity Service to get full user profile
	// For now, return minimal user info since we don't have full profile in auth service
	// Return minimal login response with only essential auth data
	response := &models.LoginResponse{
		Success:    true,
		Message:    "Login successful",
		Token:      jwtToken,
		ExpiresAt:  jwtExpiresAt,
		DocumentID: user.DocumentID, // Only return document ID for session context
	}

	log.Printf("INFO: User logged in successfully: %s", user.DocumentID)
	return c.JSON(http.StatusOK, response)
}

// callIdentityService registers user identity with the ciudadano-registry-service
func (h *Handlers) callIdentityService(documentID, fullName, address string) (*models.IdentityRegistrationResponse, error) {
	log.Printf("INFO: Calling ciudadano-registry-service for document ID: %s, name: %s", documentID, fullName)

	// Convert document ID to integer
	cedula, err := strconv.ParseInt(documentID, 10, 64)
	if err != nil {
		return nil, fmt.Errorf("invalid document ID format: %w", err)
	}

	// Prepare request payload
	requestPayload := &models.IdentityRegistrationRequest{
		Cedula:         cedula,
		NombreCompleto: fullName,
		Direccion:      address,
	}

	// Marshal request to JSON
	jsonData, err := json.Marshal(requestPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Build the URL - using ciudadano-registry-service as the service name
	identityServiceURL := h.config.IdentityServiceURL
	if identityServiceURL == "" {
		// Default to localhost for development, but in Docker/K8s this should be the service name
		identityServiceURL = "http://ciudadano-registry-service:8080"
	}

	url := fmt.Sprintf("%s/api/v1/ciudadanos/registrar", identityServiceURL)
	log.Printf("INFO: Making request to: %s", url)

	// Create HTTP request
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")

	// Create HTTP client with timeout
	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	// Make the request
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request to ciudadano-registry-service: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	log.Printf("INFO: Ciudadano-registry-service response status: %d", resp.StatusCode)
	log.Printf("DEBUG: Response body: %s", string(body))

	// Check HTTP status
	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		return nil, fmt.Errorf("ciudadano-registry-service returned error status %d: %s", resp.StatusCode, string(body))
	}

	// Parse response
	var response models.IdentityRegistrationResponse
	if err := json.Unmarshal(body, &response); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	// Check if the registration was successful
	if !response.Success {
		return nil, fmt.Errorf("ciudadano-registry-service registration failed: %s", response.Message)
	}

	log.Printf("INFO: Successfully registered citizen with ID: %s, CarpetaID: %s",
		response.Data.ID, response.Data.CarpetaID)

	return &response, nil
}

// TestIdentityService allows testing the identity service integration
func (h *Handlers) TestIdentityService(documentID, fullName, address string) (*models.IdentityRegistrationResponse, error) {
	return h.callIdentityService(documentID, fullName, address)
}
