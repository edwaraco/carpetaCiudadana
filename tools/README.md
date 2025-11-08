# Tools - Scripts de Automatización

Utilidades y scripts para desarrollo, deployment y gestión del proyecto Carpeta Ciudadana.

## 📜 Scripts Disponibles

### k8s-update-service.sh

Script genérico para actualizar servicios en Kubernetes (Minikube).

#### 🚀 Uso Rápido

```bash
# Actualizar citizen-web completo
./tools/k8s-update-service.sh citizen-web

# Ver ayuda
./tools/k8s-update-service.sh --help
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

#### Opciones

| Opción | Descripción |
|--------|-------------|
| `-n, --namespace` | Namespace de Kubernetes (default: carpeta-ciudadana) |
| `-s, --skip-build` | Saltar construcción de imagen Docker |
| `-l, --skip-load` | Saltar carga de imagen en Minikube |
| `-c, --skip-config` | Saltar aplicación de ConfigMap |
| `-t, --tag` | Tag de la imagen Docker (default: latest) |
| `-h, --help` | Mostrar ayuda completa |

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

