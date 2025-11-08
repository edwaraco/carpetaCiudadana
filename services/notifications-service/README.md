# Notificaciones Service

Microservicio para la gestión de notificaciones y comunicaciones en el sistema de Carpeta Ciudadana.

## Descripción

Este microservicio implementa el **Bounded Context: Notificaciones** con el **Aggregate Root: Notificacion**. Su propósito es comunicar eventos a usuarios del sistema de Carpeta Ciudadana, garantizando que los ciudadanos reciban información oportuna sobre documentos recibidos, solicitudes pendientes y procesos de portabilidad a través de múltiples canales de comunicación.

### Arquitectura Event-Driven

El servicio opera bajo un **modelo completamente event-driven**:

- ✅ **Consumo automático**: Todos los eventos se consumen desde RabbitMQ
- ✅ **Sin dependencias HTTP**: No depende de llamadas síncronas de otros servicios  
- ✅ **Procesamiento asíncrono**: Manejo paralelo de múltiples notificaciones
- ✅ **Resilencia**: Sistema de reintentos y dead letter queues
- ✅ **Escalabilidad**: Múltiples instancias pueden consumir en paralelo

**Patrón de Comunicación**: `Evento → RabbitMQ → Consumo → Procesamiento → Envío → Auditoría`

## Funcionalidades Principales

### ✅ Implementado
- **Verificación de Email**: Email con JWT token tras registro inicial  
- **Notificación de Bienvenida**: Email automático tras completar registro
- **Consumo RabbitMQ**: Escucha eventos `user.registration.email` y `user.registration.complete`
- **SendGrid Integration**: Envío de emails con plantillas HTML
- **Modo Desarrollo**: Test mode sin envío real
- ✅ Modo producción con envío efectivo
- ✅ Manejo de errores y reintentos automáticos

### RF-NO-02: Notificación de Documentos Recibidos (En Roadmap)

- 🔄 Envío de notificaciones por email cuando el ciudadano recibe documentos
- 🔄 Incluye información del remitente, tipo de documento y fecha de recepción
- 🔄 Enlace directo a la carpeta ciudadana para acceso inmediato
- 🔄 Plantillas HTML responsivas con información detallada
- 🔄 Notificaciones push a app móvil

### RF-NO-03: Notificación de Solicitudes de Documentos (En Roadmap)

- 🔄 Envío de notificaciones por Email con detalles de la solicitud
- 🔄 Incluye entidad solicitante, lista de documentos y plazo de respuesta
- 🔄 Plantillas multi-contexto para diferentes tipos de solicitud
- 🔄 Envío de notificaciones por SMS
- 🔄 Respuesta directa desde la notificación

### RF-NO-04: Notificación de Validación de Usuario

- ✅ Email de verificación tras registro de usuario
- ✅ Enlace seguro con token JWT para activación de cuenta
- 🔄 Reenvío automático de email de verificación
- ✅  Notificación de verificación exitosa
- ✅  Expiración configurable del enlace de verificación (24 horas)
- 🔄 Integración con auth-service para validación de tokens

## Tecnologías Utilizadas

- **Go 1.23**
- **Echo Framework** (para APIs REST)
- **SendGrid API** (envío de emails)
- **RabbitMQ** (consumo de mensajes)
- **Docker** (containerización)
- **HTML/CSS** (plantillas de email)
- **JSON** (configuración y mensajes)

## Estructura del Proyecto

```
notificaciones/
├── main.go
├── config/
│   └── config.go
├── internal/
│   ├── api/
│   │   └── api.gen.go
│   ├── consumer/
│   │   ├── consumer.go
│   │   └── router.go
│   ├── handlers/
│   │   └── handlers.go
│   └── rabbitmq/
│       └── client.go
├── pkg/
│   ├── authclient/
│   │   └── client.go
│   └── email/
│       └── sender.go
├── api/
│   └── openapi.yaml
├── test/
│   └── test_sendgrid.go
├── rabbitmq/
│   ├── definitions.json
│   └── rabbitmq.conf
├── docker-compose.yml
└── Dockerfile
```
## API Endpoints

### Health Check

```http
GET /health
```

**Respuesta**:
```json
{
  "status": "OK",
  "timestamp": "2024-11-04T10:00:00Z",
  "service": "notificaciones",
  "version": "1.0.0"
}
```

### Envío Manual de Email (Para Testing)

```http
POST /api/v1/notifications/email/send
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "to": "usuario@email.com",
  "subject": "Test Email",
  "template": "welcome",
  "data": {
    "full_name": "Juan Pérez",
    "first_steps_url": "https://carpeta.gov.co/primeros-pasos"
  }
}
```

## Eventos RabbitMQ

### Eventos Consumidos

#### user.registration.email

- **Exchange**: `microservices.topic`
- **Routing Key**: `user.registration.email`
- **Queue**: `notifications.email.queue`
- **Propósito**: Enviar email de verificación con JWT token

**Formato del Mensaje**:
```json
{
  "event_id": "uuid-here",
  "event_type": "user.registration.email",
  "timestamp": "2024-11-04T10:00:00Z",
  "user_document_id": "1234567890",
  "user_data": {
    "document_id": "1234567890",
    "email": "usuario@email.com",
    "full_name": "Juan Pérez",
    "phone": "+57 300 123 4567",
    "address": "Calle 123 #45-67"
  },
  "token": "jwt-verification-token-here",
  "verification_url": "http://localhost:3000/verify-email?token=jwt-token",
  "expires_at": "2024-11-05T10:00:00Z",
  "routing_key": "user.registration.email"
}
```

#### user.registration.complete

- **Exchange**: `microservices.topic`
- **Routing Key**: `user.registration.complete`
- **Queue**: `notifications.email.queue`
- **Propósito**: Enviar email de bienvenida tras completar registro

**Formato del Mensaje**:
```json
{
  "event_id": "uuid-here",
  "event_type": "user.registration.complete",
  "timestamp": "2024-11-04T10:00:00Z",
  "user_document_id": "1234567890",
  "user_data": {
    "document_id": "1234567890",
    "email": "usuario@email.com",
    "full_name": "Juan Pérez",
    "phone": "+57 300 123 4567",
    "address": "Calle 123 #45-67"
  },
  "routing_key": "user.registration.complete"
}
```

## Configuración

### Variables de Entorno

- `SENDGRID_API_KEY`: Clave API de SendGrid (requerida)
- `ENVIRONMENT`: Entorno de ejecución (`development` o `production`)
- `RABBITMQ_URL`: URL de conexión a RabbitMQ
- `AUTH_SERVICE_URL`: URL del servicio de autenticación
- `PORT`: Puerto del servicio (default: 8082)
- `FROM_EMAIL`: Email remitente (default: noreply@carpeta.gov.co)
- `FROM_NAME`: Nombre del remitente (default: Carpeta Ciudadana Digital)

### Configuración de SendGrid

1. **Obtener API Key**:
   - Acceder a [SendGrid Console](https://app.sendgrid.com/settings/api_keys)
   - Crear nueva API Key con permisos de "Mail Send"

2. **Verificar Email del Remitente**:
   - Ir a **Settings > Sender Authentication**
   - Hacer clic en **"Verify a Single Sender"**
   - Llenar el formulario:
     - **From Name**: `Carpeta Ciudadana`
     - **From Email**: `carpeta.ciudadana.info@gmail.com` (o tu email verificado)
     - **Reply To**: Mismo email o tu email personal
     - Completar dirección y demás campos requeridos
   - Hacer clic en **"Create"**
   - Revisar tu email y hacer clic en el enlace de verificación
   
   ⚠️ **Importante**: El email en `FROM_EMAIL` debe estar verificado en SendGrid

3. **Configurar API Key en .env**:
   ```bash
   # Copiar tu SendGrid API Key y agregarlo al archivo .env
   SENDGRID_API_KEY=SG.tu-api-key-aqui
   ```
   
   🔒 **Seguridad**: Nunca cometas el archivo .env al repositorio

4. **Para Kubernetes**:
   - El script `k8s/deploy.sh` automáticamente lee el API key del archivo `.env`
   - No necesitas pasos manuales adicionales
   - El configmap usa un placeholder que se reemplaza automáticamente

5. **Configurar Dominio** (Para Producción):
   - Verificar dominio en SendGrid
   - Configurar registros DNS (SPF, DKIM, DMARC)

6. **Modo Desarrollo**:
   - Configurar `ENVIRONMENT=development`
   - Los emails se logean pero no se envían

### Configuración de RabbitMQ

- **Exchange**: `microservices.topic` (tipo: topic)
- **Queue**: `notifications.email.queue`
- **Routing Keys**: `user.registration.email`, `user.registration.complete`
- **Durabilidad**: Queue y mensajes son durables
- **Dead Letter Queue**: Configurada para mensajes fallidos

## Ejecución

### Desarrollo Local

1. **Requisitos**:
   - Go 1.23+
   - Docker (para RabbitMQ)
   - Cuenta SendGrid

## 🔗 RabbitMQ Integration (Required)

### Prerequisites

**This service requires an existing RabbitMQ broker.** It does NOT include its own RabbitMQ instance.

#### Required RabbitMQ Configuration:

1. **Exchange**: `microservices.topic` (type: topic)
2. **Queue**: `notifications.email.queue` (durable)
3. **Bindings**:
   ```
   user.registration.email → notifications.email.queue
   user.registration.complete → notifications.email.queue
   notifications.email.send → notifications.email.queue
   ```

### Connection Configuration

#### Environment Variables:
```bash
# Required: RabbitMQ connection URL
RABBITMQ_URL=amqp://username:password@rabbitmq-host:5672/

# Required: Queue and exchange configuration
EXCHANGE_NAME=microservices.topic
QUEUE_NAME=notifications.email.queue
ROUTING_KEYS=user.registration.email,user.registration.complete,notifications.email.send
```

#### Example for Different Environments:

**Development (Docker Compose):**
```bash
RABBITMQ_URL=amqp://admin:microservices2024@host.docker.internal:5672/
```

**Production:**
```bash
RABBITMQ_URL=amqp://username:password@your-rabbitmq-server:5672/
```

**Kubernetes:**
```bash
RABBITMQ_URL=amqp://username:password@rabbitmq-service.namespace.svc.cluster.local:5672/
```

### Testing Connection

```bash
# Check if the service can connect to RabbitMQ
curl http://localhost:8080/health

# Expected response:
{
  "rabbitmq": "connected",
  "status": "healthy"
}
```

## 🔗 Integración con RabbitMQ Externo

### Configuración para Producción/Integración

**Por defecto, el servicio NO incluye RabbitMQ.** Se conecta a un broker existente configurado en tu infraestructura.

#### Variables de Entorno Requeridas:
```bash
RABBITMQ_URL=amqp://user:pass@your-rabbitmq-host:5672/
EXCHANGE_NAME=microservices.topic
QUEUE_NAME=notifications.email.queue
ROUTING_KEYS=user.registration.email,user.registration.complete,notifications.email.send
```

#### Topología RabbitMQ Esperada:
- **Exchange**: `microservices.topic` (tipo: topic)
- **Queue**: `notifications.email.queue` 
- **Bindings**:
  - `user.registration.email` → `notifications.email.queue`
  - `user.registration.complete` → `notifications.email.queue`
  - `notifications.email.send` → `notifications.email.queue`

#### Solo para Desarrollo Local:
```bash
# If you need a local RabbitMQ for testing, deploy it separately:
# Use the project's global docker-compose that includes RabbitMQ
cd ../
docker-compose -f docker-compose.global.yml up -d rabbitmq
```

## Deployment

### Production Deployment

1. **Prerequisites**:
   - Go 1.23+ (for building)
   - Docker (for containerization)  
   - Existing RabbitMQ broker with proper configuration
   - SendGrid API key

2. **Configuration**:
   ```bash
   cp .env.example .env
   # Editar .env con tu SENDGRID_API_KEY
   ```

3. **Deployment**:
   ```bash
   # Build and start the service
   docker-compose up -d
   
   # Or build manually
   docker build -t notifications-service:latest .
   docker run -d \
     --name notifications-service \
     -p 8080:8080 \
     -e RABBITMQ_URL=amqp://user:pass@your-rabbitmq:5672/ \
     -e SENDGRID_API_KEY=your-sendgrid-key \
     notifications-service:latest
   ```

4. **Verification**:
   ```bash
   # Check service health
   curl http://localhost:8080/health
   
   # Verify RabbitMQ connection
   # Should show "rabbitmq": "connected"
   ```

### Development Setup (No RabbitMQ included)

This service connects to external RabbitMQ only.

4. **Access**:
   - API: http://localhost:8080
   - Health: http://localhost:8080/health
   - RabbitMQ Management: Use your existing RabbitMQ management interface

### Docker

1. **Build**:
   ```bash
   docker build -t notifications-service:latest .
   ```

2. **Ejecución con Docker Compose**:
   ```bash
   docker-compose --profile standalone up -d
   ```

### Kubernetes Deployment

#### Prerequisites para Kubernetes

1. **Kubernetes cluster** (minikube, kind, o cluster real)
2. **kubectl configurado** para conectarse al cluster
3. **SendGrid API Key** configurado en tu `.env` local

#### Pasos de Deployment

1. **Configurar SendGrid API Key**:
   ```bash
   # Asegúrate de que tu archivo .env tenga el SendGrid API key real
   echo "SENDGRID_API_KEY=tu-sendgrid-api-key-real" >> .env
   ```

2. **Verificar Email en SendGrid**:
   - El email `carpeta.ciudadana.info@gmail.com` debe estar verificado en SendGrid
   - O cambiar `FROM_EMAIL` en `k8s/configmap.yaml` por tu email verificado

3. **Deploy automático**:
   ```bash
   cd k8s
   ./deploy.sh
   ```
   
   El script automáticamente:
   - Lee el API key de tu archivo `.env`
   - Construye la imagen Docker
   - Carga la imagen en minikube (si aplica)
   - Crea el configmap con el API key real
   - Despliega el servicio en Kubernetes

4. **Deploy manual** (si prefieres control manual):
   ```bash
   # Crear namespace
   kubectl create namespace carpeta-ciudadana
   
   # Aplicar manifiestos
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/deployment.yaml
   ```

5. **Verificar deployment**:
   ```bash
   # Ver pods
   kubectl get pods -n carpeta-ciudadana -l app=notifications-service
   
   # Ver logs
   kubectl logs -n carpeta-ciudadana -l app=notifications-service
   
   # Port-forward para testing
   kubectl port-forward svc/notifications-service 8090:8080 -n carpeta-ciudadana
   curl http://localhost:8090/health
   ```

#### Estructura de archivos Kubernetes

```
k8s/
├── configmap.yaml          # Configuración del servicio (con placeholder para API key)
├── deployment.yaml         # Deployment y Service definitions
├── deploy.sh              # Script automático de deployment
├── configmap.template.yaml # Template para env vars
└── secret.local.yaml      # Archivo local para crear secrets manualmente
```

#### Troubleshooting Kubernetes

**Error 401 de SendGrid:**
- Verificar que el API key en `.env` sea válido y no esté revocado
- Verificar que el email `FROM_EMAIL` esté verificado en SendGrid

**Pod no inicia:**
- Verificar recursos disponibles: `kubectl describe pod <pod-name> -n carpeta-ciudadana`
- Revisar logs: `kubectl logs <pod-name> -n carpeta-ciudadana`

**RabbitMQ connection error:**
- Verificar que el servicio `carpeta-rabbitmq` esté corriendo en el cluster
- Revisar la URL de conexión en `configmap.yaml`

## Testing

### Test de Configuración SendGrid

```bash
go run test/test_sendgrid.go
```

### Test Manual via API

```bash
curl -X POST http://localhost:8082/api/v1/notifications/email/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {jwt_token}" \
  -d '{
    "to": "test@email.com",
    "subject": "Test Email",
    "template": "welcome",
    "data": {
      "full_name": "Usuario Test",
      "first_steps_url": "https://carpeta.gov.co/primeros-pasos"
    }
  }'
```

### Testing Message Processing

```bash
# Test with your external RabbitMQ instance
# Replace 'your-rabbitmq-container' with your actual RabbitMQ container name
docker exec -it your-rabbitmq-container rabbitmqadmin publish \
  exchange=microservices.topic \
  routing_key=user.registration.email \
  payload='{"user_id":"123","email":"test@email.com","full_name":"Test User","created_at":"2024-11-04T10:00:00Z"}'
```

## Monitoring & Logs

- **Service Logs**: `docker logs notifications-service`
- **Health Check**: Endpoint `/health` to verify service and RabbitMQ connection
- **External RabbitMQ Management**: Use your existing RabbitMQ management interface
- **SendGrid Analytics**: Dashboard in SendGrid for delivery statistics

## Integration with Other Services

This microservice integrates with:

- **Auth Service**: Consume eventos de registro de usuarios via RabbitMQ
- **SendGrid**: Para el envío efectivo de emails
- **RabbitMQ**: Como message broker para arquitectura event-driven

## Consideraciones de Seguridad

- Validación de entrada con estructuras Go
- Manejo seguro de errores sin exposición de información sensible
- API Key de SendGrid manejada como variable de entorno
- Logging de auditoría para trazabilidad
- Timeout configurable para llamadas HTTP externas
- Autenticación JWT para endpoints manuales (cuando se requiera)

## Plantillas de Email

### Plantilla de Bienvenida

- **Archivo**: `pkg/email/templates/welcome.html`
- **Variables**: `full_name`, `first_steps_url`
- **Estilo**: HTML responsivo con CSS embebido
- **Características**: Logo, header, footer institucional