package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"

	"auth-service/config"
	"auth-service/internal/database"
	"auth-service/internal/handlers"
	"auth-service/internal/jwt"
	"auth-service/internal/rabbitmq"

	"github.com/labstack/echo/v4"
	"github.com/labstack/echo/v4/middleware"
)

func main() {
	log.Println("🔐 Starting Auth Service...")

	// Load configuration
	cfg, err := config.LoadConfig()
	if err != nil {
		log.Fatalf("ERROR: Failed to load configuration: %v", err)
	}

	// Initialize database
	db, err := database.NewDatabase(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("ERROR: Failed to connect to database: %v", err)
	}
	defer db.Close()

	// Initialize JWT service
	jwtService := jwt.NewJWTService(cfg.JWTSecret, "auth-service")

	// Initialize RabbitMQ publisher
	publisher, err := rabbitmq.NewPublisher(&cfg.RabbitMQ)
	if err != nil {
		log.Printf("WARNING: Failed to initialize RabbitMQ publisher: %v", err)
		log.Printf("WARNING: Service will continue without message publishing functionality")
		publisher = nil
	} else {
		defer publisher.Close()
	}

	// Initialize handlers
	h := handlers.NewHandlers(db, jwtService, publisher, cfg)

	// Setup Echo server
	e := echo.New()

	// Middleware
	e.Use(middleware.Logger())
	e.Use(middleware.Recover())
	e.Use(middleware.CORS())

	// Routes
	e.GET("/health", h.HealthCheck)

	// Auth routes
	authGroup := e.Group("/auth")
	authGroup.POST("/register", h.Register)
	authGroup.POST("/set-password", h.SetPassword)
	authGroup.POST("/login", h.Login)

	// Start server in a goroutine
	go func() {
		log.Printf("🚀 Auth service starting on :%s", cfg.ListenPort)
		if err := e.Start(":" + cfg.ListenPort); err != nil {
			log.Printf("ERROR: HTTP server failed: %v", err)
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM)
	<-quit

	log.Println("🛑 Shutting down Auth Service...")

	// Graceful shutdown
	if err := e.Shutdown(nil); err != nil {
		log.Printf("ERROR: Server shutdown failed: %v", err)
	}

	log.Println("✅ Auth Service stopped")
}
