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
	conn, err := amqp091.Dial(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	publisher := &Publisher{
		conn:    conn,
		channel: channel,
		config:  cfg,
	}

	// Try to ensure the exchange exists (but don't fail if we can't create it)
	if err := publisher.ensureExchange(); err != nil {
		log.Printf("WARN: Could not ensure exchange exists: %v", err)
		log.Printf("INFO: Continuing anyway - assuming exchange exists or will be created by infrastructure team")
	}

	log.Printf("INFO: RabbitMQ publisher connected to: %s", maskConnectionString(cfg.URL))
	return publisher, nil
}

// ensureExchange tries to declare the exchange, but doesn't fail if it can't
func (p *Publisher) ensureExchange() error {
	// First try passive declaration (check if exists)
	err := p.channel.ExchangeDeclarePassive(
		p.config.ExchangeName, // name
		"topic",               // type
		true,                  // durable
		false,                 // auto-deleted
		false,                 // internal
		false,                 // no-wait
		nil,                   // arguments
	)

	if err != nil {
		// Exchange doesn't exist, try to create it
		log.Printf("WARN: Exchange '%s' doesn't exist, attempting to create it", p.config.ExchangeName)
		err = p.channel.ExchangeDeclare(
			p.config.ExchangeName, // name
			"topic",               // type
			true,                  // durable
			false,                 // auto-deleted
			false,                 // internal
			false,                 // no-wait
			nil,                   // arguments
		)
		if err != nil {
			return fmt.Errorf("failed to declare exchange: %w", err)
		}
		log.Printf("INFO: Exchange '%s' created successfully", p.config.ExchangeName)
	} else {
		log.Printf("INFO: Exchange '%s' already exists", p.config.ExchangeName)
	}

	return nil
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
	// Serialize event to JSON
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Publish message
	err = p.channel.Publish(
		p.config.ExchangeName,                  // exchange
		models.RoutingKeyUserRegistrationEmail, // routing key
		false,                                  // mandatory
		false,                                  // immediate
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
	// Serialize event to JSON
	body, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	// Publish message
	err = p.channel.Publish(
		p.config.ExchangeName,                     // exchange
		models.RoutingKeyUserRegistrationComplete, // routing key
		false, // mandatory
		false, // immediate
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
