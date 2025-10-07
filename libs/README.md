# Shared Libraries

Código compartido entre servicios para evitar duplicación y mantener consistencia.

## Propósito

Las librerías compartidas permiten:
- Reutilizar lógica común entre servicios
- Mantener consistencia en tipos y modelos de dominio
- Compartir utilidades y helpers
- Definir contratos de eventos/mensajes

## Librerías Potenciales

### Domain Models
- **shared-types**: Tipos TypeScript/interfaces compartidas
- **domain-models**: Modelos del dominio (Agregados, Entidades, Value Objects)
- **event-schemas**: Esquemas de eventos del Event Bus

### Utilities
- **shared-utils**: Utilidades generales (validación, formateo, etc.)
- **security**: Utilidades de seguridad (encriptación, validación firma digital)
- **logger**: Logger estandarizado para todos los servicios

### Communication
- **api-client**: Clientes para comunicación entre servicios
- **event-bus**: Cliente del bus de eventos (Kafka/RabbitMQ)

## Versionamiento

Las librerías compartidas deben versionarse independientemente para evitar breaking changes.

