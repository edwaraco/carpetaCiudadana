// pkg/email/sender.go
package email

import (
	"fmt"
	"os"

	"github.com/sendgrid/sendgrid-go"
	"github.com/sendgrid/sendgrid-go/helpers/mail"
)

// EmailRequest es la estructura que se usa para pasar los datos al sender.
type EmailRequest struct {
	SenderEmail    string
	RecipientEmail string
	Subject        string
	Message        string
}

// Send envia el correo usando SendGrid únicamente.
func Send(req EmailRequest) error {
	// Check if we're in test mode
	testMode := os.Getenv("SENDGRID_TEST_MODE")
	if testMode == "true" || testMode == "1" {
		return SendTestMode(req)
	}

	// Solo usar SendGrid - no hay fallback
	return SendWithSendGrid(req)
}

// SendTestMode simulates sending email for testing purposes
func SendTestMode(req EmailRequest) error {
	fmt.Printf("\n🧪 EMAIL TEST MODE - Email would be sent:\n")
	fmt.Printf("📧 From: %s\n", req.SenderEmail)
	fmt.Printf("📧 To: %s\n", req.RecipientEmail)
	fmt.Printf("📧 Subject: %s\n", req.Subject)
	fmt.Printf("📧 Message: %s\n", req.Message)
	fmt.Printf("✅ Email simulation completed successfully\n\n")
	return nil
}

// SendWithSendGrid envia el correo usando la API de SendGrid.
func SendWithSendGrid(req EmailRequest) error {
	// Obtener la API key desde variables de entorno
	apiKey := os.Getenv("SENDGRID_API_KEY")
	if apiKey == "" {
		return fmt.Errorf("SENDGRID_API_KEY no está configurada")
	} // Crear el objeto From (remitente) - usar nombre profesional
	from := mail.NewEmail("Sistema de Notificaciones", req.SenderEmail)

	// Crear el objeto To (destinatario)
	to := mail.NewEmail("", req.RecipientEmail)

	// Crear contenido HTML más profesional y menos spam-like
	htmlContent := fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>%s</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2c3e50;">%s</h2>
        <div style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff;">
            %s
        </div>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #6c757d;">
            Este mensaje fue enviado por el Sistema de Notificaciones.<br>
            Si no esperabas este correo, puedes ignorarlo de forma segura.
        </p>
    </div>
</body>
</html>`, req.Subject, req.Subject, req.Message)

	// Crear contenido de texto plano mejorado
	plainTextContent := fmt.Sprintf(`%s

%s

---
Este mensaje fue enviado por el Sistema de Notificaciones.
Si no esperabas este correo, puedes ignorarlo de forma segura.`, req.Subject, req.Message)

	// Crear el email
	message := mail.NewSingleEmail(from, req.Subject, to, plainTextContent, htmlContent)

	// Agregar categorías para organizar emails en SendGrid
	message.AddCategories("notificaciones", "sistema")

	// Configurar tracking settings para evitar spam flags
	trackingSettings := mail.NewTrackingSettings()
	clickTrackingSettings := mail.NewClickTrackingSetting()
	clickTrackingSettings.SetEnable(false)
	trackingSettings.SetClickTracking(clickTrackingSettings)

	openTrackingSettings := mail.NewOpenTrackingSetting()
	openTrackingSettings.SetEnable(false)
	trackingSettings.SetOpenTracking(openTrackingSettings)

	message.SetTrackingSettings(trackingSettings) // Crear el cliente SendGrid
	client := sendgrid.NewSendClient(apiKey)

	// Enviar el mensaje
	response, err := client.Send(message)
	if err != nil {
		return fmt.Errorf("fallo al enviar correo con SendGrid: %w", err)
	}

	// Verificar el status code de la respuesta
	if response.StatusCode >= 400 {
		return fmt.Errorf("SendGrid respondió con error %d: %s", response.StatusCode, response.Body)
	}

	return nil
}
