# Configuración del API Gateway

## 📋 Descripción General

El frontend `citizen-web` actúa como **API Gateway** utilizando nginx para enrutar las peticiones a diferentes microservicios backend. Esto proporciona:

- ✅ **Rutas semánticas**: `/api/documents`, `/api/folders`, etc.
- ✅ **Configuración flexible**: URLs de microservicios mediante variables de entorno
- ✅ **Fácil migración**: De monolito a microservicios sin cambiar el frontend
- ✅ **Seguridad centralizada**: Headers y CORS en un solo punto

## 🗺️ Mapeo de Rutas

### Rutas del API Gateway

El API Gateway transforma las rutas semánticas del frontend a las rutas reales de los microservicios:

| Ruta Frontend | Ruta Backend | Microservicio | Descripción |
|--------------|--------------|---------------|-------------|
| `/api/documents/**` | `/api/v1/**` | Documents Service | Gestión de documentos (CRUD, upload, download) |
| `/api/folders/**` | `/api/v1/**` | Folders Service | Información de carpetas ciudadanas |
| `/api/identity/**` | `/api/v1/**` | Identity Service | Registro y validación de ciudadanos |
| `/api/auth/**` | `/api/v1/**` | Auth Service | Login, MFA, sesiones |
| `/api/notifications/**` | `/api/v1/**` | Notifications Service | Gestión de notificaciones |
| `/api/portability/**` | `/api/v1/**` | Portability Service | Cambio de operador |
| `/api/requests/**` | `/api/v1/**` | Requests Service | Solicitudes de documentos |

### Ejemplos de Transformación

```
Frontend Request:
GET http://localhost:3000/api/documents/carpetas/abc123/documentos

↓ (Nginx rewrite)

Backend Request:
GET http://carpeta-ciudadana-service:8080/api/v1/carpetas/abc123/documentos
```

```
Frontend Request:
POST http://localhost:3000/api/auth/login

↓ (Nginx rewrite)

Backend Request:
POST http://carpeta-ciudadana-service:8080/api/v1/login
```

## ⚙️ Configuración con Variables de Entorno

### Variables de Entorno Disponibles

Cada microservicio tiene su propia variable de entorno que apunta a su URL:

```bash
# Documents Service
DOCUMENTS_SERVICE_URL=carpeta-ciudadana-service:8080

# Folders Service
FOLDERS_SERVICE_URL=carpeta-ciudadana-service:8080

# Identity Service
IDENTITY_SERVICE_URL=carpeta-ciudadana-service:8080

# Auth Service
AUTH_SERVICE_URL=carpeta-ciudadana-service:8080

# Notifications Service
NOTIFICATIONS_SERVICE_URL=carpeta-ciudadana-service:8080

# Portability Service
PORTABILITY_SERVICE_URL=carpeta-ciudadana-service:8080

# Requests Service
REQUESTS_SERVICE_URL=carpeta-ciudadana-service:8080
```

### Valores Predeterminados

Si no se especifica una variable de entorno, todas apuntan al monolito actual:
```bash
DEFAULT: carpeta-ciudadana-service:8080
```

### Configuración en Docker Compose

En `infrastructure/docker/docker-compose.yml`:

```yaml
citizen-web:
  environment:
    # Todas apuntan al monolito actual
    - DOCUMENTS_SERVICE_URL=carpeta-ciudadana-service:8080
    - FOLDERS_SERVICE_URL=carpeta-ciudadana-service:8080
    # ... resto de servicios
```

### Ejemplo: Dividir en Microservicios

Cuando se separen los servicios, simplemente actualiza las URLs:

```yaml
citizen-web:
  environment:
    # Microservicio dedicado para documentos
    - DOCUMENTS_SERVICE_URL=documents-service:8081

    # Microservicio dedicado para identidad
    - IDENTITY_SERVICE_URL=identity-service:8082

    # El resto sigue en el monolito
    - FOLDERS_SERVICE_URL=carpeta-ciudadana-service:8080
    - AUTH_SERVICE_URL=carpeta-ciudadana-service:8080
    # ...
```

## 🔧 Arquitectura Técnica

### Flujo de Configuración

1. **Build Time**: Se copia `nginx.conf.template` al contenedor
2. **Container Start**: Se ejecuta `docker-entrypoint.sh`
3. **Variable Substitution**: `envsubst` reemplaza las variables en el template
4. **Nginx Start**: nginx arranca con la configuración generada

### Archivos Clave

```
services/citizen-web/
├── nginx.conf.template       # Template con variables ${VARIABLE}
├── docker-entrypoint.sh      # Script de inicialización
├── Dockerfile                # Copia template y script
└── docs/
    └── api-gateway-configuration.md  # Esta documentación
```

### nginx.conf.template

```nginx
upstream documents_service {
    server ${DOCUMENTS_SERVICE_URL};  # Variable sustituida en runtime
}

location /api/documents/ {
    rewrite ^/api/documents/(.*)$ /api/v1/$1 break;
    proxy_pass http://documents_service;
    # ... headers y configuración
}
```

### docker-entrypoint.sh

```bash
#!/bin/sh
# Export variables con valores predeterminados
export DOCUMENTS_SERVICE_URL="${DOCUMENTS_SERVICE_URL:-carpeta-ciudadana-service:8080}"

# Sustituir variables en el template
envsubst '${DOCUMENTS_SERVICE_URL} ...' \
    < /etc/nginx/conf.d/nginx.conf.template \
    > /etc/nginx/conf.d/default.conf

# Iniciar nginx
exec nginx -g 'daemon off;'
```

## 🚀 Uso

### Desarrollo Local

```bash
# Usar servicios mock (sin API Gateway)
cd services/citizen-web
VITE_MOCK_DOCUMENTS=true npm run dev
```

### Docker (Monolito)

```bash
# Todas las rutas apuntan al mismo servicio
cd infrastructure/docker
docker-compose up -d
```

Acceder a:
- Frontend: http://localhost:3000
- API Documents: http://localhost:3000/api/documents/...
- API Folders: http://localhost:3000/api/folders/...

### Docker (Microservicios Separados)

Ejemplo con servicio de documentos separado:

```yaml
# docker-compose.yml
services:
  # Nuevo microservicio de documentos
  documents-service:
    build: ../../services/documents-service
    container_name: documents-service
    ports:
      - "8081:8080"
    networks:
      - app-network

  citizen-web:
    environment:
      # Apuntar al nuevo microservicio
      - DOCUMENTS_SERVICE_URL=documents-service:8080
      # Resto sigue en monolito
      - FOLDERS_SERVICE_URL=carpeta-ciudadana-service:8080
      # ...
```

## 🧪 Verificación

### Verificar Configuración de Nginx

```bash
# Ver configuración generada
docker exec citizen-web cat /etc/nginx/conf.d/default.conf

# Ver upstreams configurados
docker exec citizen-web cat /etc/nginx/conf.d/default.conf | grep "upstream"

# Probar configuración
docker exec citizen-web nginx -t
```

### Probar Rutas del API Gateway

```bash
# Documentos
curl http://localhost:3000/api/documents/carpetas/test/documentos

# Folders
curl http://localhost:3000/api/folders/carpetas/cedula/1234567890

# Auth
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Ver Logs

```bash
# Logs del contenedor
docker logs citizen-web

# Logs en tiempo real
docker logs -f citizen-web

# Ver configuración al iniciar
docker logs citizen-web | grep "Microservices Configuration"
```

## 📊 Beneficios

### Para el Desarrollo

- ✅ **Rutas consistentes**: Las URLs del frontend no cambian al migrar a microservicios
- ✅ **Testing flexible**: Mezclar servicios reales y mocks fácilmente
- ✅ **Debugging simple**: Logs centralizados en nginx

### Para la Arquitectura

- ✅ **Migración gradual**: De monolito a microservicios sin afectar el frontend
- ✅ **Service discovery**: nginx maneja la resolución de servicios
- ✅ **Load balancing**: Fácil agregar múltiples instancias por servicio
- ✅ **Circuit breaker**: Posible agregar reintentos y fallbacks

### Para Operaciones

- ✅ **Configuración centralizada**: Todas las URLs en variables de entorno
- ✅ **Zero downtime**: Cambiar servicios sin rebuild del frontend
- ✅ **Observabilidad**: Logs y métricas centralizadas en nginx

## 🔮 Roadmap Futuro

### Fase 1: Monolito (Actual)
```
Frontend → API Gateway (nginx) → carpeta-ciudadana-service
```

### Fase 2: Separación de Documentos
```
Frontend → API Gateway → ┬→ documents-service (nuevo)
                         └→ carpeta-ciudadana-service (resto)
```

### Fase 3: Microservicios Completos
```
Frontend → API Gateway → ┬→ documents-service
                         ├→ identity-service
                         ├→ auth-service
                         ├→ folders-service
                         ├→ notifications-service
                         ├→ portability-service
                         └→ requests-service
```

## 📚 Referencias

- [Nginx Proxy Pass](http://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_pass)
- [Nginx Rewrite](http://nginx.org/en/docs/http/ngx_http_rewrite_module.html)
- [Nginx Upstream](http://nginx.org/en/docs/http/ngx_http_upstream_module.html)
- [Docker Environment Variables](https://docs.docker.com/compose/environment-variables/)

