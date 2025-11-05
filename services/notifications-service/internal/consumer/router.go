package consumer

import (
	"fmt"
	"log"
	"strings"
)

// MessageHandler interface for handling different types of messages
type MessageHandler interface {
	Handle(body []byte) error
}

// MessageRouter routes messages to appropriate handlers based on routing key
type MessageRouter struct {
	consumer *Consumer
	handlers map[string]MessageHandler
}

// NewMessageRouter creates a new message router
func NewMessageRouter(consumer *Consumer) *MessageRouter {
	router := &MessageRouter{
		consumer: consumer,
		handlers: make(map[string]MessageHandler),
	}

	// Register handlers for different routing keys
	router.RegisterHandler("user.registration.email", &UserRegistrationHandler{consumer: consumer})
	router.RegisterHandler("user.registration.complete", &UserWelcomeHandler{consumer: consumer})
	router.RegisterHandler("notifications.email.send", &DirectEmailHandler{consumer: consumer})

	return router
}

// RegisterHandler registers a handler for a specific routing key pattern
func (r *MessageRouter) RegisterHandler(pattern string, handler MessageHandler) {
	r.handlers[pattern] = handler
	log.Printf("INFO: Registered handler for pattern: %s", pattern)
}

// Route routes a message to the appropriate handler
func (r *MessageRouter) Route(routingKey string, body []byte) error {
	// Try exact match first
	if handler, exists := r.handlers[routingKey]; exists {
		log.Printf("DEBUG: Routing message with key '%s' to exact match handler", routingKey)
		return handler.Handle(body)
	}

	// Try pattern matching
	for pattern, handler := range r.handlers {
		if r.matchPattern(pattern, routingKey) {
			log.Printf("DEBUG: Routing message with key '%s' to pattern handler '%s'", routingKey, pattern)
			return handler.Handle(body)
		}
	}

	// No handler found
	log.Printf("WARN: No handler found for routing key: %s", routingKey)
	return fmt.Errorf("no handler found for routing key: %s", routingKey)
}

// matchPattern checks if a routing key matches a pattern (simple wildcard support)
func (r *MessageRouter) matchPattern(pattern, routingKey string) bool {
	// For now, just exact match. Could be extended with wildcards (* and #)
	return pattern == routingKey ||
		(strings.HasSuffix(pattern, "*") && strings.HasPrefix(routingKey, strings.TrimSuffix(pattern, "*")))
}

// UserRegistrationHandler handles user registration email events
type UserRegistrationHandler struct {
	consumer *Consumer
}

func (h *UserRegistrationHandler) Handle(body []byte) error {
	return h.consumer.HandleUserRegistration(body)
}

// DirectEmailHandler handles direct email send events
type DirectEmailHandler struct {
	consumer *Consumer
}

func (h *DirectEmailHandler) Handle(body []byte) error {
	return h.consumer.HandleGenericEmail(body)
}

// UserWelcomeHandler handles user welcome email events (registration complete)
type UserWelcomeHandler struct {
	consumer *Consumer
}

func (h *UserWelcomeHandler) Handle(body []byte) error {
	return h.consumer.HandleUserWelcome(body)
}
