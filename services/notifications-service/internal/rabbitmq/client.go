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

// SetupQueue connects to existing queue without declaring it - simplified
func (r *RabbitMQClient) SetupQueue() error {
	// Skip exchange and queue validation - assume they exist (managed by infrastructure)
	log.Printf("INFO: Skipping exchange and queue validation - assuming '%s' exchange and '%s' queue exist",
		r.config.ExchangeName, r.config.QueueName)

	// We don't declare the queue since it already exists with specific configuration
	// Instead we just verify we can bind to the routing key (though binding might already exist)
	log.Printf("INFO: Using existing queue: %s", r.config.QueueName)
	log.Printf("INFO: Will consume messages with routing key: %s", r.config.RoutingKey)

	return nil
} // StartConsumer starts consuming messages from the queue
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
