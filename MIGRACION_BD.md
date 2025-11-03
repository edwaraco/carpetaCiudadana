# Optimización de Estructura DynamoDB - RegistroCiudadano

## Cambios Realizados

### 1. Simplificación radical de la estructura

**Antes (estructura compleja con prefijos):**
```json
{
  "PK": "CIUDADANO#3052620004",
  "SK": "METADATA",
  "cedula": 3052620004,
  "operadorId": "65ca0a00d833e984e2608756",
  "operadorNombre": "Operador Ciudadano",
  "GSI1PK": "OPERADOR#65ca0a00d833e984e2608756",
  "GSI1SK": "CIUDADANO#3052620004",
  "nombreCompleto": "Juan Pérez García",
  "direccion": "Calle 123 #45-67",
  "email": "juan.perez@email.com",
  "carpetaId": "59634ad8-34b2-4252-a10b-100b0708cd6a",
  "estado": "REGISTRADO",
  "activo": true,
  ...
}
```

**Después (estructura simple y directa):**
```json
{
  "cedula": 3052620004,
  "nombreCompleto": "Juan Pérez García",
  "direccion": "Calle 123 #45-67",
  "email": "juan.perez@email.com",
  "carpetaId": "59634ad8-34b2-4252-a10b-100b0708cd6a",
  "estado": "REGISTRADO",
  "activo": true,
  "fechaRegistroGovCarpeta": "2025-11-02T20:28:40",
  "fechaCreacion": "2025-11-02T20:28:40",
  "fechaActualizacion": "2025-11-02T20:28:40"
}
```

### 2. Campos eliminados

- **PK/SK con prefijos**: Ahora solo `cedula` como Partition Key
- **operadorId**: Innecesario, la tabla es para un único operador
- **operadorNombre**: Innecesario, la tabla es para un único operador
- **GSI1PK y GSI1SK**: Eliminados completamente

### 3. Nueva estructura de claves

- **Partition Key**: `cedula` (Long) - Simple y directo
- **Sort Key**: Ninguno - No se necesita
- **GSI**: Ninguno - No se necesita

## Beneficios

1. **Menor consumo de almacenamiento**: ~50% menos datos por registro
2. **Menor consumo de RCU/WCU**: Menos bytes = menor costo en operaciones
3. **Sin GSI**: Ahorro total del costo de índices secundarios
4. **Estructura ultra simple**: Solo cédula como PK, sin SK
5. **Más legible**: Los datos en DynamoDB son fáciles de entender
6. **Código más limpio**: Sin lógica de prefijos ni concatenaciones
7. **Queries más rápidas**: Acceso directo por cédula sin parseo

## Migración de Datos Existentes

### Script de migración AWS CLI

```bash
# 1. Escanear todos los registros existentes
aws dynamodb scan --table-name RegistroCiudadano > backup.json

# 2. Crear nueva tabla con estructura simple (si es necesario)
aws dynamodb create-table \
  --table-name RegistroCiudadano \
  --attribute-definitions AttributeName=cedula,AttributeType=N \
  --key-schema AttributeName=cedula,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### Script de migración Java

```java
public void migrarRegistros() {
    // Leer todos los registros de la tabla vieja
    List<Map<String, AttributeValue>> items = dynamoDbClient.scan(
        ScanRequest.builder()
            .tableName("RegistroCiudadano")
            .build()
    ).items();
    
    // Transformar y guardar en nueva estructura
    items.forEach(item -> {
        Long cedula = Long.parseLong(
            item.get("cedula").n() != null 
                ? item.get("cedula").n() 
                : item.get("PK").s().replace("CIUDADANO#", "")
        );
        
        RegistroCiudadano registro = RegistroCiudadano.builder()
            .cedula(cedula)
            .nombreCompleto(item.get("nombreCompleto").s())
            .direccion(item.get("direccion").s())
            .email(item.get("email").s())
            .carpetaId(item.get("carpetaId").s())
            .estado(EstadoRegistro.valueOf(item.get("estado").s()))
            .activo(item.get("activo").bool())
            // ... otros campos
            .build();
            
        registroRepository.save(registro);
    });
}
```

## Actualización de Infraestructura

Si usas CloudFormation/Terraform, actualiza la definición de la tabla:

```yaml
# CloudFormation
RegistroCiudadanoTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: RegistroCiudadano
    AttributeDefinitions:
      - AttributeName: cedula
        AttributeType: N
    KeySchema:
      - AttributeName: cedula
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST
```

## Notas Importantes

- **Sin prefijos**: La cédula es directamente la Partition Key
- **Sin Sort Key**: No se necesita para este caso de uso
- **Sin GSI**: Todas las consultas son por cédula
- **Más económico**: Menos almacenamiento y sin costos de GSI
