# Integración con RabbitMQ

## Descripción

Este microservicio publica eventos a RabbitMQ cuando se sube un documento a una carpeta ciudadana.

## Configuración

### Variables de Entorno

```bash
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=admin
RABBITMQ_PASSWORD=admin123
```

### Docker Compose

RabbitMQ está configurado en el `docker-compose.yml`:

```bash
# Iniciar RabbitMQ
docker-compose up -d rabbitmq

# Ver logs
docker-compose logs -f rabbitmq
```

### Acceso a la Consola de Administración

- URL: http://localhost:15672
- Usuario: admin
- Contraseña: admin123

## Evento: Documento Subido

### Exchange
- Nombre: `carpeta-ciudadana.exchange`
- Tipo: Topic
- Durable: Sí

### Cola
- Nombre: `documento.subido.queue`
- Durable: Sí

### Routing Key
- `documento.subido`

### Estructura del Evento

```json
{
  "documentoId": "uuid",
  "carpetaId": "uuid",
  "propietarioCedula": "1234567890",
  "tipoDocumento": "CEDULA",
  "nombreArchivo": "cedula.pdf",
  "tamanioBytes": 1024000,
  "hashDocumento": "sha256hash",
  "fechaSubida": "2025-11-03T10:30:00",
  "urlAlmacenamiento": "userId/filename.pdf"
}
```

## Consumir Eventos

Para consumir estos eventos desde otro microservicio:

```java
@Component
@Slf4j
public class DocumentoEventListener {

    @RabbitListener(queues = "documento.subido.queue")
    public void handleDocumentoSubido(DocumentoSubidoEvent event) {
        log.info("Documento recibido: {}", event.getDocumentoId());
        // Procesar el evento
    }
}
```

## Testing

Puedes verificar que los eventos se publican correctamente desde la consola de RabbitMQ:

1. Accede a http://localhost:15672
2. Ve a la pestaña "Queues"
3. Busca `documento.subido.queue`
4. Verifica que los mensajes lleguen cuando subes un documento
