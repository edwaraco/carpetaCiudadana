
# ADR-0006: Servicio de Notificaciones con Go, RabbitMQ y SendGrid

## Estado
**Aceptado** - 2025-11-04

## Contexto

El sistema Carpeta Ciudadana requiere implementar el **Bounded Context "Notificaciones"**, que gestiona el envío automático de comunicaciones por email a ciudadanos durante procesos críticos como registro, verificación de identidad y actividades en sus carpetas personales.

### Desafíos Identificados

1. **Event-Driven Processing:** Consumo asíncrono de eventos de múltiples microservicios
2. **Email Reliability:** Garantía de entrega de emails críticos (verificación, bienvenida)
3. **Template Management:** Emails HTML profesionales con branding consistente
4. **High Throughput:** Procesamiento de miles de emails simultáneos
5. **Fault Tolerance:** Resilencia ante fallos de servicios externos (SendGrid)
6. **Auditabilidad:** Tracking completo de emails enviados y delivery status
7. **External Integration:** Conexión con RabbitMQ existente sin administrar broker propio

### Requisitos No Funcionales Relevantes

- **RNF-01:** Disponibilidad 99.9% para procesamiento de eventos críticos
- **RNF-06:** Latencia P95 < 500ms para procesar y enviar emails
- **RNF-07:** Throughput mínimo 1000 emails/hora
- **RNF-11:** Encriptación en tránsito para comunicación con SendGrid
- **RNF-18:** Logs de auditoría inmutables con retención 5 años
- **RNF-21:** MTTR < 4 horas para fallos en delivery de emails
- **RNF-22:** Cobertura de pruebas > 85%
- **RNF-24:** Documentación sincronizada al 100% con implementación

### Requisitos Funcionales Relevantes

- **RF-NO-01:** Envío automático de email de verificación tras registro
- **RF-NO-02:** Envío automático de email de bienvenida tras completar registro
- **RF-SD-03:** Notificaciones de documentos recibidos en carpeta personal
- **RF-TO-03:** Notificaciones de documentos enviados por email (ciudadano sin operador)
- **RF-TO-04:** Notificaciones de proceso de transferencia de operador
- **RF-TO-06:** Notificaciones de documentos en tránsito durante portabilidad

## Decisión

Implementaremos un **microservicio de notificaciones** usando:

### 1. Go 1.23 como Lenguaje Principal

**Razones:**

1. **High Concurrency:** Goroutines ideales para procesamiento paralelo de eventos
2. **Memory Efficiency:** Bajo overhead para long-running consumers
3. **Fast Processing:** Performance crítico para high-volume email processing
4. **Standard Library:** HTTP client robusto para integraciones con SendGrid
5. **Error Handling:** Explicit error handling crucial para email delivery reliability
6. **Deployment:** Binarios estáticos, fácil containerización
7. **Ecosystem:** Excelente soporte para RabbitMQ y REST APIs

**Alternativas Consideradas:**
- **Node.js:** Event loop single-threaded, menos performance para CPU-intensive tasks
- **Python:** GIL limitations para concurrencia real
- **Java:** Mayor memory footprint para consumers 24/7

### 2. Echo Framework para API REST

**Razones:**

1. **Lightweight:** Minimal overhead para endpoints de health check y testing
2. **Middleware Support:** Logging, CORS, validation built-in
3. **JSON Handling:** Automatic parsing para requests de testing
4. **Health Checks:** Endpoints para monitoring de dependencies
5. **Hot Reload:** Development experience con air tool

**Funcionalidades API:**
- `GET /health` - Status de servicio, RabbitMQ y SendGrid
- `POST /test-email` - Endpoint para testing manual de envío
- `GET /metrics` - Métricas de emails procesados

### 3. RabbitMQ Consumer (External Broker)

**Razones:**

1. **Event-Driven Architecture:** Consumo asíncrono de eventos de auth-service
2. **Message Reliability:** Acknowledgments garantizan processing o requeue
3. **Dead Letter Queues:** Manejo de mensajes que fallan múltiples veces
4. **Load Balancing:** Múltiples consumers pueden procesar en paralelo
5. **Decoupling:** Zero dependency entre auth-service y notifications-service
6. **External Integration:** Se conecta a RabbitMQ existente, no administra broker propio

**Topología de Mensajería:**

```
Exchange: microservices.topic (Topic Exchange)
├── Queue: notifications.email.queue
    ├── Binding: user.registration.email
    ├── Binding: user.registration.complete
    └── Binding: notifications.email.send
```

**Eventos Consumidos:**

```go
// Email de verificación tras registro inicial
type UserRegistrationEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "user.registration.email"
    Timestamp     time.Time              `json:"timestamp"`
    UserDocumentID string                `json:"user_document_id"`
    UserData      UserRegistrationData   `json:"user_data"`
    RoutingKey    string                 `json:"routing_key"`
}

// Email de bienvenida tras completar registro
type UserRegistrationCompleteEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "user.registration.complete"
    Timestamp     time.Time              `json:"timestamp"`
    UserDocumentID string                `json:"user_document_id"`
    UserData      UserRegistrationData   `json:"user_data"`
    RoutingKey    string                 `json:"routing_key"`
}

// Notificación de documento recibido (RF-SD-03)
type DocumentReceivedEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "document.received"
    Timestamp     time.Time              `json:"timestamp"`
    UserDocumentID string                `json:"user_document_id"`
    DocumentID    string                 `json:"document_id"`
    DocumentTitle string                 `json:"document_title"`
    SenderEntity  string                 `json:"sender_entity"`
    DocumentType  string                 `json:"document_type"`
    IsUrgent      bool                   `json:"is_urgent"`
    RoutingKey    string                 `json:"routing_key"`
}

// Notificación de documento enviado por email (RF-TO-03)
type DocumentSentByEmailEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "document.sent.email"
    Timestamp     time.Time              `json:"timestamp"`
    RecipientEmail string                `json:"recipient_email"`
    DocumentTitle string                 `json:"document_title"`
    SenderEntity  string                 `json:"sender_entity"`
    DocumentURL   string                 `json:"document_url"`   // Signed URL for download
    ExpiresAt     time.Time              `json:"expires_at"`
    RoutingKey    string                 `json:"routing_key"`
}

// Notificación de proceso de transferencia (RF-TO-04)
type OperatorTransferEvent struct {
    EventID         string               `json:"event_id"`
    EventType       string               `json:"event_type"`     // "operator.transfer.started" | "operator.transfer.completed"
    Timestamp       time.Time            `json:"timestamp"`
    UserDocumentID  string               `json:"user_document_id"`
    SourceOperator  string               `json:"source_operator"`
    TargetOperator  string               `json:"target_operator"`
    TransferStatus  string               `json:"transfer_status"`
    DocumentsCount  int                  `json:"documents_count"`
    PendingDocs     []string             `json:"pending_docs,omitempty"`  // Documents in transit
    RoutingKey      string               `json:"routing_key"`
}

// Email directo (futuras integraciones)
type GenericEmailEvent struct {
    EventID   string            `json:"event_id"`
    EventType string            `json:"event_type"`     // "notifications.email.send"
    To        string            `json:"to"`
    Subject   string            `json:"subject"`
    Body      string            `json:"body"`
    From      string            `json:"from"`
    Data      map[string]string `json:"data,omitempty"`
}
```

**Alternativas Consideradas:**
- **Apache Kafka:** Overkill para volumen actual, mayor complejidad operacional
- **AWS SQS:** Vendor lock-in, menos features de routing que RabbitMQ
- **HTTP Webhooks:** Coupling directo, requiere retry logic manual

### 4. SendGrid para Email Delivery

**Razones:**

1. **High Deliverability:** Reputación establecida, emails llegan a inbox
2. **Scalability:** Maneja millones de emails sin infrastructure management
3. **Analytics:** Tracking de opens, clicks, bounces, unsubscribes
4. **Template Engine:** HTML templates con variables dinámicas
5. **API Robusta:** REST API bien documentada con SDKs oficiales
6. **Compliance:** GDPR, CAN-SPAM compliance built-in
7. **Reliability:** 99.9% uptime SLA, redundancia global

**Plantillas Implementadas (Simples):**

Actualmente el servicio implementa plantillas **básicas en texto plano** con formato HTML mínimo aplicado automáticamente por el módulo de email:

```go
// Email de Verificación (implementado en consumer.go)
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

// Email de Bienvenida (implementado en consumer.go)
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
```

**Formato HTML Automático (aplicado por sender.go):**

El módulo de email aplica automáticamente un envoltorio HTML básico a todos los mensajes:

```go
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
```

**Estado Actual vs ADR:**
- ✅ **Implementado:** Plantillas básicas de verificación y bienvenida (texto plano + HTML wrapper automático)
- ❌ **No Implementado:** Plantillas HTML especializadas mostradas en el ADR
- ❌ **No Implementado:** Plantillas para documentos, transferencias, etc.

**Alternativas Consideradas:**
- **AWS SES:** Menos deliverability, requiere warm-up manual
- **Mailgun:** Menor adopción, API menos madura
- **SMTP Directo:** No escalable, sin analytics, deliverability issues

### 5. Consumer/Handler Pattern Architecture

**Estructura:**

```
cmd/
├── main.go                 # Entry point, goroutine orchestration
internal/
├── api/                    # REST API (health, testing)
│   ├── handlers.go
│   └── api.gen.go         # OpenAPI generated structs
├── consumer/               # RabbitMQ message processing
│   ├── consumer.go
│   └── router.go          # Message routing by type
├── handlers/               # Business logic handlers
│   └── handlers.go
├── rabbitmq/              # RabbitMQ client
│   └── client.go
pkg/
├── email/                 # SendGrid integration
│   └── sender.go
config/
├── config.go              # Environment configuration
```

**Message Processing Flow:**

```go
// 1. Message Consumer (Goroutine)
RabbitMQ Consumer → Message Router → Specific Handler → SendGrid API → ACK/NACK

// 2. Router Pattern
func (r *MessageRouter) Route(routingKey string, body []byte) error {
    switch routingKey {
    case "user.registration.email":
        return r.userRegistrationHandler.Handle(body)
    case "user.registration.complete":
        return r.userWelcomeHandler.Handle(body)
    case "notifications.email.send":
        return r.directEmailHandler.Handle(body)
    default:
        return fmt.Errorf("no handler for routing key: %s", routingKey)
    }
}

// 3. Handler Implementation
func (c *Consumer) HandleUserRegistration(data []byte) error {
    var event UserRegistrationEvent
    if err := json.Unmarshal(data, &event); err != nil {
        return fmt.Errorf("failed to unmarshal event: %w", err)
    }

    // Generate verification URL with JWT
    verificationURL := fmt.Sprintf("%s/auth/verify?token=%s", 
        baseURL, event.UserData.VerificationToken)

    // Send email via SendGrid
    emailReq := email.EmailRequest{
        SenderEmail:    "carpeta.ciudadana.info@gmail.com",
        RecipientEmail: event.UserData.Email,
        Subject:        "Verifica tu email - Carpeta Ciudadana",
        Message:        renderVerificationTemplate(event.UserData, verificationURL),
    }

    return email.Send(emailReq)
}
```

**Razones:**
1. **Single Responsibility:** Cada handler maneja un tipo específico de evento
2. **Extensibility:** Fácil agregar nuevos tipos de eventos y handlers
3. **Error Isolation:** Fallo en un handler no afecta otros
4. **Testing:** Mock individual de handlers para unit tests

### 6. Configuración External-First

**Razones:**

1. **12-Factor App:** Configuración via environment variables
2. **No Broker Management:** Se conecta a RabbitMQ existente, no administra propio
3. **Production Ready:** Fácil deployment en cualquier ambiente
4. **Docker Friendly:** Configuration via environment variables

**Configuración Requerida:**

```go
type Config struct {
    // Service
    ListenPort string `env:"LISTEN_PORT" envDefault:"8080"`
    
    // SendGrid (Required)
    SendGridAPIKey  string `env:"SENDGRID_API_KEY"`
    SendGridTestMode bool  `env:"SENDGRID_TEST_MODE" envDefault:"true"`
    
    // RabbitMQ (External - Required)
    RabbitMQURL    string `env:"RABBITMQ_URL"`                    // amqp://user:pass@host:5672/
    ExchangeName   string `env:"EXCHANGE_NAME" envDefault:"microservices.topic"`
    QueueName      string `env:"QUEUE_NAME" envDefault:"notifications.email.queue"`
    RoutingKeys    string `env:"ROUTING_KEYS" envDefault:"user.registration.email,user.registration.complete,notifications.email.send"`
    
    // Consumer
    ConsumerEnabled bool   `env:"CONSUMER_ENABLED" envDefault:"true"`
    ConsumerTag     string `env:"CONSUMER_TAG" envDefault:"notifications-service"`
    ConsumerWorkers int    `env:"CONSUMER_WORKERS" envDefault:"3"`
    
    // External Services
    AuthServiceURL string `env:"AUTH_SERVICE_URL" envDefault:"http://localhost:8081"`
}
```

## Consecuencias

### Positivas

1. ✅ **Zero Infrastructure:** No administra RabbitMQ propio, solo consumer
2. ✅ **High Throughput:** Goroutines procesan múltiples emails concurrentemente
3. ✅ **Fault Tolerance:** RabbitMQ ACK/NACK + DLQ para message reliability
4. ✅ **Professional Emails:** SendGrid + HTML templates = high deliverability
5. ✅ **Event-Driven:** Completamente desacoplado de otros microservicios
6. ✅ **Scalability:** Múltiples instancias pueden consumir en paralelo
7. ✅ **Observability:** Health checks + structured logging + metrics
8. ✅ **Development:** Hot reload + local testing con mock SendGrid
9. ✅ **Production Ready:** Docker container + external configuration
10. ✅ **Cost Effective:** Pay-per-email con SendGrid, no infrastructure costs

### Negativas

1. ❌ **External Dependencies:** Depende de RabbitMQ y SendGrid availability
2. ❌ **SendGrid Costs:** Costo por email escalable con volumen
3. ❌ **Limited Templates:** Templates hardcoded, no dynamic template management
4. ❌ **No Email Queue:** Si SendGrid falla, mensajes se pierden (no retry logic)
5. ❌ **Configuration Complexity:** Múltiples variables de entorno requeridas
6. ❌ **Debugging:** Async processing hace debugging más complejo
7. ❌ **Message Ordering:** No garantía de orden en processing de mensajes

### Mitigaciones Implementadas

1. **Robust Error Handling:**
   ```go
   func (c *Consumer) HandleUserRegistration(data []byte) error {
       var event UserRegistrationEvent
       if err := json.Unmarshal(data, &event); err != nil {
           log.Printf("ERROR: Failed to unmarshal event: %v", err)
           return err // NACK message para requeue
       }

       err := email.Send(emailReq)
       if err != nil {
           log.Printf("ERROR: Failed to send email: %v", err)
           return err // NACK para retry
       }

       log.Printf("INFO: Email sent successfully to: %s", event.UserData.Email)
       return nil // ACK message
   }
   ```

2. **Health Checks Comprensivos:**
   ```go
   type HealthResponse struct {
       Service  string            `json:"service"`
       Status   string            `json:"status"`
       Version  string            `json:"version"`
       RabbitMQ string            `json:"rabbitmq"`
       Features map[string]bool   `json:"features"`
   }
   ```

3. **Graceful Shutdown:**
   ```go
   // Graceful shutdown de consumers y connections
   func (c *Consumer) Stop() {
       c.channel.Close()
       c.connection.Close()
       log.Println("✅ RabbitMQ consumer stopped gracefully")
   }
   ```

## Métricas de Éxito

Mediremos el éxito de esta decisión con:

1. **Email Delivery:**
   - Target: 99% successful delivery rate
   - Target: <5s average processing time per email
   - Target: <1% bounce rate
   - Medición: SendGrid analytics + application logs

2. **Message Processing:**
   - Target: <1s latency desde RabbitMQ receipt hasta SendGrid API call
   - Target: 100% message acknowledgment (no lost messages)
   - Target: <0.1% messages enviados a DLQ
   - Medición: RabbitMQ metrics + custom metrics

3. **System Reliability:**
   - Target: 99.9% uptime del consumer
   - Target: Auto-recovery de RabbitMQ connection failures
   - Target: <10s startup time
   - Medición: Health check monitoring + container metrics

4. **Performance:**
   - Target: 1000+ emails/hour sustained throughput
   - Target: Linear scalability con múltiples consumer instances
   - Target: <50MB memory usage per instance
   - Medición: Resource monitoring + load testing

## Estado de Implementación

### Funcionalidades Implementadas ✅

1. **RabbitMQ Consumer (Básico):**
   - Conexión a RabbitMQ externo con configuración flexible
   - Consumer con acknowledgments para message reliability
   - Message routing por routing key a handlers específicos
   - Auto-reconnection con exponential backoff
   - Graceful shutdown de connections

2. **Email Processing (Básico):**
   - Handler para `user.registration.email` → Email de verificación
   - Handler para `user.registration.complete` → Email de bienvenida
   - Handler para `notifications.email.send` → Emails directos (futuro)
   - HTML templates responsivos con CSS inline
   - Variable substitution en templates

3. **SendGrid Integration:**
   - REST API client con error handling robusto
   - Test mode para development (no envía emails reales)
   - Production mode con emails reales
   - Structured logging de todos los envíos

4. **REST API:**
   - `GET /health` - Health check con status de dependencies
   - Swagger/OpenAPI documentation
   - CORS middleware para frontend integration

5. **Observability (Básica):**
   - Structured logging con timestamps y log levels
   - Health checks para RabbitMQ connection
   - Request/response logging
   - Error tracking con stack traces

6. **Configuration Management:**
   - Environment-based configuration
   - Validation de required variables
   - Default values para desarrollo
   - Docker-friendly configuration

7. **Development Tools:**
   - Docker Compose standalone (sin RabbitMQ)
   - Hot reload con air tool
   - Comprehensive README con setup instructions

### Funcionalidades FALTANTES ❌ (Requisitos No Implementados)

1. **Plantillas Específicas de Documentos (RF-SD-03):**
   - ❌ Plantilla optimizada para notificación de documento recibido
   - ❌ Formateo específico de metadatos de documentos
   - ❌ Diseño visual para documentos urgentes
   - ❌ Enlaces de vista previa de documentos en emails

2. **Plantillas de Proceso de Transferencia (RF-TO-04, RF-TO-06):**
   - ❌ Plantilla para transferencia iniciada
   - ❌ Plantilla para transferencia completada
   - ❌ Formateo de información de documentos pendientes
   - ❌ Diseño visual para estado de transferencia

3. **Plantillas de Respaldo por Email para Ciudadanos No Registrados (RF-TO-03):**
   - ❌ Plantilla para documento enviado por email
   - ❌ Formateo de URLs de descarga firmadas con expiración
   - ❌ Integración de enlaces de invitación al registro
   - ❌ Diseño para vista previa de documento sin registro

4. **Registro de Auditoría Inmutable (RNF-18):**
   - ❌ Encadenamiento hash tipo blockchain para eventos de email
   - ❌ Seguimiento inmutable de entrega de emails
   - ❌ Implementación de política de retención 5 años
   - ❌ Verificación de cadena de auditoría
   - ❌ Seguimiento de confirmación de entrega de email
   - ❌ Base de datos de auditoría separada

5. **Características Avanzadas de Email:**
   - ❌ Versionado de plantillas de email
   - ❌ Soporte de plantillas multi-idioma
   - ❌ Carga dinámica de plantillas desde base de datos
   - ❌ Personalización de email basada en preferencias de usuario
   - ❌ Mecanismo de cancelación de suscripción
   - ❌ Integración de analíticas de email

6. **Resistencia y Confiabilidad:**
   - ❌ Procesamiento de Cola de Cartas Muertas (Dead Letter Queue)
   - ❌ Mecanismos de reintento de email con retroceso exponencial
   - ❌ Disyuntor para API de SendGrid
   - ❌ Persistencia de cola de email durante interrupciones
   - ❌ Detección de emails duplicados
   - ❌ Protección de limitación de tasa

7. **Sincronización de Documentación (RNF-24):**
   - ❌ Generación automática de documentación de API
   - ❌ Documentación de esquema de eventos
   - ❌ Documentación de plantillas
   - ❌ Documentación de configuración
   - ❌ Documentación de despliegue

### Análisis de Brecha de Manejadores de Eventos

**Manejadores Actuales vs Eventos Requeridos:**

| Tipo de Evento | Implementado | Requerido | Brecha |
|----------------|-------------|-----------|--------|
| `user.registration.email` | ✅ Completo | ✅ | **NINGUNA** |
| `user.registration.complete` | ✅ Completo | ✅ | **NINGUNA** |
| `notifications.email.send` | ✅ Completo (Agnóstico) | ✅ | **NINGUNA** |
| Plantillas específicas de documentos | ❌ Ninguno | ✅ RF-SD-03 | **MEDIO** |
| Plantillas de transferencia | ❌ Ninguno | ✅ RF-TO-04 | **MEDIO** |
| Plantillas de respaldo por email | ❌ Ninguno | ✅ RF-TO-03 | **MEDIO** |

**Nota:** El servicio puede procesar cualquier evento de email mediante el manejador genérico `notifications.email.send`, pero carece de plantillas especializadas para casos de uso específicos.

### Estado de Implementación de Plantillas

| Plantilla | Implementado | Requerido | Prioridad |
|-----------|-------------|-----------|-----------|
| Email de Verificación | ✅ Completo | ✅ | **NÚCLEO** |
| Email de Bienvenida | ✅ Completo | ✅ | **NÚCLEO** |
| Documento Recibido | ❌ Diseñado | ✅ | **ALTO** |
| Documento Enviado por Email | ❌ Diseñado | ✅ | **ALTO** |
| Transferencia Iniciada | ❌ Diseñado | ✅ | **MEDIO** |
| Transferencia Completada | ❌ Diseñado | ✅ | **MEDIO** |

### Esfuerzo Estimado para Cumplimiento Completo

**Pendiente por Implementar:**

1. **Plantillas de Notificación de Documentos:** 1 sprint
   - Diseño de plantillas HTML especializadas
   - Formateo de metadatos de documentos
   - Integración con datos de eventos existentes
   - Pruebas y validación visual

2. **Plantillas de Proceso de Transferencia:** 1 sprint
   - Plantillas para estados de transferencia
   - Formateo de información de documentos pendientes
   - Diseño visual para seguimiento de estado
   - Pruebas de extremo a extremo

3. **Plantillas de Respaldo por Email:** 1 sprint
   - Plantillas para ciudadanos no registrados
   - Formateo de URLs firmadas y enlaces de registro
   - Diseño de invitación visual
   - Implementación de elementos de seguridad

4. **Sistema de Auditoría Inmutable:** 2 sprints
   - Diseño de esquema de auditoría
   - Implementación de encadenamiento hash
   - Herramientas de verificación
   - Políticas de retención

5. **Mejoras de Resistencia:** 1 sprint
   - Procesamiento de DLQ
   - Disyuntores
   - Mecanismos de reintento
   - Mejoras de monitoreo

**Esfuerzo Total Estimado:** 6 sprints (3 meses)

**Orden de Prioridad de Implementación:**
1. **Plantillas de Documentos Recibidos (RF-SD-03)** - Alto
2. **Plantillas de Respaldo por Email (RF-TO-03)** - Alto  
3. **Plantillas de Transferencia (RF-TO-04)** - Medio
4. **Auditoría Inmutable (RNF-18)** - Crítico para cumplimiento
5. **Características de Resistencia** - Medio

**Nota:** La reducción del esfuerzo estimado refleja que la funcionalidad base de procesamiento de eventos ya está implementada - solo se requiere desarrollo de plantillas especializadas.

### Dependencias Tecnológicas

```go
require (
    github.com/labstack/echo/v4 v4.13.4           // Framework HTTP
    github.com/rabbitmq/amqp091-go v1.10.0        // Cliente RabbitMQ
    github.com/sendgrid/sendgrid-go v3.16.1       // API SendGrid
    github.com/oapi-codegen/runtime v1.1.2        // Runtime OpenAPI
    github.com/caarlos0/env/v10 v10.0.0           // Configuración de entorno
)
```

### Configuración Externa Requerida

```bash
# SendGrid (Requerido)
SENDGRID_API_KEY=SG.tu_clave_api_sendgrid_aqui
SENDGRID_TEST_MODE=false

# Broker RabbitMQ Externo (Requerido)
RABBITMQ_URL=amqp://usuario:contraseña@tu-host-rabbitmq:5672/
EXCHANGE_NAME=microservices.topic
QUEUE_NAME=notifications.email.queue
ROUTING_KEYS=user.registration.email,user.registration.complete,notifications.email.send

# Configuración del Consumidor
CONSUMER_ENABLED=true
CONSUMER_TAG=notifications-service
CONSUMER_WORKERS=3

# Servicio
LISTEN_PORT=8080
ENVIRONMENT=production
```

## Patrones de Diseño Implementados

1. **Patrón Consumidor:** Gorrutina de larga duración consumiendo de cola RabbitMQ
2. **Patrón Enrutador:** Enrutamiento de mensajes basado en claves de enrutamiento
3. **Patrón Manejador:** Manejadores específicos por tipo de evento
4. **Patrón Plantilla:** Plantillas de email HTML con sustitución de variables
5. **Inyección de Dependencias:** Inyección por constructor en main.go
6. **Patrón Disyuntor:** (Configurado pero no implementado - dependencia Resilience4j)

## Integración Externa

### 1. Broker RabbitMQ Externo
- **Tipo:** Conexión AMQP 0.9.1
- **Configuración:** Se conecta a broker existente, no administra propio
- **Resistencia:** Reconexión automática + retroceso exponencial
- **Monitoreo:** Verificación de salud del estado de conexión

### 2. API SendGrid
- **Tipo:** API REST HTTPS
- **Autenticación:** Clave API vía headers
- **Limitación de Tasa:** Respeta límites de tasa de SendGrid
- **Manejo de Errores:** Lógica de reintentos para errores temporales

### 3. Integración con Servicio de Autenticación
- **Tipo:** Consumo de eventos (indirecto vía RabbitMQ)
- **Eventos:** Consume eventos publicados por servicio de autenticación
- **Desacoplamiento:** Cero dependencia directa, puramente orientado a eventos

## Plantillas de Email

### 1. Plantilla de Email de Verificación
```html
<!-- Plantilla HTML profesional con branding -->
<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <header style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Verificación de Email</h1>
    </header>
    <main style="padding: 30px; background-color: #f8f9fa;">
        <h2>¡Hola {{.FullName}}!</h2>
        <p>Para completar tu registro en Carpeta Ciudadana, haz clic en el siguiente enlace:</p>
        <a href="{{.VerificationURL}}" class="btn-primary">Verificar Email</a>
        <p><small>Este enlace expira en 24 horas.</small></p>
    </main>
</div>
```

### 2. Plantilla de Email de Bienvenida
```html
<div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
    <header style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">¡Bienvenido a Carpeta Ciudadana!</h1>
    </header>
    <main style="padding: 30px; background-color: #f8f9fa;">
        <h2>¡Hola {{.FullName}}!</h2>
        <p>Tu registro ha sido completado exitosamente.</p>
        <ul>
            <li>📁 Almacenar documentos de forma segura</li>
            <li>🔍 Acceder desde cualquier lugar</li>
            <li>📨 Recibir notificaciones importantes</li>
        </ul>
        <a href="{{.LoginURL}}" class="btn-success">Acceder a Mi Carpeta</a>
    </main>
</div>
```

## Limitaciones Conocidas

1. **No Persistencia de Email:** No almacena histórico de emails enviados
2. **Plantillas Codificadas:** Las plantillas están codificadas en el código
3. **No Lógica de Reintentos:** Si SendGrid falla, el mensaje se pierde
4. **No Limitación de Tasa:** No hay protección contra spam desde eventos
5. **No Validación de Email:** No valida formato de emails antes de enviar
6. **No Cancelación de Suscripción:** No maneja enlaces de cancelación de suscripción
7. **No Almacenamiento de Analíticas:** No persiste métricas de entrega

## Trabajo Pendiente

1. **Pruebas:** Pruebas unitarias + pruebas de integración con mocks de RabbitMQ/SendGrid
2. **Lógica de Reintentos:** Retroceso exponencial para fallos de SendGrid
3. **Motor de Plantillas:** Carga dinámica de plantillas desde archivos/base de datos
4. **Persistencia de Email:** Tabla de auditoría para emails enviados
5. **Métricas:** Métricas personalizadas de Prometheus para lógica de negocio
6. **Cola de Cartas Muertas:** Manejador específico para procesamiento de DLQ

## Migración a Producción

### Cambios Necesarios:

1. **SendGrid:**
   - Configuración de dominio verificado del remitente
   - Calentamiento de IP dedicada
   - Configuración de webhook para eventos de entrega

2. **RabbitMQ:**
   - Conexión a clúster RabbitMQ de producción
   - Cifrado TLS para conexión
   - Monitoreo de profundidades de cola

3. **Infraestructura:**
   - Orquestación de contenedores (Kubernetes/ECS)
   - Auto-escalado basado en profundidad de cola
   - Logging centralizado (ELK/CloudWatch)

4. **Monitoreo:**
   - AlertManager para fallos de entrega de email
   - Panel de control con métricas de rendimiento
   - Monitoreo de SLA para tiempos de entrega

## Hoja de Ruta de Características

### Futuras Notificaciones (Configuradas pero no implementadas):

1. **Documentos Recibidos:**
   - Evento: `document.received`
   - Plantilla: Email con detalles del documento recibido
   - Adjunto: Enlace de vista previa del documento

2. **Solicitudes de Documentos:**
   - Evento: `document.requested`
   - Plantilla: Email con detalles de la solicitud
   - Acción: Botones para aprobar/rechazar

3. **Multi-Canal:**
   - Notificaciones SMS vía Twilio
   - Notificaciones push para aplicación móvil
   - Integración de API de WhatsApp Business

## Revisión Futura

Esta decisión debe revisarse si:

1. **Volumen supera límites:** >100,000 emails/mes requiere optimización
2. **Tasa de entrega < 95%:** Problemas de entregabilidad con SendGrid
3. **Latencia > 5s:** Cuellos de botella en pipeline de procesamiento
4. **Escalación de costos:** Los costos de SendGrid se vuelven prohibitivos

**Fecha de próxima revisión:** 2026-05-01

## Referencias

- **Documentación API SendGrid:** https://docs.sendgrid.com/api-reference
- **Tutorial RabbitMQ Go:** https://www.rabbitmq.com/tutorials/tutorial-one-go.html
- **Librería Go AMQP:** https://github.com/rabbitmq/amqp091-go
- **Framework Echo:** https://echo.labstack.com/
- **Mejores Prácticas de Email:** https://sendgrid.com/blog/email-best-practices/

## Autores

- **Decisión Propuesta por:** Equipo de Desarrollo Servicio de Notificaciones
- **Revisado por:** Especialista en Marketing por Email
- **Aprobado por:** Líder Técnico

---

**Versión:** 1.0  
**Última Actualización:** 2025-01-04  
**Estado:** Implementación completa - Características principales funcionales, plantillas optimizadas