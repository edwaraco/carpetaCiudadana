# RabbitMQ Tester - Carpeta Ciudadana

Scripts Python para testing del cluster RabbitMQ con Quorum Queues en Kubernetes o Docker Compose.

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

### Opción A: Testing con Kubernetes (Recomendado)

```bash
# 1. Iniciar cluster Kubernetes (minikube, kind, etc.)
minikube start

# 2. Desplegar RabbitMQ
cd services/rabbitmq-service
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml
kubectl apply -f k8s/

# 3. Esperar a que los pods estén listos
kubectl get pods -n carpeta-ciudadana -w

# 4. Port-forward para acceso local
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672 &

# 5. Obtener credenciales
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

echo "User: $RABBITMQ_USER"
echo "Password: $RABBITMQ_PASSWORD"
```

**Management UI**: <http://localhost:15672> (usar credenciales de arriba)

### Opción B: Testing con Docker Compose (Legacy)

**⚠️ Nota**: RabbitMQ ha sido migrado a Kubernetes. Docker Compose ya no incluye RabbitMQ.

Para desarrollo local con Docker Compose, usar port-forward desde Kubernetes como se muestra arriba.

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

```bash
# Con Kubernetes (usando credenciales de K8s)
python consumer.py --host localhost --port 5672 \
  --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# O con valores por defecto (si no cambió admin/admin123)
python consumer.py
```

**Terminal 2 - Producer** (envía mensajes):

```bash
# Con Kubernetes (usando credenciales de K8s)
python producer.py --count 3 --host localhost --port 5672 \
  --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# O con valores por defecto
python producer.py --count 3
```

✅ **Éxito**: Terminal 1 muestra los 3 eventos con detalle completo incluyendo el **TEXTO IMPORTANTE**.

## 📝 Uso de Scripts

### Producer - Enviar Eventos

```bash
# Enviar 1 evento (default)
python producer.py

# Enviar múltiples eventos
python producer.py --count 10

# Enviar a queue específica
python producer.py --queue minio.cleanup.queue --count 5

# Cambiar tipo de evento
python producer.py --event-type documento.minio.cleanup

# Especificar host y credenciales para Kubernetes
python producer.py --host localhost --port 5672 \
  --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD --count 5

# Ver ayuda
python producer.py --help
```

### Consumer - Recibir Eventos

```bash
# Consumir con ACK manual (default)
python consumer.py

# Consumir de queue diferente
python consumer.py --queue metadata.cleanup.queue

# Auto-acknowledgement (sin confirmación manual)
python consumer.py --auto-ack

# Aumentar prefetch para mayor throughput
python consumer.py --prefetch 10

# Especificar host y credenciales para Kubernetes
python consumer.py --host localhost --port 5672 \
  --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

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

### Test 1: Replicación de Quorum Queues (Kubernetes)

```bash
# 1. Enviar eventos
python producer.py --count 5 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# 2. Verificar replicación (debe mostrar 3 miembros por queue)
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl list_queues name type members

# 3. Simular fallo de un nodo
kubectl delete pod carpeta-rabbitmq-server-2 -n carpeta-ciudadana

# 4. Consumer debe seguir funcionando (quorum = 2/3 nodos)
python consumer.py --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# 5. El pod se recrea automáticamente (auto-healing)
kubectl get pods -n carpeta-ciudadana -w
```

### Test 2: Failover del Seed Node (Kubernetes)

```bash
# Terminal 1: Iniciar consumer
python consumer.py --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 2: Enviar mensajes
python producer.py --count 10 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 3: Simular falla del seed node
kubectl delete pod carpeta-rabbitmq-server-0 -n carpeta-ciudadana

# Terminal 2: Raft elige nuevo líder (~5 segundos), sistema sigue funcionando
sleep 10
python producer.py --count 5 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 3: El pod se recrea automáticamente
kubectl get pods -n carpeta-ciudadana -w
```

### Test 3: Escalabilidad del Cluster (Kubernetes)

```bash
# Escalar a 5 nodos
kubectl patch rabbitmqcluster carpeta-rabbitmq -n carpeta-ciudadana \
  --type merge -p '{"spec":{"replicas":5}}'

# Verificar cluster
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl cluster_status

# Probar throughput
python producer.py --count 100 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD
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

## 🔄 Migración a Kubernetes

Este proyecto ha migrado RabbitMQ de Docker Compose a Kubernetes. Los scripts de testing ahora soportan ambos ambientes:

**Docker Compose (Legacy)**:
- ❌ RabbitMQ removido de `infrastructure/docker/docker-compose.yml`
- ❌ Directorio `infrastructure/docker/rabbitmq/` eliminado

**Kubernetes (Actual)**:
- ✅ RabbitMQ desplegado con Cluster Operator
- ✅ Ubicación: `services/rabbitmq-service/`
- ✅ Scripts actualizados con flags `--host`, `--port`, `--user`, `--password`
- ✅ Soporte para obtener credenciales de secrets de Kubernetes

**Para más información**:
- Ver: `services/rabbitmq-service/README.md` - Guía completa de Kubernetes
- Ver: `docs/ADR/0004-rabbitmq-quorum-queues-arquitectura-leader-followers.md` - Decisión de arquitectura
- Ver: `docs/ADR/0005-ubicacion-rabbitmq-docker-compose-escalable.md` - Decisión de migración

---

**Última actualización**: 2025-11-05 - Migración a Kubernetes completada
