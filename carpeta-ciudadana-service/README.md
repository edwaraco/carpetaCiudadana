# Microservicio Carpeta Ciudadana

Este microservicio implementa el **Core Domain "Carpeta Personal"** del sistema Carpeta Ciudadana, gestionando el repositorio virtual personal de cada ciudadano donde almacenan documentos certificados y no certificados.

## Funcionalidades Principales

- ✅ **Crear carpetas ciudadanas únicas**: Registro inicial con email inmutable
- ✅ **Almacenar documentos**: Subida de documentos (firmados o no) en MinIO con metadatos en DynamoDB
- ✅ **Ver mis documentos**: Consulta de documentos por carpeta
- ✅ **Integración con microservicio de firma digital**: Autenticar documentos mediante servicio externo que implementa FR-AF-01

## Arquitectura

### Tecnologías Utilizadas

- **Spring Boot 3.2.0** - Framework principal
- **DynamoDB Local** - Persistencia de metadatos
- **MinIO** - Almacenamiento de archivos (S3-compatible)
- **Spring Cloud OpenFeign** - Comunicación con microservicios
- **Docker Compose** - Orquestación de servicios

### Estructura por Capas

```
Controller (REST) -> Service (Lógica de Negocio) -> Repository (Persistencia) -> Entity (Modelo)
```

## Configuración y Ejecución

### Prerrequisitos

- Java 17+
- Docker y Docker Compose
- Maven 3.6+

### 1. Clonar y Compilar

```bash
cd carpeta-ciudadana-service
mvn clean package
```

### 2. Ejecutar con Docker Compose

```bash
docker-compose up --build
```

### 3. Verificar Servicios

- **Aplicación**: http://localhost:8080/api/v1
- **MinIO Console**: http://localhost:9001 (admin/admin123)
- **DynamoDB Admin**: http://localhost:8001

## API Endpoints

### Carpetas Ciudadanas

#### Crear Carpeta

```http
POST /api/v1/carpetas
Content-Type: application/json

{
  "cedula": "1234567890",
  "nombreCompleto": "Juan Pérez García",
  "operadorActual": "MiOperador"
}
```

#### Obtener Carpeta por ID

```http
GET /api/v1/carpetas/{carpetaId}
```

#### Obtener Carpeta por Cédula

```http
GET /api/v1/carpetas/cedula/{cedula}
```

### Documentos

#### Subir Documento

```http
POST /api/v1/carpetas/{carpetaId}/documentos
Content-Type: multipart/form-data

archivo: [archivo]
titulo: "Diploma Universitario"
tipoDocumento: "DIPLOMA"
contextoDocumento: "EDUCACION"
descripcion: "Diploma de Ingeniería de Sistemas"
```

#### Obtener Documentos de Carpeta

```http
GET /api/v1/carpetas/{carpetaId}/documentos
```

#### Obtener Documento Específico

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}
```

### Autenticación/Firma Digital

#### Autenticar Documento (FR-AF-01)

```http
POST /api/v1/firma-digital/{carpetaId}/documentos/{documentoId}/autenticar?funcionarioSolicitante=JuanPerez&entidadSolicitante=UniversidadEAFIT
```

#### Verificar Estado de Autenticación

```http
GET /api/v1/firma-digital/{carpetaId}/documentos/{documentoId}/estado
```

#### Obtener Certificado

```http
GET /api/v1/firma-digital/{carpetaId}/documentos/{documentoId}/certificado
```

## Integración con Microservicio de Autenticación

El microservicio se comunica con un servicio externo que implementa **FR-AF-01** usando la API de MinTIC `/apis/authenticateDocument`:

### Request al Microservicio de Autenticación

```json
{
  "idCitizen": "1234567890",
  "urlDocument": "https://bucket.s3.amazonaws.com/documento.pdf?AWSAccessKeyId=...",
  "documentTitle": "Diploma Grado",
  "funcionarioSolicitante": "Juan Pérez",
  "entidadSolicitante": "Universidad EAFIT",
  "motivoAutenticacion": "Autenticación de documento para validez legal"
}
```

### Códigos de Respuesta de MinTIC

- **200**: Autenticación exitosa
- **204**: Sin contenido - documento no válido para autenticación
- **501**: Parámetros incorrectos
- **500**: Error de aplicación

## Configuración

### Variables de Entorno

```yaml
# DynamoDB
AWS_DYNAMODB_ENDPOINT: http://localhost:8000
AWS_REGION: us-east-1
AWS_ACCESS_KEY_ID: dummy
AWS_SECRET_ACCESS_KEY: dummy

# MinIO
MINIO_ENDPOINT: http://localhost:9000
MINIO_ACCESS_KEY: admin
MINIO_SECRET_KEY: admin123
MINIO_BUCKET_NAME: carpeta-ciudadana-docs

# Microservicio de Autenticación/Firma Digital
DIGITAL_SIGNATURE_SERVICE_URL: http://localhost:8081
```

## Estructura del Proyecto

```
src/main/java/co/edu/eafit/carpeta/ciudadana/
├── CarpetaCiudadanaServiceApplication.java    # Clase principal
├── config/                                   # Configuraciones
│   ├── DynamoDbConfig.java
│   ├── MinioConfig.java
│   ├── DynamoDbInitializer.java
│   └── MinioInitializer.java
├── controller/                               # Controladores REST
│   ├── CarpetaCiudadanoController.java
│   └── FirmaDigitalController.java
├── service/                                 # Lógica de negocio
│   ├── CarpetaCiudadanoService.java
│   └── FirmaDigitalService.java
├── repository/                              # Acceso a datos
│   ├── CarpetaCiudadanoRepository.java
│   ├── DocumentoRepository.java
│   └── HistorialAccesoRepository.java
├── entity/                                  # Entidades de dominio
│   ├── CarpetaCiudadano.java
│   ├── Documento.java
│   └── HistorialAcceso.java
├── dto/                                     # Objetos de transferencia
│   ├── CarpetaRequest.java
│   ├── DocumentoRequest.java
│   ├── ResponseDTOs.java
│   ├── FirmaDigitalRequest.java
│   └── FirmaDigitalResponse.java
└── client/                                  # Clientes Feign
    ├── DigitalSignatureClient.java
    ├── DigitalSignatureClientConfig.java
    └── DigitalSignatureErrorDecoder.java
```

## Modelo de Datos

### CarpetaCiudadano

- `carpetaId`: UUID único de la carpeta
- `propietarioCedula`: Cédula del ciudadano propietario
- `propietarioNombre`: Nombre completo del propietario
- `emailCarpeta`: Email inmutable de la carpeta (@carpetacolombia.co)
- `estadoCarpeta`: ACTIVA, SUSPENDIDA, MIGRACION
- `operadorActual`: ID del operador actual
- `espacioUtilizadoBytes`: Espacio utilizado en bytes

### Documento

- `carpetaId`: ID de la carpeta propietaria (PK)
- `documentoId`: UUID único del documento (SK)
- `titulo`: Título del documento
- `tipoDocumento`: CEDULA, DIPLOMA, ACTA_GRADO, etc.
- `contextoDocumento`: EDUCACION, NOTARIA, REGISTRADURIA, etc.
- `formatoArchivo`: PDF, JPEG, PNG
- `tamanoBytes`: Tamaño en bytes
- `hashDocumento`: SHA-256 del contenido
- `urlAlmacenamiento`: URL en MinIO/S3
- `estadoDocumento`: TEMPORAL, CERTIFICADO, REVOCADO
- `firmadoPor`: Entidad que firmó el documento
- `firmaDigital`: Firma digital del documento
- `certificadoValidez`: Certificado de validez

### HistorialAcceso

- `carpetaId`: ID de la carpeta (PK)
- `accesoId`: UUID único del acceso (SK)
- `documentoId`: ID del documento accedido
- `tipoAcceso`: CONSULTA, DESCARGA, COMPARTIR, AUTENTICACION_EXITOSA, etc.
- `usuarioAcceso`: Usuario que realizó el acceso
- `fechaAcceso`: Fecha y hora del acceso
- `resultadoAcceso`: EXITOSO, FALLIDO, DENEGADO
- `motivoAcceso`: Motivo del acceso

## Monitoreo y Logs

- **Actuator**: http://localhost:8080/api/v1/actuator/health
- **Logs**: Configurados con nivel DEBUG para desarrollo
- **Métricas**: Disponibles en `/actuator/metrics`

## Desarrollo

### Ejecutar en Modo Desarrollo

```bash
mvn spring-boot:run
```

### Ejecutar Tests

```bash
mvn test
```

### Generar JAR

```bash
mvn clean package
java -jar target/carpeta-ciudadana-service-1.0.0.jar
```

## Próximas Funcionalidades

- [ ] Autenticación y autorización (JWT)
- [ ] Compartir documentos entre ciudadanos
- [ ] Transferencias P2P entre operadores
- [ ] Portabilidad de carpetas
- [ ] Notificaciones por email/SMS
- [ ] Servicios premium
- [ ] Analytics y reportes
