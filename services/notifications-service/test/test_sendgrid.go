// test_sendgrid.go - Script para probar la integración de SendGrid
package main

import (
	"log"
	"os"

	"notifications-service/pkg/email"
)

func main() {
	// Configurar la API key de SendGrid desde variables de entorno
	apiKey := os.Getenv("SENDGRID_API_KEY")
	if apiKey == "" {
		log.Fatal("ERROR: SENDGRID_API_KEY no está configurada")
	}

	// Crear una solicitud de email de prueba
	req := email.EmailRequest{
		SenderEmail:    "carpeta.ciudadana.info@gmail.com", // Cambia por tu email verificado en SendGrid
		RecipientEmail: "carpeta.ciudadana.info@gmail.com", // Cambia por el email de destino
		Subject:        "Prueba de SendGrid - Servicio de Notificaciones",
		Message:        "Este es un email de prueba enviado desde el servicio de notificaciones usando SendGrid.",
	}

	// Probar envío con SendGrid
	log.Println("Enviando email de prueba con SendGrid...")
	if err := email.SendWithSendGrid(req); err != nil {
		log.Fatalf("Error al enviar email: %v", err)
	}

	log.Println("✅ Email enviado exitosamente con SendGrid!")
}
