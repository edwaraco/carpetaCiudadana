# ADR-0002: Arquitectura Backend con Spring Boot, DynamoDB y MinIO

## Estado
**Aceptado** - 2025-11-04

## Contexto

El sistema Carpeta Ciudadana requiere implementar el **Core Domain "Carpeta Personal"**, que gestiona el repositorio virtual personal de cada ciudadano donde almacenan documentos certificados y no certificados a perpetuidad.

### Desafíos Identificados

1. **Almacenamiento Dual:** Necesidad de almacenar metadatos estructurados (búsquedas rápidas) y archivos binarios grandes (documentos PDF, imágenes)
2. **Escalabilidad:** El sistema debe soportar millones de ciudadanos colombianos con crecimiento impredecible
3. **Disponibilidad:** Requisito de 99.9% uptime (RNF-01) para acceso a documentos críticos
4. **Inmutabilidad:** Los documentos certificados deben almacenarse a perpetuidad sin límite de tamaño (RF-CP-02)
5. **Seguridad:** Integridad de documentos mediante hashing SHA-256 y URLs prefirmadas temporales
6. **Portabilidad:** Facilitar migración de documentos entre operadores (RF-GP-01)
7. **Trazabilidad:** Auditoría completa de accesos y modificaciones (RF-AU-01)

### Requisitos No Funcionales Relevantes

- **RNF-01:** Disponibilidad 99.9% (8.76 horas downtime/año máximo)
- **RNF-02:** RPO < 1 hora, RTO < 4 horas
- **RNF-06:** Latencia P95 < 500ms para consultas
- **RNF-07:** Throughput mínimo 1000 req/s
- **RNF-11:** Encriptación en tránsito (TLS 1.3) y en reposo (AES-256)
- **RNF-21:** MTTR < 4 horas para correcciones críticas
- **RNF-22:** Cobertura de pruebas > 85%

### Requisitos Funcionales Relevantes

- **RF-CP-01:** Crear carpetas ciudadanas únicas con email inmutable
- **RF-CP-02:** Almacenar documentos certificados sin límite de tamaño a perpetuidad
- **RF-CP-03:** Almacenar documentos temporales con límites por usuario
- **RF-CP-05:** Visualización y descarga segura de documentos
- **RF-AU-01:** Registro completo de accesos y modificaciones

## Decisión

Implementaremos un **microservicio backend modular** usando:

### 1. Spring Boot 3.2.12 como Framework Principal

**Razones:**

1. **Ecosistema Maduro:** Framework empresarial probado con amplio soporte para integraciones
2. **Java 21 LTS:** Lenguaje robusto con soporte a largo plazo, performance mejorado con Virtual Threads
3. **Spring Cloud:** Integración nativa con patrones de microservicios (Circuit Breaker, Service Discovery)
4. **Productividad:** Auto-configuración, inyección de dependencias, y convenciones sobre configuración
5. **Observabilidad:** Spring Boot Actuator para health checks, metrics y monitoring
6. **Testing:** Excelente soporte para testing con Spring Test, MockMvc, Testcontainers
7. **Comunidad:** Gran comunidad en Colombia, abundancia de desarrolladores Java

**Alternativas Consideradas:**
- **Node.js + Express:** Menos robusto para operaciones intensivas de I/O con archivos grandes
- **Python + FastAPI:** Menor performance para alta concurrencia
- **.NET Core:** Menos experiencia del equipo, ecosistema menos maduro en AWS

### 2. DynamoDB como Base de Datos NoSQL

**Razones:**

1. **Escalabilidad Horizontal Automática:** Escala sin intervención manual hasta millones de registros
2. **Performance Predecible:** Latencia consistente de milisegundos independiente del tamaño
3. **Modelo de Datos Flexible:** Ideal para agregados DDD (CarpetaCiudadano, Documento, HistorialAcceso)
4. **Sin Administración:** Fully managed, sin necesidad de provisionar servidores
5. **Alta Disponibilidad:** Replicación multi-AZ automática (cumple RNF-01)
6. **Costo Eficiente:** Pay-per-request pricing, ideal para carga variable
7. **Integración AWS:** Nativa con S3, Lambda, CloudWatch

**Modelo de Datos:**

```
Tabla: CarpetaCiudadano
PK: carpetaId (UUID)
Atributos: propietarioCedula, propietarioNombre, emailCarpeta, 
           estadoCarpeta, operadorActual, espacioUtilizadoBytes
GSI: propietarioCedula-index (para búsqueda por cédula)

Tabla: Documento
PK: carpetaId
SK: documentoId (UUID)
Atributos: titulo, tipoDocumento, contextoDocumento, formatoArchivo,
           tamanoBytes, hashDocumento, urlAlmacenamiento, estadoDocumento
LSI: fechaRecepcion-index (para ordenar por fecha)

Tabla: HistorialAcceso
PK: carpetaId
SK: accesoId (UUID)
Atributos: documentoId, tipoAcceso, usuarioAcceso, fechaAcceso,
           resultadoAcceso, motivoAcceso
```

**Alternativas Consideradas:**
- **PostgreSQL:** Requiere escalado vertical, administración de índices, menos flexible para cambios de esquema
- **MongoDB:** Menos integración con AWS, requiere gestión de clusters
- **MySQL:** No optimizado para alta concurrencia de escrituras

### 3. MinIO como Almacenamiento de Objetos (S3-Compatible)

**Razones:**

1. **Compatibilidad S3:** API 100% compatible con Amazon S3, fácil migración a producción
2. **Desarrollo Local:** Permite desarrollo sin costos de AWS durante fase académica
3. **Performance:** Optimizado para archivos grandes (documentos PDF, imágenes de alta resolución)
4. **Escalabilidad:** Diseñado para petabytes de datos
5. **URLs Prefirmadas:** Generación de URLs temporales para descarga segura (15 minutos)
6. **Versionado:** Soporte para versionado de objetos (útil para auditoría)
7. **Encriptación:** Soporte nativo para encriptación en reposo (cumple RNF-11)

**Estructura de Almacenamiento:**

```
Bucket: carpeta-ciudadana-docs
Estructura: /{carpetaId}/{documentoId}/{filename}
Ejemplo: /a1b2c3d4-uuid/doc-uuid-5678/diploma_universidad.pdf

Metadata en objeto:
- Content-Type: application/pdf
- x-amz-meta-carpeta-id: a1b2c3d4-uuid
- x-amz-meta-documento-id: doc-uuid-5678
- x-amz-meta-hash-sha256: abc123...
```

**Alternativas Consideradas:**
- **Sistema de Archivos Local:** No escalable, sin replicación, pérdida de datos
- **GridFS (MongoDB):** Menos eficiente para archivos >16MB, no estándar S3
- **Azure Blob Storage:** Menos compatible con ecosistema AWS

### 4. Arquitectura en Capas (Layered Architecture)

**Estructura:**

```
Controller (REST API)
    ↓
Service (Lógica de Negocio)
    ↓
Repository (Acceso a Datos)
    ↓
Entity (Modelo de Dominio)
```

**Razones:**

1. **Separación de Responsabilidades:** Cada capa tiene una responsabilidad clara
2. **Testabilidad:** Fácil mockear dependencias entre capas
3. **Mantenibilidad:** Cambios en una capa no afectan otras (bajo acoplamiento)
4. **Simplicidad:** Patrón bien conocido, fácil onboarding de nuevos desarrolladores
5. **Cumple RNF-23:** Modificabilidad - nuevas features con mínima modificación

**Componentes Clave:**

- **Controllers:** Exponen API REST, validación de entrada, manejo de errores HTTP
- **Services:** Lógica de negocio, orquestación de repositorios, transacciones
- **Repositories:** Abstracción de acceso a DynamoDB, operaciones CRUD
- **Entities:** Modelo de dominio DDD (Aggregates: CarpetaCiudadano, Documento)
- **DTOs:** Request/Response objects para desacoplar API de modelo interno
- **Mappers:** MapStruct para conversión entre DTOs y Entities

### 5. Tecnologías Complementarias

#### 5.1 MapStruct para Mapeo de Objetos

**Razones:**
- Generación de código en tiempo de compilación (zero runtime overhead)
- Type-safe, detecta errores en compile-time
- Más rápido que reflection-based mappers (Dozer, ModelMapper)

#### 5.2 Spring Cloud OpenFeign (Configurado pero no implementado)

**Razones para inclusión:**
- Cliente HTTP declarativo, reduce boilerplate
- Integración con load balancing y circuit breaker
- Soporte para retry automático y timeouts configurables

**Estado actual:** La dependencia está incluida en pom.xml para futuras integraciones con otros microservicios, pero actualmente no hay clientes Feign implementados.

#### 5.3 Resilience4j (Configurado pero no implementado)

**Razones para inclusión:**
- Circuit Breaker: Previene cascading failures
- Retry: Reintentos automáticos con backoff exponencial
- Rate Limiter: Protección contra sobrecarga
- Bulkhead: Aislamiento de recursos

**Estado actual:** La dependencia está incluida en pom.xml pero no hay implementación activa de patrones de resiliencia en el código.

#### 5.4 SpringDoc OpenAPI para Documentación

**Razones:**
- Generación automática de documentación Swagger UI
- Especificación OpenAPI 3.0 estándar
- Testing interactivo de endpoints

#### 5.5 Testcontainers (Configurado pero sin tests implementados)

**Razones para inclusión:**
- Tests con DynamoDB Local y MinIO reales
- Aislamiento completo, no requiere infraestructura externa
- CI/CD friendly

**Estado actual:** Las dependencias de testing (spring-boot-starter-test, testcontainers) están configuradas en pom.xml, pero actualmente no hay tests unitarios ni de integración implementados en el proyecto.

## Consecuencias

### Positivas

1. ✅ **Alta Escalabilidad:** DynamoDB + MinIO escalan horizontalmente sin límites prácticos
2. ✅ **Performance Predecible:** Latencia consistente independiente de la carga (cumple RNF-06)
3. ✅ **Alta Disponibilidad:** Arquitectura multi-AZ de DynamoDB (cumple RNF-01: 99.9%)
4. ✅ **Desarrollo Ágil:** Spring Boot reduce boilerplate, auto-configuración
5. ✅ **Infraestructura de Testing Preparada:** Testcontainers configurado para futuros tests de integración
6. ✅ **Observabilidad:** Actuator + CloudWatch para monitoring completo
7. ✅ **Seguridad:** URLs prefirmadas, hashing SHA-256, encriptación en reposo
8. ✅ **Portabilidad:** MinIO S3-compatible facilita migración a AWS S3 en producción
9. ✅ **Costo Eficiente:** Pay-per-request de DynamoDB, sin servidores que provisionar
10. ✅ **Resiliencia:** Circuit Breaker y Retry patterns con Resilience4j

### Negativas

1. ❌ **Vendor Lock-in Parcial:** DynamoDB es específico de AWS
2. ❌ **Curva de Aprendizaje NoSQL:** Equipo debe aprender modelado de datos NoSQL (diferente a SQL)
3. ❌ **Consultas Limitadas:** DynamoDB no soporta queries complejas (requiere GSI/LSI bien diseñados)
4. ❌ **Costos Variables:** DynamoDB puede ser costoso con tráfico muy alto
5. ❌ **Complejidad de Transacciones:** Transacciones distribuidas entre DynamoDB y MinIO son complejas
6. ❌ **Debugging NoSQL:** Más difícil debuggear queries NoSQL vs SQL tradicional
7. ❌ **Sin Tests Implementados:** Actualmente no hay tests unitarios ni de integración

### Mitigaciones Implementadas

1. **Abstracción de Repositorios:**
   ```java
   public interface CarpetaCiudadanoRepository {
       CarpetaCiudadano save(CarpetaCiudadano carpeta);
       Optional<CarpetaCiudadano> findById(String id);
       Optional<CarpetaCiudadano> findByPropietarioCedula(String cedula);
   }
   ```
   - Permite cambiar implementación de DynamoDB a otra BD sin afectar servicios

2. **Manejo de Errores Robusto:**
   - Try-catch en operaciones críticas
   - Logging detallado con SLF4J
   - Excepciones personalizadas (CarpetaAlreadyExistsException, DocumentUploadException, StorageException)

3. **Auditoría de Accesos:**
   - Registro automático en HistorialAcceso para cada operación (subida, descarga)
   - Trazabilidad completa de operaciones

## Métricas de Éxito

Mediremos el éxito de esta decisión con:

1. **Disponibilidad:**
   - Target: 99.9% uptime (RNF-01)
   - Medición: CloudWatch Synthetics, uptime monitoring

2. **Latencia:**
   - Target: P95 < 500ms para consultas (RNF-06)
   - Target: P99 < 1s para subida de documentos
   - Medición: Spring Boot Actuator metrics, CloudWatch

3. **Throughput:**
   - Target: 1000 req/s sostenido (RNF-07)
   - Medición: Load testing con JMeter/Gatling

4. **Test Coverage:**
   - Target: > 85% coverage (RNF-22)
   - **Estado actual:** No implementado - no hay tests en el proyecto

5. **MTTR:**
   - Target: < 4 horas para correcciones críticas (RNF-21)
   - Medición: Incident tracking, deployment frequency

6. **Costo:**
   - Target: < $500/mes para 10,000 usuarios activos
   - Medición: AWS Cost Explorer

## Estado de Implementación

### Funcionalidades Implementadas ✅

1. **Gestión de Carpetas:**
   - Crear carpeta ciudadana con email inmutable generado automáticamente
   - Buscar carpeta por ID o por cédula
   - Validación de duplicados (una cédula = una carpeta)

2. **Gestión de Documentos:**
   - Subir documentos con cálculo automático de hash SHA-256
   - Almacenamiento en MinIO con estructura `{userId}/{fileName}`
   - Listar documentos de una carpeta
   - Obtener documento específico
   - Generar URLs prefirmadas temporales (15 minutos) para descarga segura

3. **Auditoría:**
   - Registro automático en HistorialAcceso para operaciones de subida y descarga
   - Tracking de usuario, tipo de acceso, fecha y resultado

4. **Manejo de Errores:**
   - Excepciones personalizadas (CarpetaAlreadyExistsException, DocumentUploadException, StorageException, ResourceNotFoundException)
   - GlobalExceptionHandler con @RestControllerAdvice
   - Respuestas HTTP estandarizadas con ApiResponse<T>

5. **Documentación API:**
   - Swagger UI disponible en `/api/v1/swagger-ui.html`
   - Anotaciones OpenAPI en controllers
   - Ejemplos de request/response

6. **Infraestructura Local:**
   - Docker Compose con MinIO, DynamoDB Local y DynamoDB Admin
   - Inicialización automática de tablas DynamoDB
   - Inicialización automática de bucket MinIO

### Dependencias Configuradas pero No Utilizadas ⚠️

1. **Resilience4j:** Incluido en pom.xml pero sin implementación de Circuit Breaker o Retry
2. **Spring Cloud OpenFeign:** Incluido pero sin clientes Feign implementados
3. **Testcontainers:** Configurado pero sin tests escritos
4. **Spring Boot Test:** Dependencia presente pero carpeta `src/test` no existe

## Notas de Implementación

### Stack Tecnológico Completo

```json
{
  "framework": "Spring Boot 3.2.12",
  "language": "Java 21 LTS",
  "database": "AWS DynamoDB (DynamoDB Local para desarrollo)",
  "storage": "MinIO (S3-compatible, migración a AWS S3 en producción)",
  "buildTool": "Maven 3.9",
  "dependencies": {
    "web": "spring-boot-starter-web",
    "validation": "spring-boot-starter-validation",
    "actuator": "spring-boot-starter-actuator",
    "dynamodb": "aws-sdk-dynamodb-enhanced 2.35.10",
    "minio": "minio 8.5.7",
    "feign": "spring-cloud-starter-openfeign",
    "resilience4j": "resilience4j-spring-boot3",
    "mapstruct": "1.5.5.Final",
    "openapi": "springdoc-openapi-starter-webmvc-ui 2.3.0"
  },
  "testing": {
    "configured": "JUnit 5 + Mockito + Testcontainers",
    "status": "Dependencias configuradas, tests no implementados"
  },
  "deployment": "Docker + Docker Compose (desarrollo), Kubernetes (producción)"
}
```

### Configuración de DynamoDB

```java
@Configuration
public class DynamoDbConfig {
    @Bean
    public DynamoDbClient dynamoDbClient() {
        return DynamoDbClient.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.of(region))
            .credentialsProvider(StaticCredentialsProvider.create(
                AwsBasicCredentials.create(accessKey, secretKey)))
            .build();
    }

    @Bean
    public DynamoDbEnhancedClient dynamoDbEnhancedClient(DynamoDbClient client) {
        return DynamoDbEnhancedClient.builder()
            .dynamoDbClient(client)
            .build();
    }
}
```

### Configuración de MinIO

```java
@Configuration
public class MinioConfig {
    @Bean
    public MinioClient minioClient() {
        return MinioClient.builder()
            .endpoint(endpoint)
            .credentials(accessKey, secretKey)
            .build();
    }
}
```

### Ejemplo de Endpoint REST

```java
@RestController
@RequestMapping("/api/v1/carpetas")
public class CarpetaCiudadanoController {
    
    @PostMapping
    public ResponseEntity<ApiResponse<CrearCarpetaResponse>> crearCarpeta(
            @Valid @RequestBody CrearCarpetaRequest request) {
        CarpetaCiudadano carpeta = service.crearCarpeta(request);
        return ResponseEntity.ok(ResponseUtil.success(
            mapper.toResponse(carpeta), "Carpeta creada exitosamente"));
    }

    @PostMapping("/{carpetaId}/documentos")
    public ResponseEntity<ApiResponse<SubirDocumentoResponse>> subirDocumento(
            @PathVariable String carpetaId,
            @RequestPart("archivo") MultipartFile archivo,
            @Valid @ModelAttribute SubirDocumentoRequest request) {
        Documento documento = service.subirDocumento(request, archivo);
        return ResponseEntity.ok(ResponseUtil.success(
            mapper.toResponse(documento), "Documento subido exitosamente"));
    }
}
```

### Manejo de Errores Global

```java
@RestControllerAdvice
public class GlobalExceptionHandler {
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Void>> handleNotFound(
            ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ResponseUtil.error(ex.getMessage(), "NOT_FOUND"));
    }

    @ExceptionHandler(CarpetaAlreadyExistsException.class)
    public ResponseEntity<ApiResponse<Void>> handleAlreadyExists(
            CarpetaAlreadyExistsException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(ResponseUtil.error(ex.getMessage(), "ALREADY_EXISTS"));
    }
}
```

## Patrones de Diseño Implementados

1. **Repository Pattern:** Abstracción de acceso a datos (CarpetaCiudadanoRepository, DocumentoRepository, HistorialAccesoRepository)
2. **DTO Pattern:** Desacoplamiento de API y modelo de dominio (Request/Response objects)
3. **Mapper Pattern:** Conversión entre capas con MapStruct (CarpetaMapper, DocumentoResponseMapper, etc.)
4. **Dependency Injection:** Inversión de control con Spring (@Service, @Repository, constructor injection)
5. **Builder Pattern:** Construcción de objetos complejos (Lombok @Builder en entities)
6. **Exception Handling:** Manejo centralizado de excepciones con @RestControllerAdvice

## Migración a Producción (AWS)

### Cambios Necesarios:

1. **DynamoDB Local → DynamoDB AWS:**
   ```yaml
   spring:
     cloud:
       aws:
         dynamodb:
           endpoint: # Remover (usar endpoint AWS por defecto)
           region: us-east-1
   ```

2. **MinIO → Amazon S3:**
   ```java
   // Cambiar MinioClient por S3Client
   S3Client s3Client = S3Client.builder()
       .region(Region.US_EAST_1)
       .build();
   ```

3. **Infraestructura:**
   - Desplegar en ECS Fargate o EKS
   - Application Load Balancer para distribución de tráfico
   - CloudWatch para logs y metrics
   - AWS Secrets Manager para credenciales

## Trabajo Pendiente

Aspectos configurados pero no implementados que requieren desarrollo:

1. **Tests:** Implementar tests unitarios y de integración usando Testcontainers
2. **Resiliencia:** Activar patrones de Resilience4j (Circuit Breaker, Retry) en servicios críticos
3. **Comunicación entre Microservicios:** Implementar clientes Feign cuando se desarrollen otros microservicios
4. **Índices DynamoDB:** Crear GSI para propietarioCedula en producción
5. **Monitoreo:** Configurar métricas personalizadas con Actuator
6. **Validaciones:** Agregar validaciones más robustas en DTOs con Bean Validation

## Revisión Futura

Esta decisión debe revisarse si:

1. **Costos de DynamoDB superan presupuesto:** Considerar migración a Aurora Serverless
2. **Queries complejas requeridas:** Evaluar DynamoDB Streams + Elasticsearch para analytics
3. **Latencia P95 > 500ms:** Implementar caching con Redis/ElastiCache
4. **Necesidad de transacciones ACID complejas:** Considerar PostgreSQL para subdominios específicos

**Fecha de próxima revisión:** 2026-05-01 (6 meses después de inicio de desarrollo)

## Referencias

- **Requisitos Funcionales:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md`
  - RF-CP-01: Crear carpetas ciudadanas
  - RF-CP-02: Almacenar documentos certificados
  - RF-CP-05: Visualización y descarga
  - RF-AU-01: Auditoría de accesos
- **Requisitos No Funcionales:** `/docs/informacion_cruda/requisitos_no_funcionales.md`
  - RNF-01: Disponibilidad 99.9%
  - RNF-06: Latencia P95 < 500ms
  - RNF-07: Throughput 1000 req/s
  - RNF-11: Encriptación
  - RNF-21: MTTR < 4h
  - RNF-22: Coverage > 85%
- **DDD Análisis:** `/docs/informacion_cruda/ddd_analisis/2_domain-description.md`
- **Proyecto Backend:** `/services/carpeta-ciudadana-service/`
- **Spring Boot Docs:** https://spring.io/projects/spring-boot
- **DynamoDB Best Practices:** https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html
- **MinIO Docs:** https://min.io/docs/minio/linux/index.html

## Endpoints Implementados

### Carpetas
- `POST /api/v1/carpetas` - Crear carpeta ciudadana
- `GET /api/v1/carpetas/{carpetaId}` - Obtener carpeta por ID
- `GET /api/v1/carpetas/cedula/{cedula}` - Obtener carpeta por cédula

### Documentos
- `POST /api/v1/carpetas/{carpetaId}/documentos` - Subir documento (multipart/form-data)
- `GET /api/v1/carpetas/{carpetaId}/documentos` - Listar documentos de carpeta
- `GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}` - Obtener documento específico
- `GET /api/v1/carpetas/{carpetaId}/documentos/{documentoId}/descargar` - Generar URL de descarga

### Documentación
- `GET /api/v1/swagger-ui.html` - Swagger UI
- `GET /api/v1/api-docs` - OpenAPI JSON

## Limitaciones Conocidas

1. **Sin Autenticación/Autorización:** Los endpoints son públicos, no hay validación de JWT o permisos
2. **Sin Validación de Tamaño:** No hay límites configurados para documentos temporales vs certificados
3. **Sin Paginación:** El endpoint de listar documentos no implementa paginación
4. **Sin Búsqueda Avanzada:** No hay filtros por tipo de documento, fecha, etc.
5. **Sin Compensación de Transacciones:** Si falla guardar en DynamoDB después de subir a MinIO, el archivo queda huérfano
6. **Sin Rate Limiting:** No hay protección contra abuso de API
7. **Sin Métricas Personalizadas:** Solo métricas básicas de Actuator

## Autores

- **Decisión Propuesta por:** Equipo de Desarrollo Carpeta Ciudadana
- **Revisado por:** Arquitecto de Software
- **Aprobado por:** Tech Lead

---

**Versión:** 1.0  
**Última Actualización:** 2025-11-04  
**Estado:** Implementación parcial - Funcionalidades core completadas, features avanzadas pendientes
