# Tools - Scripts de Automatización

Utilidades y scripts para desarrollo, deployment y gestión del proyecto Carpeta Ciudadana.

> **💡 Nota para usuarios de Windows**: Los scripts están disponibles en dos versiones:
>
> - **`.sh`** - Para Linux/Mac (Bash)
> - **`.ps1`** - Para Windows (PowerShell)

## 📜 Scripts Disponibles

### k8s-update-service (.sh / .ps1)

Script genérico para actualizar servicios en Kubernetes (Minikube).

#### 🚀 Uso Rápido

**Linux/Mac:**

```bash
# Actualizar citizen-web completo
./tools/k8s-update-service.sh citizen-web

# Ver ayuda
./tools/k8s-update-service.sh --help
```

**Windows (PowerShell):**

```powershell
# Actualizar citizen-web completo
.\tools\k8s-update-service.ps1 -ServiceName citizen-web

# Ver ayuda
Get-Help .\tools\k8s-update-service.ps1 -Detailed
```

#### Características

- ✅ Construcción automática de imagen Docker
- ✅ Carga de imagen en Minikube
- ✅ Aplicación de ConfigMaps
- ✅ Rollout restart del deployment
- ✅ Verificación de estado y logs
- ✅ Soporte para múltiples servicios
- ✅ Flags opcionales para saltar pasos
- ✅ Output con colores para mejor legibilidad

#### Servicios Soportados

- `citizen-web` - Frontend React
- `auth-service` - Servicio de autenticación
- `carpeta-ciudadana-service` - Backend Spring Boot principal
- `ciudadano-registry-service` - Registro de ciudadanos
- `document-authentication-service` - Autenticación de documentos con Gov Carpeta
- `notifications-service` - Servicio de notificaciones

#### Ejemplos

**Linux/Mac:**

```bash
# Actualización completa
./tools/k8s-update-service.sh citizen-web

# Solo configuración (sin rebuild)
./tools/k8s-update-service.sh auth-service --skip-build

# Rebuild local sin cargar en Minikube
./tools/k8s-update-service.sh carpeta-ciudadana-service --skip-load

# Usar tag específico
./tools/k8s-update-service.sh document-authentication-service --tag v1.2.0
```

**Windows (PowerShell):**

```powershell
# Actualización completa
.\tools\k8s-update-service.ps1 -ServiceName citizen-web

# Solo configuración (sin rebuild)
.\tools\k8s-update-service.ps1 -ServiceName auth-service -SkipBuild

# Rebuild local sin cargar en Minikube
.\tools\k8s-update-service.ps1 -ServiceName carpeta-ciudadana-service -SkipLoad

# Usar tag específico
.\tools\k8s-update-service.ps1 -ServiceName document-authentication-service -Tag v1.2.0
```

#### Opciones

**Linux/Mac (Bash):**

| Opción | Descripción |
|--------|-------------|
| `-n, --namespace` | Namespace de Kubernetes (default: carpeta-ciudadana) |
| `-s, --skip-build` | Saltar construcción de imagen Docker |
| `-l, --skip-load` | Saltar carga de imagen en Minikube |
| `-c, --skip-config` | Saltar aplicación de ConfigMap |
| `-t, --tag` | Tag de la imagen Docker (default: latest) |
| `-h, --help` | Mostrar ayuda completa |

**Windows (PowerShell):**

| Parámetro | Descripción |
|-----------|-------------|
| `-ServiceName` | Nombre del servicio (requerido) |
| `-Namespace` | Namespace de Kubernetes (default: carpeta-ciudadana) |
| `-SkipBuild` | Saltar construcción de imagen Docker |
| `-SkipLoad` | Saltar carga de imagen en Minikube |
| `-SkipConfig` | Saltar aplicación de ConfigMap |
| `-Tag` | Tag de la imagen Docker (default: latest) |

---

### update-minikube-hosts (.sh / .ps1)

Script para actualizar el archivo hosts del sistema con la IP actual de Minikube.

#### Uso

**Linux/Mac:**

```bash
# Ejecutar script (requiere sudo)
./tools/update-minikube-hosts.sh
```

**Windows (PowerShell como Administrador):**

```powershell
# Ejecutar script (requiere permisos de Administrador)
.\tools\update-minikube-hosts.ps1
```

> **⚠️ Importante**: En Windows, debes ejecutar PowerShell como Administrador para que el script pueda modificar el archivo hosts.

#### Qué hace

- Obtiene la IP actual de Minikube
- Actualiza las entradas en el archivo hosts:
  - `citizen-web.local`
  - `citizen-os.local`
- Elimina entradas antiguas antes de agregar las nuevas

---

## 🛠️ Otros Scripts

### rabbitmq-tester

Herramientas para testing de RabbitMQ y mensajería.

---

## 📝 Propósito General

Centralizar scripts útiles para:

- ✅ Automatización de tareas repetitivas
- ✅ Deployment en Kubernetes
- ✅ Generación de código/scaffolding
- ✅ Validación y testing
- ✅ Utilidades de desarrollo

