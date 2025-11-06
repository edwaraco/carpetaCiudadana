// config/config.go
package config

import (
	"log"
	"os"
	"strconv"
	"strings"
)

// AppConfig contiene todas las configuraciones del servicio.
type AppConfig struct {
	// Configuración del Servidor de Autenticación (opcional para servicios internos)
	AuthServiceURL string

	// Configuración de SendGrid
	SendGridAPIKey string

	// Configuración del Servicio (ej. puerto de escucha)
	ListenPort string

	// Frontend URL for email links
	FrontendBaseURL string

	// 🆕 Configuración de RabbitMQ Consumer
	RabbitMQ RabbitMQConfig

	// 🆕 Consumer settings
	ConsumerEnabled bool
}

// RabbitMQConfig holds RabbitMQ specific configuration
type RabbitMQConfig struct {
	URL          string   `env:"RABBITMQ_URL"`
	ExchangeName string   `env:"EXCHANGE_NAME"`
	QueueName    string   `env:"QUEUE_NAME"`
	RoutingKeys  []string `env:"ROUTING_KEYS"`
	ConsumerTag  string   `env:"CONSUMER_TAG"`
	Workers      int      `env:"CONSUMER_WORKERS"`
	AutoAck      bool     `env:"AUTO_ACK"`
}

// LoadConfig lee las variables de entorno y devuelve la configuración.
func LoadConfig() *AppConfig {
	// Para servicios internos, AUTH_SERVICE_URL es opcional
	authURL := os.Getenv("AUTH_SERVICE_URL")
	if authURL == "" {
		log.Println("INFO: AUTH_SERVICE_URL no configurada - ejecutando en modo servicios internos")
	}

	// Cargar configuración de SendGrid
	sendGridKey := os.Getenv("SENDGRID_API_KEY")

	// Validar que SendGrid esté configurado
	if sendGridKey == "" {
		log.Fatal("ERROR: SENDGRID_API_KEY es requerida para el servicio de notificaciones.")
	}

	log.Println("INFO: SendGrid configurado correctamente.")

	// 🆕 RabbitMQ configuration
	rabbitmqConfig := RabbitMQConfig{
		URL:          getEnv("RABBITMQ_URL", ""),
		ExchangeName: getEnv("EXCHANGE_NAME", "microservices.topic"),
		QueueName:    getEnv("QUEUE_NAME", "notifications.email.queue"),
		RoutingKeys:  getEnvStringSlice("ROUTING_KEYS", []string{"user.registration.email", "user.registration.complete", "user.password_reset", "notifications.email.send"}),
		ConsumerTag:  getEnv("CONSUMER_TAG", "notifications-service"),
		Workers:      getEnvInt("CONSUMER_WORKERS", 3),
		AutoAck:      getEnvBool("AUTO_ACK", false),
	}

	consumerEnabled := getEnvBool("CONSUMER_ENABLED", false)
	if consumerEnabled && rabbitmqConfig.URL == "" {
		log.Fatal("ERROR: RABBITMQ_URL is required when CONSUMER_ENABLED=true")
	}

	config := &AppConfig{
		AuthServiceURL:  authURL,
		SendGridAPIKey:  sendGridKey,
		ListenPort:      os.Getenv("LISTEN_PORT"),
		FrontendBaseURL: getEnv("FRONTEND_BASE_URL", "http://localhost:3000"),
		RabbitMQ:        rabbitmqConfig,
		ConsumerEnabled: consumerEnabled,
	}

	if consumerEnabled {
		log.Printf("INFO: RabbitMQ Consumer enabled - Exchange: %s, Queue: %s",
			rabbitmqConfig.ExchangeName, rabbitmqConfig.QueueName)
		log.Printf("INFO: Routing Keys: %v", rabbitmqConfig.RoutingKeys)
	}

	return config
}

// Helper functions for environment variables
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

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

func getEnvStringSlice(key string, defaultValue []string) []string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}

	// Split by comma and trim spaces
	parts := strings.Split(value, ",")
	result := make([]string, 0, len(parts))
	for _, part := range parts {
		if trimmed := strings.TrimSpace(part); trimmed != "" {
			result = append(result, trimmed)
		}
	}

	if len(result) == 0 {
		return defaultValue
	}

	return result
}
