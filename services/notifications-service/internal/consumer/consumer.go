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

// EventTypes supported by the notifications service
const (
	EventUserRegistrationEmail    = "user.registration.email"
	EventUserRegistrationComplete = "user.registration.complete"
	EventNotificationsEmail       = "notifications.email.send"
)

// Consumer handles RabbitMQ message consumption
type Consumer struct {
	rabbitmq *rabbitmq.RabbitMQClient
	done     chan struct{}
	router   *MessageRouter
}

// UserRegistrationEvent represents a user registration event from auth-service
type UserRegistrationEvent struct {
	EventID         string    `json:"event_id"`
	EventType       string    `json:"event_type"`
	Timestamp       time.Time `json:"timestamp"`
	UserID          string    `json:"user_id"`
	UserData        UserData  `json:"user_data"`
	Token           string    `json:"token"`            // JWT verification token
	VerificationURL string    `json:"verification_url"` // Complete frontend URL
	ExpiresAt       time.Time `json:"expires_at"`       // Token expiration
	RoutingKey      string    `json:"routing_key"`
}

// UserData contains user information
type UserData struct {
	Email     string `json:"email"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
}

// UserRegistrationCompleteEvent represents a user registration complete event (welcome email)
type UserRegistrationCompleteEvent struct {
	EventID        string    `json:"event_id"`
	EventType      string    `json:"event_type"`
	Timestamp      time.Time `json:"timestamp"`
	UserDocumentID string    `json:"user_document_id"`
	UserData       struct {
		DocumentID string `json:"document_id"`
		Email      string `json:"email"`
		FullName   string `json:"full_name"`
		Phone      string `json:"phone"`
		Address    string `json:"address"`
	} `json:"user_data"`
	RoutingKey string `json:"routing_key"`
}

// GenericEmailEvent represents a generic email event
type GenericEmailEvent struct {
	EventID   string            `json:"event_id"`
	EventType string            `json:"event_type"`
	Timestamp time.Time         `json:"timestamp"`
	To        string            `json:"to"`
	Subject   string            `json:"subject"`
	Body      string            `json:"body"`
	From      string            `json:"from"`
	Data      map[string]string `json:"data,omitempty"`
}

// NewConsumer creates a new RabbitMQ consumer
func NewConsumer(rabbitmqClient *rabbitmq.RabbitMQClient) *Consumer {
	consumer := &Consumer{
		rabbitmq: rabbitmqClient,
		done:     make(chan struct{}),
	}

	// Initialize message router
	consumer.router = NewMessageRouter(consumer)

	return consumer
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

// handleMessage processes a single message
func (c *Consumer) handleMessage(delivery amqp.Delivery) {
	log.Printf("INFO: Received message with routing key: %s", delivery.RoutingKey)

	// Route message based on routing key
	if err := c.router.Route(delivery.RoutingKey, delivery.Body); err != nil {
		log.Printf("ERROR: Failed to process message: %v", err)
		delivery.Nack(false, false) // Negative acknowledgment, don't requeue
		return
	}

	// Acknowledge the message
	delivery.Ack(false)
	log.Printf("INFO: Message processed successfully: %s", delivery.RoutingKey)
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
		event.UserData.FirstName,
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

// HandleGenericEmail handles generic email events
func (c *Consumer) HandleGenericEmail(data []byte) error {
	var event GenericEmailEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return fmt.Errorf("failed to unmarshal generic email event: %w", err)
	}

	log.Printf("INFO: Processing generic email to: %s", event.To)

	// Send email using the email package
	emailReq := email.EmailRequest{
		SenderEmail:    event.From,
		RecipientEmail: event.To,
		Subject:        event.Subject,
		Message:        event.Body,
	}

	err := email.Send(emailReq)
	if err != nil {
		return fmt.Errorf("failed to send generic email: %w", err)
	}

	log.Printf("INFO: Generic email sent successfully to: %s", event.To)
	return nil
}

// HandleUserWelcome handles user welcome email events (registration complete)
func (c *Consumer) HandleUserWelcome(data []byte) error {
	var event UserRegistrationCompleteEvent
	if err := json.Unmarshal(data, &event); err != nil {
		return fmt.Errorf("failed to unmarshal user welcome event: %w", err)
	}

	log.Printf("INFO: Processing welcome email for: %s", event.UserData.Email)

	// Prepare welcome email content
	subject := "¡Bienvenido a Carpeta Ciudadana Digital!"
	message := fmt.Sprintf(`
¡Hola %s!

¡Bienvenido a Carpeta Ciudadana Digital! Tu registro ha sido completado exitosamente.

Tu cuenta está ahora activa y puedes comenzar a usar todos nuestros servicios:

• Gestionar tus documentos ciudadanos
• Recibir notificaciones importantes  
• Acceder a servicios gubernamentales digitales
• Consultar el estado de tus trámites

Para comenzar, puedes iniciar sesión en: http://localhost:3000/login

Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.

¡Gracias por confiar en nosotros!

Equipo de Carpeta Ciudadana Digital
Gobierno Digital Colombia`,
		event.UserData.FullName,
	)

	// Send welcome email using the email package
	emailReq := email.EmailRequest{
		SenderEmail:    "carpeta.ciudadana.info@gmail.com", // Verified sender
		RecipientEmail: event.UserData.Email,
		Subject:        subject,
		Message:        message,
	}

	err := email.Send(emailReq)
	if err != nil {
		return fmt.Errorf("failed to send welcome email: %w", err)
	}

	log.Printf("INFO: Welcome email sent successfully to: %s (%s)", event.UserData.Email, event.UserData.FullName)
	return nil
}
