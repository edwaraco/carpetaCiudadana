# RabbitMQ Tester - Carpeta Ciudadana

Scripts Python para testing del cluster RabbitMQ con Quorum Queues.

## 📋 Pre-requisitos

### Software Requerido

- **Docker Desktop** 4.0+ corriendo y saludable
- **Python** 3.8+ con pip
- **RAM**: 12GB+ disponible (para cluster de 5 nodos)

### Verificar Instalación

```powershell
# Verificar Docker
docker --version
docker compose version

# Verificar Python
python --version
pip --version
```

## 🚀 Inicio Rápido

### 1. Levantar RabbitMQ Cluster

```powershell
# Desde la raíz del proyecto
cd infrastructure\docker

# Iniciar cluster (1 Leader + 4 Followers = 5 nodos)
docker compose up -d

# Ver logs de RabbitMQ
docker compose logs -f rabbitmq-leader rabbitmq-follower

# Verificar cluster (debe mostrar 5 nodos)
docker exec -it rabbitmq-leader rabbitmqctl cluster_status
```

**⏳ Primera vez**: Docker descarga imágenes (~2-5 min)

**Management UI**: <http://localhost:15672> (admin / admin123)

### 2. Crear Quorum Queues

Opción A - **Management UI** (recomendado):

1. Ir a <http://localhost:15672> → Login: `admin` / `admin123`
2. Click "Queues" → "Add a new queue"
3. Type: **Quorum**, Name: `documento.deletion.queue`, Durable: ✅
4. Repetir para: `minio.cleanup.queue`, `metadata.cleanup.queue`

Opción B - **CLI**:

```powershell
docker exec -it rabbitmq-leader rabbitmqadmin declare queue `
  name=documento.deletion.queue durable=true `
  arguments='{\"x-queue-type\":\"quorum\",\"x-quorum-initial-group-size\":3}'
```

### 3. Instalar Dependencias Python

```powershell
# Navegar a esta carpeta
cd tools\rabbitmq-tester

# Instalar pika
pip install -r requirements.txt
```

### 4. Ejecutar Tests

**Terminal 1 - Consumer** (espera mensajes):

```powershell
python consumer.py
```

**Terminal 2 - Producer** (envía mensajes):

```powershell
python producer.py --count 3
```

✅ **Éxito**: Terminal 1 muestra los 3 eventos con detalle completo incluyendo el **TEXTO IMPORTANTE**.

## 📝 Uso de Scripts

### Producer - Enviar Eventos

```powershell
# Enviar 1 evento (default)
python producer.py

# Enviar múltiples eventos
python producer.py --count 10

# Enviar a queue específica
python producer.py --queue minio.cleanup.queue --count 5

# Cambiar tipo de evento
python producer.py --event-type documento.minio.cleanup

# Ver ayuda
python producer.py --help
```

### Consumer - Recibir Eventos

```powershell
# Consumir con ACK manual (default)
python consumer.py

# Consumir de queue diferente
python consumer.py --queue metadata.cleanup.queue

# Auto-acknowledgement (sin confirmación manual)
python consumer.py --auto-ack

# Aumentar prefetch para mayor throughput
python consumer.py --prefetch 10

# Ver ayuda
python consumer.py --help
```

## 📊 Eventos Generados

Los scripts generan eventos con la siguiente estructura:

```json
{
  "eventId": "uuid-v4",
  "eventType": "documento.deletion.requested",
  "timestamp": "2025-11-05T19:30:45.123456Z",
  "version": "1.0",
  "payload": {
    "documentId": "DOC-123456",
    "citizenId": "CC-12345678",
    "documentType": "CEDULA | PASAPORTE | ...",
    "operation": "DELETE | CLEANUP | UPDATE | ...",
    "description": "Texto aleatorio descriptivo",
    "metadata": {
      "bucket": "carpeta-ciudadana-docs",
      "region": "us-east-1",
      "size": 2048576,
      "mimeType": "application/pdf"
    }
  },
  "correlationId": "uuid-v4",
  "causationId": "uuid-v4"
}
```

El **consumer** muestra el evento completo + el **TEXTO IMPORTANTE** resaltado en una caja.

## 🐛 Troubleshooting

| Error | Causa | Solución |
|-------|-------|----------|
| `ModuleNotFoundError: No module named 'pika'` | Pika no instalado | `pip install pika` |
| `AMQPConnectionError` | RabbitMQ no está corriendo | `docker compose up -d` en `infrastructure/docker` |
| `Queue not found` | Queues no declaradas | Crear queues vía Management UI o CLI (ver paso 2) |
| Consumer no recibe mensajes | Queues vacías o no conectado | Verificar con `docker exec rabbitmq-leader rabbitmqctl list_queues name messages` |
| `port is already allocated` | Puerto 5672 en uso | Ver proceso: `netstat -ano \| findstr :5672` y matar o cambiar puerto |

### Docker Desktop no está corriendo

**Síntoma**: `error during connect: open //./pipe/dockerDesktopLinuxEngine`

**Solución**:

1. Abrir Docker Desktop desde menú inicio
2. Esperar a que ícono se ponga verde
3. Ejecutar `docker info` para verificar

## 🧪 Tests Avanzados

### Test 1: Replicación de Quorum Queues

```powershell
# 1. Enviar eventos
python producer.py --count 5

# 2. Verificar replicación (debe mostrar 3 miembros por queue)
docker exec rabbitmq-leader rabbitmqctl list_queues name type members

# 3. Detener un follower
docker stop infrastructure-docker-rabbitmq-follower-1

# 4. Consumer debe seguir funcionando (quorum = 2/3 nodos)
python consumer.py

# 5. Reiniciar follower
docker start infrastructure-docker-rabbitmq-follower-1
```

### Test 2: Failover del Leader

```powershell
# Terminal 1: Iniciar consumer
python consumer.py

# Terminal 2: Enviar mensajes
python producer.py --count 10

# Terminal 3: Simular falla del leader
docker stop rabbitmq-leader

# Terminal 2: Intentar enviar más mensajes (debería fallar)
python producer.py --count 3

# Terminal 3: Recuperar leader
docker start rabbitmq-leader

# Terminal 2: Reintentar (debería funcionar)
python producer.py --count 3
```

### Test 3: Escalabilidad del Cluster

```powershell
# Escalar a 10 nodos
cd ..\..\infrastructure\docker
docker compose up -d --scale rabbitmq-follower=9

# Verificar cluster
docker exec rabbitmq-leader rabbitmqctl cluster_status

# Probar throughput
cd ..\..\tools\rabbitmq-tester
python producer.py --count 100
```

## � Referencias

### Documentación del Proyecto

- [README RabbitMQ Cluster](../../infrastructure/docker/rabbitmq/README.md) - Arquitectura y configuración detallada
- [ADR-0003: Event-Driven Architecture](../../docs/ADR/0003-eliminacion-documentos-event-driven-rabbitmq.md)
- [ADR-0004: Quorum Queues Leader-Followers](../../docs/ADR/0004-rabbitmq-quorum-queues-arquitectura-leader-followers.md)
- [ADR-0005: Ubicación Docker Compose](../../docs/ADR/0005-ubicacion-rabbitmq-docker-compose-escalable.md)

### Documentación Externa

- [RabbitMQ Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)
- [RabbitMQ Cluster Sizing](https://www.rabbitmq.com/blog/2020/06/18/cluster-sizing-and-other-considerations)
- [Pika Documentation](https://pika.readthedocs.io/)

---

**💡 Tip**: Para desarrollo normal usa 3-5 nodos. Para stress testing escala hasta 10-50 nodos.
