# Arquitectura - Carpeta Ciudadana Service

## Mejoras Implementadas

### 1. Manejo de Excepciones Centralizado

#### Excepciones Personalizadas

- **`ResourceNotFoundException`**: Cuando un recurso no existe
- **`CarpetaAlreadyExistsException`**: Cuando se intenta crear una carpeta duplicada
- **`DocumentUploadException`**: Errores al subir documentos
- **`InvalidRequestException`**: Validación de peticiones
- **`StorageException`**: Errores del sistema de almacenamiento (MinIO)

#### GlobalExceptionHandler

Maneja todas las excepciones de forma centralizada y devuelve respuestas consistentes:

- Logging automático de errores
- Códigos HTTP apropiados
- Mensajes de error descriptivos
- Información de debugging (campo, valor rechazado, etc.)

### 2. Respuestas Consistentes

#### ApiResponse<T>

Wrapper genérico para todas las respuestas de la API:

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {...},
  "timestamp": "2025-10-21T10:30:00"
}
```

En caso de error:

```json
{
  "success": false,
  "message": "Error encontrado",
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Carpeta no encontrado con carpetaId: '123'",
    "field": "carpetaId",
    "rejectedValue": "123"
  },
  "timestamp": "2025-10-21T10:30:00"
}
```

#### ResponseUtil

Utilidad para generar respuestas de forma consistente:

- Métodos helper para códigos HTTP comunes (ok, created, notFound, etc.)
- Conversión de entidades a DTOs de respuesta
- Código limpio y reutilizable

### 3. Controlador Funcional

#### Antes:

```java
@PostMapping
public ResponseEntity<CrearCarpetaResponse> crearCarpeta(@RequestBody CrearCarpetaRequest request) {
    try {
        CarpetaCiudadano carpeta = carpetaService.crearCarpeta(request);

        CrearCarpetaResponse response = new CrearCarpetaResponse(
            carpeta.getCarpetaId(),
            carpeta.getEmailCarpeta(),
            carpeta.getEstadoCarpeta(),
            carpeta.getFechaCreacion(),
            "Carpeta creada exitosamente"
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);

    } catch (IllegalArgumentException e) {
        log.error("Error creando carpeta: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
            new CrearCarpetaResponse(null, null, null, null, "Error: " + e.getMessage())
        );
    } catch (Exception e) {
        log.error("Error interno creando carpeta: {}", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
            new CrearCarpetaResponse(null, null, null, null, "Error interno del servidor")
        );
    }
}
```

#### Después:

```java
@PostMapping
public ResponseEntity<ApiResponse<CrearCarpetaResponse>> crearCarpeta(
        @RequestBody CrearCarpetaRequest request) {

    log.info("Creando carpeta para ciudadano con cédula: {}", request.cedula());

    var carpeta = carpetaService.crearCarpeta(request);
    var response = ResponseUtil.toCrearCarpetaResponse(carpeta);

    return ResponseUtil.created(response, "Carpeta creada exitosamente");
}
```

### 4. Servicio con Excepciones Específicas

El servicio ahora lanza excepciones específicas en lugar de genéricas:

```java
// Antes
throw new IllegalArgumentException("Carpeta no encontrada");

// Después
throw new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId);
```

### 5. Programación Funcional

Uso de streams y Optional de forma funcional:

```java
@GetMapping("/{carpetaId}")
public ResponseEntity<ApiResponse<CarpetaResponse>> buscarCarpetaPorId(
        @PathVariable String carpetaId) {

    log.info("Buscando carpeta con ID: {}", carpetaId);

    return carpetaService.buscarCarpetaPorId(carpetaId)
            .map(ResponseUtil::toCarpetaResponse)
            .map(ResponseUtil::ok)
            .orElseThrow(() -> new ResourceNotFoundException("Carpeta", "carpetaId", carpetaId));
}
```

## Beneficios

1. **Código más limpio**: Controladores con menos líneas, más legibles
2. **Separación de responsabilidades**:
   - Controller: solo maneja HTTP
   - Service: lógica de negocio y lanza excepciones
   - GlobalExceptionHandler: manejo de errores
   - ResponseUtil: construcción de respuestas
3. **Consistencia**: Todas las respuestas tienen el mismo formato
4. **Mejor debugging**: Errores con información detallada
5. **Mantenibilidad**: Cambios centralizados afectan toda la aplicación
6. **Testing más fácil**: Componentes desacoplados

## Estructura de Directorios

```
co.edu.eafit.carpeta.ciudadana/
├── controller/          # Endpoints REST
├── service/            # Lógica de negocio
├── repository/         # Acceso a datos
├── entity/            # Entidades de dominio
├── dto/               # DTOs de request/response
├── exception/         # Excepciones personalizadas
│   └── GlobalExceptionHandler
├── util/              # Utilidades
│   └── ResponseUtil
├── mapper/            # Mappers entre entidades y DTOs
└── config/            # Configuraciones
```

## Próximos Pasos

- [ ] Añadir validación con Bean Validation (@Valid, @NotNull, etc.)
- [ ] Implementar logging estructurado (ELK)
- [ ] Añadir métricas con Micrometer/Prometheus
- [ ] Circuit breaker para llamadas externas
- [ ] Rate limiting
- [ ] API documentation con OpenAPI/Swagger
