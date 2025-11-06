// main.go
package main

import (
	"fmt"
	"log"
	"os"
	"os/signal"
	"syscall"

	"notifications-service/config"
	"notifications-service/internal/api"
	"notifications-service/internal/consumer"
	"notifications-service/internal/handlers"
	"notifications-service/internal/rabbitmq"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	log.Println("📧 Starting Notifications Service...")

	// --- 1. Cargar Configuración ---
	cfg := config.LoadConfig()

	// --- 2. Setup complete - RabbitMQ consumer will handle email sending via SendGrid ---

	// --- 3. Inicializar RabbitMQ Consumer (si está habilitado) ---	// --- 3. Inicializar RabbitMQ Consumer (si está habilitado) ---
	var messageConsumer *consumer.Consumer
	if cfg.ConsumerEnabled {
		log.Println("INFO: Initializing RabbitMQ consumer...")

		rabbitmqClient, err := rabbitmq.NewRabbitMQClient(&cfg.RabbitMQ)
		if err != nil {
			log.Fatalf("ERROR: Failed to connect to RabbitMQ: %v", err)
		}
		defer rabbitmqClient.Close()

		messageConsumer = consumer.NewConsumer(rabbitmqClient)
		if err := messageConsumer.Start(); err != nil {
			log.Fatalf("ERROR: Failed to start RabbitMQ consumer: %v", err)
		}
		defer messageConsumer.Stop()

		log.Println("INFO: RabbitMQ consumer started successfully")
	} else {
		log.Println("INFO: RabbitMQ consumer disabled - running in API-only mode")
	}

	// --- 4. Inicializar REST API (si está habilitado) ---
	if cfg.ListenPort != "" {
		log.Println("INFO: Initializing REST API...")

		// Inicializar Handlers para Servicios Internos (Solo SendGrid)
		impl := handlers.NewServerImpl()

		// Crear servidor Echo y registrar handlers
		e := echo.New()

		// Middleware
		e.Use(middleware.Logger())
		e.Use(middleware.Recover())
		e.Use(middleware.CORS())

		// Register API handlers
		api.RegisterHandlers(e, impl)

		// Agregar health check endpoint
		e.GET("/health", func(c echo.Context) error {
			health := map[string]interface{}{
				"service": "notifications-service",
				"status":  "healthy",
				"version": "1.0.0",
				"features": map[string]bool{
					"rest_api":          true,
					"rabbitmq_consumer": cfg.ConsumerEnabled,
				},
			}

			// Check RabbitMQ health if consumer is enabled
			if cfg.ConsumerEnabled && messageConsumer != nil {
				// Add RabbitMQ health status
				health["rabbitmq"] = "connected"
			}

			return c.JSON(200, health)
		})

		// --- 5. Iniciar el Servidor REST API ---
		listenAddr := fmt.Sprintf(":%s", cfg.ListenPort)

		go func() {
			log.Printf("🚀 REST API starting on %s", listenAddr)
			if err := e.Start(listenAddr); err != nil {
				log.Printf("ERROR: REST API server failed: %v", err)
			}
		}()

		// Wait for interrupt signal to gracefully shutdown
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
		<-quit

		log.Println("🛑 Shutting down Notifications Service...")

		// Graceful shutdown
		if err := e.Shutdown(nil); err != nil {
			log.Printf("ERROR: Server shutdown failed: %v", err)
		}
	} else {
		// Running in consumer-only mode
		log.Println("INFO: Running in consumer-only mode (no REST API)")

		// Wait for interrupt signal
		quit := make(chan os.Signal, 1)
		signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
		<-quit

		log.Println("🛑 Shutting down Notifications Service...")
	}

	log.Println("✅ Notifications Service stopped")
}
