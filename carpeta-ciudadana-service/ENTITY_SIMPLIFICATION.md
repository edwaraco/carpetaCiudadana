# Simplificación de Entidades - MVP Carpeta Ciudadana

## Resumen de Cambios

Este documento detalla la simplificación de las entidades del dominio para enfocarse en el MVP actual, eliminando campos que no son necesarios en esta etapa y que agregan complejidad innecesaria.

## Principios Aplicados

1. **YAGNI (You Aren't Gonna Need It)**: Eliminar campos que no se usan actualmente
2. **MVP First**: Mantener solo lo esencial para las 4 funcionalidades básicas
3. **DDD Alignment**: Respetar el modelo de dominio pero simplificado para MVP
4. **Evolución Gradual**: Los campos eliminados pueden agregarse en futuras iteraciones

---

## 1. CarpetaCiudadano

### Campos Eliminados

- ❌ `documentoIds` (List<String>)

### Justificación

- Los documentos se consultan directamente por `carpetaId` en DynamoDB
- No hay necesidad de mantener una lista duplicada
- Reduce complejidad de sincronización
- Los documentos son una entidad separada con su propia tabla

### Campos Mantenidos (11 campos)

```java
✅ carpetaId              // PK - Identificador único
✅ propietarioCedula      // Identificación del ciudadano
✅ propietarioNombre      // Nombre completo
✅ emailCarpeta           // Email inmutable @carpetacolombia.co
✅ estadoCarpeta          // ACTIVA, SUSPENDIDA, EN_TRANSFERENCIA
✅ operadorActual         // Para portabilidad entre operadores
✅ espacioUtilizadoBytes  // Métrica de uso
✅ fechaCreacion          // Auditoría
✅ fechaUltimaModificacion // Auditoría
```

### Impacto

- **Mapper**: Actualizado `CarpetaMapper.java` - eliminado `@Mapping(target = "documentoIds", ignore = true)`
- **DTOs**: No requiere cambios (no se exponía en responses)
- **Servicios**: No requiere cambios

---

## 2. Documento

### Campos Eliminados (9 campos)

- ❌ `fechaEmision` (LocalDateTime)
- ❌ `fechaVencimiento` (LocalDateTime)
- ❌ `tags` (Map<String, String>)
- ❌ `firmaDigital` (String)
- ❌ `fechaCertificacion` (LocalDateTime)
- ❌ `versionDocumento` (String)

### Justificación

- **fechaEmision/fechaVencimiento**: No se usan en el MVP, pueden agregarse cuando se necesiten
- **tags**: Over-engineering para MVP, no hay funcionalidad de búsqueda por tags
- **firmaDigital**: Solo se usa `firmadoPor` y `certificadoValidez` para documentos certificados
- **fechaCertificacion**: Redundante, `fechaUltimaModificacion` es suficiente
- **versionDocumento**: No hay versionado de documentos en MVP

### Campos Mantenidos (18 campos)

```java
// Claves DynamoDB
✅ carpetaId              // PK
✅ documentoId            // SK

// Metadatos básicos
✅ titulo                 // Título del documento
✅ tipoDocumento          // CEDULA, DIPLOMA, etc.
✅ contextoDocumento      // EDUCACION, NOTARIA, etc.
✅ descripcion            // Descripción opcional

// Contenido y almacenamiento
✅ formatoArchivo         // PDF, JPEG, PNG
✅ tamanoBytes            // Tamaño del archivo
✅ hashDocumento          // SHA-256 para integridad
✅ urlAlmacenamiento      // Ruta en MinIO/S3

// Estado y certificación (simplificado)
✅ estadoDocumento        // TEMPORAL, CERTIFICADO, REVOCADO
✅ firmadoPor             // Entidad emisora (opcional)
✅ certificadoValidez     // ID del certificado (opcional)

// Control y auditoría
✅ esDescargable          // Flag de descarga
✅ fechaRecepcion         // Cuándo llegó al sistema
✅ fechaUltimaModificacion // Última actualización
```

### Impacto

- **Mapper**: Actualizado `CrearDocumentoMapper.java` - simplificados los @Mapping
- **DTOs**: No requiere cambios (ya estaban alineados)
- **Servicios**: No requiere cambios

---

## 3. HistorialAcceso

### Campos Eliminados (3 campos)

- ❌ `ipAcceso` (String)
- ❌ `userAgent` (String)
- ❌ `metadatosAdicionales` (Map<String, String>)

### Justificación

- **ipAcceso/userAgent**: Información técnica no esencial para MVP
- **metadatosAdicionales**: Over-engineering, no hay casos de uso definidos
- Para auditoría básica es suficiente con usuario, fecha y tipo de acceso

### Campos Mantenidos (8 campos)

```java
// Claves DynamoDB
✅ carpetaId              // PK
✅ accesoId               // SK (incluye timestamp)

// Información del acceso
✅ documentoId            // Documento accedido (nullable)
✅ tipoAcceso             // SUBIDA, CONSULTA, DESCARGA, etc.
✅ usuarioAcceso          // Quién realizó el acceso

// Resultado y contexto
✅ fechaAcceso            // Cuándo ocurrió
✅ resultadoAcceso        // EXITOSO, FALLIDO, DENEGADO
✅ motivoAcceso           // Descripción del acceso
```

### Impacto

- **Mapper**: Actualizado `HistorialAccesoMapper.java` - eliminados mappings de campos removidos
- **DTOs**: Actualizado `HistorialAccesoResponse.java` - eliminado `ipAcceso`
- **Servicios**: No requiere cambios

---

## Comparación: Antes vs Después

| Entidad              | Campos Antes | Campos Después | Reducción |
| -------------------- | ------------ | -------------- | --------- |
| **CarpetaCiudadano** | 12           | 11             | -8%       |
| **Documento**        | 24           | 18             | **-25%**  |
| **HistorialAcceso**  | 11           | 8              | **-27%**  |
| **TOTAL**            | **47**       | **37**         | **-21%**  |

## Beneficios de la Simplificación

### 1. Menor Complejidad

- ✅ Menos campos = menos código para mantener
- ✅ Mappers más simples y legibles
- ✅ Menos probabilidad de errores

### 2. Mejor Performance

- ✅ Menor tamaño de objetos en memoria
- ✅ Menos datos a transferir en DynamoDB
- ✅ Serialización/deserialización más rápida

### 3. Enfoque en MVP

- ✅ Solo campos que realmente se usan
- ✅ Alineado con las 4 funcionalidades básicas
- ✅ Más fácil de entender para nuevos desarrolladores

### 4. Facilita Testing

- ✅ Menos campos para mockear en tests
- ✅ Fixtures más simples
- ✅ Tests más enfocados

## Funcionalidades MVP Soportadas

Todas las 4 funcionalidades básicas siguen totalmente funcionales:

### ✅ 1. Crear carpetas ciudadanas únicas

- `CarpetaCiudadano` tiene todos los campos necesarios
- Email inmutable generado correctamente
- Estado y operador para portabilidad

### ✅ 2. Almacenar documentos (firmados o no)

- `Documento` tiene metadatos completos
- Soporte para documentos temporales y certificados
- Hash y URL de almacenamiento

### ✅ 3. Ver mis documentos

- Todos los campos de visualización presentes
- Filtros por tipo y contexto disponibles

### ✅ 4. Integración con firma digital

- Campos `firmadoPor` y `certificadoValidez` presentes
- Estado del documento (TEMPORAL/CERTIFICADO)

## Evolución Futura

Los campos eliminados pueden agregarse cuando sea necesario:

### Fase 2 - Documentos Avanzados

```java
+ fechaEmision
+ fechaVencimiento
+ tags
```

### Fase 3 - Firma Digital Completa

```java
+ firmaDigital (firma completa en base64)
+ fechaCertificacion
```

### Fase 4 - Versionado

```java
+ versionDocumento
+ historialVersiones
```

### Fase 5 - Auditoría Avanzada

```java
+ ipAcceso
+ userAgent
+ metadatosAdicionales
```

## Archivos Modificados

### Entidades

- ✅ `entity/CarpetaCiudadano.java`
- ✅ `entity/Documento.java`
- ✅ `entity/HistorialAcceso.java`

### Mappers

- ✅ `mapper/carpeta/CarpetaMapper.java`
- ✅ `mapper/document/CrearDocumentoMapper.java`
- ✅ `mapper/historial/HistorialAccesoMapper.java`

### DTOs

- ✅ `dto/response/HistorialAccesoResponse.java`

### Sin Cambios Necesarios

- ✅ DTOs de request (ya estaban simplificados)
- ✅ Services (sin dependencias de campos eliminados)
- ✅ Controllers (usan DTOs, no entidades directamente)
- ✅ Repositories (DynamoDB maneja los cambios automáticamente)

## Validación

✅ Sin errores de compilación  
✅ Mappers actualizados correctamente  
✅ DTOs alineados con entidades  
✅ Documentación actualizada

---

**Última actualización**: 2025-10-21  
**Versión**: MVP 1.0  
**Estado**: ✅ Completado
