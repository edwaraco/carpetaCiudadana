# Carpeta Ciudadana - Infraestructura de Desarrollo Local

Esta carpeta contiene la configuración de Docker Compose para ejecutar toda la infraestructura necesaria para el desarrollo local del sistema Carpeta Ciudadana.

## Componentes Incluidos

### 1. **MinIO** - Almacenamiento de Documentos (S3-compatible)
- **Puerto**: 9000 (API), 9001 (Console)
- **Acceso Console**: http://localhost:9001
- **Credenciales**: admin / admin123

### 2. **DynamoDB Local** - Base de Datos NoSQL
- **Puerto**: 8000
- **AWS Endpoint**: http://localhost:8000

### 3. **DynamoDB Admin** - Interfaz Web para DynamoDB
- **Puerto**: 8001
- **Acceso**: http://localhost:8001

### 4. **RabbitMQ Cluster** - Message Broker (3 Nodos)
- **Arquitectura**: Quorum Queues con replicación factor 2
- **Nodos**:
  - Nodo 1 (Líder): http://localhost:15672 (AMQP: 5672)
  - Nodo 2 (Follower): http://localhost:15673 (AMQP: 5673)
  - Nodo 3 (Follower): http://localhost:15674 (AMQP: 5674)
- **Credenciales**: admin / admin123
- **ADRs**: Ver ADR-0004 (Quorum Queues) y ADR-0005 (Ubicación)

### 5. **Carpeta Ciudadana Service** - Microservicio Spring Boot
- **Puerto**: 8080
- **API Base**: http://localhost:8080

## Inicio Rápido

### Requisitos Previos

- Docker Desktop 4.0+ con Docker Compose
- Mínimo 16GB RAM (recomendado)
- Mínimo 4 cores CPU
- 20GB espacio en disco disponible

### Iniciar Toda la Infraestructura

```bash
# Desde la raíz del proyecto
cd infrastructure/docker

# Iniciar todos los servicios
docker-compose up -d

# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f rabbitmq-node1
```

### Verificar Estado de los Servicios

```bash
# Ver servicios en ejecución
docker-compose ps

# Verificar salud de los servicios
docker-compose ps --format json | jq '.[] | {name: .Name, status: .Status, health: .Health}'
```

## RabbitMQ Cluster

### Verificar Estado del Cluster

```bash
# Conectarse a nodo 1
docker exec -it carpeta-rabbitmq-node1 rabbitmqctl cluster_status

# Salida esperada:
# Cluster name: rabbit@rabbitmq-node1
# Running nodes: [rabbit@rabbitmq-node1, rabbit@rabbitmq-node2, rabbit@rabbitmq-node3]
# Versions: rabbit@rabbitmq-node1: 3.12.x
```

### Verificar Quorum Queues

```bash
# Listar todas las queues
docker exec -it carpeta-rabbitmq-node1 rabbitmqctl list_queues name type state

# Verificar que las queues sean de tipo "quorum"
# Ejemplo de salida:
# documento.deletion.queue    quorum  running
# minio.cleanup.queue         quorum  running
```

### Acceder a Management UI

- **Nodo 1**: http://localhost:15672
- **Nodo 2**: http://localhost:15673
- **Nodo 3**: http://localhost:15674

**Usuario**: admin  
**Contraseña**: admin123

En la interfaz, verifica:
1. **Overview** → Cluster name: debería mostrar 3 nodos
2. **Queues** → Tipo: "Quorum" para las queues críticas
3. **Admin** → Cluster → Ver los 3 nodos activos

### Test de Failover (Desarrollo)

```bash
# 1. Detener el nodo líder
docker stop carpeta-rabbitmq-node1

# 2. Verificar que el cluster sigue funcionando
docker exec -it carpeta-rabbitmq-node2 rabbitmqctl cluster_status

# 3. Reiniciar el nodo
docker start carpeta-rabbitmq-node1

# 4. Verificar re-sincronización
docker exec -it carpeta-rabbitmq-node1 rabbitmqctl cluster_status
```

## Detener la Infraestructura

### Detener sin eliminar datos

```bash
docker-compose down
```

### Detener y eliminar TODOS los datos (⚠️ Data Loss)

```bash
docker-compose down -v
```

### Detener un servicio específico

```bash
# Detener solo RabbitMQ
docker-compose stop rabbitmq-node1 rabbitmq-node2 rabbitmq-node3

# Reiniciar RabbitMQ
docker-compose start rabbitmq-node1 rabbitmq-node2 rabbitmq-node3
```

## Troubleshooting

### RabbitMQ no forma el cluster

**Síntomas**: Los nodos 2 y 3 no se unen al cluster

**Solución**:
```bash
# 1. Verificar que el nodo 1 esté saludable
docker exec carpeta-rabbitmq-node1 rabbitmq-diagnostics ping

# 2. Ver logs de nodos 2 y 3
docker-compose logs rabbitmq-node2 rabbitmq-node3

# 3. Reiniciar formación del cluster
docker-compose restart rabbitmq-node2 rabbitmq-node3
```

### Error "Erlang Cookie mismatch"

**Causa**: Los nodos tienen diferentes Erlang cookies

**Solución**: Verificar que todos los nodos tengan el mismo `RABBITMQ_ERLANG_COOKIE` en docker-compose.yml

### Disco lleno en un nodo

**Síntomas**: RabbitMQ bloquea publishers

**Solución**:
```bash
# Ver uso de disco
docker exec carpeta-rabbitmq-node1 df -h

# Limpiar datos antiguos (⚠️ solo desarrollo)
docker volume rm carpeta-rabbitmq-node1-data
docker-compose up -d rabbitmq-node1
```

### Puerto ya en uso

**Síntomas**: Error al iniciar: "port is already allocated"

**Solución**:
```bash
# Ver qué proceso usa el puerto
lsof -i :5672
# o en Linux:
sudo netstat -tulpn | grep 5672

# Detener el proceso conflictivo o cambiar el puerto en docker-compose.yml
```

## Configuración Avanzada

### Perfil "Light" (1 solo nodo RabbitMQ)

Para desarrollo de features que no requieren HA:

```bash
# Crear docker-compose.override.yml
cat > docker-compose.override.yml <<EOF
services:
  rabbitmq-node2:
    profiles: [full]
  rabbitmq-node3:
    profiles: [full]
EOF

# Iniciar solo con 1 nodo
docker-compose up -d
```

### Cambiar Configuración de RabbitMQ

Crear archivo `rabbitmq/rabbitmq.conf`:

```ini
# Límites de memoria
vm_memory_high_watermark.relative = 0.6

# Límites de disco
disk_free_limit.absolute = 2GB

# Heartbeat
heartbeat = 60

# Logging
log.console.level = info
```

Montar en docker-compose.yml:
```yaml
volumes:
  - ./rabbitmq/rabbitmq.conf:/etc/rabbitmq/rabbitmq.conf:ro
```

## Monitoreo

### Métricas de RabbitMQ

Acceder a http://localhost:15672 y navegar a:
- **Overview**: Métricas generales del cluster
- **Queues**: Estado de queues, mensajes pending, consumers activos
- **Nodes**: CPU, memoria, disco de cada nodo

### Logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo RabbitMQ
docker-compose logs -f rabbitmq-node1 rabbitmq-node2 rabbitmq-node3

# Últimas 100 líneas
docker-compose logs --tail=100 rabbitmq-node1
```

### Exportar métricas (Prometheus)

```bash
# Habilitar plugin de Prometheus
docker exec carpeta-rabbitmq-node1 rabbitmq-plugins enable rabbitmq_prometheus

# Métricas disponibles en:
# http://localhost:15692/metrics
```

## Referencias

- [ADR-0003: Eliminación de Documentos Event-Driven](../../docs/ADR/0003-eliminacion-documentos-event-driven-rabbitmq.md)
- [ADR-0004: RabbitMQ Quorum Queues (3 Nodos, RF=2)](../../docs/ADR/0004-rabbitmq-quorum-queues-3-nodos-replicacion-2.md)
- [ADR-0005: Ubicación de RabbitMQ en Docker Compose](../../docs/ADR/0005-ubicacion-rabbitmq-docker-compose.md)
- [RabbitMQ Clustering Guide](https://www.rabbitmq.com/clustering.html)
- [RabbitMQ Quorum Queues](https://www.rabbitmq.com/quorum-queues.html)

## Notas de Desarrollo

1. **Primer inicio**: Los nodos 2 y 3 tardan ~60 segundos en unirse al cluster
2. **Recursos**: El cluster completo consume ~4GB RAM + servicios adicionales
3. **Red**: Todos los servicios están en la red `carpeta-ciudadana-network`
4. **Persistencia**: Los datos se almacenan en volumes Docker nombrados
5. **Backup**: Los volumes pueden ser respaldados con `docker volume inspect <volume_name>`
