# Auth Service

Microservicio para la gestión de autenticación y autorización en el sistema de Carpeta Ciudadana.

## Descripción

Este microservicio implementa el **Bounded Context: Autenticación y Autorización** con los **Aggregate Roots: Usuario y SesionUsuario**. Su propósito es proteger el acceso a carpetas y documentos mediante un mecanismo sólido de autenticación JWT, implementando sistemas de autorización para garantizar que solo personas autorizadas accedan a los documentos ciudadanos.

## Funcionalidades Principales

### FR-AU-01: Registro de Usuario

- ✅ Validación de datos de entrada (documento, nombre completo, dirección, email, contraseña)
- ✅ Integración con ciudadano-registry-service para registro de identidad
- ✅ Encriptación segura de contraseñas con bcrypt
- ✅ Creación de perfil de usuario con información personal
- ✅ Envío de notificación de bienvenida vía RabbitMQ

### FR-AU-02: Autenticación de Usuario

- ✅ Login con email/contraseña
- ✅ Generación de tokens JWT con expiración configurable
- ✅ Middleware de validación JWT para rutas protegidas
- ✅ Invalidación automática de sesiones por inactividad
- ✅ Registro de intentos de autenticación exitosos y fallidos

### FR-AU-03: Gestión de Perfil

- ✅ Consulta de información del usuario autenticado
- ✅ Actualización de datos personales
- ✅ Cambio de contraseña con validaciones de seguridad
- ✅ Historial de cambios para auditoría

### FR-AU-04: Control de Acceso y Autorización

- ✅ Sistema de permisos basado en JWT claims
- ✅ Validación de propietario por recursos
- ✅ Middleware de autorización para APIs
- ✅ Auditoría completa de accesos y operaciones

## Tecnologías Utilizadas

- **Go 1.23**
- **Echo Framework** (para APIs REST)
- **PostgreSQL** (base de datos principal)
- **JWT** (autenticación y autorización)
- **bcrypt** (encriptación de contraseñas)
- **RabbitMQ** (eventos y notificaciones)
- **Docker** (containerización)
- **OpenAPI 3** (documentación de API)

## Estructura del Proyecto

```
auth-service/
├── main.go
├── config/
│   └── config.go
├── internal/
│   ├── database/
│   │   └── database.go
│   ├── handlers/
│   │   └── handlers.go
│   ├── jwt/
│   │   └── jwt.go
│   ├── models/
│   │   └── models.go
│   └── rabbitmq/
│       └── publisher.go
├── api/
│   └── openapi.yaml
├── database/
│   └── init.sql
├── rabbitmq/
│   ├── definitions.json
│   └── rabbitmq.conf
├── docker-compose.yml
└── Dockerfile
```

## API Endpoints

### Registro de Usuario

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "cedula": 1234567890,
  "nombre_completo": "Juan Pérez",
  "direccion": "Calle 123 #45-67",
  "email": "juan.perez@email.com"
}
```

### Autenticación

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "juan.perez@email.com",
  "password": "contraseña_segura"
}
```

**Respuesta**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123",
    "email": "juan.perez@email.com",
    "nombre_completo": "Juan Pérez",
    "cedula": 1234567890
  },
  "expires_at": "2024-11-05T10:00:00Z"
}
```

### Perfil de Usuario

```http
GET /api/v1/auth/profile
Authorization: Bearer {jwt_token}
```

### Actualizar Perfil

```http
PUT /api/v1/auth/profile
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "nombre_completo": "Juan Carlos Pérez",
  "direccion": "Nueva dirección"
}
```

### Cambiar Contraseña

```http
PUT /api/v1/auth/change-password
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "current_password": "contraseña_actual",
  "new_password": "nueva_contraseña_segura"
}
```

### Test de Integración

```http
POST /api/v1/auth/test-identity
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "cedula": 1234567890,
  "nombre_completo": "Test User",
  "direccion": "Test Address"
}
```

### Health Check

```http
GET /health
```

## Eventos RabbitMQ

### Eventos Publicados

#### user.registration.email

- **Exchange**: `microservices.topic`
- **Routing Key**: `user.registration.email`
- **Propósito**: Solicitar envío de email de verificación con JWT token

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
- **Propósito**: Notificar que el usuario completó el registro (email verificado)

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

- `JWT_SECRET`: Clave secreta para firmar tokens JWT (requerida)
- `AUTH_DB_NAME`: Nombre de la base de datos PostgreSQL
- `AUTH_DB_USER`: Usuario de la base de datos
- `AUTH_DB_PASSWORD`: Contraseña de la base de datos
- `AUTH_DB_HOST`: Host de la base de datos (default: localhost)
- `AUTH_DB_PORT`: Puerto de la base de datos (default: 5433)
- `AUTH_SERVICE_PORT`: Puerto del servicio (default: 8081)
- `RABBITMQ_URL`: URL de conexión a RabbitMQ
- `IDENTITY_SERVICE_URL`: URL del ciudadano-registry-service
- `ENVIRONMENT`: Entorno de ejecución (development/production)

## Integraciones de Servicios

### Ciudadano Registry Service

El auth-service integra con el **ciudadano-registry-service** durante el proceso de registro para:

1. **Validar disponibilidad del ciudadano**
2. **Registrar identidad ciudadana**
3. **Crear carpeta ciudadana asociada**

#### Validación de Ciudadano

**Endpoint**: `GET /api/v1/ciudadanos/validar/{cedula}`

Verifica si un ciudadano está disponible para registro en el sistema.

**Respuestas**:
- `200 OK`: Ciudadano disponible para registro
- `204 No Content`: Ciudadano ya registrado

**Estructura de Respuesta**:
```json
{
  "success": true,
  "message": "Ciudadano disponible para registro",
  "data": {
    "cedula": 1234567890,
    "disponible": true,
    "mensaje": "Ciudadano disponible para registro",
    "codigoRespuesta": 200
  },
  "timestamp": "2025-11-07T10:30:00"
}
```

#### Registro de Ciudadano

**Endpoint**: `POST /api/v1/ciudadanos/registrar`

Registra un nuevo ciudadano en el sistema y crea su carpeta ciudadana.

**Estructura de Request**:
```json
{
  "cedula": 1234567890,
  "nombreCompleto": "Juan Pérez García",
  "direccion": "Calle 123 #45-67"
}
```

**Estructura de Respuesta** (`201 Created`):
```json
{
  "success": true,
  "message": "Ciudadano registrado exitosamente",
  "data": {
    "id": "1234567890",
    "cedula": 1234567890,
    "nombreCompleto": "Juan Pérez García",
    "direccion": "Calle 123 #45-67",
    "email": "juan.perez.garcia.1234567890@carpetacolombia.co",
    "carpetaId": "550e8400-e29b-41d4-a716-446655440000",
    "estado": "REGISTRADO",
    "fechaRegistroGovCarpeta": "2025-11-07T10:30:00",
    "fechaCreacion": "2025-11-07T10:30:00",
    "activo": true
  },
  "timestamp": "2025-11-07T10:30:00"
}
```

#### Configuración de Integración

**Variables de Entorno**:
- `IDENTITY_SERVICE_URL`: URL base del ciudadano-registry-service (ej: `http://ciudadano-registry-service:8080`)

**En Docker/Kubernetes**: Usar el nombre del servicio (`ciudadano-registry-service`)
**En desarrollo local**: Usar localhost con el puerto correspondiente

### Configuración de Base de Datos

El servicio utiliza PostgreSQL con las siguientes tablas:

- **users**: Información de usuarios registrados
- **audit_logs**: Registros de auditoría de todas las operaciones

**Script de inicialización**: `database/init.sql`

### Configuración JWT

- **Algoritmo**: HS256
- **Expiración**: 24 horas (configurable)
- **Claims incluidos**: user_id, email, cedula, exp, iat

### Configuración RabbitMQ

El auth-service **NO ejecuta su propio RabbitMQ**, sino que se conecta a uno externo. Los archivos en `rabbitmq/` contienen las definiciones de configuración que deben aplicarse al RabbitMQ externo.

#### Archivos de Configuración RabbitMQ

**`rabbitmq/definitions.json`** - Define:
- **Exchange**: `microservices.topic` (tipo: topic)
- **Queues**: 
  - `notifications.email.queue` (para emails)
  - `identity.registration.queue` (para registros)
- **Bindings**:
  - `user.registration.email` → `notifications.email.queue` (verificación email)
  - `user.registration.complete` → `notifications.email.queue` (bienvenida)
  - `user.password_reset` → `notifications.email.queue` (reset password)

**`rabbitmq/rabbitmq.conf`** - Configuración del servidor RabbitMQ

#### Conexión a RabbitMQ Externo

Para conectarse al RabbitMQ del servicio de notificaciones:

```bash
# En tu .env
RABBITMQ_URL=amqp://admin:microservices2024@localhost:5673/
```

#### Verificar Configuración RabbitMQ

Una vez que tengas RabbitMQ ejecutándose (desde notificaciones service):

1. **Management UI**: http://localhost:15673
2. **Credenciales**: admin / microservices2024
3. **Verificar Exchange**: Debe existir `microservices.topic`
4. **Verificar Queue**: Debe existir `notifications.email.queue`

#### Publicar Eventos

El auth-service publica dos tipos de eventos durante el registro:

**1. Verificación de Email** (inmediatamente después del registro):
```json
{
  "event_id": "uuid-here",
  "event_type": "user.registration.email",
  "user_document_id": "1234567890",
  "user_data": { /* perfil completo */ },
  "token": "jwt-verification-token",
  "verification_url": "http://localhost:3000/verify-email?token=...",
  "expires_at": "2024-11-05T10:00:00Z"
}
```

**2. Registro Completado** (después de verificar email):
```json
{
  "event_id": "uuid-here", 
  "event_type": "user.registration.complete",
  "user_document_id": "1234567890",
  "user_data": { /* perfil completo */ }
}
```

**Routing Keys**: 
- `user.registration.email` → `notifications.email.queue` (verificación)
- `user.registration.complete` → `notifications.email.queue` (bienvenida)

## Ejecución

### Desarrollo Local

1. **Requisitos**:
   - Go 1.23+
   - PostgreSQL 15+ (incluido en docker-compose)
   - **RabbitMQ externo**

2. **Configuración**:
   ```bash
   cp .env.example .env
   # Editar .env con tu RABBITMQ_URL apuntando a RabbitMQ externo
   ```

3. **Orden de Despliegue**:
   ```bash
   # 1. Primero levantar RabbitMQ (desde notificaciones service)
   cd ../notificaciones
   docker-compose --profile standalone up -d
   
   # 2. Luego levantar auth-service (conecta al RabbitMQ del paso 1)
   cd ../auth-service
   docker-compose up -d
   ```

4. **Acceso**:
   - API: http://localhost:8081
   - Health: http://localhost:8081/health
   - Swagger UI: http://localhost:8083
   - PostgreSQL: localhost:5432
   - RabbitMQ Management: http://localhost:15673 (desde notificaciones service)

### Docker

1. **Construcción**:
   ```bash
   docker build -t auth-service:latest .
   ```

2. **Ejecución con Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## Troubleshooting RabbitMQ

### Problema: Auth-service no puede conectarse a RabbitMQ

1. **Verificar que RabbitMQ esté ejecutándose**:
   ```bash
   # Debe mostrar notifications-rabbitmq en puerto 5673
   docker ps | grep rabbitmq
   ```

2. **Verificar conectividad**:
   ```bash
   # Debe responder con conexión exitosa
   telnet localhost 5673
   ```

3. **Verificar URL en .env**:
   ```bash
   # Debe apuntar al puerto correcto (5673, no 5672)
   cat .env | grep RABBITMQ_URL
   # Debe ser: amqp://admin:microservices2024@localhost:5673/
   ```

4. **Verificar logs del auth-service**:
   ```bash
   docker logs auth-service
   # Buscar errores de conexión RabbitMQ
   ```

5. **Verificar Management UI**:
   - URL: http://localhost:15673
   - Usuario: admin
   - Password: microservices2024
   - Verificar que existe exchange `microservices.topic`

### Problema: Eventos no llegan a notificaciones

1. **Verificar queue binding**:
   - IR a http://localhost:15673/#/queues
   - Buscar `notifications.email.queue`
   - Verificar binding con routing key `user.registered`

2. **Verificar publicación manual**:
   ```bash
   # Publicar mensaje de prueba via Management UI
   # Exchange: microservices.topic
   # Routing key: user.registered
   # Payload: {"user_id":"test","email":"test@email.com"}
   ```

## Testing

### Test de Registro

```bash
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "cedula": 1234567890,
    "nombre_completo": "Test User",
    "direccion": "Test Address",
    "email": "test@email.com",
    "password": "test_password_123"
  }'
```

### Test de Login

```bash
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@email.com",
    "password": "test_password_123"
  }'
```

### Test de Perfil

```bash
curl -X GET http://localhost:8081/api/v1/auth/profile \
  -H "Authorization: Bearer {jwt_token}"
```

## Monitoreo y Logs

- **Logs del Servicio**: `docker logs auth-service`
- **Health Check**: Endpoint `/health` para verificar estado
- **Base de Datos**: Logs de PostgreSQL para queries y errores
- **RabbitMQ Management**: Interface web para monitorear mensajes
- **Auditoría**: Tabla `audit_logs` con registro completo de operaciones

## Integración con Otros Servicios

Este microservicio se integra con:

- **Ciudadano Registry Service**: Para validación y registro de identidad ciudadana
- **Notificaciones Service**: Envía eventos de registro via RabbitMQ
- **PostgreSQL**: Para persistencia de datos de usuario y auditoría
- **RabbitMQ**: Para comunicación asíncrona entre servicios

## Consideraciones de Seguridad

- **Encriptación**: Contraseñas hasheadas con bcrypt (cost factor 12)
- **JWT**: Tokens firmados con HS256 y expiración automática
- **Validación**: Sanitización de entrada y validación de datos
- **Auditoría**: Registro completo de todas las operaciones de seguridad
- **Rate Limiting**: Protección contra ataques de fuerza bruta (recomendado)
- **HTTPS**: Uso obligatorio en producción
- **Secrets**: Variables sensibles manejadas como variables de entorno

## Base de Datos

### Esquema Principal

#### Tabla `users`
- `id`: UUID único del usuario
- `cedula`: Número de identificación ciudadana
- `nombre_completo`: Nombre completo del usuario
- `direccion`: Dirección de residencia
- `email`: Email único del usuario
- `password_hash`: Hash bcrypt de la contraseña
- `created_at`: Timestamp de creación
- `updated_at`: Timestamp de última actualización

#### Tabla `audit_logs`
- `id`: UUID único del log
- `user_id`: UUID del usuario (FK)
- `action`: Tipo de acción realizada
- `details`: Detalles adicionales en formato JSON
- `ip_address`: Dirección IP del cliente
- `user_agent`: User agent del cliente
- `created_at`: Timestamp del evento