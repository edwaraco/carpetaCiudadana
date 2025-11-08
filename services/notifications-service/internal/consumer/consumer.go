package consumer

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"notifications-service/internal/rabbitmq"
	"notifications-service/pkg/email"

	amqp "github.com/rabbitmq/amqp091-go"
)

// EventTypes supported by the notifications service - simplified to single type
const (
	EventUserRegistrationEmail = "user.registration.email"
)

// Consumer handles RabbitMQ message consumption - simplified
type Consumer struct {
	rabbitmq *rabbitmq.RabbitMQClient
	done     chan struct{}
}

// UserRegistrationEvent represents a user registration event from auth-service
type UserRegistrationEvent struct {
	EventID         string    `json:"event_id"`
	EventType       string    `json:"event_type"`
	Timestamp       time.Time `json:"timestamp"`
	UserDocumentID  string    `json:"user_document_id"`
	UserData        UserData  `json:"user_data"`
	Token           string    `json:"token"`            // JWT verification token
	VerificationURL string    `json:"verification_url"` // Complete frontend URL
	ExpiresAt       time.Time `json:"expires_at"`       // Token expiration
	RoutingKey      string    `json:"routing_key"`
}

// UserData contains user information
type UserData struct {
	DocumentID string `json:"document_id"`
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	Phone      string `json:"phone"`
	Address    string `json:"address"`
}

// NewConsumer creates a new simplified RabbitMQ consumer
func NewConsumer(rabbitmqClient *rabbitmq.RabbitMQClient) *Consumer {
	return &Consumer{
		rabbitmq: rabbitmqClient,
		done:     make(chan struct{}),
	}
}

// Start begins consuming messages from RabbitMQ
func (c *Consumer) Start() error {
	log.Println("INFO: Starting RabbitMQ consumer...")

	// Setup queue and bindings
	if err := c.rabbitmq.SetupQueue(); err != nil {
		return fmt.Errorf("failed to setup queue: %w", err)
	}

	// Start consuming messages
	deliveries, err := c.rabbitmq.StartConsumer()
	if err != nil {
		return fmt.Errorf("failed to start consumer: %w", err)
	}

	// Process messages in a goroutine
	go c.processMessages(deliveries)

	log.Println("INFO: RabbitMQ consumer started successfully")
	return nil
}

// Stop gracefully stops the consumer
func (c *Consumer) Stop() {
	log.Println("INFO: Stopping RabbitMQ consumer...")
	close(c.done)
}

// processMessages handles incoming messages from RabbitMQ
func (c *Consumer) processMessages(deliveries <-chan amqp.Delivery) {
	for {
		select {
		case delivery, ok := <-deliveries:
			if !ok {
				log.Println("INFO: Deliveries channel closed")
				return
			}
			c.handleMessage(delivery)

		case <-c.done:
			log.Println("INFO: Consumer stopped")
			return
		}
	}
}

// handleMessage processes a single message - simplified for registration emails only
func (c *Consumer) handleMessage(delivery amqp.Delivery) {
	log.Printf("INFO: Received message with routing key: %s", delivery.RoutingKey)

	// Only handle registration events
	if delivery.RoutingKey == "notifications.send" {
		if err := c.HandleUserRegistration(delivery.Body); err != nil {
			log.Printf("ERROR: Failed to process registration email: %v", err)
			delivery.Nack(false, false) // Negative acknowledgment, don't requeue
			return
		}
	} else {
		log.Printf("WARN: Unsupported routing key: %s", delivery.RoutingKey)
		delivery.Ack(false) // Acknowledge but don't process
		return
	}

	// Acknowledge the message
	delivery.Ack(false)
	log.Printf("INFO: Registration email processed successfully")
}

// HandleUserRegistration handles user registration email events
func (c *Consumer) HandleUserRegistration(data []byte) error {
	var event UserRegistrationEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return fmt.Errorf("failed to unmarshal user registration event: %w", err)
	}

	log.Printf("INFO: Processing user registration for: %s", event.UserData.Email)

	// Use the verification URL provided by the auth service
	verificationURL := event.VerificationURL

	// Prepare email content
	subject := "Bienvenido - Confirma tu correo electrónico"
	message := fmt.Sprintf(`
¡Hola %s!

Gracias por registrarte en nuestro sistema. Para completar tu registro, por favor confirma tu correo electrónico haciendo clic en el siguiente enlace:

%s

Este enlace expirará el %s.

Si no te registraste en nuestro sistema, puedes ignorar este correo de forma segura.

¡Gracias!
Equipo de Desarrollo`,
		event.UserData.FullName,
		verificationURL,
		event.ExpiresAt.Format("02/01/2006 15:04:05"),
	)

	// Send email using the email package
	emailReq := email.EmailRequest{
		SenderEmail:    "carpeta.ciudadana.info@gmail.com", // Verified sender
		RecipientEmail: event.UserData.Email,
		Subject:        subject,
		Message:        message,
	}

	err := email.Send(emailReq)
	if err != nil {
		return fmt.Errorf("failed to send registration email: %w", err)
	}

	log.Printf("INFO: Registration email sent successfully to: %s", event.UserData.Email)
	return nil
}
