package config

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"
)

// Config holds all configuration for the auth service
type Config struct {
	// Server configuration
	ListenPort string `env:"LISTEN_PORT"`

	// Database configuration
	DatabaseURL string `env:"DATABASE_URL"`

	// JWT configuration
	JWTSecret string `env:"JWT_SECRET"`

	// RabbitMQ configuration
	RabbitMQ RabbitMQConfig

	// External services
	IdentityServiceURL string `env:"IDENTITY_SERVICE_URL"`

	// Frontend configuration
	FrontendBaseURL string `env:"FRONTEND_BASE_URL"`
}

// RabbitMQConfig holds RabbitMQ specific configuration
type RabbitMQConfig struct {
	URL          string `env:"RABBITMQ_URL"`
	ExchangeName string `env:"EXCHANGE_NAME"`
}

// LoadConfig loads configuration from environment variables
func LoadConfig() (*Config, error) {
	config := &Config{
		ListenPort:         getEnv("LISTEN_PORT", "8080"),
		DatabaseURL:        getEnv("DATABASE_URL", ""),
		JWTSecret:          getEnv("JWT_SECRET", ""),
		IdentityServiceURL: getEnv("IDENTITY_SERVICE_URL", ""),
		FrontendBaseURL:    getEnv("FRONTEND_BASE_URL", ""),
		RabbitMQ: RabbitMQConfig{
			URL:          getEnv("RABBITMQ_URL", ""),
			ExchangeName: getEnv("EXCHANGE_NAME", "carpeta.events"),
		},
	}

	// Validate required configuration
	if err := config.validate(); err != nil {
		return nil, fmt.Errorf("configuration validation failed: %w", err)
	}

	log.Printf("INFO: Auth service configuration loaded successfully")
	log.Printf("INFO: Database URL: %s", maskConnectionString(config.DatabaseURL))
	log.Printf("INFO: RabbitMQ URL: %s", maskConnectionString(config.RabbitMQ.URL))
	log.Printf("INFO: Exchange Name: %s", config.RabbitMQ.ExchangeName)
	log.Printf("INFO: Identity Service URL: %s", config.IdentityServiceURL)
	log.Printf("INFO: Frontend Base URL: %s", config.FrontendBaseURL)

	return config, nil
}

// validate checks if all required configuration is present
func (c *Config) validate() error {
	required := map[string]string{
		"DATABASE_URL":         c.DatabaseURL,
		"JWT_SECRET":           c.JWTSecret,
		"RABBITMQ_URL":         c.RabbitMQ.URL,
		"IDENTITY_SERVICE_URL": c.IdentityServiceURL,
		"FRONTEND_BASE_URL":    c.FrontendBaseURL,
	}

	var missing []string
	for key, value := range required {
		if value == "" {
			missing = append(missing, key)
		}
	}

	if len(missing) > 0 {
		return fmt.Errorf("missing required environment variables: %s", strings.Join(missing, ", "))
	}

	return nil
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvBool gets a boolean environment variable with a default value
func getEnvBool(key string, defaultValue bool) bool {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	boolValue, err := strconv.ParseBool(value)
	if err != nil {
		log.Printf("WARN: Invalid boolean value for %s: %s, using default: %t", key, value, defaultValue)
		return defaultValue
	}

	return boolValue
}

// getEnvInt gets an integer environment variable with a default value
func getEnvInt(key string, defaultValue int) int {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		log.Printf("WARN: Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
		return defaultValue
	}

	return intValue
}

// maskConnectionString masks sensitive information in connection strings
func maskConnectionString(connStr string) string {
	if connStr == "" {
		return ""
	}

	// Simple masking for database URLs
	// postgres://user:password@host:port/database -> postgres://user:***@host:port/database
	if strings.Contains(connStr, "postgres://") {
		parts := strings.Split(connStr, "@")
		if len(parts) == 2 {
			userPart := strings.Split(parts[0], ":")
			if len(userPart) >= 3 {
				// Replace password with ***
				userPart[2] = "***"
				parts[0] = strings.Join(userPart, ":")
			}
			return strings.Join(parts, "@")
		}
	}

	// Simple masking for AMQP URLs
	// amqp://user:password@host:port/ -> amqp://user:***@host:port/
	if strings.Contains(connStr, "amqp://") {
		parts := strings.Split(connStr, "@")
		if len(parts) == 2 {
			userPart := strings.Split(parts[0], ":")
			if len(userPart) >= 3 {
				// Replace password with ***
				userPart[2] = "***"
				parts[0] = strings.Join(userPart, ":")
			}
			return strings.Join(parts, "@")
		}
	}

	return connStr
}
