package rabbitmq

import (
	"fmt"
	"log"

	"notifications-service/config"

	"github.com/rabbitmq/amqp091-go"
)

// RabbitMQClient handles RabbitMQ connections and operations
type RabbitMQClient struct {
	conn    *amqp091.Connection
	channel *amqp091.Channel
	config  *config.RabbitMQConfig
}

// NewRabbitMQClient creates a new RabbitMQ client
func NewRabbitMQClient(cfg *config.RabbitMQConfig) (*RabbitMQClient, error) {
	conn, err := amqp091.Dial(cfg.URL)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to RabbitMQ: %w", err)
	}

	channel, err := conn.Channel()
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("failed to open channel: %w", err)
	}

	client := &RabbitMQClient{
		conn:    conn,
		channel: channel,
		config:  cfg,
	}

	log.Printf("INFO: RabbitMQ client connected successfully")
	return client, nil
}

// EnsureExchange declares the exchange only if it doesn't exist
func (r *RabbitMQClient) EnsureExchange() error {
	// Use passive=true to check if exchange exists without creating it
	err := r.channel.ExchangeDeclarePassive(
		r.config.ExchangeName, // name
		"topic",               // type
		true,                  // durable
		false,                 // auto-deleted
		false,                 // internal
		false,                 // no-wait
		nil,                   // arguments
	)

	if err != nil {
		// Exchange doesn't exist, try to create it (only if we're allowed to)
		log.Printf("WARN: Exchange '%s' doesn't exist, attempting to create it", r.config.ExchangeName)
		err = r.channel.ExchangeDeclare(
			r.config.ExchangeName, // name
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
		log.Printf("INFO: Exchange '%s' created successfully", r.config.ExchangeName)
	} else {
		log.Printf("INFO: Exchange '%s' already exists", r.config.ExchangeName)
	}

	return nil
}

// Close closes the RabbitMQ connection
func (r *RabbitMQClient) Close() error {
	if r.channel != nil {
		r.channel.Close()
	}
	if r.conn != nil {
		r.conn.Close()
	}
	log.Println("INFO: RabbitMQ client connection closed")
	return nil
}

// SetupQueue declares the queue and bindings for consuming messages
func (r *RabbitMQClient) SetupQueue() error {
	// First, ensure the exchange exists (try to connect to existing, create if needed)
	if err := r.EnsureExchange(); err != nil {
		return fmt.Errorf("failed to ensure exchange exists: %w", err)
	}

	// Declare our specific queue
	_, err := r.channel.QueueDeclare(
		r.config.QueueName, // queue name
		true,               // durable
		false,              // delete when unused
		false,              // exclusive
		false,              // no-wait
		nil,                // arguments
	)
	if err != nil {
		return fmt.Errorf("failed to declare queue: %w", err)
	}

	log.Printf("INFO: Queue declared: %s", r.config.QueueName)

	// Bind queue to routing keys
	for _, routingKey := range r.config.RoutingKeys {
		err = r.channel.QueueBind(
			r.config.QueueName,    // queue name
			routingKey,            // routing key
			r.config.ExchangeName, // exchange (should exist now)
			false,                 // no-wait
			nil,                   // arguments
		)
		if err != nil {
			return fmt.Errorf("failed to bind queue to routing key %s: %w", routingKey, err)
		}

		log.Printf("INFO: Queue bound to routing key: %s", routingKey)
	}

	return nil
}

// StartConsumer starts consuming messages from the queue
func (r *RabbitMQClient) StartConsumer() (<-chan amqp091.Delivery, error) {
	return r.channel.Consume(
		r.config.QueueName,   // queue
		r.config.ConsumerTag, // consumer tag
		r.config.AutoAck,     // auto-ack
		false,                // exclusive
		false,                // no-local
		false,                // no-wait
		nil,                  // args
	)
}

// Health checks RabbitMQ connection health
func (r *RabbitMQClient) Health() error {
	if r.conn.IsClosed() {
		return fmt.Errorf("connection is closed")
	}
	return nil
}
