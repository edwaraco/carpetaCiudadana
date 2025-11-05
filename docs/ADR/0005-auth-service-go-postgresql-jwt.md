# ADR-0005: Servicio de Autenticación con Go, PostgreSQL y JWT

## Estado
**Aceptado** - 2025-11-04

## Contexto

El sistema Carpeta Ciudadana requiere implementar el **Bounded Context "Autenticación y Autorización"**, que gestiona el registro, verificación por email y autenticación de ciudadanos para acceder de forma segura a sus carpetas personales.

### Desafíos Identificados

1. **Autenticación Sin Estado:** Necesidad de manejar sesiones sin estado para escalabilidad horizontal
2. **Verificación por Correo:** Proceso de doble confirmación para validar identidad ciudadana
3. **Seguridad Robusta:** Protección contra ataques comunes (fuerza bruta, secuestro de tokens)
4. **Comunicación Orientada a Eventos:** Publicación de eventos para notificaciones automáticas
5. **Alto Rendimiento:** Manejo de miles de autenticaciones simultáneas
6. **Auditabilidad:** Registro completo de intentos de autenticación y accesos

### Requisitos No Funcionales Relevantes

- **RNF-01:** Disponibilidad 99.99% para Core Domain (Autenticación crítica)
- **RNF-11:** Latencia P95 < 600ms para APIs críticas con verificación MFA
- **RNF-14:** Capacidad de 2000 TPS en capa de persistencia
- **RNF-15:** Cifrado AES-256 en reposo para credenciales y tokens
- **RNF-16:** TLS 1.3 obligatorio para toda comunicación
- **RNF-17:** **MFA Obligatoria** con factor biométrico o certificado digital (No Negociable)
- **RNF-18:** Logs de auditoría inmutables con retención 5 años (Crítico)
- **RNF-19:** Certificación ISO 27001 y cumplimiento Habeas Data (No Negociable)
- **RNF-20:** Control de acceso granular a nivel de documento (Crítico)
- **RNF-21:** MTTR < 4 horas para correcciones críticas de seguridad
- **RNF-22:** Cobertura de pruebas > 85%

### Requisitos Funcionales (Alcance del Servicio de Autenticación)

- **RF-AU-01:** Registro de usuarios con validación básica
- **RF-AU-02:** Verificación por correo electrónico con tokens JWT temporales  
- **RF-AU-03:** Autenticación con generación de tokens de sesión
- **RF-AU-04:** Gestión de sesiones con expiración automática
- **RF-AU-05:** Auditoría básica de eventos de autenticación

### Arquitectura de Responsabilidades

- **✅ Servicio de Autenticación:** Autenticación, sesiones JWT, identidad de usuario
- **✅ Servicio de Identidad:** Registro ciudadano, integración con MinTIC  
- **✅ Servicio de Documentos:** Autorización, permisos, almacenamiento de documentos
- **✅ Servicio de Notificaciones:** Notificaciones por correo electrónico basadas en eventos

## Decisión

Implementaremos un **microservicio de autenticación** usando:

### 1. Go 1.23 como Lenguaje Principal

**Razones:**

1. **Alto Rendimiento:** Compilado nativo, concurrencia con gorrutinas para alta carga (RNF-14: 2000 TPS)
2. **Eficiencia de Memoria:** Menor uso de memoria comparado con JVM o Node.js
3. **Inicio Rápido:** Tiempo de arranque mínimo, ideal para contenedores y escalado
4. **Biblioteca Estándar Robusta:** Servidor HTTP, criptografía, análisis JSON incluidos
5. **Multiplataforma:** Binarios estáticos, fácil despliegue en cualquier SO
6. **Ecosistema Maduro:** Bibliotecas bien mantenidas para JWT, PostgreSQL, RabbitMQ
7. **Soporte Criptográfico:** Soporte nativo para AES-256, TLS 1.3, certificados digitales (RNF-15, RNF-16)

**Alternativas Consideradas:**
- **Java Spring Security:** Mayor huella de memoria, tiempo de inicio más lento
- **Node.js Passport:** Un solo hilo, menor rendimiento para operaciones criptográficas
- **Python Django:** Limitaciones de GIL para operaciones criptográficas intensivas

### 2. Autenticación Básica Usuario/Contraseña (Sin AMF)

**Razones Actuales:**

1. **Desarrollo Rápido:** Implementación mínima viable para prototipo
2. **Simplicidad:** Inicio de sesión tradicional con número_documento + contraseña
3. **Facilidad de Pruebas:** Facilita las pruebas sin hardware biométrico
4. **Alcance de MVP:** Funcionalidad básica antes de características avanzadas

**Implementación Actual:**

```go
// Autenticación BÁSICA únicamente
type SolicitudLogin struct {
    NumeroDocumento string `json:"numero_documento" validate:"required"`
    Contraseña      string `json:"contraseña" validate:"required"`
}

// NO hay implementación de AMF
// ❌ type SolicitudAMF struct { ... } // NO IMPLEMENTADO

// Claims JWT básicos (sin AMF)
type ClaimsJWT struct {
    IDUsuario       string `json:"id_usuario"`
    NumeroDocumento string `json:"numero_documento"`
    Email           string `json:"email"`
    // ❌ AMFVerificado   bool   // NO IMPLEMENTADO
    // ❌ MetodoAMF       string // NO IMPLEMENTADO  
    // ❌ NivelSesion     string // NO IMPLEMENTADO
    EmitidoEn       int64  `json:"iat"`
    ExpiraEn        int64  `json:"exp"`
    jwt.RegisteredClaims
}
```

**Limitaciones Críticas:**
- ❌ **NO cumple RNF-17** (AMF Obligatoria - No Negociable)
- ❌ **NO hay factor biométrico**
- ❌ **NO hay certificados digitales**
- ❌ **NO hay niveles de sesión** (básico vs elevado)
- ❌ **Vulnerable** a ataques de relleno de credenciales

**Pendiente por Implementar:**
- **Integración SDK Biométrico:** Huella dactilar, reconocimiento facial
- **Validación de Certificados Digitales:** Integración PKI con certificados colombianos
- **Flujo Desafío/Respuesta AMF:** Autenticación de dos factores
- **Claims JWT Mejorados:** Estado de verificación AMF en tokens

### 3. Autenticación Básica Username/Password (NO MFA)

**Razones Actuales:**

1. **Desarrollo Rápido:** Implementación mínima viable para prototipo
2. **Simplicidad:** Login tradicional document_id + password
3. **Testing:** Facilita testing sin hardware biométrico
4. **MVP Scope:** Funcionalidad básica antes de features avanzadas

**Implementación Actual:**

```go
// Autenticación BÁSICA únicamente
type LoginRequest struct {
    DocumentID string `json:"document_id" validate:"required"`
    Password   string `json:"password" validate:"required"`
}

// NO hay implementación de MFA
// ❌ type MFARequest struct { ... } // NO IMPLEMENTADO

// JWT Claims básicos (NO MFA)
type JWTClaims struct {
    UserID       string `json:"user_id"`
    DocumentID   string `json:"document_id"`
    Email        string `json:"email"`
    // ❌ MFAVerified   bool   // NO IMPLEMENTADO
    // ❌ MFAMethod     string // NO IMPLEMENTADO  
    // ❌ SessionLevel  string // NO IMPLEMENTADO
    IssuedAt     int64  `json:"iat"`
    ExpiresAt    int64  `json:"exp"`
    jwt.RegisteredClaims
}
```

**Limitaciones Críticas:**
- ❌ **NO cumple RNF-17** (MFA Obligatoria - No Negociable)
- ❌ **NO hay factor biométrico**
- ❌ **NO hay certificados digitales**
- ❌ **NO hay session levels** (basic vs elevated)
- ❌ **Vulnerable** a credential stuffing attacks

**Pendiente por Implementar:**
- **Biometric SDK Integration:** Huella dactilar, facial recognition
- **Digital Certificate Validation:** PKI integration con certificados colombianos
- **MFA Challenge/Response:** Two-factor authentication flow
- **Enhanced JWT Claims:** MFA verification status en tokens

### 3. Gestión de Sesiones JWT (Sin Autorización de Documentos)

**Responsabilidades del Servicio de Autenticación:**

1. **Solo Autenticación:** Verificación de identidad ciudadana
2. **Generación de Tokens JWT:** Tokens de sesión con claims básicos
3. **Ciclo de Vida de Sesión:** Creación, validación, expiración de sesiones
4. **Claims de Usuario:** Información básica de usuario en JWT

**Implementación Actual (CORRECTA):**

```go
// Claims JWT básicos para AUTENTICACIÓN únicamente
type ClaimsJWT struct {
    IDUsuario       string `json:"id_usuario"`
    NumeroDocumento string `json:"numero_documento"`
    Email           string `json:"email"`
    IDSesion        string `json:"id_sesion"`
    EmitidoEn       int64  `json:"iat"`
    ExpiraEn        int64  `json:"exp"`
    jwt.RegisteredClaims
}

// Middleware de autenticación JWT (NO autorización)
func MiddlewareJWT(servicioJWT *jwt.ServicioJWT) echo.MiddlewareFunc {
    return func(next echo.HandlerFunc) echo.HandlerFunc {
        return func(c echo.Context) error {
            // Solo valida AUTENTICACIÓN - quién eres
            token := extraerTokenDelHeader(c)
            claims, err := servicioJWT.ValidarToken(token)
            if err != nil {
                return c.JSON(http.StatusUnauthorized, "Token inválido")
            }
            
            // ✅ CORRECTO: Solo establece identidad del usuario
            c.Set("usuario", claims)
            return next(c)
            
            // ❌ NO ES RESPONSABILIDAD DEL AUTH:
            // - Validar permisos de documentos
            // - Gestionar consentimientos
            // - Validar acceso por propósito
            // - Autorización granular
        }
    }
}
```

**NO ES RESPONSABILIDAD DEL SERVICIO DE AUTENTICACIÓN:**
- ❌ Permisos de documentos (RNF-20)
- ❌ Gestión de consentimientos  
- ❌ Control de acceso a nivel de documento
- ❌ Reglas de compartir entre usuarios
- ❌ Validación de propósito para acceso a documentos
- ❌ Auditoría de acceso a documentos

**SÍ ES RESPONSABILIDAD DEL SERVICIO DE AUTENTICACIÓN:**
- ✅ Autenticación de usuario (¿quién eres?)
- ✅ Gestión de sesiones (¿estás conectado?)
- ✅ Generación de tokens JWT con claims básicos de usuario
- ✅ Auditoría de inicio/cierre de sesión (solo eventos de autenticación)

**Auth Service Claims (Básicos):**
- **User Identity:** document_id, email, full_name
- **Session Info:** session_id, issued_at, expires_at
- **Basic Roles:** citizen, institution_user (si aplicable)

**Document Service Authorization (Granular):**
- **Document-Level Permissions:** read, write, share, download per document
- **Consent Management:** explicit consent tracking
- **Time-Based Access:** temporary permissions with expiration
- **Purpose-Based Access:** access restricted by declared purpose
- **Audit Trail:** complete access log per document

**Flujo de Authorization Correcto:**

```
1. User Request → Document Service
2. Document Service extracts JWT → validates with Auth Service OR validates signature locally
3. Document Service gets user_id from JWT claims
4. Document Service checks OWN authorization rules for that user + document
5. Document Service grants/denies access based on OWN permission model
```

**NO ES RESPONSABILIDAD DE AUTH:**
- ❌ Document permissions (RNF-20)
- ❌ Consent management  
- ❌ Document-level access control
- ❌ Sharing rules between users
- ❌ Purpose validation for document access
- ❌ Document audit trails

**SÍ ES RESPONSABILIDAD DE AUTH:**
- ✅ User authentication (who are you?)
- ✅ Session management (are you logged in?)
- ✅ JWT token generation with basic user claims
- ✅ Login/logout audit (authentication events only)
    RequesterID    string                `json:"requester_id"`
    DocumentID     string                `json:"document_id"`
    Purpose        string                `json:"purpose"`        // "EMPLOYMENT_VERIFICATION", "LOAN_APPLICATION"
    ExpirationTime *time.Time            `json:"expiration_time"`
    Institution    string                `json:"institution"`    // "BANCO_XYZ", "UNIVERSIDAD_ABC"
}
```

**Authorization Engine:**

```go
func (a *AuthorizationService) CheckAccess(userID, documentID string, action PermissionType) (*AuthorizationResult, error) {
    // 1. Check if user is document owner
    if isOwner := a.isDocumentOwner(userID, documentID); isOwner {
        return &AuthorizationResult{Allowed: true, Reason: "OWNER"}, nil
    }
    
    // 2. Check explicit permissions
    permission, err := a.getPermission(userID, documentID, action)
    if err != nil {
        return &AuthorizationResult{Allowed: false, Reason: "NO_PERMISSION"}, err
    }
    
    // 3. Validate time-based access
    if permission.ExpiresAt != nil && time.Now().After(*permission.ExpiresAt) {
        return &AuthorizationResult{Allowed: false, Reason: "EXPIRED"}, nil
    }
    
    // 4. Check if consent was given
    if !permission.ConsentGiven {
        return &AuthorizationResult{Allowed: false, Reason: "NO_CONSENT"}, nil
    }
    
    // 5. Check if permission was revoked
    if permission.RevokedAt != nil {
        return &AuthorizationResult{Allowed: false, Reason: "REVOKED"}, nil
    }
    
    return &AuthorizationResult{Allowed: true, Permission: permission}, nil
}
```

**Alternativas Consideradas:**
- **Role-Based Access Control (RBAC):** No granular enough para document-level permissions
- **Attribute-Based Access Control (ABAC):** Más complejo, overkill para caso de uso actual

### 4. Auditoría Básica (No Inmutable)

**Implementación Actual:**

1. **Registro Simple:** Solo registro estructurado con logrus
2. **Auditoría Básica en Base de Datos:** Tabla audit_logs básica
3. **No Inmutabilidad:** Los registros pueden ser modificados/eliminados
4. **No Verificación de Cadena:** No hay verificación de integridad
5. **Retención Corta:** No hay política de retención a largo plazo

**Implementación Actual:**

```go
// Registro de auditoría básico en PostgreSQL (MUTABLE)
type RegistroAuditoria struct {
    ID          int64     `json:"id" db:"id"`                    // Auto-incremento
    TipoEvento  string    `json:"tipo_evento" db:"tipo_evento"`
    IDUsuario   string    `json:"id_usuario" db:"id_usuario"`
    DireccionIP string    `json:"direccion_ip" db:"direccion_ip"`
    Accion      string    `json:"accion" db:"accion"`
    Resultado   string    `json:"resultado" db:"resultado"`
    MensajeError *string  `json:"mensaje_error" db:"mensaje_error"`
    Timestamp   time.Time `json:"timestamp" db:"timestamp"`
    // ❌ NO HAY Hash          string    // NO IMPLEMENTADO
    // ❌ NO HAY HashAnterior  *string   // NO IMPLEMENTADO
}

// Registro de auditoría simple (NO inmutable)
func (h *Handlers) registrarEventoAuditoria(tipoEvento, idUsuario, accion, resultado string, err error) {
    registroAuditoria := &RegistroAuditoria{
        TipoEvento:  tipoEvento,
        IDUsuario:   idUsuario,
        DireccionIP: obtenerIPCliente(),
        Accion:      accion,
        Resultado:   resultado,
        Timestamp:   time.Now(),
    }
    
    if err != nil {
        mensajeError := err.Error()
        registroAuditoria.MensajeError = &mensajeError
    }
    
    // INSERT normal (puede ser modificado/eliminado después)
    h.db.InsertarRegistroAuditoria(registroAuditoria)
}
```

**Limitaciones Críticas:**
- ❌ **NO cumple RNF-18** (Auditoría inmutable - Crítico)
- ❌ **NO hay encadenamiento hash** (no verificación tipo blockchain)
- ❌ **NO hay retención 5 años** obligatoria
- ❌ **NO hay verificación de integridad**
- ❌ **Los registros PUEDEN ser modificados** (no inmutable)
- ❌ **NO hay separación de base de datos de auditoría**

**Pendiente por Implementar:**
- **Tabla de Auditoría Inmutable:** Tabla solo-anexo con NO permisos UPDATE/DELETE
- **Encadenamiento Hash:** Encadenamiento SHA-256 para verificación de integridad
- **Base de Datos Separada:** Base de datos separada para aislamiento
- **Retención 5 Años:** Políticas de respaldo y retención a largo plazo
- **Verificación de Cadena de Auditoría:** Herramientas de verificación de cadena
- **Seguimiento Completo de Eventos:** Seguimiento de todos los eventos de seguridad
7. **Team Productivity:** Sintaxis simple, menos boilerplate que Java

**Alternativas Consideradas:**
- **Java + Spring Boot:** Mayor overhead de memoria y startup time
- **Node.js + Express:** Single-threaded, menos performance para CPU-intensive tasks
- **Python + FastAPI:** Menor performance, GIL limitations

### 2. Echo Framework para API REST

**Razones:**

1. **High Performance:** Uno de los frameworks más rápidos de Go (benchmark-proven)
2. **Middleware Ecosystem:** Authentication, CORS, rate limiting, logging incluidos
3. **JSON Binding:** Automático parsing y validation de requests
4. **Error Handling:** Manejo centralizado de errores con custom responses
5. **Route Groups:** Organización limpia de endpoints (/auth/*, /health)
6. **Minimal Footprint:** Librería ligera, no opinionated

**Alternativas Consideradas:**
- **Gin:** Similar performance pero menos features built-in
- **net/http:** Requiere más boilerplate para features comunes
- **Fiber:** Express-like API pero menos maduro

### 3. PostgreSQL como Base de Datos Relacional

**Razones:**

1. **ACID Compliance:** Transacciones confiables para datos críticos de autenticación
2. **JSON Support:** Columnas JSON nativas para metadata flexible de usuarios
3. **UUID Primary Keys:** Identificadores únicos distribuidos (security best practice)
4. **Advanced Indexing:** B-tree, Hash, BRIN indexes para queries optimizadas
5. **Connection Pooling:** pgx driver con pool nativo para alta concurrencia
6. **Security Features:** Row-level security, encryption at rest
7. **Backup & Recovery:** Point-in-time recovery, streaming replication

**Modelo de Datos:**

```sql
-- Tabla de usuarios ciudadanos
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    password_hash VARCHAR(255) NOT NULL,
    email_verified BOOLEAN DEFAULT false,
    verification_token VARCHAR(255),
    verification_expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de sesiones activas
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_document_id VARCHAR(50) NOT NULL REFERENCES users(document_id),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de auditoría de accesos
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para performance
CREATE INDEX idx_users_document_id ON users(document_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sessions_token_hash ON user_sessions(token_hash);
CREATE INDEX idx_sessions_user_document_id ON user_sessions(user_document_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

**Alternativas Consideradas:**
- **MySQL:** Menor soporte para tipos avanzados (UUID, JSONB)
- **SQLite:** No escalable para producción, sin replicación
- **MongoDB:** Eventual consistency, menos ACID guarantees para autenticación

### 4. JWT (JSON Web Tokens) para Autenticación

**Razones:**

1. **Stateless Authentication:** No requiere almacenamiento en servidor (escalabilidad horizontal)
2. **Industry Standard:** RFC 7519, ampliamente adoptado y soportado
3. **Self-Contained:** Claims incluidos en el token (user_id, permissions, expiration)
4. **Cross-Service:** Tokens válidos en múltiples microservicios
5. **Security:** Firma HMAC-SHA256 con secret rotable
6. **Flexible Expiration:** TTL configurable por tipo de token

**Tipos de Tokens:**

```go
// Token de verificación de email (24h TTL)
type EmailVerificationClaims struct {
    DocumentID        string    `json:"document_id"`
    Email            string    `json:"email"`
    FullName         string    `json:"full_name"`
    Purpose          string    `json:"purpose"`          // "email_verification"
    VerificationToken string   `json:"verification_token"`
    jwt.RegisteredClaims
}

// Token de sesión de usuario (24h TTL)
type SessionClaims struct {
    DocumentID string `json:"document_id"`
    SessionID  string `json:"session_id"`
    jwt.RegisteredClaims
}
```

**Alternativas Consideradas:**
- **Session Cookies:** Requiere sticky sessions, menos escalable
- **OAuth 2.0:** Demasiado complejo para autenticación interna
- **API Keys:** Menos seguras, no expiran automáticamente

### 5. RabbitMQ para Event-Driven Communication

**Razones:**

1. **Async Processing:** Publicación de eventos sin bloquear responses HTTP
2. **Reliability:** Message acknowledgments, dead letter queues, persistence
3. **Routing Flexibility:** Topic exchanges con routing keys semánticos
4. **Decoupling:** auth-service no depende síncronamente de notifications-service
5. **Scalability:** Múltiples consumers pueden procesar eventos en paralelo
6. **Observability:** Management UI para monitorear queues y throughput

**Eventos Publicados:**

```go
// Evento cuando usuario se registra (requiere verificación email)
type UserRegistrationEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "user.registration.email"
    Timestamp     time.Time              `json:"timestamp"`
    UserDocumentID string                `json:"user_document_id"`
    UserData      UserRegistrationData   `json:"user_data"`
    RoutingKey    string                 `json:"routing_key"`
}

// Evento cuando usuario completa registro (email verificado + password set)
type UserRegistrationCompleteEvent struct {
    EventID       string                 `json:"event_id"`
    EventType     string                 `json:"event_type"`     // "user.registration.complete"
    Timestamp     time.Time              `json:"timestamp"`
    UserDocumentID string                `json:"user_document_id"`
    UserData      UserRegistrationData   `json:"user_data"`
    RoutingKey    string                 `json:"routing_key"`
}
```

**Alternativas Consideradas:**
- **Apache Kafka:** Overkill para casos de uso simples, mayor complejidad operacional
- **Redis Pub/Sub:** Sin garantías de entrega, no persiste mensajes
- **HTTP Webhooks:** Coupling directo, requiere manejo de fallos manual

### 6. Arquitectura en Capas (Clean Architecture)

**Estructura:**

```
cmd/
├── main.go                 # Entry point, dependency injection
internal/
├── handlers/               # HTTP Controllers (Echo handlers)
│   ├── handlers.go
│   └── auth_handlers.go
├── models/                 # Domain entities y DTOs
│   ├── user.go
│   ├── session.go
│   └── requests.go
├── database/              # Data access layer
│   ├── database.go
│   └── migrations/
├── jwt/                   # JWT service
│   └── jwt.go
├── rabbitmq/             # Event publisher
│   └── publisher.go
config/                   # Configuration management
├── config.go
api/                      # OpenAPI specification
└── openapi.yaml
```

**Razones:**

1. **Separation of Concerns:** Cada capa tiene responsabilidades claras
2. **Testability:** Interfaces permiten mocking fácil de dependencias
3. **Independence:** Business logic no depende de frameworks externos
4. **Maintainability:** Cambios en una capa no afectan otras (low coupling)

### 7. Tecnologías Complementarias

#### 7.1 pgx PostgreSQL Driver

**Razones:**
- Native Go driver, mejor performance que database/sql genérico
- Connection pooling built-in con configuración granular
- Support para prepared statements y bulk operations
- JSON/JSONB support nativo

#### 7.2 golang-migrate para Database Migrations

**Razones:**
- Versioning de esquema de base de datos
- Rollback automático en caso de errores
- Support para PostgreSQL features avanzadas

#### 7.3 bcrypt para Password Hashing

**Razones:**
- Adaptative cost factor (configurable work factor)
- Slow by design, resistente a brute force attacks
- Salt automático incluido en hash

#### 7.4 AMQP 0.9.1 Driver para RabbitMQ

**Razones:**
- Connection pooling y multiplexing automático
- Automatic reconnection con exponential backoff
- Publisher confirms para guaranteed delivery

## Consecuencias

### Positivas

1. ✅ **High Performance:** Go + Echo maneja >10,000 req/s con latencia <50ms
2. ✅ **Memory Efficient:** ~20MB RAM vs ~200MB de Spring Boot equivalente
3. ✅ **Fast Deployment:** Startup time <1s vs ~10s de JVM
4. ✅ **Horizontal Scalability:** JWT stateless permite scaling sin límites
5. ✅ **Event-Driven:** Async communication evita cascading failures
6. ✅ **Security:** bcrypt + JWT + HTTPS + input validation robusta
7. ✅ **Developer Experience:** Hot reload con air, testing con httptest
8. ✅ **Observability:** Structured logging + health checks + metrics
9. ✅ **Data Integrity:** PostgreSQL ACID transactions para operaciones críticas
10. ✅ **Auditability:** Audit logs completos de accesos y operaciones

### Negativas

1. ❌ **Learning Curve:** Equipo debe aprender Go si viene de Java/Python
2. ❌ **Ecosystem:** Menos librerías que Java, requiere más código custom
3. ❌ **Error Handling:** Go error handling verbose comparado con exceptions
4. ❌ **JWT Revocation:** Difícil invalidar tokens antes de expiration
5. ❌ **Session Management:** Tabla de sesiones requiere cleanup periódico
6. ❌ **Dependency Management:** go.mod menos maduro que Maven/npm
7. ❌ **Debugging:** Menos tooling que ecosistemas más maduros

### Mitigaciones Implementadas

1. **JWT Security:**
   ```go
   // Rotación de secrets, expiration corta, secure claims
   func GenerateJWT(claims AuthClaims, secret string, ttl time.Duration) (string, error) {
       token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
           "document_id": claims.DocumentID,
           "session_id":  claims.SessionID,
           "iss":         "auth-service",
           "exp":         time.Now().Add(ttl).Unix(),
           "iat":         time.Now().Unix(),
           "nbf":         time.Now().Unix(),
       })
       return token.SignedString([]byte(secret))
   }
   ```

2. **Input Validation:**
   ```go
   // Validación robusta en request structs
   type RegistrationRequest struct {
       DocumentID string `json:"document_id" validate:"required,min=3,max=50"`
       Email      string `json:"email" validate:"required,email"`
       FullName   string `json:"full_name" validate:"required,min=2,max=255"`
       Address    string `json:"address" validate:"max=500"`
   }
   ```

3. **Error Handling Centralizado:**
   ```go
   // Custom error types + global handler
   type ErrorResponse struct {
       Success bool   `json:"success"`
       Error   string `json:"error"`
       Message string `json:"message"`
   }
   ```

4. **Database Connection Pooling:**
   ```go
   // pgx pool configuration para alta concurrencia
   config, _ := pgxpool.ParseConfig(databaseURL)
   config.MaxConns = 25
   config.MinConns = 5
   config.MaxConnLifetime = time.Hour
   ```

## Métricas de Éxito

Mediremos el éxito de esta decisión con:

1. **Performance:**
   - Target: P95 < 100ms para /auth/login
   - Target: P99 < 200ms para /auth/register
   - Target: >1000 RPS sostenido
   - Medición: Echo middleware metrics + Prometheus

2. **Security:**
   - Target: 0 vulnerabilidades críticas (OWASP Top 10)
   - Target: Password hashing cost factor ≥12
   - Target: JWT expiration ≤24h
   - Medición: Security audits, penetration testing

3. **Reliability:**
   - Target: 99.9% uptime (RNF-01)
   - Target: <5 segundos de startup time
   - Target: Auto-recovery de RabbitMQ connection failures
   - Medición: Health checks, error rates, SLA monitoring

4. **Event Processing:**
   - Target: <1s latency para publicar eventos
   - Target: 100% delivery rate a RabbitMQ
   - Target: Event ordering preservation
   - Medición: RabbitMQ metrics, message tracking

## Estado de Implementación

### Funcionalidades Implementadas ✅

1. **Registro de Usuarios con Identity Service:**
   - ✅ Validación de document_id único en base de datos local
   - ✅ Integración HTTP REST con ciudadano-registry-service
   - ✅ Mapping de datos para Identity Service API
   - ✅ Error handling para fallos de Identity Service
   - ✅ Hashing seguro de passwords con bcrypt (cost 12)
   - ✅ Generación de email verification JWT (24h TTL)
   - ✅ Publicación de evento `user.registration.email` vía RabbitMQ

2. **Verificación por Email:**
   - Endpoint `/auth/set-password` que valida verification JWT
   - Activación de cuenta + establecimiento de password
   - Generación de session JWT para auto-login
   - Publicación de evento `user.registration.complete`

3. **Autenticación Básica:**
   - Login con document_id + password
   - Verificación bcrypt + generación session JWT
   - Registro en audit_logs de intentos exitosos/fallidos

4. **Gestión de Sesiones:**
   - Tabla user_sessions con tracking de tokens activos
   - Cleanup automático de sesiones expiradas
   - Invalidación de sesiones específicas

5. **API REST:**
   - `POST /auth/register` - Registro inicial
   - `POST /auth/set-password` - Completar registro con JWT
   - `POST /auth/login` - Autenticación
   - `GET /health` - Health check con status de dependencias

6. **Seguridad Básica:**
   - Input validation con go-playground/validator
   - CORS middleware configurado
   - Rate limiting por IP (configurable)
   - Secure headers (HSTS, CSP, X-Frame-Options)

7. **Observabilidad:**
   - Structured logging con logrus
   - Health checks para PostgreSQL y RabbitMQ


### Funcionalidades FALTANTES ❌ (Requisitos No Implementados)

1. **Autenticación Multifactor (RNF-17 - No Negociable):**
   - ❌ Soporte para autenticación biométrica
   - ❌ Validación de certificados digitales
   - ❌ Flujo desafío/respuesta AMF
   - ❌ Claims JWT con estado de verificación AMF
   - ❌ Niveles de sesión (básico vs elevado)
   - ❌ Mecanismos de respaldo AMF (SMS/Email)

2. **Registro de Auditoría Inmutable (RNF-18 - Crítico):**
   - ❌ Encadenamiento hash tipo blockchain
   - ❌ Diseño de tabla de auditoría inmutable
   - ❌ Implementación de política de retención 5 años
   - ❌ Verificación de cadena de auditoría
   - ❌ Seguimiento completo de eventos de autenticación
   - ❌ Base de datos de auditoría separada

3. **Cumplimiento y Certificación (RNF-19 - No Negociable):**
   - ❌ Implementación de cumplimiento ISO 27001
   - ❌ Cumplimiento de Habeas Data
   - ❌ Configuración de pruebas de penetración
   - ❌ Rastro de auditoría de cumplimiento
   - ❌ Evaluación de impacto de protección de datos

4. **Usuarios Institucionales (RF-AU-02):**
   - ❌ Autenticación institucional
   - ❌ Claims JWT basados en roles (ciudadano, usuario_institucional)
   - ❌ Soporte institucional multi-inquilino

5. **Cifrado Avanzado (RNF-15, RNF-16):**
   - ❌ Cifrado AES-256 en reposo para contraseñas
   - ❌ Aplicación de TLS 1.3
   - ❌ Gestión de certificados
   - ❌ Políticas de rotación de claves

### Análisis de Brechas de Arquitectura

**Arquitectura Actual vs Requisitos:**

| Componente | Implementado | Requerido | Brecha | Servicio Responsable |
|------------|-------------|-----------|--------|---------------------|
| Autenticación | ✅ Básica | ❌ AMF Obligatoria | **CRÍTICO** | **Servicio Auth** |
| Gestión Sesiones JWT | ✅ Completo | ✅ Completo | **NINGUNA** | **Servicio Auth** |
| Registro Auditoría | ✅ Básico | ❌ Inmutable + Retención 5 años | **CRÍTICO** | **Servicio Auth** |
| Cumplimiento | ❌ Ninguno | ✅ ISO 27001 + Habeas Data | **NO NEGOCIABLE** | **Todos los Servicios** |
| Cifrado | ✅ TLS 1.2 | ❌ TLS 1.3 + AES-256 | **ALTO** | **Servicio Auth** |
| Usuarios Institucionales | ❌ Ninguno | ✅ Claims JWT Basados en Roles | **MEDIO** | **Servicio Auth** |

### Impacto de Implementación

**Esfuerzo Estimado para Cumplimiento del Servicio de Autenticación:**

1. **Implementación AMF:** 3-4 sprints
   - Integración API biométrica
   - Validación de certificados digitales
   - Claims JWT mejorados
   - Flujo desafío/respuesta AMF

2. **Auditoría Inmutable:** 2 sprints
   - Rediseño de base de datos para eventos de autenticación
   - Implementación de encadenamiento hash
   - Herramientas de verificación
   - Políticas de retención

3. **Cifrado Avanzado:** 1 sprint
   - Aplicación de TLS 1.3
   - AES-256 para almacenamiento de contraseñas
   - Gestión de certificados

4. **Marco de Cumplimiento:** 1-2 sprints
   - Análisis de brecha ISO 27001 para componentes de autenticación
   - Implementación de controles de seguridad
   - Preparación de auditoría de autenticación

**Esfuerzo Total Estimado para Servicio de Autenticación:** 7-9 sprints (3.5-4.5 meses)

**Removido del Alcance del Servicio de Autenticación:**
- ❌ **Autorización de Documentos (RNF-20)** → Movido al Servicio de Documentos
- ❌ **Gestión de Consentimientos** → Movido al Servicio de Documentos  
- ❌ **Permisos de Documentos** → Movido al Servicio de Documentos
- ❌ **Integración Directa MinTIC** → Manejado por Servicio de Identidad

**Orden de Prioridad de Implementación:**
1. **AMF (RNF-17)** - No Negociable
2. **Auditoría Inmutable (RNF-18)** - Crítico  
3. **Cifrado Avanzado (RNF-15, RNF-16)** - Alto
4. **Cumplimiento (RNF-19)** - No Negociable
## Dependencias Críticas del Servicio de Autenticación

```go
require (
    github.com/labstack/echo/v4 v4.13.4           // Framework HTTP
    github.com/golang-jwt/jwt/v5 v5.2.1           // Manejo de JWT
    github.com/jackc/pgx/v5 v5.7.2                // Driver PostgreSQL
    github.com/rabbitmq/amqp091-go v1.10.0        // Cliente RabbitMQ
    golang.org/x/crypto v0.28.0                   // Hash bcrypt
    github.com/go-playground/validator/v10 v10.22.1 // Validación de entrada
    github.com/golang-migrate/migrate/v4 v4.17.1   // Migraciones de base de datos
)
```

## Configuración de Producción del Servicio de Autenticación

```go
type Config struct {
    // Servidor
    ListenPort string `env:"LISTEN_PORT" envDefault:"8080"`
    
    // Base de Datos
    DatabaseURL string `env:"DATABASE_URL" envDefault:"postgres://auth_user:auth_pass@localhost:5432/auth_db?sslmode=disable"`
    
    // JWT
    JWTSecret              string        `env:"JWT_SECRET" envDefault:"development-secret-key"`
    JWTExpirationDuration  time.Duration `env:"JWT_EXPIRATION" envDefault:"24h"`
    
    // RabbitMQ
    RabbitMQURL      string `env:"RABBITMQ_URL" envDefault:"amqp://admin:microservices2024@localhost:5672/"`
    ExchangeName     string `env:"EXCHANGE_NAME" envDefault:"microservices.topic"`
    
    // Servicios Externos
    IdentityServiceURL string `env:"IDENTITY_SERVICE_URL" envDefault:"http://localhost:8082"`
    
    // Seguridad
    PasswordHashCost int `env:"PASSWORD_HASH_COST" envDefault:"12"`
}
```

## Infraestructura de Despliegue
- Docker Compose con PostgreSQL y pgAdmin
- Migraciones de base de datos automáticas en inicio
- Configuración basada en variables de entorno
- Hot reload en desarrollo con air


## Patrones de Diseño Implementados

1. **Patrón Repository:** Abstracción de acceso a datos con interfaces
2. **Inyección de Dependencias:** Inyección por constructor manual en main.go
3. **Patrón Factory:** Factory de servicio JWT con múltiples firmantes
4. **Patrón Publisher:** Publicación de eventos asíncrona a RabbitMQ
5. **Patrón Middleware:** Stack de middleware de Echo para concerns transversales
6. **Encapsulamiento de Errores:** Encapsulamiento de errores Go para preservación de contexto

## Integración con Otros Servicios

### 1. Servicio de Identidad (Mock)
- **Tipo:** Llamada HTTP síncrona
- **Endpoint:** `POST /validate-citizen`
- **Propósito:** Validar que document_id + full_name corresponden a ciudadano real
- **Timeout:** 5 segundos con reintentos

### 2. Servicio de Notificaciones
- **Tipo:** Mensajería asíncrona vía RabbitMQ
- **Exchange:** microservices.topic
- **Claves de Enrutamiento:** 
  - `user.registration.email` → Email de verificación
  - `user.registration.complete` → Email de bienvenida

## Seguridad Implementada

### 1. Validación de Entrada
```go
// Ejemplo de validación robusta
type RegistrationRequest struct {
    DocumentID string `json:"document_id" validate:"required,min=8,max=15,numeric"`
    Email      string `json:"email" validate:"required,email,max=255"`
    FullName   string `json:"full_name" validate:"required,min=2,max=255"`
}
```

### 2. Seguridad de Contraseñas
```go
// bcrypt con factor de costo alto
func HashPassword(password string) (string, error) {
    bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
    return string(bytes), err
}
```

### 3. Seguridad JWT
```go
// Claims seguros con validación temporal
type SessionClaims struct {
    DocumentID string `json:"document_id"`
    SessionID  string `json:"session_id"`
    jwt.RegisteredClaims
}
```

### 4. Prevención de Inyección SQL
```go
// Sentencias preparadas en todas las consultas
const queryInsertUser = `
    INSERT INTO users (document_id, full_name, email, password_hash, verification_token)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, created_at`
```

## Limitaciones Conocidas

1. **Revocación JWT:** No hay lista negra de tokens, invalidación solo por expiración
2. **Limitación de Tasa:** Implementado básico por IP, no por usuario
3. **Políticas de Contraseña:** Solo validación de longitud mínima, no complejidad
4. **Logs de Auditoría:** Sin política de retención automática
5. **Limpieza de Sesiones:** Limpieza manual, no job de fondo automático
6. **Detalles de Error:** Logs detallados no sanitizados para producción

## Trabajo Pendiente

1. **Pruebas:** Pruebas unitarias + pruebas de integración con testcontainers
2. **Lista Negra JWT:** Cache Redis para tokens revocados
3. **Trabajos de Fondo:** Limpieza automática de sesiones expiradas
4. **Métricas:** Métricas personalizadas para lógica de negocio (tasa de registro, tasa de éxito de login)
5. **Trazabilidad Distribuida:** OpenTelemetry para trazabilidad de solicitudes
6. **Verificaciones de Salud:** Verificaciones de salud de dependencias más granulares

## Migración a Producción

### Cambios Necesarios:

1. **Base de Datos:**
   - Servicio administrado PostgreSQL (AWS RDS/Aurora)
   - Agrupación de conexiones con pgbouncer
   - Réplicas de lectura para consultas de auditoría

2. **Seguridad:**
   - Gestión de secretos (AWS Secrets Manager/Vault)
   - Rotación automática de secreto JWT
   - WAF para protección de endpoints

3. **Observabilidad:**
   - Logging centralizado (ELK stack/CloudWatch)
   - Trazabilidad distribuida (Jaeger/X-Ray)
   - Gestor de alertas para monitoreo de SLA

4. **Infraestructura:**
   - Orquestación de contenedores (Kubernetes/ECS)
   - Balanceador de carga con terminación SSL
   - Auto-escalado basado en CPU/memoria

## Revisión Futura

Esta decisión debe revisarse si:

1. **Rendimiento degrada:** P95 > 500ms consistentemente
2. **Incidentes de seguridad:** Vulnerabilidades críticas encontradas
3. **Experticia del equipo:** Equipo prefiere cambio a Java/Python
4. **Brechas del ecosistema:** Librerías críticas no disponibles en Go

**Fecha de próxima revisión:** 2026-05-01

## Referencias

- **RFC 7519:** Especificación JSON Web Token (JWT)
- **OWASP Auth Cheat Sheet:** https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
- **Guías de Seguridad Go:** https://golang.org/doc/security.html
- **Framework Echo:** https://echo.labstack.com/
- **Documentación PostgreSQL:** https://www.postgresql.org/docs/
- **Documentación RabbitMQ:** https://www.rabbitmq.com/documentation.html

## Autores

- **Decisión Propuesta por:** Equipo de Desarrollo Servicio de Autenticación
- **Revisado por:** Arquitecto de Seguridad
- **Aprobado por:** Líder Técnico

---

**Versión:** 1.0  
**Última Actualización:** 2025-01-04  
**Estado:** Implementación completa - Funciones principales operativas, optimizaciones pendientes