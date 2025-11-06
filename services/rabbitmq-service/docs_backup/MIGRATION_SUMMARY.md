# Resumen de Migración: RabbitMQ de Docker Compose a Kubernetes

## 📋 Cambios Realizados

### 1. ✅ Estructura Nueva Creada

**Ubicación**: `services/rabbitmq-service/`

```
services/rabbitmq-service/
├── k8s/                                  # Manifiestos Kubernetes
│   ├── 00-namespace.yaml                 # Namespaces (carpeta-ciudadana, rabbitmq-system)
│   ├── 01-cluster-operator.yaml          # Instrucciones para instalar Cluster Operator
│   ├── 02-storage.yaml                   # StorageClass para PVs
│   ├── 03-rabbitmq-cluster.yaml          # RabbitmqCluster CR (3 nodos, RF=2)
│   └── 04-ingress.yaml                   # Ingress para Management UI
├── docs/
│   ├── INSTALL_KUBECTL_PLUGIN.md         # Guía instalación kubectl rabbitmq plugin
│   └── QUORUM_QUEUES.md                  # Guía Quorum Queues en K8s
├── README.md                             # Documentación completa del servicio
└── MIGRATION_SUMMARY.md                  # Este archivo
```

### 2. ❌ Eliminado de Docker Compose

**Archivo**: `infrastructure/docker/docker-compose.yml`

- ❌ Removido servicio `rabbitmq-leader`
- ❌ Removido servicio `rabbitmq-follower`
- ❌ Removido volume `rabbitmq-leader-data`
- ❌ Removidas referencias de RabbitMQ en `carpeta-ciudadana-service`
- ✅ Agregados comentarios indicando migración a Kubernetes

**Directorio eliminado**: `infrastructure/docker/rabbitmq/`
- ❌ `README.md` (contenía info de Docker Compose)
- ❌ `cluster-entrypoint.sh` (script de clustering para Docker)

### 3. 📝 ADRs Actualizados

**ADR-0004**: `docs/ADR/0004-rabbitmq-quorum-queues-arquitectura-leader-followers.md`

Agregada sección completa de actualización con:
- Arquitectura en Kubernetes con diagrama Mermaid
- Configuración del RabbitmqCluster CR
- Peer Discovery en Kubernetes (plugin kubernetes_peer_discovery_k8s)
- Quorum Queues con RF=2
- kubectl plugin para RabbitMQ (instalación con krew)
- Operator Environment Variables
- Persistencia con PVCs individuales por nodo
- Escalado del cluster
- Referencias a documentación oficial

**ADR-0005**: `docs/ADR/0005-ubicacion-rabbitmq-docker-compose-escalable.md`

Agregada sección completa de actualización con:
- Nueva decisión: migración a Kubernetes
- Motivación para la migración (limitaciones de Docker Compose)
- Nueva ubicación en `services/rabbitmq-service/`
- Arquitectura de despliegue (Desarrollo vs Staging/Producción)
- Configuración del cluster en Kubernetes
- Peer Discovery automático
- Persistencia con shared volume y carpetas por nodo
- kubectl plugin y operaciones
- Configuración del Operator
- Path forward: Docker Compose → Kubernetes (fases)
- Referencias a documentación

### 4. 🛠️ Herramienta de Testing Actualizada

**Archivos**: `tools/rabbitmq-tester/producer.py` y `consumer.py`

Cambios realizados:
- ✅ Agregados flags CLI: `--host`, `--port`, `--user`, `--password`
- ✅ Soporte para credenciales de Kubernetes secrets
- ✅ Comentarios indicando cómo usar con port-forward
- ✅ Mantiene compatibilidad con valores por defecto

**Archivo**: `tools/rabbitmq-tester/README.md`

- ✅ Reescrita sección de "Inicio Rápido" con Opción A (Kubernetes) y Opción B (Docker Compose legacy)
- ✅ Agregadas instrucciones para obtener credenciales de K8s
- ✅ Actualizados todos los ejemplos de comandos
- ✅ Tests avanzados actualizados para Kubernetes
- ✅ Agregada sección "Migración a Kubernetes" al final

## 🎯 Configuración del Cluster

### Especificaciones

- **Número de nodos**: 3 (mínimo para Quorum Queues)
- **Replication Factor**: 2
- **Seed Node**: `carpeta-rabbitmq-server-0` (ordinal 0)
- **Peer Discovery**: Automático vía plugin `rabbitmq_peer_discovery_k8s`
- **Persistencia**: 10Gi por nodo (PVC individual)
- **Plugins habilitados**:
  - `rabbitmq_management`
  - `rabbitmq_prometheus`
  - `rabbitmq_peer_discovery_k8s`

### Características del Peer Discovery

Según la documentación oficial de RabbitMQ:

1. **Seed Node Único**: Solo el pod con ordinal más bajo (`-0`) puede formar un nuevo cluster
2. **Join Automático**: Todos los demás pods se unen automáticamente al seed node
3. **Sin Configuración Manual**: El Cluster Operator configura todo
4. **Configuración Automática**:
   ```ini
   cluster_formation.peer_discovery_backend = kubernetes
   cluster_formation.k8s.host = kubernetes.default.svc.cluster.local
   cluster_formation.k8s.address_type = hostname
   cluster_formation.k8s.ordinal_start = 0  # Default
   ```

## 🚀 Cómo Desplegar

### Requisitos Previos

1. **Kubernetes cluster** (minikube, kind, k3s, GKE, EKS, AKS)
2. **kubectl** 1.24+
3. **krew** (opcional, para plugin rabbitmq)

### Pasos de Instalación

```bash
# 1. Instalar RabbitMQ Cluster Operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# 2. Crear namespaces y configuración
cd services/rabbitmq-service
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/02-storage.yaml

# 3. Desplegar cluster (3 nodos)
kubectl apply -f k8s/03-rabbitmq-cluster.yaml

# 4. Opcional: Ingress para Management UI
kubectl apply -f k8s/04-ingress.yaml

# 5. Verificar despliegue
kubectl get rabbitmqclusters -n carpeta-ciudadana
kubectl get pods -n carpeta-ciudadana -w

# 6. Obtener credenciales
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

# 7. Port-forward para acceso local
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672 &

# 8. Acceder a Management UI
open http://localhost:15672
```

## 🧪 Testing

Ver `tools/rabbitmq-tester/README.md` para pruebas completas.

**Prueba rápida**:

```bash
cd tools/rabbitmq-tester

# Terminal 1: Consumer
python consumer.py --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD

# Terminal 2: Producer
python producer.py --count 5 --host localhost --user $RABBITMQ_USER --password $RABBITMQ_PASSWORD
```

## 📚 Documentación Disponible

1. **README Principal**: `services/rabbitmq-service/README.md`
   - Instalación completa
   - Operaciones comunes
   - Troubleshooting
   - Monitoring

2. **Instalación kubectl Plugin**: `services/rabbitmq-service/docs/INSTALL_KUBECTL_PLUGIN.md`
   - Instalación de krew
   - Instalación del plugin rabbitmq
   - Comandos principales

3. **Quorum Queues**: `services/rabbitmq-service/docs/QUORUM_QUEUES.md`
   - Qué son las Quorum Queues
   - Cómo crearlas (UI, CLI, código)
   - Replication Factor
   - Conversión desde Classic Queues
   - Testing de failover

4. **ADR-0004**: Decisiones de arquitectura (Quorum Queues + K8s)

5. **ADR-0005**: Decisiones de ubicación (Docker Compose → Kubernetes)

## 🔗 Referencias Oficiales

Todas las referencias están incluidas en los documentos actualizados:

- [RabbitMQ Kubernetes Operator Overview](https://www.rabbitmq.com/kubernetes/operator/operator-overview)
- [RabbitMQ Cluster Formation](https://www.rabbitmq.com/docs/cluster-formation)
- [Peer Discovery on Kubernetes](https://www.rabbitmq.com/docs/cluster-formation#peer-discovery-k8s)
- [RabbitMQ Quorum Queues](https://www.rabbitmq.com/docs/quorum-queues)
- [kubectl Plugin](https://www.rabbitmq.com/kubernetes/operator/kubectl-plugin)
- [Configure Operator Defaults](https://www.rabbitmq.com/kubernetes/operator/configure-operator-defaults)
- [DIY Kubernetes Examples](https://github.com/rabbitmq/diy-kubernetes-examples/tree/master/minikube)

## ✅ Checklist de Migración Completada

- [x] Crear estructura `services/rabbitmq-service/`
- [x] Crear manifiestos Kubernetes (5 archivos)
- [x] Configurar cluster de 3 nodos
- [x] Configurar Replication Factor de 2
- [x] Configurar Peer Discovery automático en Kubernetes
- [x] Configurar persistencia con volúmenes compartidos (PVC por nodo)
- [x] Remover RabbitMQ de `infrastructure/docker/docker-compose.yml`
- [x] Eliminar directorio `infrastructure/docker/rabbitmq/`
- [x] Actualizar ADR-0004 con información de Kubernetes
- [x] Actualizar ADR-0005 con información de migración
- [x] Actualizar `tools/rabbitmq-tester/producer.py` con flags CLI
- [x] Actualizar `tools/rabbitmq-tester/consumer.py` con flags CLI
- [x] Actualizar `tools/rabbitmq-tester/README.md` con instrucciones K8s
- [x] Crear documentación de kubectl plugin
- [x] Crear documentación de Quorum Queues
- [x] Incluir todas las referencias oficiales solicitadas

## 🎓 Próximos Pasos

1. **Desplegar en cluster de desarrollo**: Validar funcionamiento
2. **Crear Quorum Queues**: Usar Management UI o código
3. **Probar failover**: Eliminar pods y verificar auto-healing
4. **Escalar el cluster**: Probar con 5 nodos
5. **Configurar monitoring**: Prometheus + Grafana
6. **Producción**: Desplegar en cluster productivo con multi-AZ

---

**Migración completada**: 2025-11-05  
**Autor**: Equipo Carpeta Ciudadana  
**Estado**: ✅ Listo para testing en Kubernetes
