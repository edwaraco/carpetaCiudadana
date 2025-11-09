# Document Authentication Proxy Service

A lightweight FastAPI proxy service that receives HTTP document authentication requests from the citizen-web frontend and publishes them as events to RabbitMQ for asynchronous processing.

## Purpose

This service acts as a bridge between the synchronous HTTP world (citizen-web frontend) and the asynchronous event-driven world (document-authentication-service). It:

1. Receives HTTP POST requests to `/api/v1/authenticateDocument`
2. Validates and parses the JWT token to extract citizen and folder information
3. Publishes a structured event to RabbitMQ queue `document.authentication.request.queue`
4. Returns a 202 Accepted response immediately

## Architecture

```
citizen-web (HTTP) 
    ↓
document-authentication-proxy (HTTP → Event)
    ↓ (RabbitMQ Event)
document-authentication-service (Event Consumer → Gov Carpeta API)
    ↓ (RabbitMQ Event)
carpeta-ciudadana-service (Event Consumer)
```

## Technology Stack

- **Python 3.13**
- **FastAPI** - Web framework
- **Pydantic** - Data validation
- **python-jose** - JWT parsing
- **aio-pika** - RabbitMQ client
- **httpx** - HTTP client (for health checks)

## API Endpoints

### POST `/api/v1/authenticateDocument`

Request body:
```json
{
  "documentId": "uuid-string",
  "documentTitle": "Document Title",
  "dummyJWT": false,
  "dummyURL": "optional-presigned-url"
}
```

Response (202 Accepted):
```json
{
  "status": 202,
  "message": "Accepted"
}
```

### GET `/api/v1/health`

Health check endpoint.

## Configuration

Environment variables (loaded from ConfigMap in Kubernetes):

- `SERVICE_PORT` - Port to run the service (default: 8084)
- `SERVICE_NAME` - Service name (default: document-authentication-proxy)
- `LOG_LEVEL` - Logging level (default: INFO)
- `RABBITMQ_URL` - RabbitMQ connection URL
- `DOCUMENT_AUTHENTICATION_REQUEST_QUEUE` - Queue name for outgoing events
- `JWT_SECRET_KEY` - JWT secret for token validation
- `JWT_ALGORITHM` - JWT algorithm (default: HS256)

## Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables (or create .env file)
export RABBITMQ_URL="amqp://admin:admin123@localhost:5672/"
export JWT_SECRET_KEY="your-secret-key"
export DOCUMENT_AUTHENTICATION_REQUEST_QUEUE="document.authentication.request.queue"

# Run the service
python main.py
```

## Docker Build

```bash
docker build -t document-authentication-proxy:latest .
```

## Kubernetes Deployment

```bash
cd k8s
kubectl apply -f 00-configmap.yaml
kubectl apply -f 01-deployment.yaml
```

## Event Schema

Published to `document.authentication.request.queue`:

```json
{
  "documentId": "uuid-string",
  "documentTitle": "Document Title",
  "folderId": "extracted-from-jwt",
  "citizenId": 123456789,
  "dummyJWT": false,
  "dummyURL": "optional-presigned-url",
  "rawToken": "original-jwt-token",
  "timestamp": "2024-01-01T12:00:00"
}
```

## Testing

```bash
# Run tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app --cov-report=html
```

## Health Checks

The service provides health check endpoints used by Kubernetes:
- Readiness probe: `GET /api/v1/health`
- Liveness probe: `GET /api/v1/health`

## Monitoring

The service logs all requests and events for observability:
- Request received
- JWT parsed successfully
- Event published to RabbitMQ
- Any errors encountered
