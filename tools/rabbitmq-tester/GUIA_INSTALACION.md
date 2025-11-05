# 🚀 Guía de Instalación y Testing - RabbitMQ Cluster Local

Esta guía te llevará paso a paso desde cero hasta tener el cluster RabbitMQ funcionando y testeado.

## 📋 Tabla de Contenidos

1. [Pre-requisitos](#1-pre-requisitos)
2. [Instalación de Docker Desktop](#2-instalación-de-docker-desktop)
3. [Instalación de Python](#3-instalación-de-python)
4. [Levantar el Cluster RabbitMQ](#4-levantar-el-cluster-rabbitmq)
5. [Crear las Quorum Queues](#5-crear-las-quorum-queues)
6. [Testing con Scripts Python](#6-testing-con-scripts-python)
7. [Verificación del Cluster](#7-verificación-del-cluster)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Pre-requisitos

### ✅ Checklist de Requisitos

- [ ] Windows 10/11 (64-bit)
- [ ] 12GB+ RAM disponible (para cluster de 5 nodos)
- [ ] 20GB espacio en disco
- [ ] 4+ CPU cores
- [ ] Conexión a internet

### 🔍 Verificar lo que ya tienes

Abre **PowerShell** y ejecuta estos comandos:

```powershell
# Verificar si Docker está instalado
docker --version

# Verificar si Docker Compose está instalado
docker compose version

# Verificar si Python está instalado
python --version
```

**Resultados esperados:**
- ✅ Si ves versiones (ej: `Docker version 24.0.0`), está instalado
- ❌ Si ves `'docker' is not recognized`, necesitas instalarlo

---

## 2. Instalación de Docker Desktop

### ❌ Si Docker NO está instalado:

1. **Descargar Docker Desktop**
   - Ir a: https://www.docker.com/products/docker-desktop/
   - Click en "Download for Windows"
   - Ejecutar el instalador descargado

2. **Instalación**
   - Seguir el asistente de instalación
   - ✅ Marcar "Use WSL 2 instead of Hyper-V" (recomendado)
   - Click "Ok" y esperar a que termine

3. **Reiniciar PC**
   - **IMPORTANTE**: Reiniciar después de la instalación

4. **Primera Ejecución**
   - Abrir "Docker Desktop" desde el menú inicio
   - Esperar a que el ícono de Docker en la barra de tareas se ponga verde
   - Aceptar los términos de servicio si aparecen

5. **Verificar instalación**

   ```powershell
   docker --version
   docker compose version
   ```

   Deberías ver:
   ```
   Docker version 24.x.x, build xxxxx
   Docker Compose version v2.x.x
   ```

### ✅ Si Docker YA está instalado:

1. **Iniciar Docker Desktop**
   - Abrir Docker Desktop desde el menú inicio
   - Esperar a que se inicie completamente (ícono verde)

2. **Verificar configuración de recursos**
   - Click en el ícono de Docker en la barra de tareas
   - Settings → Resources → Advanced
   - **RAM**: Mínimo 12GB (para 5 nodos)
   - **CPUs**: Mínimo 4
   - Click "Apply & restart" si hiciste cambios

---

## 3. Instalación de Python

### ❌ Si Python NO está instalado:

1. **Descargar Python**
   - Ir a: https://www.python.org/downloads/
   - Descargar Python 3.11 o 3.12 (recomendado)

2. **Instalación**
   - Ejecutar el instalador
   - ✅ **IMPORTANTE**: Marcar "Add Python to PATH"
   - Click "Install Now"
   - Esperar a que termine

3. **Verificar instalación**

   ```powershell
   python --version
   pip --version
   ```

   Deberías ver:
   ```
   Python 3.11.x
   pip 23.x.x from ...
   ```

### ✅ Si Python YA está instalado:

1. **Verificar versión**

   ```powershell
   python --version
   ```

   Si es Python 3.8+, estás listo. Si no, actualizar a 3.11+.

---

## 4. Levantar el Cluster RabbitMQ

### Paso 1: Navegar al directorio del proyecto

```powershell
# Cambia esta ruta a donde tengas el proyecto
cd c:\Users\Esteban\Downloads\CODE\carpetaCiudadana

# Ir a la carpeta de infraestructura
cd infrastructure\docker
```

### Paso 2: Verificar archivos necesarios

```powershell
# Listar archivos
dir

# Deberías ver:
# - docker-compose.yml
# - rabbitmq/cluster-entrypoint.sh
```

### Paso 3: Iniciar el cluster (Configuración default: 5 nodos)

```powershell
# Iniciar todos los servicios en background
docker compose up -d

# Esto levantará:
# - 1 RabbitMQ Leader
# - 4 RabbitMQ Followers
# - MinIO
# - DynamoDB Local
# - Otros servicios...
```

**⏳ Primera vez tarda más**: Docker descarga las imágenes (~2-5 minutos).

### Paso 4: Ver el progreso

```powershell
# Ver logs en tiempo real
docker compose logs -f rabbitmq-leader rabbitmq-follower

# Presiona Ctrl+C para salir de los logs
```

**🎯 Busca estas líneas en los logs**:
- Leader: `✅ Server startup complete`
- Followers: `✅ Successfully joined cluster`

### Paso 5: Verificar que los servicios estén corriendo

```powershell
# Ver estado de los servicios
docker compose ps
```

**Salida esperada:**

```
NAME                          STATUS              PORTS
rabbitmq-leader               Up (healthy)        5672->5672, 15672->15672
rabbitmq-follower-1           Up (healthy)        5672/tcp, 15672/tcp
rabbitmq-follower-2           Up (healthy)        5672/tcp, 15672/tcp
rabbitmq-follower-3           Up (healthy)        5672/tcp, 15672/tcp
rabbitmq-follower-4           Up (healthy)        5672/tcp, 15672/tcp
...
```

✅ **Todos deben estar "Up (healthy)"**

### Paso 6: Verificar el cluster desde dentro

```powershell
# Verificar estado del cluster
docker exec -it rabbitmq-leader rabbitmqctl cluster_status
```

**Salida esperada:**

```
Cluster name: rabbit@rabbitmq-leader

Running nodes:
  - rabbit@rabbitmq-leader
  - rabbit@rabbitmq-follower-1
  - rabbit@rabbitmq-follower-2
  - rabbit@rabbitmq-follower-3
  - rabbit@rabbitmq-follower-4
```

✅ **Deberías ver 5 nodos en total**

---

## 5. Crear las Quorum Queues

Las Quorum Queues se deben crear manualmente o desde la aplicación. Aquí las crearemos manualmente para testing.

### Opción 1: Usando Management UI (Recomendado - Más Fácil)

1. **Abrir Management UI**
   - Ir a: http://localhost:15672
   - **Usuario**: `admin`
   - **Contraseña**: `admin123`

2. **Ir a la pestaña "Queues"**
   - Click en "Queues" en el menú superior

3. **Crear nueva queue**
   - Click en "Add a new queue" (abajo)
   - **Virtual host**: `/` (default)
   - **Type**: Seleccionar **"Quorum"** ⚠️ IMPORTANTE
   - **Name**: `documento.deletion.queue`
   - **Durability**: Durable (debe estar marcado)
   - **Arguments** (opcional):
     - Key: `x-quorum-initial-group-size`
     - Value: `3`
   - Click "Add queue"

4. **Repetir para las otras queues**:
   - `minio.cleanup.queue`
   - `metadata.cleanup.queue`

5. **Verificar**
   - Deberías ver las 3 queues listadas
   - En la columna "Type" debe decir **"quorum"**

### Opción 2: Usando CLI (Avanzado)

```powershell
# Queue 1: documento.deletion.queue
docker exec -it rabbitmq-leader rabbitmqadmin declare queue `
  name=documento.deletion.queue `
  durable=true `
  arguments='{\"x-queue-type\":\"quorum\",\"x-quorum-initial-group-size\":3}'

# Queue 2: minio.cleanup.queue
docker exec -it rabbitmq-leader rabbitmqadmin declare queue `
  name=minio.cleanup.queue `
  durable=true `
  arguments='{\"x-queue-type\":\"quorum\",\"x-quorum-initial-group-size\":3}'

# Queue 3: metadata.cleanup.queue
docker exec -it rabbitmq-leader rabbitmqadmin declare queue `
  name=metadata.cleanup.queue `
  durable=true `
  arguments='{\"x-queue-type\":\"quorum\",\"x-quorum-initial-group-size\":3}'
```

### Verificar queues creadas

```powershell
# Listar todas las queues
docker exec -it rabbitmq-leader rabbitmqctl list_queues name type state
```

**Salida esperada:**

```
documento.deletion.queue    quorum    running
minio.cleanup.queue         quorum    running
metadata.cleanup.queue      quorum    running
```

✅ **Todas deben ser tipo "quorum"**

---

## 6. Testing con Scripts Python

### Paso 1: Instalar dependencia Python

```powershell
# Navegar a la carpeta de scripts
cd ..\..\tools\rabbitmq-tester

# Instalar pika (cliente RabbitMQ)
pip install -r requirements.txt

# O directamente:
pip install pika
```

### Paso 2: Abrir DOS terminales PowerShell

**Terminal 1: Consumer (Receptor)**

```powershell
cd c:\Users\Esteban\Downloads\CODE\carpetaCiudadana\tools\rabbitmq-tester

# Iniciar consumer - se quedará esperando mensajes
python consumer.py
```

Deberías ver:

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
```

**Terminal 2: Producer (Emisor)**

```powershell
cd c:\Users\Esteban\Downloads\CODE\carpetaCiudadana\tools\rabbitmq-tester

# Enviar 3 eventos de prueba
python producer.py --count 3
```

### Paso 3: Ver los resultados

En **Terminal 1 (Consumer)** deberías ver los 3 eventos aparecer con TODO el detalle:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📬 EVENTO RECIBIDO - 14:30:45
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Metadata:
   Delivery Tag: 1
   Redelivered: No

🆔 Event ID: 123e4567-e89b-12d3-a456-426614174000
📝 Event Type: documento.deletion.requested
...
   📄 TEXTO IMPORTANTE:
   ╭─────────────────────────────────────────────────╮
   │ Eliminación de documento temporal solicitada... │
   ╰─────────────────────────────────────────────────╯
...
📋 EVENTO COMPLETO (JSON):
┌──────────────────────────────────────────────────────┐
│ {                                                    │
│   "eventId": "...",                                  │
│   "eventType": "documento.deletion.requested",       │
│   ...                                                │
│ }                                                    │
└──────────────────────────────────────────────────────┘

✅ Mensaje confirmado (ACK enviado)
```

✅ **Si ves esto, el cluster está funcionando perfectamente!**

### Paso 4: Pruebas adicionales

```powershell
# Terminal 2: Enviar más eventos
python producer.py --count 10

# Terminal 2: Probar otra queue
python producer.py --queue minio.cleanup.queue --count 5

# Terminal 1: (detener con Ctrl+C y cambiar queue)
python consumer.py --queue minio.cleanup.queue
```

---

## 7. Verificación del Cluster

### Test 1: Verificar Nodos del Cluster

```powershell
docker exec -it rabbitmq-leader rabbitmqctl cluster_status
```

✅ Debe mostrar 5 nodos corriendo.

### Test 2: Verificar Replicación de Queues

```powershell
docker exec -it rabbitmq-leader rabbitmqctl list_queues name type members
```

✅ Cada queue debe tener 3 miembros (por el replication factor).

### Test 3: Verificar Mensajes en las Queues

```powershell
docker exec -it rabbitmq-leader rabbitmqctl list_queues name messages
```

Si enviaste mensajes y no los consumiste, deberías ver números > 0.

### Test 4: Management UI

1. Abrir: http://localhost:15672
2. Login: `admin` / `admin123`
3. **Overview Tab**:
   - Debería mostrar 5 nodos
   - Gráficas de mensajes/segundo
4. **Queues Tab**:
   - Ver las 3 queues creadas
   - Ver número de mensajes
   - Ver consumidores conectados
5. **Admin → Cluster Tab**:
   - Ver todos los nodos y su estado

---

## 8. Troubleshooting

### ❌ Error: "docker: command not found"

**Solución**: Docker no está instalado o no está en el PATH.
- Reinstalar Docker Desktop
- Reiniciar terminal después de instalar

### ❌ Error: "Cannot connect to the Docker daemon"

**Solución**: Docker Desktop no está corriendo.
- Abrir Docker Desktop desde el menú inicio
- Esperar a que el ícono se ponga verde

### ❌ Error: "port is already allocated" (5672 o 15672)

**Solución**: Otro proceso está usando el puerto.

```powershell
# Ver qué está usando el puerto 5672
netstat -ano | findstr :5672

# Matar el proceso (usa el PID que aparece)
taskkill /PID <PID> /F

# O cambiar el puerto en docker-compose.yml
```

### ❌ Followers no se unen al cluster

**Solución**:

```powershell
# Ver logs del leader
docker compose logs rabbitmq-leader

# Ver logs de los followers
docker compose logs rabbitmq-follower

# Reiniciar el cluster completo
docker compose down
docker compose up -d
```

### ❌ Error: "AMQPConnectionError" en Python

**Solución**: RabbitMQ no está accesible.

```powershell
# Verificar que RabbitMQ está corriendo
docker compose ps rabbitmq-leader

# Ver logs
docker compose logs rabbitmq-leader

# Verificar puerto
Test-NetConnection localhost -Port 5672
```

### ❌ Queues no son tipo "quorum"

**Solución**: Recrear las queues.

```powershell
# Eliminar queue existente
docker exec -it rabbitmq-leader rabbitmqadmin delete queue name=documento.deletion.queue

# Recrear como quorum (ver sección 5)
```

### ❌ Sistema lento / sin memoria

**Solución**: Reducir número de nodos.

```powershell
# Escalar a 3 nodos (mínimo para HA)
docker compose up -d --scale rabbitmq-follower=2

# Verificar
docker compose ps | findstr rabbitmq
```

---

## 🎉 Checklist Final

- [ ] Docker Desktop instalado y corriendo
- [ ] Python 3.8+ instalado
- [ ] Cluster RabbitMQ levantado (5 nodos)
- [ ] Verificado `cluster_status` muestra 5 nodos
- [ ] Quorum Queues creadas (3 queues tipo "quorum")
- [ ] Scripts Python funcionando (producer + consumer)
- [ ] Consumer recibe eventos completos con texto importante
- [ ] Management UI accesible en http://localhost:15672

---

## 🚀 Siguiente Paso

Una vez completada esta guía, puedes:

1. **Escalar el cluster**:
   ```powershell
   docker compose up -d --scale rabbitmq-follower=9  # 10 nodos
   ```

2. **Integrar con Spring Boot**: Configurar el microservicio para publicar/consumir eventos

3. **Testing de Failover**: Detener nodos y verificar alta disponibilidad

4. **Monitoreo**: Explorar Prometheus metrics en http://localhost:15692/metrics

---

## 📚 Referencias

- [README Principal](../../infrastructure/docker/README.md)
- [README Scripts Python](./README.md)
- [ADR-0003: Event-Driven](../../docs/ADR/0003-eliminacion-documentos-event-driven-rabbitmq.md)
- [ADR-0004: Quorum Queues](../../docs/ADR/0004-rabbitmq-quorum-queues-arquitectura-leader-followers.md)
- [ADR-0005: Ubicación Docker Compose](../../docs/ADR/0005-ubicacion-rabbitmq-docker-compose-escalable.md)

---

**¿Problemas?** Revisa la sección [Troubleshooting](#8-troubleshooting) o los logs con `docker compose logs -f`
