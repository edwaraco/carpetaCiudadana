# Servicio de Autenticación de Documentos

Servicio de autenticación de documentos para el sistema Carpeta Ciudadana. Este servicio valida la autenticidad de los documentos presentados por los usuarios mediante la integración con el servicio externo Gov Carpeta.

## Descripción

El servicio recibe solicitudes de autenticación de documentos a través de una API REST, procesa las solicitudes de forma asíncrona y publica los resultados en una cola de RabbitMQ para su procesamiento posterior.

### Flujo de Autenticación

```mermaid
sequenceDiagram
    participant CW as citizen-web
    participant DAS as document-authentication-service
    participant CCS as carpeta-ciudadana-service
    participant GC as Gov Carpeta API
    participant RMQ as RabbitMQ

    CW->>DAS: POST /api/v1/authenticateDocument<br/>{documentId, documentTitle}<br/>Bearer {jwt_token}
    DAS-->>CW: 202 Accepted
    
    Note over DAS: Procesamiento en Background
    
    DAS->>GC: HEAD /apis/ (Health Check)
    
    alt Gov Carpeta Disponible
        DAS->>CCS: GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}/descargar<br/>Bearer {jwt_token}
        CCS-->>DAS: Presigned URL
        
        DAS->>GC: PUT /apis/authenticateDocument<br/>{idCitizen, UrlDocument, documentTitle}
        GC-->>DAS: 200 OK / 204 / 500 / 501
        
        DAS->>RMQ: Publish DocumentoAutenticadoEvent<br/>status_code, mensaje
    else Gov Carpeta No Disponible
        DAS->>RMQ: Publish DocumentoAutenticadoEvent<br/>status_code: 500<br/>mensaje: "Gov Carpeta service unavailable"
    end
```

## Características

- ✅ **API REST con FastAPI**: Endpoint POST `/api/v1/authenticateDocument`
- ✅ **Autenticación JWT**: Protección con bearer token (misma configuración que carpeta-ciudadana-service)
- ✅ **Procesamiento Asíncrono**: Respuesta 202 Accepted inmediata, procesamiento en background
- ✅ **Circuit Breaker**: Patrón de resiliencia para servicios externos
- ✅ **Validación con Pydantic**: Modelos tipados para todas las requests/responses
- ✅ **Documentación OpenAPI/Swagger**: Documentación interactiva de la API
- ✅ **Publicación a RabbitMQ**: Envío de eventos de autenticación completados
- ✅ **Health Checks**: Verificación de disponibilidad de Gov Carpeta
- ✅ **Logging Estructurado**: Logs detallados de todas las operaciones
- ✅ **Dockerizado**: Imagen Docker lista para despliegue en Kubernetes

## Requisitos Previos

- Python 3.10+
- RabbitMQ (para publicación de eventos)
- Acceso a carpeta-ciudadana-service
- Acceso a Gov Carpeta API (https://govcarpeta-apis-4905ff3c005b.herokuapp.com)

## Instalación

### Desarrollo Local

1. Clonar el repositorio y navegar al directorio del servicio:

```bash
cd services/document-authentication-service
```

2. Crear y activar un entorno virtual:

```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. Instalar dependencias:

```bash
pip install -r requirements.txt
```

4. Configurar variables de entorno:

```bash
cp .env.example .env
# Editar .env con tus valores
```

5. Iniciar el servicio:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8083
```

### Con Docker

1. Construir la imagen:

```bash
docker build -t document-authentication-service:latest .
```

2. Ejecutar el contenedor:

```bash
docker run -p 8083:8083 --env-file .env document-authentication-service:latest
```

## Configuración

Todas las configuraciones se manejan a través de variables de entorno definidas en el archivo `.env`:

```bash
# Configuración del Servicio
SERVICE_PORT=8083
SERVICE_NAME=document-authentication-service
LOG_LEVEL=INFO

# RabbitMQ
RABBITMQ_URL=amqp://guest:guest@localhost:5672/
DOCUMENT_AUTHENTICATED_QUEUE=document_authenticated_response

# Servicios Externos
CARPETA_CIUDADANA_SERVICE_URL=http://localhost:8082
GOV_CARPETA_SERVICE_URL=https://govcarpeta-apis-4905ff3c005b.herokuapp.com

# JWT (misma configuración que carpeta-ciudadana-service)
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256

# Circuit Breaker
CIRCUIT_BREAKER_FAILURE_THRESHOLD=5
CIRCUIT_BREAKER_TIMEOUT_SECONDS=60
CIRCUIT_BREAKER_RECOVERY_TIMEOUT=30
```

**Nota**: El archivo `.env` NO está en `.gitignore` porque no contiene credenciales sensibles, solo configuración.

## API Endpoints

### POST /api/v1/authenticateDocument

Autenticar un documento con Gov Carpeta.

**Request:**
```json
{
  "documentId": "550e8400-e29b-41d4-a716-446655440000",
  "documentTitle": "Diploma Grado"
}
```

**Headers:**
```
Authorization: Bearer {jwt_token}
Content-Type: application/json
```

**Response (202 Accepted):**
```json
{
  "status": 202,
  "message": "Accepted"
}
```

### GET /api/v1/health

Verificar el estado del servicio.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "service": "document-authentication-service",
  "version": "1.0.0"
}
```

## Documentación Interactiva

Una vez iniciado el servicio, la documentación interactiva está disponible en:

- **Swagger UI**: http://localhost:8083/api/v1/swagger-ui.html
- **ReDoc**: http://localhost:8083/api/v1/redoc
- **OpenAPI JSON**: http://localhost:8083/api/v1/api-docs

## Eventos RabbitMQ

### DocumentoAutenticadoEvent

El servicio publica eventos a la cola `document_authenticated_response` con la siguiente estructura:

```json
{
  "documento_id": "550e8400-e29b-41d4-a716-446655440000",
  "carpeta_id": "folder-123-456",
  "status_code": "200",
  "mensaje": "El documento: Diploma Grado del ciudadano 1234567890 ha sido autenticado exitosamente",
  "fecha_autenticacion": "2024-11-07T10:30:45.123456"
}
```

**Códigos de Estado:**
- `200`: Documento autenticado exitosamente
- `204`: Sin contenido
- `500`: Error de aplicación (Gov Carpeta no disponible o error interno)
- `501`: Parámetros incorrectos

## Ejemplos de Uso

El directorio `events/` contiene tres ejemplos de uso:

1. **example_1_diploma.py**: Autenticación de diploma universitario
2. **example_2_birth_certificate.py**: Autenticación de registro civil
3. **example_3_professional_license.py**: Autenticación de tarjeta profesional

Ejecutar un ejemplo:

```bash
cd events
python example_1_diploma.py
```

**Nota**: Debes reemplazar el JWT token de ejemplo con un token real obtenido del auth-service.

## Pruebas

### Ejecutar Todas las Pruebas

```bash
python -m pytest tests/ -v
```

### Ejecutar con Cobertura

```bash
python -m pytest tests/ --cov=app --cov-report=html
```

### Pruebas Unitarias Incluidas

- `test_config.py`: Validación de configuración
- `test_models.py`: Validación de modelos Pydantic
- `test_circuit_breaker.py`: Funcionalidad del circuit breaker
- `test_auth.py`: Validación y decodificación de JWT

## Desarrollo

### Depuración con VS Code

El proyecto incluye configuración de lanzamiento en `.vscode/launch.json`:

1. **Python: FastAPI (Uvicorn)**: Iniciar servicio con recarga automática
2. **Python: Current File**: Ejecutar archivo actual
3. **Python: Run Tests**: Ejecutar suite de pruebas

### Formateo de Código

El proyecto usa Black para formateo de código:

```bash
black .
```

### Estructura del Proyecto

```
document-authentication-service/
├── app/
│   ├── api/
│   │   └── routes.py          # Endpoints de la API
│   ├── models/
│   │   ├── __init__.py        # Modelos Pydantic
│   │   └── enums.py           # Enumeraciones
│   ├── services/
│   │   ├── authentication_service.py  # Lógica de negocio
│   │   ├── external_services.py       # Clientes HTTP externos
│   │   └── rabbitmq_client.py         # Cliente RabbitMQ
│   ├── utils/
│   │   ├── auth.py            # Utilidades JWT
│   │   └── circuit_breaker.py # Implementación circuit breaker
│   └── config.py              # Configuración
├── tests/
│   ├── test_auth.py
│   ├── test_circuit_breaker.py
│   ├── test_config.py
│   └── test_models.py
├── events/
│   ├── example_1_diploma.py
│   ├── example_2_birth_certificate.py
│   └── example_3_professional_license.py
├── .vscode/
│   └── launch.json            # Configuración VS Code
├── .env.example               # Plantilla de configuración
├── .env                       # Configuración local
├── Dockerfile                 # Imagen Docker
├── requirements.txt           # Dependencias Python
├── main.py                    # Punto de entrada
└── README.md                  # Este archivo
```

## Patrones de Diseño Implementados

- **Circuit Breaker**: Resiliencia ante fallos de servicios externos
- **Background Tasks**: Procesamiento asíncrono con FastAPI
- **Repository Pattern**: Separación de lógica de negocio y acceso a datos
- **Dependency Injection**: Inyección de dependencias con FastAPI
- **Type Safety**: Validación estricta con Pydantic y type hints

## Limitaciones Conocidas

- No persiste historial de autenticaciones (solo publica a RabbitMQ)
- No implementa reintentos automáticos para fallos de RabbitMQ
- Circuit breaker se resetea al reiniciar el servicio
- Requiere que carpeta-ciudadana-service esté disponible

## Referencias

- **Gov Carpeta API**: https://govcarpeta-apis-4905ff3c005b.herokuapp.com/api-docs/
- **FastAPI**: https://fastapi.tiangolo.com/
- **Pydantic**: https://docs.pydantic.dev/
- **RabbitMQ**: https://www.rabbitmq.com/

## Licencia

Este proyecto es parte del sistema Carpeta Ciudadana para la Universidad EAFIT.

## Autor

Desarrollado como parte del curso de Arquitectura Avanzada, Universidad EAFIT, 2024.
