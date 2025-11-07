# RabbitMQ Deployment Guide

Guía completa de despliegue del servicio RabbitMQ en Kubernetes para el proyecto Carpeta Ciudadana.

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#-pre-requisitos)
2. [Instalación de Herramientas](#-instalación-de-herramientas)
3. [Despliegue del Cluster](#-despliegue-del-cluster)
4. [Verificación del Despliegue](#-verificación-del-despliegue)
5. [Acceso al Management UI](#-acceso-al-management-ui)
6. [Operaciones Post-Despliegue](#-operaciones-post-despliegue)
7. [Troubleshooting](#-troubleshooting)
8. [Comandos Útiles](#-comandos-útiles-y-fun-facts)

---

## 🛠️ Pre-requisitos

### Requisitos de Sistema

- **CPU**: 3 cores mínimo
- **RAM**: 6GB mínimo
- **Disco**: 30GB mínimo
- **SO**: Windows 10/11, macOS, o Linux

### Software Requerido

- kubectl 1.24+
- Kubernetes cluster (Minikube, Docker Desktop, Kind, K3s, o cloud)
- Git (para clonar el repositorio)

---

## 🔧 Instalación de Herramientas

### Instalar kubectl

#### Windows (PowerShell)

```powershell
# Opción 1: Usando winget (Windows Package Manager)
winget install -e --id Kubernetes.kubectl

# Opción 2: Usando Chocolatey
choco install kubernetes-cli

# Verificar instalación
kubectl version --client
```

#### macOS

```bash
# Usando Homebrew
brew install kubectl

# Verificar instalación
kubectl version --client
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y kubectl

# Fedora/RHEL
sudo dnf install kubectl

# Verificar instalación
kubectl version --client
```

### Instalar Kubernetes Cluster

Elige una de estas opciones según tu entorno:

#### Opción 1: Minikube (Recomendado para desarrollo)

**Windows:**

```powershell
# Instalar Minikube
winget install -e --id Kubernetes.minikube

# Iniciar cluster con recursos adecuados. Abre powershell como Administrador
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V-Tools-All -All
minikube start --driver=hyperv --memory=6144 --cpus=2

# Si no tienes Hyper-V, usa VirtualBox o Docker o Kind
minikube start --driver=virtualbox --memory=6144 --cpus=2
# o
minikube start --driver=docker --memory=6144 --cpus=2
# o
minikube start --driver=kind --memory=6144 --cpus=2

# Verificar que esté corriendo
kubectl cluster-info
kubectl get nodes
```

**macOS/Linux:**

```bash
# macOS con Homebrew
brew install minikube

# Linux
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Iniciar cluster
minikube start --memory=6144 --cpus=2

# Verificar
kubectl cluster-info
kubectl get nodes
```

#### Opción 2: Docker Desktop Kubernetes

Si tienes Docker Desktop instalado:

1. Abrir Docker Desktop
2. Ir a Settings → Kubernetes
3. Marcar "Enable Kubernetes"
4. Click en "Apply & Restart"
5. Esperar a que el cluster inicie
6. Verificar: `kubectl cluster-info`

#### Opción 3: Kind (Kubernetes in Docker)

```bash
# Instalar kind
# macOS
brew install kind

# Linux
curl -Lo ./kind https://kind.sigs.k8s.io/dl/v0.20.0/kind-linux-amd64
chmod +x ./kind
sudo mv ./kind /usr/local/bin/kind

# Crear cluster
kind create cluster --name rabbitmq-dev

# Verificar
kubectl cluster-info
```

### Instalar "make" (Opcional pero recomendado)

El proyecto incluye un Makefile con comandos útiles.

#### Windows

```powershell
# Abrir PowerShell como Administrador

# 1. Instalar Chocolatey (si no lo tienes)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Cerrar y reabrir PowerShell como Administrador

# 3. Instalar make
choco install make

# 4. Verificar instalación (cierra y reabre PowerShell)
make --version
```

#### macOS

```bash
# make viene preinstalado con Command Line Tools
xcode-select --install

# Verificar
make --version
```

#### Linux

```bash
# Ubuntu/Debian
sudo apt-get install build-essential

# Fedora/RHEL
sudo dnf install make

# Verificar
make --version
```

---

## 🚀 Despliegue del Cluster

### Paso 1: Instalar RabbitMQ Cluster Operator

El Operator gestiona el ciclo de vida del cluster de RabbitMQ.

```bash
# Instalar la última versión del operator
kubectl apply -f https://github.com/rabbitmq/cluster-operator/releases/latest/download/cluster-operator.yml

# Verificar que el operator esté corriendo
kubectl get pods -n rabbitmq-system

# Deberías ver algo como:
# NAME                                         READY   STATUS    RESTARTS   AGE
# rabbitmq-cluster-operator-7d9b8b9f4d-xxxxx   1/1     Running   0          30s
```

**Validación de CRDs:**

```bash
# Verificar que los Custom Resource Definitions se instalaron
kubectl get customresourcedefinition | grep rabbitmq

# Deberías ver:
# rabbitmqclusters.rabbitmq.com
```

### Paso 2: Desplegar el Cluster RabbitMQ

```bash
# Navegar al directorio del servicio
cd services/rabbitmq-service

# Aplicar todos los manifiestos de Kubernetes
kubectl apply -f k8s/

# Esto creará:
# - Namespaces (carpeta-ciudadana, rabbitmq-system)
# - StorageClass para persistencia
# - RabbitmqCluster (3 nodos)
# - Ingress para Management UI
# - ConfigMap con definiciones de queues
```

**Salida esperada:**

```
namespace/carpeta-ciudadana created
namespace/rabbitmq-system configured
storageclass.storage.k8s.io/standard configured
rabbitmqcluster.rabbitmq.com/carpeta-rabbitmq created
ingress.networking.k8s.io/carpeta-rabbitmq-ingress created
configmap/rabbitmq-definitions created
```

### Paso 3: Monitorear el Despliegue

Los pods tardan entre 2-3 minutos en estar completamente operativos.

```bash
# Ver el estado del cluster
kubectl get rabbitmqclusters -n carpeta-ciudadana

# Monitorear los pods (Ctrl+C para salir)
kubectl get pods -n carpeta-ciudadana -w

# Esperar hasta ver todos los pods 1/1 Running:
# NAME                           READY   STATUS    RESTARTS   AGE
# carpeta-rabbitmq-server-0      1/1     Running   0          2m
# carpeta-rabbitmq-server-1      1/1     Running   0          90s
# carpeta-rabbitmq-server-2      1/1     Running   0          60s
```

---

## ✅ Verificación del Despliegue

### Verificar Estado del Cluster RabbitMQ

```bash
# Opción 1: Usar kubectl rabbitmq plugin (si lo instalaste)
kubectl rabbitmq get carpeta-rabbitmq -n carpeta-ciudadana

# Opción 2: Verificar manualmente
kubectl get rabbitmqclusters -n carpeta-ciudadana

# Deberías ver:
# NAME               ALLREPLICASREADY   RECONCILESUCCESS   AGE
# carpeta-rabbitmq   True               True               3m
```

### Verificar Nodos del Cluster

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl cluster_status

# Deberías ver los 3 nodos:
# Cluster name: carpeta-rabbitmq
# Nodes: [rabbit@carpeta-rabbitmq-server-0,
#         rabbit@carpeta-rabbitmq-server-1,
#         rabbit@carpeta-rabbitmq-server-2]
# Running nodes: [rabbit@carpeta-rabbitmq-server-0,
#                 rabbit@carpeta-rabbitmq-server-1,
#                 rabbit@carpeta-rabbitmq-server-2]
```

### Verificar Queues Configuradas

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl list_queues name type durable

# Deberías ver las queues configuradas:
# document_verification_request    quorum  true
# document_verified_response       quorum  true
# test_queue                       quorum  true
# document_verification_request.dlq quorum true
# document_verified_response.dlq   quorum  true
```

### Verificar Persistencia (PVCs)

```bash
kubectl get pvc -n carpeta-ciudadana

# Deberías ver 3 PVCs de 10Gi cada uno:
# NAME                                           STATUS   VOLUME                                     CAPACITY
# persistence-carpeta-rabbitmq-server-0          Bound    pvc-xxxxx                                  10Gi
# persistence-carpeta-rabbitmq-server-1          Bound    pvc-yyyyy                                  10Gi
# persistence-carpeta-rabbitmq-server-2          Bound    pvc-zzzzz                                  10Gi
```

---

## 🌐 Acceso al Management UI

### Obtener Credenciales

Tienes dos opciones para acceder:

#### Opción 1: Usuario Admin Predefinido (Más Fácil)

Usa las credenciales definidas en el archivo de configuración:

- **Usuario**: `admin`
- **Contraseña**: `admin123`

#### Opción 2: Usuario Default Generado por el Operator

**Linux/macOS:**

```bash
export RABBITMQ_USER=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | base64 -d)
export RABBITMQ_PASSWORD=$(kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | base64 -d)

echo "Usuario: $RABBITMQ_USER"
echo "Contraseña: $RABBITMQ_PASSWORD"
```

**Windows PowerShell:**

```powershell
$RABBITMQ_USER = kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.username}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

$RABBITMQ_PASSWORD = kubectl get secret carpeta-rabbitmq-default-user -n carpeta-ciudadana -o jsonpath='{.data.password}' | ForEach-Object { [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($_)) }

Write-Host "Usuario: $RABBITMQ_USER"
Write-Host "Contraseña: $RABBITMQ_PASSWORD"
```

### Port-Forward para Acceso Local

```bash
# Port-forward de Management UI (15672) y AMQP (5672)
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672

# Dejar esta terminal abierta mientras uses RabbitMQ
```

**Windows:**

```powershell
# Abrir Management UI en navegador
start http://localhost:15672
```

**macOS:**

```bash
open http://localhost:15672
```

**Linux:**

```bash
xdg-open http://localhost:15672
# o simplemente abre el navegador manualmente
```

### Verificar Acceso al UI

1. Abrir <http://localhost:15672> en tu navegador
2. Ingresar credenciales (admin/admin123)
3. Deberías ver el dashboard con:
   - **Overview**: 3 nodos running
   - **Queues**: 5 queues (3 principales + 2 DLQs)
   - **Exchanges**: carpeta.events, carpeta.dlx

---

## 🔄 Operaciones Post-Despliegue

### Verificar Usuarios

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_users

# Deberías ver:
# Listing users ...
# user    tags
# admin   [administrator]
# default_user_XXXXX  [administrator]
```

### Verificar Exchanges

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl list_exchanges name type durable

# Deberías ver:
# carpeta.events    topic    true
# carpeta.dlx       topic    true
# (+ exchanges por defecto de RabbitMQ)
```

### Probar Conectividad

```bash
cd ../../tools/rabbitmq-tester

# Terminal 1: Iniciar consumer
python consumer.py --host localhost --port 5672 --user admin --password admin123

# Terminal 2: Enviar mensajes
python producer.py --count 5 --host localhost --port 5672 --user admin --password admin123

# Deberías ver mensajes siendo enviados y recibidos
```

### Aplicar Cambios a la Configuración

Si modificas algún archivo en `k8s/`:

```bash
# Aplicar cambios
kubectl apply -f k8s/

# Reiniciar el StatefulSet para aplicar cambios
kubectl rollout restart statefulset/carpeta-rabbitmq-server -n carpeta-ciudadana

# Esperar a que termine el rollout
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n carpeta-ciudadana --timeout=300s

# Verificar que todos los pods estén corriendo
kubectl get pods -n carpeta-ciudadana
```

---

## 🆘 Troubleshooting

### Problema: Authentication Failed en Management UI

**Síntoma**: Error "Login failed" al intentar acceder al UI.

**Solución 1: Verificar usuarios existentes**

```bash
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_users
```

Si no aparece ningún usuario, o falta el usuario `admin`:

```bash
# Crear usuario admin
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl add_user admin admin123

# Dar permisos de administrador
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl set_user_tags admin administrator

# Dar permisos completos
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

**Solución 2: Cambiar contraseña de usuario existente**

```bash
# Cambiar contraseña
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl change_password admin admin123

# Verificar que funcionó
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl authenticate_user admin admin123
```

**Solución 3: Extraer hash de contraseña para definitions file**

Si necesitas actualizar el hash de contraseña en `k8s/05-queue-definitions.yaml`:

```powershell
# Windows PowerShell
# Hacer un cambio de contraseña en runtime
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl change_password admin admin123

# Dar tag de administrador
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl set_user_tags admin administrator

# Ver el hash actual (necesitas autenticación para la API)
$auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("admin:admin123"))
Invoke-RestMethod -Uri "http://localhost:15672/api/users/admin" -Headers @{Authorization="Basic $auth"} | ConvertTo-Json

# El campo "password_hash" contiene el hash que puedes copiar al definitions file
```

### Problema: Queues No Aparecen

**Síntoma**: Las queues definidas no aparecen en el Management UI.

**Diagnóstico:**

```bash
# Verificar que el ConfigMap existe
kubectl get configmap rabbitmq-definitions -n carpeta-ciudadana -o yaml

# Ver logs de un pod buscando errores de importación
kubectl logs -n carpeta-ciudadana carpeta-rabbitmq-server-0 | grep -i definition
```

**Solución:**

```bash
# Verificar que el ConfigMap está montado correctamente en el cluster
kubectl describe rabbitmqcluster carpeta-rabbitmq -n carpeta-ciudadana | grep -A 5 "additionalConfig"

# Si no está montado, verificar que 03-rabbitmq-cluster.yaml tenga:
# additionalConfig: |
#   load_definitions = /etc/rabbitmq/definitions.json

# Reiniciar el cluster
kubectl rollout restart statefulset/carpeta-rabbitmq-server -n carpeta-ciudadana
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n carpeta-ciudadana --timeout=300s
```

### Problema: Pods No Inician (Pending o CrashLoopBackOff)

**Diagnóstico:**

```bash
# Ver estado detallado de los pods
kubectl describe pods -n carpeta-ciudadana

# Ver logs del pod que falla
kubectl logs -n carpeta-ciudadana carpeta-rabbitmq-server-0

# Ver eventos del namespace
kubectl get events -n carpeta-ciudadana --sort-by='.lastTimestamp'

# Ver logs del operator
kubectl logs -n rabbitmq-system -l app.kubernetes.io/name=rabbitmq-cluster-operator --tail=50
```

**Soluciones comunes:**

1. **Recursos insuficientes:**

   ```bash
   # Ver recursos disponibles
   kubectl top nodes
   kubectl describe nodes
   
   # Si no hay recursos, escala tu cluster o reduce réplicas
   ```

2. **Problemas con PVC (PersistentVolumeClaims):**

   **Síntoma**: Pods en estado `Pending` con mensaje "unbound immediate PersistentVolumeClaims"

   **Diagnóstico detallado:**

   ```bash
   # Ver estado de PVCs
   kubectl get pvc -n carpeta-ciudadana
   
   # Si están Pending, verificar StorageClass
   kubectl get storageclass
   
   # Ver detalles del pod para confirmar el problema
   kubectl describe pod carpeta-rabbitmq-server-0 -n carpeta-ciudadana
   ```

   **Solución**:

   El problema suele ser que el `provisioner` en `k8s/02-storage.yaml` no coincide con el cluster:

   - **Para Minikube**: El provisioner debe ser `k8s.io/minikube-hostpath`
     ```yaml
     provisioner: k8s.io/minikube-hostpath
     ```

   - **Para Docker Desktop**: El provisioner debe ser `docker.io/hostpath`
     ```yaml
     provisioner: docker.io/hostpath
     ```

   - **Para verificar cuál usar**, revisa la StorageClass por defecto:
     ```bash
     kubectl get storageclass
     # Busca la línea con "(default)" y copia su PROVISIONER
     ```

   **Aplicar el fix:**

   ```bash
   # 1. Eliminar el cluster actual
   kubectl delete -f k8s/
   
   # 2. Editar k8s/02-storage.yaml con el provisioner correcto
   
   # 3. Esperar limpieza
   sleep 10
   
   # 4. Redesplegar
   kubectl apply -f k8s/
   
   # 5. Monitorear que los PVCs se creen correctamente
   kubectl get pvc -n carpeta-ciudadana -w
   ```

3. **Problemas de red:**

   ```bash
   # Verificar que los pods puedan comunicarse entre sí
   kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- ping carpeta-rabbitmq-server-1.carpeta-rabbitmq-nodes.carpeta-ciudadana
   ```

### Problema: Connection Refused al Probar con Scripts

**Síntoma**: `pika.exceptions.AMQPConnectionError: Connection refused`

**Solución:**

```bash
# Verificar que port-forward esté activo
ps aux | grep port-forward

# Si no está activo, iniciarlo
kubectl port-forward -n carpeta-ciudadana svc/carpeta-rabbitmq 5672:5672 15672:15672

# Verificar que el servicio existe
kubectl get svc -n carpeta-ciudadana

# Probar conectividad desde un pod temporal
kubectl run -n carpeta-ciudadana test-connection --image=busybox --rm -it -- sh
# Dentro del pod:
nc -zv carpeta-rabbitmq 5672
```

### Reset Completo (Opción Nuclear)

Si todo está muy roto y necesitas empezar de cero:

**Windows:**

```powershell
# Eliminar todo el cluster
kubectl delete -f services/rabbitmq-service/k8s/

# Esperar a que todo se elimine
Start-Sleep -Seconds 10

# Volver a desplegar
kubectl apply -f services/rabbitmq-service/k8s/

# Esperar a que los pods estén ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n carpeta-ciudadana --timeout=300s
```

**Linux/macOS:**

```bash
# Eliminar todo el cluster
kubectl delete -f services/rabbitmq-service/k8s/

# Esperar a que todo se elimine
sleep 10

# Volver a desplegar
kubectl apply -f services/rabbitmq-service/k8s/

# Esperar a que los pods estén ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=carpeta-rabbitmq -n carpeta-ciudadana --timeout=300s
```

---

## 💡 Comandos Útiles y Fun Facts

### Comandos de Inspección

```bash
# Ver TODAS las variables de entorno de un pod
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- env

# Ver configuración efectiva de RabbitMQ
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmq-diagnostics environment

# Ver plugins habilitados
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmq-plugins list

# Ver estadísticas de memoria
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmq-diagnostics memory_breakdown

# Ver conexiones activas
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_connections name peer_host peer_port state

# Ver canales activos
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- rabbitmqctl list_channels connection name number consumer_count messages_unacknowledged
```

### Comandos de Gestión de Queues

```bash
# Ver detalles completos de una queue específica
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl list_queues name messages consumers memory state leader members

# Purgar una queue (eliminar todos los mensajes)
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl purge_queue document_verification_request

# Ver bindings de una queue
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl list_bindings source_name source_kind destination_name destination_kind routing_key

# Ver mensajes en una queue (peek sin consumir)
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqadmin get queue=test_queue count=10
```

### Comandos de Operaciones Avanzadas

```bash
# Exportar todas las definitions (backup completo)
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl export_definitions /tmp/backup.json

kubectl cp carpeta-ciudadana/carpeta-rabbitmq-server-0:/tmp/backup.json ./backup-$(date +%Y%m%d).json

# Forzar sincronización de quorum queue
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmqctl sync_queue document_verification_request

# Ver health checks
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmq-diagnostics check_running
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmq-diagnostics check_local_alarms

# Ver el lag de replicación de quorum queues
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-0 -- \
  rabbitmq-diagnostics quorum_status document_verification_request
```

### Monitoreo con Prometheus

```bash
# Port-forward del endpoint de Prometheus
kubectl port-forward -n carpeta-ciudadana carpeta-rabbitmq-server-0 15692:15692 &

# Ver todas las métricas
curl http://localhost:15692/metrics

# Filtrar métricas específicas
curl http://localhost:15692/metrics | grep rabbitmq_queue_messages
curl http://localhost:15692/metrics | grep rabbitmq_quorum

# Ver métricas de un nodo específico
curl http://localhost:15692/metrics | grep "node=\"rabbit@carpeta-rabbitmq-server-0\""
```

### Simulación de Fallos (Testing de Resiliencia)

```bash
# Test 1: Eliminar un follower
kubectl delete pod carpeta-rabbitmq-server-2 -n carpeta-ciudadana
# El pod se recrea automáticamente
kubectl get pods -n carpeta-ciudadana -w

# Test 2: Eliminar el seed node (líder)
kubectl delete pod carpeta-rabbitmq-server-0 -n carpeta-ciudadana
# Raft elige nuevo líder en ~5 segundos
sleep 10
kubectl exec -n carpeta-ciudadana carpeta-rabbitmq-server-1 -- \
  rabbitmqctl list_queues name leader

# Test 3: Stress test de red
# Eliminar 2 pods al mismo tiempo (perderás el quorum temporalmente)
kubectl delete pod carpeta-rabbitmq-server-0 carpeta-rabbitmq-server-1 -n carpeta-ciudadana
# El cluster quedará en read-only hasta que los pods vuelvan
kubectl get pods -n carpeta-ciudadana -w
```

### Fun Facts y Tips

**1. Peer Discovery Automático**

- El pod `-0` siempre es el seed node
- Los demás pods esperan a que `-0` esté ready antes de unirse
- El discovery usa Kubernetes API (no requiere configuración manual)

**2. Persistencia Inteligente**

- Cada nodo tiene su propio PVC (Persistent Volume Claim)
- Los datos persisten incluso si eliminas los pods
- Para borrar datos, debes eliminar los PVCs explícitamente

**3. Quorum = Mayoría Simple**

- Con 3 nodos: Quorum = 2 (⌈(3+1)/2⌉)
- Puedes perder 1 nodo sin pérdida de datos
- Si pierdes 2 nodos, el cluster queda read-only

**4. Replication Factor**

- RF = 2 significa que cada mensaje está en 2 nodos
- No confundir con "x-quorum-initial-group-size" (número de réplicas)
- El quorum siempre es mayoría simple, independiente del RF

**5. Leader Election**

- Raft elige un líder por queue (no por cluster)
- El líder maneja todas las escrituras para esa queue
- Si el líder falla, se elige uno nuevo en <5 segundos

**6. Dead Letter Queues (DLQ)**

- Mensajes que fallan 3 veces van a DLQ automáticamente
- Las DLQs son también quorum queues para durabilidad
- Requieren intervención manual para reprocesar

**7. Management UI Tips**

- El botón "Get messages" consume mensajes (no es peek)
- Usa "Publish message" para testing rápido
- Las estadísticas se actualizan cada 5 segundos

**8. Cluster Partition Handling**

- Configurado en modo "autoheal"
- Si hay split-brain, el cluster se auto-repara
- La partición minoritaria pierde sus datos

---

## 🔗 Referencias

- **README.md**: Visión general del servicio y comandos comunes
- **docs/QUORUM_QUEUES.md**: Guía detallada de Quorum Queues
- **docs/INSTALL_KUBECTL_PLUGIN.md**: Instalación de kubectl rabbitmq plugin
- **Makefile**: 30+ comandos helper simplificados
- **RabbitMQ Docs**: <https://www.rabbitmq.com/docs>
- **Kubernetes Operator**: <https://www.rabbitmq.com/kubernetes/operator/operator-overview>

---

**Última actualización**: 2025-11-06  
**Autor**: Equipo Carpeta Ciudadana
