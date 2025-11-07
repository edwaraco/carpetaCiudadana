# Ciudadano Registry Service

Microservicio para la gestión de registro de ciudadanos en el sistema de Carpeta Ciudadana.

## Descripción

Este microservicio implementa el **Bounded Context: Identidad y Registro** con el **Aggregate Root: RegistroCiudadano**. Su propósito es gestionar el registro inicial y creación de carpeta personal de los ciudadanos colombianos.

## Funcionalidades Principales

### FR-CU-01: Registro Inicial de Ciudadano

- ✅ Validación de ciudadano no registrado usando `/apis/validateCitizen/{id}`
- ✅ Registro de ciudadano usando `/apis/registerCitizen`
- ✅ Creación de carpeta ciudadana con identificador único (UUID interno)
- ✅ Manejo de respuestas 201 (éxito) o 501 (ya registrado)
- ✅ Registro de auditoría del proceso

### FR-CU-02: Validación de Ciudadano Existente

- ✅ Consulta `/apis/validateCitizen/{id}` con identificación del ciudadano
- ✅ Manejo de respuestas 200 (disponible) o 204 (ya registrado)
- ✅ Manejo de errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ Registro del resultado de la validación

### FR-CU-03: Desregistro de Ciudadano

- ✅ Uso de `/apis/unregisterCitizen`
- ✅ Manejo de respuestas 201 (desregistrado) o 204 (sin contenido)
- ✅ Manejo de errores 501 (parámetros incorrectos) y 500 (error de aplicación)
- ✅ Mantenimiento de backup de datos por 30 días adicionales
- ✅ Registro del proceso de desregistro en auditoría

## Tecnologías Utilizadas

- **Java 17**
- **Spring Boot 3.2.0**
- **Spring Data JPA**
- **PostgreSQL**
- **WebFlux** (para comunicación HTTP reactiva)
- **OpenAPI 3** (Swagger)
- **Docker**
- **Lombok**
- **MapStruct**

## Estructura del Proyecto

```
src/main/java/co/edu/eafit/carpeta/ciudadana/registry/
├── CiudadanoRegistryServiceApplication.java
├── client/
│   └── GovCarpetaClient.java
├── config/
│   └── OpenApiConfig.java
├── controller/
│   └── CiudadanoRegistryController.java
├── dto/
│   ├── request/
│   │   ├── RegistrarCiudadanoRequest.java
│   │   └── DesregistrarCiudadanoRequest.java
│   └── response/
│       ├── RegistroCiudadanoResponse.java
│       ├── ValidacionCiudadanoResponse.java
│       └── AuditoriaRegistroResponse.java
├── entity/
│   ├── RegistroCiudadano.java
│   └── AuditoriaRegistro.java
├── repository/
│   ├── RegistroCiudadanoRepository.java
│   └── AuditoriaRegistroRepository.java
└── service/
    ├── CiudadanoRegistryService.java
    └── impl/
        └── CiudadanoRegistryServiceImpl.java
```

## API Endpoints

### Validación de Ciudadano

```http
GET /api/v1/ciudadanos/validar/{cedula}
```

### Registro de Ciudadano

```http
POST /api/v1/ciudadanos/registrar
Content-Type: application/json

{
  "cedula": 1234567890,
  "nombreCompleto": "Carlos Andres Caro",
  "direccion": "Cra 54 # 45 -67",
  "email": "caro@mymail.com",
  "operadorId": "65ca0a00d833e984e2608756",
  "operadorNombre": "Operador Ciudadano"
}
```

### Desregistro de Ciudadano

```http
DELETE /api/v1/ciudadanos/desregistrar
Content-Type: application/json

{
  "cedula": 1234567890,
  "operadorId": "65ca0a00d833e984e2608756",
  "operadorNombre": "Operador Ciudadano",
  "motivoDesregistro": "Transferencia a otro operador"
}
```

### Obtener Ciudadano

```http
GET /api/v1/ciudadanos/{cedula}
```

### Obtener Ciudadanos por Operador

```http
GET /api/v1/ciudadanos/operador/{operadorId}
```

### Obtener Historial de Auditoría

```http
GET /api/v1/ciudadanos/{cedula}/auditoria
```

## Configuración

### Variables de Entorno

- `SPRING_DATASOURCE_URL`: URL de conexión a PostgreSQL
- `SPRING_DATASOURCE_USERNAME`: Usuario de la base de datos
- `SPRING_DATASOURCE_PASSWORD`: Contraseña de la base de datos
- `GOVCARPETA_API_BASE_URL`: URL base de la API de GovCarpeta
- `GOVCARPETA_API_TIMEOUT_SECONDS`: Timeout para las llamadas HTTP

### Configuración de GovCarpeta

El servicio se comunica con la API externa de GovCarpeta en:

- **Base URL**: `https://govcarpeta-apis-4905ff3c005b.herokuapp.com`
- **Endpoints**:
  - `GET /apis/validateCitizen/{id}`
  - `POST /apis/registerCitizen`
  - `DELETE /apis/unregisterCitizen`

## Base de Datos

### Tablas Principales

#### `registro_ciudadano`

- Almacena información de los ciudadanos registrados
- Estados: `PENDIENTE_VALIDACION`, `REGISTRADO`, `DESREGISTRADO`, `ERROR_VALIDACION`, `ERROR_REGISTRO`

#### `auditoria_registro`

- Registra todas las acciones realizadas en el sistema
- Acciones: `VALIDACION_CIUDADANO`, `REGISTRO_CIUDADANO`, `DESREGISTRO_CIUDADANO`, `CREACION_CARPETA`, etc.

## Ejecución

### Desarrollo Local

1. **Requisitos**:

   - Java 17+
   - Maven 3.6+
   - PostgreSQL 15+

2. **Configuración de Base de Datos**:

   ```sql
   CREATE DATABASE carpeta_ciudadana_registry;
   ```

3. **Ejecución**:

   ```bash
   mvn spring-boot:run
   ```

4. **Acceso**:
   - API: http://localhost:8081/ciudadano-registry
   - Swagger UI: http://localhost:8081/ciudadano-registry/swagger-ui.html

### Docker

1. **Construcción**:

   ```bash
   mvn clean package
   docker build -t ciudadano-registry-service .
   ```

2. **Ejecución con Docker Compose**:
   ```bash
   docker-compose up -d
   ```

## Monitoreo y Logs

- **Logs**: Configurados para mostrar información detallada de las operaciones
- **Auditoría**: Todas las operaciones se registran en la tabla `auditoria_registro`
- **Métricas**: Disponibles a través de Actuator (si se configura)

## Integración con Otros Servicios

Este microservicio se integra con:

- **GovCarpeta API**: Para validación y registro externo
- **Carpeta Ciudadana Service**: Para creación de carpetas (pendiente de implementación)

## Consideraciones de Seguridad

- Validación de entrada con Bean Validation
- Manejo seguro de errores sin exposición de información sensible
- Logging de auditoría para trazabilidad
- Timeout configurable para llamadas HTTP externas
