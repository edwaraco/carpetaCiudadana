// config/config.go
package config

import (
	"log"
	"os"
	"strconv"
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

// RabbitMQConfig holds simplified RabbitMQ configuration
type RabbitMQConfig struct {
	URL          string `env:"RABBITMQ_URL"`
	ExchangeName string `env:"EXCHANGE_NAME"`
	QueueName    string `env:"QUEUE_NAME"`
	RoutingKey   string `env:"ROUTING_KEY"` // Single routing key
	ConsumerTag  string `env:"CONSUMER_TAG"`
	AutoAck      bool   `env:"AUTO_ACK"`
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

	// Para desarrollo/testing, usar placeholder si no está configurado
	if sendGridKey == "" {
		sendGridKey = "SG.placeholder-for-testing"
		log.Println("WARN: SENDGRID_API_KEY no configurada - usando placeholder para testing")
	} else {
		log.Println("INFO: SendGrid configurado correctamente.")
	}

	// 🆕 RabbitMQ configuration - simplified for single queue
	rabbitmqConfig := RabbitMQConfig{
		URL:          getEnv("RABBITMQ_URL", ""),
		ExchangeName: getEnv("EXCHANGE_NAME", "carpeta.events"),
		QueueName:    getEnv("QUEUE_NAME", "notifications.queue"),
		RoutingKey:   getEnv("ROUTING_KEY", "notifications.send"),
		ConsumerTag:  getEnv("CONSUMER_TAG", "notifications-service"),
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
		log.Printf("INFO: Routing Key: %s", rabbitmqConfig.RoutingKey)
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
