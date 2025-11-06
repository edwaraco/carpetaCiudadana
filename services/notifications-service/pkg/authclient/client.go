// pkg/authclient/client.go
package authclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// IntrospectionRequest y IntrospectionResponse mapean el endpoint /auth/token/introspect
type IntrospectionRequest struct {
	Token string `json:"token"`
}

type IntrospectionResponse struct {
	Active bool   `json:"active"`
	Sub    string `json:"sub"`
	Scope  string `json:"scope"`
}

// AuthClient maneja la comunicación con el Servicio de Autenticación.
type AuthClient struct {
	AuthServiceURL string
	HTTPClient     *http.Client
}

// NewAuthClient crea una nueva instancia de AuthClient.
func NewAuthClient(url string) *AuthClient {
	return &AuthClient{
		AuthServiceURL: url,
		HTTPClient:     &http.Client{Timeout: 5 * time.Second}, // Timeout de 5s para llamadas de red
	}
}

// IntrospectToken llama al Auth Service para validar el JWT.
func (c *AuthClient) IntrospectToken(ctx context.Context, token string) (bool, *IntrospectionResponse, error) {

	reqBody := IntrospectionRequest{Token: token}
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return false, nil, fmt.Errorf("fallo al serializar la solicitud: %w", err)
	}

	url := fmt.Sprintf("%s/auth/token/introspect", c.AuthServiceURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(jsonBody))
	if err != nil {
		return false, nil, fmt.Errorf("fallo al crear la solicitud HTTP: %w", err)
	}

	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return false, nil, fmt.Errorf("fallo al realizar la petición de introspección: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		// Devuelve false si el servicio Auth no responde 200 (podría ser 401 si el token es irreconocible)
		return false, nil, fmt.Errorf("el Auth Service devolvió un estado inesperado: %d", resp.StatusCode)
	}

	var respData IntrospectionResponse
	if err := json.NewDecoder(resp.Body).Decode(&respData); err != nil {
		return false, nil, fmt.Errorf("fallo al decodificar la respuesta de introspección: %w", err)
	}

	return respData.Active, &respData, nil
}
