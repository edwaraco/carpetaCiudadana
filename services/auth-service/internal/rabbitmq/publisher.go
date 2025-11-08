package rabbitmq

import (
	"encoding/json"
	"fmt"
	"log"

	"auth-service/config"
	"auth-service/internal/models"

	"github.com/rabbitmq/amqp091-go"
)

// Publisher handles RabbitMQ message publishing
type Publisher struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
	config  *config.RabbitMQConfig
}

// NewPublisher creates a new RabbitMQ publisher
func NewPublisher(cfg *config.RabbitMQConfig) (*Publisher, error) {
	log.Printf("DEBUG: Attempting to connect to RabbitMQ with URL: %s", maskConnectionString(cfg.URL))

	conn, err := amqp091.Dial(cfg.URL)
	if err != nil {
		log.Printf("DEBUG: Connection failed with error: %v", err)
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	log.Printf("DEBUG: RabbitMQ connection established successfully")

	channel, err := conn.Channel()
	if err != nil {
		log.Printf("DEBUG: Channel creation failed with error: %v", err)
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	log.Printf("DEBUG: RabbitMQ channel created successfully")

	publisher := &Publisher{
		conn:    conn,
		channel: channel,
		config:  cfg,
	}

	// Skip exchange declaration - exchange is managed by infrastructure
	log.Printf("INFO: Skipping exchange validation - assuming 'carpeta.events' exchange exists")

	log.Printf("INFO: RabbitMQ publisher connected to: %s", maskConnectionString(cfg.URL))
	return publisher, nil
}

// Close closes the RabbitMQ connection
func (p *Publisher) Close() error {
	if p.channel != nil {
		p.channel.Close()
	}
	if p.conn != nil {
		p.conn.Close()
	}
	log.Println("INFO: RabbitMQ publisher connection closed")
	return nil
}

// PublishUserRegistrationEvent publishes a user registration event
func (p *Publisher) PublishUserRegistrationEvent(event *models.UserRegistrationEvent) error {
	// Ensure connection is healthy before publishing
	if err := p.ensureConnection(); err != nil {
		return fmt.Errorf("failed to ensure RabbitMQ connection: %w", err)
	}

	// Serialize event to JSON
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Publish message
	err = p.channel.Publish(
		p.config.ExchangeName,          // exchange
		models.RoutingKeyNotifications, // routing key
		false,                          // mandatory
		false,                          // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
			Headers: amqp091.Table{
				"event_type": event.EventType,
				"event_id":   event.EventID.String(),
				"timestamp":  event.Timestamp.Unix(),
				"source":     "auth-service",
				"version":    "v1",
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	log.Printf("INFO: Published user registration event: %s (User: %s)", event.EventID, event.UserDocumentID)
	return nil
}

// PublishUserRegistrationCompleteEvent publishes a user registration complete event
func (p *Publisher) PublishUserRegistrationCompleteEvent(event *models.UserRegistrationCompleteEvent) error {
	// Ensure connection is healthy before publishing
	if err := p.ensureConnection(); err != nil {
		return fmt.Errorf("failed to ensure RabbitMQ connection: %w", err)
	}

	// Serialize event to JSON
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Publish message
	err = p.channel.Publish(
		p.config.ExchangeName,          // exchange
		models.RoutingKeyNotifications, // routing key
		false,                          // mandatory
		false,                          // immediate
		amqp091.Publishing{
			ContentType: "application/json",
			Body:        body,
			Headers: amqp091.Table{
				"event_type": event.EventType,
				"event_id":   event.EventID.String(),
				"timestamp":  event.Timestamp.Unix(),
				"source":     "auth-service",
				"version":    "v1",
			},
		},
	)

	if err != nil {
		return fmt.Errorf("failed to publish message: %w", err)
	}

	log.Printf("INFO: Published user registration complete event: %s (User: %s)", event.EventID, event.UserDocumentID)
	return nil
}

// Health checks RabbitMQ connection health
func (p *Publisher) Health() error {
	if p.conn.IsClosed() {
		return fmt.Errorf("connection is closed")
	}
	return nil
}

// ensureConnection validates and recreates connection/channel if needed
func (p *Publisher) ensureConnection() error {
	// Check if connection is alive
	if p.conn == nil || p.conn.IsClosed() {
		log.Printf("WARN: RabbitMQ connection is closed, attempting to reconnect...")
		return p.reconnect()
	}

	// Check if channel is alive
	if p.channel == nil {
		log.Printf("WARN: RabbitMQ channel is nil, attempting to recreate...")
		return p.recreateChannel()
	}

	return nil
}

// reconnect creates a new connection and channel
func (p *Publisher) reconnect() error {
	log.Printf("DEBUG: Attempting to reconnect to RabbitMQ...")

	// Close existing connection if any
	if p.conn != nil && !p.conn.IsClosed() {
		p.conn.Close()
	}
	if p.channel != nil {
		p.channel.Close()
	}

	// Create new connection
	conn, err := amqp091.Dial(p.config.URL)
	if err != nil {
		return fmt.Errorf("failed to reconnect to RabbitMQ: %w", err)
	}

	// Create new channel
	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return fmt.Errorf("failed to recreate channel: %w", err)
	}

	p.conn = conn
	p.channel = channel

	log.Printf("INFO: RabbitMQ connection and channel recreated successfully")
	return nil
}

// recreateChannel creates a new channel on existing connection
func (p *Publisher) recreateChannel() error {
	log.Printf("DEBUG: Attempting to recreate RabbitMQ channel...")

	if p.channel != nil {
		p.channel.Close()
	}

	channel, err := p.conn.Channel()
	if err != nil {
		return fmt.Errorf("failed to recreate channel: %w", err)
	}

	p.channel = channel
	log.Printf("INFO: RabbitMQ channel recreated successfully")
	return nil
}

// maskConnectionString masks sensitive information in connection strings
func maskConnectionString(connStr string) string {
	if connStr == "" {
		return ""
	}

	// Simple masking for AMQP URLs
	// amqp://user:password@host:port/ -> amqp://user:***@host:port/
	if len(connStr) > 20 {
		return connStr[:10] + "***" + connStr[len(connStr)-10:]
	}
	return "***"
}
