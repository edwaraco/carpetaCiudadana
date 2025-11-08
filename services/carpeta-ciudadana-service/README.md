# Microservicio Carpeta Ciudadana

Este microservicio implementa el **Core Domain "Carpeta Personal"** del sistema Carpeta Ciudadana, gestionando el repositorio virtual personal de cada ciudadano donde almacenan documentos certificados y no certificados.

## Funcionalidades Principales

- ✅ **Crear carpetas ciudadanas únicas**: Registro inicial con email inmutable
- ✅ **Almacenar documentos**: Subida de documentos (firmados o no) en MinIO con metadatos en DynamoDB
- ✅ **Ver mis documentos**: Consulta de documentos por carpeta
- ✅ **Generar URLs de descarga seguras**: URLs prefirmadas temporales para descarga de documentos

## Arquitectura

### Tecnologías Utilizadas

- **Spring Boot 3.2.12** - Framework principal
- **Java 21** - Lenguaje de programación
- **DynamoDB Local** - Persistencia de metadatos
- **MinIO** - Almacenamiento de archivos (S3-compatible)
- **Spring Cloud OpenFeign** - Comunicación con microservicios
- **MapStruct** - Mapeo de objetos
- **SpringDoc OpenAPI** - Documentación de API
- **Resilience4j** - Circuit Breaker y Retry
- **Docker Compose** - Orquestación de servicios

### Estructura por Capas

```
Controller (REST) -> Service (Lógica de Negocio) -> Repository (Persistencia) -> Entity (Modelo)
```

## Configuración y Ejecución

### Prerrequisitos

- Java 21+
- Docker y Docker Compose
- Maven 3.6+

### 1. Clonar y Compilar

```bash
cd carpeta-ciudadana-service
mvn clean package
```

### 2. Ejecutar con Docker Compose

```bash
# Solo servicios de infraestructura (MinIO, DynamoDB)
docker-compose up

# Para ejecutar la aplicación completa (comentado en docker-compose.yml)
# docker-compose up --build
```

**Nota**: El servicio de aplicación está comentado en `docker-compose.yml`. Para ejecutarlo, descomenta las líneas correspondientes y actualiza el Dockerfile para usar Java 21.

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
```

#### Obtener Documentos de Carpeta

```http
GET /api/v1/carpetas/{carpetaId}/documentos
```

#### Obtener Documento Específico

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}
```

#### Generar URL de Descarga

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}/descargar
```

## Documentación de API

La API está documentada usando **SpringDoc OpenAPI** y está disponible en:

- **Swagger UI**: http://localhost:8080/api/v1/swagger-ui.html
- **API Docs**: http://localhost:8080/api/v1/api-docs

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

# Configuración adicional
MINIO_PRESIGNED_URL_EXPIRY: 15
```

## Estructura del Proyecto

```
src/main/java/co/edu/eafit/carpeta/ciudadana/
├── CarpetaCiudadanaServiceApplication.java    # Clase principal
├── config/                                   # Configuraciones
│   ├── DynamoDbConfig.java
│   ├── MinioConfig.java
│   ├── DynamoDbInitializer.java
│   ├── MinioInitializer.java
│   └── OpenApiConfig.java
├── controller/                               # Controladores REST
│   └── CarpetaCiudadanoController.java
├── service/                                 # Lógica de negocio
│   ├── CarpetaCiudadanoService.java
│   ├── MinioStorageService.java
│   └── impl/
│       └── CarpetaCiudadanoServiceImpl.java
├── repository/                              # Acceso a datos
│   ├── CarpetaCiudadanoRepository.java
│   ├── DocumentoRepository.java
│   ├── HistorialAccesoRepository.java
│   └── impl/
│       ├── CarpetaCiudadanoRepositoryImpl.java
│       ├── DocumentoRepositoryImpl.java
│       └── HistorialAccesoRepositoryImpl.java
├── entity/                                  # Entidades de dominio
│   ├── CarpetaCiudadano.java
│   ├── Documento.java
│   └── HistorialAcceso.java
├── dto/                                     # Objetos de transferencia
│   ├── request/
│   │   ├── BuscarCarpetaRequest.java
│   │   ├── CrearCarpetaRequest.java
│   │   ├── ObtenerDocumentoRequest.java
│   │   ├── ObtenerDocumentosCarpetaRequest.java
│   │   ├── SubirDocumentoConArchivoRequest.java
│   │   └── SubirDocumentoRequest.java
│   └── response/
│       ├── ApiResponse.java
│       ├── CarpetaResponse.java
│       ├── CrearCarpetaResponse.java
│       ├── DocumentoResponse.java
│       ├── DocumentoUrlResponse.java
│       ├── HistorialAccesoResponse.java
│       ├── ListaDocumentosResponse.java
│       ├── SubirDocumentoResponse.java
│       └── UrlDescargaResponse.java
├── mapper/                                   # Mappers con MapStruct
│   ├── carpeta/
│   │   └── CarpetaMapper.java
│   ├── document/
│   │   ├── CrearDocumentoMapper.java
│   │   ├── DocumentoResponseMapper.java
│   │   └── SubirDocumentoMapper.java
│   └── historial/
│       └── HistorialAccesoMapper.java
├── exception/                               # Manejo de excepciones
│   ├── CarpetaAlreadyExistsException.java
│   ├── DocumentUploadException.java
│   ├── GlobalExceptionHandler.java
│   ├── InvalidRequestException.java
│   ├── ResourceNotFoundException.java
│   └── StorageException.java
└── util/                                    # Utilidades
    └── ResponseUtil.java
```

## Modelo de Datos

### CarpetaCiudadano

- `carpetaId`: UUID único de la carpeta (PK)
- `propietarioCedula`: Cédula del ciudadano propietario
- `propietarioNombre`: Nombre completo del propietario
- `emailCarpeta`: Email inmutable de la carpeta (@carpetacolombia.co)
- `estadoCarpeta`: ACTIVA, SUSPENDIDA, EN_TRANSFERENCIA
- `operadorActual`: ID del operador actual (para portabilidad)
- `espacioUtilizadoBytes`: Espacio utilizado en bytes
- `fechaCreacion`: Fecha de creación de la carpeta
- `fechaUltimaModificacion`: Fecha de última modificación

### Documento

- `carpetaId`: ID de la carpeta propietaria (PK)
- `documentoId`: UUID único del documento (SK)
- `titulo`: Título del documento
- `tipoDocumento`: CEDULA, DIPLOMA, ACTA_GRADO, PROCESADO_LABORAL, PROCESADO_MEDICO
- `contextoDocumento`: EDUCACION, NOTARIA, REGISTRADURIA, SALUD, LABORAL
- `descripcion`: Descripción opcional del documento
- `formatoArchivo`: PDF, JPEG, PNG, etc.
- `tamanoBytes`: Tamaño en bytes
- `hashDocumento`: SHA-256 del contenido
- `urlAlmacenamiento`: URL en MinIO/S3
- `estadoDocumento`: TEMPORAL, PROCESADO, CERTIFICADO, REVOCADO
- `esDescargable`: Indica si el documento es descargable
- `fechaRecepcion`: Fecha de recepción del documento
- `fechaUltimaModificacion`: Fecha de última modificación

### HistorialAcceso

- `carpetaId`: ID de la carpeta (PK)
- `accesoId`: UUID único del acceso (SK)
- `documentoId`: ID del documento accedido
- `tipoAcceso`: CONSULTA, DESCARGA, COMPARTIR, AUTENTICACION_EXITOSA, etc.
- `usuarioAcceso`: Usuario que realizó el acceso
- `fechaAcceso`: Fecha y hora del acceso
- `resultadoAcceso`: EXITOSO, FALLIDO, DENEGADO
- `motivoAcceso`: Motivo del acceso

### Configuración de Archivos

- **Tamaño máximo de archivo**: 50MB
- **Tamaño máximo de request**: 50MB
- **URLs prefirmadas**: Válidas por 15 minutos
- **Logging**: Nivel DEBUG para desarrollo

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

## Linter y Formateo de Código

Este proyecto utiliza **Spotless** para formateo automático y **Checkstyle** para linting.

### Comandos Disponibles

#### Verificar formato del código
```bash
mvn spotless:check
```

#### Formatear código automáticamente
```bash
mvn spotless:apply
```

#### Verificar reglas de Checkstyle
```bash
mvn checkstyle:check
```

#### Formatear y verificar todo
```bash
mvn spotless:apply && mvn checkstyle:check
```

### Configuración

- **Spotless**: Usa Google Java Format con estilo GOOGLE
- **Checkstyle**: Configuración personalizada en `checkstyle.xml`
- **EditorConfig**: Configuración de IDE en `.editorconfig`

### Integración en el Build

- Spotless se ejecuta automáticamente en la fase `compile`
- Checkstyle se ejecuta automáticamente en la fase `validate`
- El build fallará si hay problemas de formato o linting

# Microservicio Carpeta Ciudadana

Este microservicio implementa el **Core Domain "Carpeta Personal"** del sistema Carpeta Ciudadana, gestionando el repositorio virtual personal de cada ciudadano donde almacenan documentos certificados y no certificados.

## Funcionalidades Principales

- ✅ **Crear carpetas ciudadanas únicas**: Registro inicial con email inmutable
- ✅ **Almacenar documentos**: Subida de documentos (firmados o no) en MinIO con metadatos en DynamoDB
- ✅ **Ver mis documentos**: Consulta de documentos por carpeta
- ✅ **Generar URLs de descarga seguras**: URLs prefirmadas temporales para descarga de documentos

## Arquitectura

### Tecnologías Utilizadas

- **Spring Boot 3.2.12** - Framework principal
- **Java 21** - Lenguaje de programación
- **DynamoDB Local** - Persistencia de metadatos
- **MinIO** - Almacenamiento de archivos (S3-compatible)
- **Spring Cloud OpenFeign** - Comunicación con microservicios
- **MapStruct** - Mapeo de objetos
- **SpringDoc OpenAPI** - Documentación de API
- **Resilience4j** - Circuit Breaker y Retry
- **Docker Compose** - Orquestación de servicios

### Estructura por Capas

```
Controller (REST) -> Service (Lógica de Negocio) -> Repository (Persistencia) -> Entity (Modelo)
```

## Configuración y Ejecución

### Prerrequisitos

- Java 21+
- Docker y Docker Compose
- Maven 3.6+

### 1. Clonar y Compilar

```bash
cd carpeta-ciudadana-service
mvn clean package
```

### 2. Ejecutar con Docker Compose

```bash
# Solo servicios de infraestructura (MinIO, DynamoDB)
docker-compose up

# Para ejecutar la aplicación completa (comentado en docker-compose.yml)
# docker-compose up --build
```

**Nota**: El servicio de aplicación está comentado en `docker-compose.yml`. Para ejecutarlo, descomenta las líneas correspondientes y actualiza el Dockerfile para usar Java 21.

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
```

#### Obtener Documentos de Carpeta

```http
GET /api/v1/carpetas/{carpetaId}/documentos
```

#### Obtener Documento Específico

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}
```

#### Generar URL de Descarga

```http
GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}/descargar
```

## Documentación de API

La API está documentada usando **SpringDoc OpenAPI** y está disponible en:

- **Swagger UI**: http://localhost:8080/api/v1/swagger-ui.html
- **API Docs**: http://localhost:8080/api/v1/api-docs

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

# Configuración adicional
MINIO_PRESIGNED_URL_EXPIRY: 15
```

## Estructura del Proyecto

```
src/main/java/co/edu/eafit/carpeta/ciudadana/
├── CarpetaCiudadanaServiceApplication.java    # Clase principal
├── config/                                   # Configuraciones
│   ├── DynamoDbConfig.java
│   ├── MinioConfig.java
│   ├── DynamoDbInitializer.java
│   ├── MinioInitializer.java
│   └── OpenApiConfig.java
├── controller/                               # Controladores REST
│   └── CarpetaCiudadanoController.java
├── service/                                 # Lógica de negocio
│   ├── CarpetaCiudadanoService.java
│   ├── MinioStorageService.java
│   └── impl/
│       └── CarpetaCiudadanoServiceImpl.java
├── repository/                              # Acceso a datos
│   ├── CarpetaCiudadanoRepository.java
│   ├── DocumentoRepository.java
│   ├── HistorialAccesoRepository.java
│   └── impl/
│       ├── CarpetaCiudadanoRepositoryImpl.java
│       ├── DocumentoRepositoryImpl.java
│       └── HistorialAccesoRepositoryImpl.java
├── entity/                                  # Entidades de dominio
│   ├── CarpetaCiudadano.java
│   ├── Documento.java
│   └── HistorialAcceso.java
├── dto/                                     # Objetos de transferencia
│   ├── request/
│   │   ├── BuscarCarpetaRequest.java
│   │   ├── CrearCarpetaRequest.java
│   │   ├── ObtenerDocumentoRequest.java
│   │   ├── ObtenerDocumentosCarpetaRequest.java
│   │   ├── SubirDocumentoConArchivoRequest.java
│   │   └── SubirDocumentoRequest.java
│   └── response/
│       ├── ApiResponse.java
│       ├── CarpetaResponse.java
│       ├── CrearCarpetaResponse.java
│       ├── DocumentoResponse.java
│       ├── DocumentoUrlResponse.java
│       ├── HistorialAccesoResponse.java
│       ├── ListaDocumentosResponse.java
│       ├── SubirDocumentoResponse.java
│       └── UrlDescargaResponse.java
├── mapper/                                   # Mappers con MapStruct
│   ├── carpeta/
│   │   └── CarpetaMapper.java
│   ├── document/
│   │   ├── CrearDocumentoMapper.java
│   │   ├── DocumentoResponseMapper.java
│   │   └── SubirDocumentoMapper.java
│   └── historial/
│       └── HistorialAccesoMapper.java
├── exception/                               # Manejo de excepciones
│   ├── CarpetaAlreadyExistsException.java
│   ├── DocumentUploadException.java
│   ├── GlobalExceptionHandler.java
│   ├── InvalidRequestException.java
│   ├── ResourceNotFoundException.java
│   └── StorageException.java
└── util/                                    # Utilidades
    └── ResponseUtil.java
```

## Modelo de Datos

### CarpetaCiudadano

- `carpetaId`: UUID único de la carpeta (PK)
- `propietarioCedula`: Cédula del ciudadano propietario
- `propietarioNombre`: Nombre completo del propietario
- `emailCarpeta`: Email inmutable de la carpeta (@carpetacolombia.co)
- `estadoCarpeta`: ACTIVA, SUSPENDIDA, EN_TRANSFERENCIA
- `operadorActual`: ID del operador actual (para portabilidad)
- `espacioUtilizadoBytes`: Espacio utilizado en bytes
- `fechaCreacion`: Fecha de creación de la carpeta
- `fechaUltimaModificacion`: Fecha de última modificación

### Documento

- `carpetaId`: ID de la carpeta propietaria (PK)
- `documentoId`: UUID único del documento (SK)
- `titulo`: Título del documento
- `tipoDocumento`: CEDULA, DIPLOMA, ACTA_GRADO, PROCESADO_LABORAL, PROCESADO_MEDICO
- `contextoDocumento`: EDUCACION, NOTARIA, REGISTRADURIA, SALUD, LABORAL
- `descripcion`: Descripción opcional del documento
- `formatoArchivo`: PDF, JPEG, PNG, etc.
- `tamanoBytes`: Tamaño en bytes
- `hashDocumento`: SHA-256 del contenido
- `urlAlmacenamiento`: URL en MinIO/S3
- `estadoDocumento`: TEMPORAL, PROCESADO, CERTIFICADO, REVOCADO
- `esDescargable`: Indica si el documento es descargable
- `fechaRecepcion`: Fecha de recepción del documento
- `fechaUltimaModificacion`: Fecha de última modificación

### HistorialAcceso

- `carpetaId`: ID de la carpeta (PK)
- `accesoId`: UUID único del acceso (SK)
- `documentoId`: ID del documento accedido
- `tipoAcceso`: CONSULTA, DESCARGA, COMPARTIR, AUTENTICACION_EXITOSA, etc.
- `usuarioAcceso`: Usuario que realizó el acceso
- `fechaAcceso`: Fecha y hora del acceso
- `resultadoAcceso`: EXITOSO, FALLIDO, DENEGADO
- `motivoAcceso`: Motivo del acceso

### Configuración de Archivos

- **Tamaño máximo de archivo**: 50MB
- **Tamaño máximo de request**: 50MB
- **URLs prefirmadas**: Válidas por 15 minutos
- **Logging**: Nivel DEBUG para desarrollo

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
