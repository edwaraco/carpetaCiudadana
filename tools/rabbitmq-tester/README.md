# RabbitMQ Tester - Carpeta Ciudadana

Scripts Python para testing del cluster RabbitMQ con Quorum Queues.

## 📋 Requisitos

### Python
- Python 3.8+
- pip (gestor de paquetes)

### Dependencias
```bash
pip install pika
```

## 🚀 Uso Rápido

### 1. Instalar dependencias

```powershell
# Navegar a la carpeta
cd tools\rabbitmq-tester

# Instalar pika (cliente RabbitMQ para Python)
pip install pika
```

### 2. Verificar RabbitMQ está corriendo

```powershell
# Verificar servicios
docker compose ps

# Debería mostrar rabbitmq-leader y rabbitmq-follower corriendo
```

### 3. Ejecutar Producer (Enviar eventos)

```powershell
# Enviar 1 evento
python producer.py

# Enviar 5 eventos
python producer.py --count 5

# Enviar a queue diferente
python producer.py --queue minio.cleanup.queue --count 3

# Ver ayuda
python producer.py --help
```

### 4. Ejecutar Consumer (Recibir eventos)

```powershell
# Terminal separada: Consumir eventos
python consumer.py

# Consumir de queue diferente
python consumer.py --queue minio.cleanup.queue

# Con auto-acknowledgement
python consumer.py --auto-ack

# Ver ayuda
python consumer.py --help
```

## 🧪 Flujo de Testing Completo

### Terminal 1: Consumer (Escuchando)
```powershell
cd c:\Users\Esteban\Downloads\CODE\carpetaCiudadana\tools\rabbitmq-tester
python consumer.py
```

### Terminal 2: Producer (Enviando)
```powershell
cd c:\Users\Esteban\Downloads\CODE\carpetaCiudadana\tools\rabbitmq-tester
python producer.py --count 3
```

**Resultado esperado**: El consumer debe mostrar los 3 eventos enviados con todo el detalle.

## 📊 Output Esperado

### Producer
```
╔══════════════════════════════════════════════════════════════╗
║          RabbitMQ Producer - Carpeta Ciudadana              ║
╚══════════════════════════════════════════════════════════════╝

📊 Configuración:
   - Host: localhost:5672
   - Queue: documento.deletion.queue
   - Eventos: 1
   - Tipo: documento.deletion.requested

🔄 Conectando al cluster RabbitMQ...
✅ Conexión establecida

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📨 Evento #1/1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ID: 123e4567-e89b-12d3-a456-426614174000
   Tipo: documento.deletion.requested
   Documento: DOC-234567
   Operación: DELETE
   📝 Descripción: Eliminación de documento temporal solicitada por el ciudadano
   ✅ Publicado exitosamente

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Resumen:
   ✅ Exitosos: 1/1
   ❌ Fallidos: 0/1
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👋 Conexión cerrada
```

### Consumer
```
╔══════════════════════════════════════════════════════════════╗
║          RabbitMQ Consumer - Carpeta Ciudadana              ║
╚══════════════════════════════════════════════════════════════╝

📊 Configuración:
   - Host: localhost:5672
   - Queue: documento.deletion.queue
   - ACK Mode: Manual
   - Prefetch: 1

🔄 Conectando al cluster RabbitMQ...
✅ Conexión establecida

👂 Escuchando mensajes en 'documento.deletion.queue'...
   Presiona Ctrl+C para detener

============================================================

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 EVENTO RECIBIDO - 14:30:45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Metadata:
   Delivery Tag: 1
   Redelivered: No

🆔 Event ID: 123e4567-e89b-12d3-a456-426614174000
📝 Event Type: documento.deletion.requested
🕐 Timestamp: 2025-11-05T19:30:45.123456Z
📌 Version: 1.0

📦 Payload:
   Document ID: DOC-234567
   Citizen ID: CC-12345678
   Document Type: CEDULA
   Operation: DELETE

   📄 TEXTO IMPORTANTE:
   ╭─────────────────────────────────────────────────╮
   │ Eliminación de documento temporal solicitada... │
   ╰─────────────────────────────────────────────────╯

   🗂️  Metadata:
      Bucket: carpeta-ciudadana-docs
      Region: us-east-1
      Size: 2,048,576 bytes
      MIME Type: application/pdf

🔗 Correlación:
   Correlation ID: 987f6543-e21c-98d7-b654-987654321000
   Causation ID: 456a7890-b12c-34e5-f678-123456789abc

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 EVENTO COMPLETO (JSON):
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   "eventId": "123e4567-e89b-12d3-a456-426614174000", │
│   "eventType": "documento.deletion.requested",       │
│   "timestamp": "2025-11-05T19:30:45.123456Z",        │
│   ...                                                │
│ }                                                    │
└──────────────────────────────────────────────────────┘

✅ Mensaje confirmado (ACK enviado)
```

## ⚙️ Opciones Avanzadas

### Producer

```powershell
# Enviar a queue específica
python producer.py --queue minio.cleanup.queue

# Enviar múltiples eventos
python producer.py --count 100

# Cambiar tipo de evento
python producer.py --event-type documento.minio.cleanup
```

### Consumer

```powershell
# Auto-ACK (sin confirmación manual)
python consumer.py --auto-ack

# Aumentar prefetch (para mayor throughput)
python consumer.py --prefetch 10

# Queue diferente
python consumer.py --queue metadata.cleanup.queue
```

## 🐛 Troubleshooting

### Error: `ModuleNotFoundError: No module named 'pika'`

**Solución**:
```powershell
pip install pika
```

### Error: `AMQPConnectionError`

**Causa**: RabbitMQ no está corriendo o no es accesible.

**Solución**:
```powershell
# Verificar Docker Compose
cd ..\..\infrastructure\docker
docker compose ps

# Iniciar si no está corriendo
docker compose up -d

# Ver logs
docker compose logs rabbitmq-leader
```

### Error: `Queue not found`

**Causa**: Las queues no existen aún (no han sido declaradas).

**Solución**: Las queues deben ser declaradas primero por la aplicación Spring Boot o manualmente:

```powershell
# Declarar queue manualmente
docker exec -it rabbitmq-leader rabbitmqadmin declare queue ^
  name=documento.deletion.queue ^
  durable=true ^
  arguments="{\"x-queue-type\":\"quorum\"}"
```

### Consumer no recibe mensajes

**Verificaciones**:

1. **Ver mensajes en la queue**:
```powershell
docker exec -it rabbitmq-leader rabbitmqctl list_queues name messages
```

2. **Management UI**: http://localhost:15672
   - User: admin
   - Pass: admin123
   - Ver tab "Queues"

## 🎯 Testing de Quorum Queues

### Verificar Replicación

```powershell
# 1. Enviar eventos
python producer.py --count 5

# 2. Ver estado en cada nodo
docker exec rabbitmq-leader rabbitmqctl list_queues name type members

# 3. Detener un follower
docker stop carpeta-ciudadana-rabbitmq-follower-1

# 4. Verificar que consumer sigue funcionando
python consumer.py

# 5. Reiniciar follower
docker start carpeta-ciudadana-rabbitmq-follower-1
```

### Test de Failover

```powershell
# Terminal 1: Consumer corriendo
python consumer.py

# Terminal 2: Detener leader
docker stop rabbitmq-leader

# Terminal 1: Debería reconectarse automáticamente (o fallar gracefully)

# Terminal 2: Reiniciar leader
docker start rabbitmq-leader
```

## 📚 Referencias

- [RabbitMQ Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)
- [Pika Documentation](https://pika.readthedocs.io/)
- [ADR-0003: Event-Driven Architecture](../../docs/ADR/0003-eliminacion-documentos-event-driven-rabbitmq.md)
- [ADR-0004: Quorum Queues](../../docs/ADR/0004-rabbitmq-quorum-queues-arquitectura-leader-followers.md)
