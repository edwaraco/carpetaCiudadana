// internal/handlers.go
package handlers

import (
	"fmt"
	"log"
	"net/http"
	"time"

	"notifications-service/internal/api" // Contiene api.gen.go (structs y ResponseObjects)
	// Cliente para la seguridad JWT
	"notifications-service/pkg/email" // Lógica de envío SMTP

	"github.com/labstack/echo/v4" // Para el echo.Context
)

// ServerImpl implementa la interfaz ServerInterface generada por oapi-codegen
type ServerImpl struct {
	// No necesitamos almacenar configuración SMTP ya que solo usamos SendGrid
}

// NewServerImpl crea una nueva instancia del implementador para servicios internos.
func NewServerImpl() *ServerImpl {
	return &ServerImpl{}
}

// PostV1EmailSend implementa la lógica principal.
// La solicitud ya ha pasado la validación de headers y cuerpo JSON del Swagger.
func (s *ServerImpl) PostV1EmailSend(ctx echo.Context, params api.PostV1EmailSendParams) error {

	// --- 1. VALIDACIÓN BÁSICA PARA SERVICIOS INTERNOS ---

	requestID := ctx.Request().Header.Get("X-Request-ID")
	if requestID == "" {
		requestID = "internal-" + fmt.Sprintf("%d", time.Now().UnixNano())
	}

	// Validación opcional de servicio interno via header
	internalService := ctx.Request().Header.Get("X-Internal-Service")
	if internalService == "" {
		log.Printf("[RequestID: %s] ADVERTENCIA: Petición sin header X-Internal-Service", requestID)
	} else {
		log.Printf("[RequestID: %s] Petición autorizada de servicio interno: %s", requestID, internalService)
	}

	// --- 2. LEER CUERPO JSON ---

	var reqBody api.PostV1EmailSendJSONBody
	if err := ctx.Bind(&reqBody); err != nil {
		log.Printf("[RequestID: %s] Error al parsear JSON: %v", requestID, err)
		return ctx.JSON(http.StatusBadRequest, map[string]string{
			"error": "JSON inválido: " + err.Error(),
		})
	}

	log.Printf("[RequestID: %s] JSON recibido correctamente", requestID)

	// --- 3. LÓGICA DE NEGOCIO (Envío Asíncrono) ---

	go func() {
		// Debug: Imprimir valores para troubleshooting
		log.Printf("[RequestID: %s] DEBUG - SenderEmail: '%s', RecipientEmail: '%s', Subject: '%s'",
			requestID, string(reqBody.SenderEmail), string(reqBody.RecipientEmail), reqBody.Subject)

		emailReq := email.EmailRequest{
			SenderEmail:    string(reqBody.SenderEmail),
			RecipientEmail: string(reqBody.RecipientEmail),
			Subject:        reqBody.Subject,
			Message:        reqBody.Message,
		}

		// Validar que los campos requeridos no estén vacíos
		if emailReq.SenderEmail == "" || emailReq.RecipientEmail == "" {
			log.Printf("[RequestID: %s] ERROR: Campos requeridos vacíos - Sender: '%s', Recipient: '%s'",
				requestID, emailReq.SenderEmail, emailReq.RecipientEmail)
			return
		}

		// Enviar email usando SendGrid
		if err := email.SendWithSendGrid(emailReq); err != nil {
			log.Printf("[RequestID: %s] Fallo al enviar correo a %s: %v", requestID, emailReq.RecipientEmail, err)
		} else {
			log.Printf("[RequestID: %s] Correo enviado exitosamente a %s", requestID, emailReq.RecipientEmail)
		}
	}()

	// 4. Devolver la Respuesta (202 Accepted)
	trackingID := "email-track-" + requestID

	response := map[string]string{
		"status":      "accepted",
		"tracking_id": trackingID,
	}

	return ctx.JSON(http.StatusAccepted, response)
}
