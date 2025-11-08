# ADR-0008: Configuración en Runtime para citizen-web usando Kubernetes ConfigMap

**Estado**: Aceptado
**Fecha**: 2025-11-07
**Autores**: Equipo Carpeta Ciudadana
**Tags**: `frontend`, `docker`, `kubernetes`, `configuracion`, `devops`

## Contexto

El servicio `citizen-web` (frontend React + Vite) requería un archivo `.env` durante el proceso de build de Docker para configurar variables de entorno que Vite "quema" en el bundle JavaScript durante la compilación. Esto presentaba varios problemas para el despliegue en Kubernetes y CI/CD:

### Problemas Identificados

1. **Dependencia de `.env` en CI/CD**: El pipeline de GitHub Actions necesitaba generar un archivo `.env` o usar build args complejos
2. **Imagen por ambiente**: Se requería una imagen Docker diferente para cada ambiente (dev, staging, prod)
3. **Cambios requieren rebuild**: Cualquier cambio de configuración (feature flags, URLs, etc.) requería reconstruir y redesplegar la imagen
4. **No es nativo de Kubernetes**: No aprovechaba ConfigMaps, la forma estándar de K8s para configuración
5. **Complejidad en desarrollo local**: Los desarrolladores necesitaban sincronizar su `.env` con los valores de producción

### Requisitos

- **RNF-02**: Escalabilidad - Despliegues rápidos sin rebuilds innecesarios
- **RNF-05**: Mantenibilidad - Configuración centralizada y fácil de actualizar
- **RNF-08**: Interoperabilidad - Funcionamiento en diferentes ambientes (local, Docker, K8s)

## Decisión

Implementar un **sistema de configuración en runtime** que inyecta variables de entorno en el contenedor al iniciar, generando dinámicamente un archivo `config.js` que expone las variables como `window.__RUNTIME_CONFIG__`.

### Arquitectura de la Solución

```mermaid
flowchart TB
    subgraph BuildTime["⚙️ Build Time (Docker Build)"]
        A[Dockerfile ejecuta] --> B{¿Existe .env?}
        B -->|No| C[Crear .env mínimo]
        B -->|Sí| D[Usar .env existente]
        C --> E[npm run build]
        D --> E
        E --> F[Bundle JavaScript en /dist]
    end

    subgraph Runtime["🚀 Runtime (Container Startup)"]
        G[Container inicia] --> H[docker-entrypoint.sh ejecuta]
        H --> I[Leer env vars del ConfigMap/Docker]
        I --> J[Generar config.js con window.__RUNTIME_CONFIG__]
        J --> K[Procesar nginx.conf.template con envsubst]
        K --> L[Iniciar nginx]
    end

    subgraph Frontend["🌐 Frontend Application"]
        M[Browser carga index.html] --> N[Cargar /config.js]
        N --> O[Cargar /src/main.tsx]
        O --> P{Leer config}
        P -->|1. Prioridad| Q[window.__RUNTIME_CONFIG__]
        P -->|2. Fallback| R[import.meta.env]
        Q --> S[App renderizada]
        R --> S
    end

    F -.->|Imagen Docker| G
    L --> M

    style BuildTime fill:#e1f5ff
    style Runtime fill:#fff4e1
    style Frontend fill:#f0ffe1
```

### Flujo de Configuración por Ambiente

```mermaid
flowchart LR
    subgraph Local["💻 Desarrollo Local"]
        L1[.env file] --> L2[Vite build]
        L2 --> L3[import.meta.env]
        L3 --> L4[App]
    end

    subgraph Docker["🐳 Docker Compose"]
        D1[docker-compose.yml<br/>environment vars] --> D2[entrypoint.sh]
        D2 --> D3[config.js generado]
        D3 --> D4[window.__RUNTIME_CONFIG__]
        D4 --> D5[App]
    end

    subgraph K8s["☸️ Kubernetes"]
        K1[ConfigMap] --> K2[Pod env vars]
        K2 --> K3[entrypoint.sh]
        K3 --> K4[config.js generado]
        K4 --> K5[window.__RUNTIME_CONFIG__]
        K5 --> K6[App]
    end

    style Local fill:#e3f2fd
    style Docker fill:#fff3e0
    style K8s fill:#e8f5e9
```

### Componentes del Sistema

```mermaid
graph TB
    subgraph Frontend["Frontend (TypeScript)"]
        RC[runtimeConfig.ts<br/>getConfig, getBooleanConfig]
        FF[featureFlags.ts<br/>lee feature flags]
        ENV[env.ts<br/>getEnvVar, isMockAPIEnabled]

        RC --> FF
        RC --> ENV
    end

    subgraph Docker["Docker Layer"]
        DF[Dockerfile<br/>Crea .env mínimo<br/>Configura entrypoint]
        EP[docker-entrypoint.sh<br/>Genera config.js<br/>Procesa nginx template]
        NC[nginx.conf.template<br/>API Gateway config]

        DF --> EP
        EP --> NC
    end

    subgraph K8s["Kubernetes Layer"]
        CM[ConfigMap<br/>citizen-web-config<br/>40+ variables]
        DEP[Deployment<br/>envFrom configMapRef]
        POD[Pod<br/>Variables inyectadas]

        CM --> DEP
        DEP --> POD
    end

    POD -.->|Environment vars| EP
    EP -.->|Genera| CJS[/usr/share/nginx/html/config.js]
    CJS -.->|window.__RUNTIME_CONFIG__| RC

    style Frontend fill:#bbdefb
    style Docker fill:#ffe0b2
    style K8s fill:#c8e6c9
    style CJS fill:#fff9c4
```

### Secuencia de Inicialización

```mermaid
sequenceDiagram
    participant K as Kubernetes
    participant P as Pod
    participant E as Entrypoint Script
    participant N as Nginx
    participant B as Browser

    K->>P: Crear pod con ConfigMap
    activate P
    P->>P: Inyectar env vars
    P->>E: Ejecutar entrypoint.sh
    activate E

    Note over E: STEP 1: Generar config.js
    E->>E: Leer VITE_* env vars
    E->>E: Crear window.__RUNTIME_CONFIG__
    E-->>P: Escribir /usr/share/nginx/html/config.js

    Note over E: STEP 2: Configurar nginx
    E->>E: Procesar nginx.conf.template
    E->>E: envsubst con URLs de servicios
    E-->>P: Escribir /etc/nginx/conf.d/default.conf

    Note over E: STEP 3: Iniciar servidor
    E->>N: exec nginx -g 'daemon off;'
    deactivate E
    activate N

    N-->>K: Healthcheck OK
    K->>K: Pod READY
    deactivate P

    B->>N: GET /
    N-->>B: index.html
    B->>N: GET /config.js
    N-->>B: window.__RUNTIME_CONFIG__ = {...}
    B->>N: GET /assets/main.js
    N-->>B: React bundle
    B->>B: App renderizada con config
    deactivate N
```

## Alternativas Consideradas

### Comparación Visual

```mermaid
graph LR
    subgraph Alt1["Alternativa 1: Build Args"]
        A1[GitHub Actions] -->|40+ ARGs| A2[Docker build]
        A2 --> A3[Imagen con config<br/>quemada]
        A3 -.->|Una por ambiente| A4[3 imágenes]
    end

    subgraph Alt2["Alternativa 2: SSR"]
        B1[Next.js/SSR] --> B2[Server renderiza<br/>con env vars]
        B2 --> B3[HTML dinámico]
    end

    subgraph Alt3["Alternativa 3: API Config"]
        C1[Browser] -->|GET /api/config| C2[Backend]
        C2 -->|JSON config| C1
        C1 --> C3[+1 request latencia]
    end

    subgraph Alt4["Alternativa 4: .env en Repo"]
        D1[.env.production<br/>en Git] --> D2[Valores hardcoded]
        D2 -.->|Rebuild para cambios| D3[No dinámico]
    end

    subgraph Elegida["✅ Solución Elegida"]
        E1[ConfigMap K8s] --> E2[entrypoint.sh]
        E2 --> E3[config.js runtime]
        E3 --> E4[Una imagen<br/>todos ambientes]
    end

    style Alt1 fill:#ffcdd2
    style Alt2 fill:#ffcdd2
    style Alt3 fill:#ffcdd2
    style Alt4 fill:#ffcdd2
    style Elegida fill:#c8e6c9
```

### Alternativa 1: Build Args en Docker

**Descripción**: Pasar variables como ARG en el Dockerfile y generar `.env` durante build.

```dockerfile
ARG VITE_API_BASE_URL=/api/v1
ARG VITE_OPERATOR_ID=micarpeta
# ... 40+ args

RUN echo "VITE_API_BASE_URL=${VITE_API_BASE_URL}" > .env
```

**Ventajas**:
- ✅ Las variables están "quemadas" en el bundle (no runtime)
- ✅ No requiere `config.js` adicional

**Desventajas**:
- ❌ Requiere modificar workflow de GitHub Actions
- ❌ Una imagen por ambiente
- ❌ Cambios requieren rebuild completo
- ❌ No es nativo de Kubernetes
- ❌ Dockerfile con 40+ ARGs (difícil mantener)

**Razón de rechazo**: No escala bien con múltiples ambientes y requiere rebuilds frecuentes.

### Alternativa 2: Server-Side Rendering (SSR)

**Descripción**: Migrar a Next.js o similar para renderizar en servidor.

**Ventajas**:
- ✅ Variables de entorno en servidor (no expuestas al cliente)
- ✅ SEO mejorado
- ✅ Configuración dinámica nativa

**Desventajas**:
- ❌ Refactorización completa del frontend
- ❌ Cambio de arquitectura SPA → SSR
- ❌ Mayor complejidad operacional
- ❌ Tiempo de desarrollo: semanas

**Razón de rechazo**: Demasiado invasivo para el problema que resuelve.

### Alternativa 3: API de Configuración

**Descripción**: Endpoint REST que devuelve la configuración: `GET /api/config`.

**Ventajas**:
- ✅ Configuración centralizada en backend
- ✅ Puede cambiar sin reiniciar frontend

**Desventajas**:
- ❌ Request adicional al cargar la app (latencia)
- ❌ Requiere backend para configuración de frontend
- ❌ Más complejidad de infraestructura

**Razón de rechazo**: Overhead innecesario. La configuración es estática durante la vida del pod.

### Alternativa 4: .env.production en el Repositorio

**Descripción**: Commitear `.env.production` con valores de producción.

**Ventajas**:
- ✅ Simple de implementar
- ✅ No requiere cambios en Dockerfile

**Desventajas**:
- ❌ Valores hardcodeados en Git
- ❌ Una imagen por ambiente
- ❌ Cambios requieren PR + rebuild

**Razón de rechazo**: No resuelve el problema fundamental de configuración por ambiente.

### Tabla Comparativa

| Criterio | Runtime Config | Build Args | SSR | API Config | .env en Repo |
|----------|---------------|------------|-----|------------|--------------|
| **Una imagen/todos ambientes** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Cambios sin rebuild** | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Nativo de K8s** | ✅ | ❌ | ⚠️ | ⚠️ | ❌ |
| **Complejidad** | ⚠️ Media | ⚠️ Media | ❌ Alta | ⚠️ Media | ✅ Baja |
| **Latencia inicial** | ✅ | ✅ | ⚠️ | ❌ | ✅ |
| **Compatible dev local** | ✅ | ⚠️ | ✅ | ✅ | ✅ |
| **GitOps** | ✅ | ❌ | ✅ | ⚠️ | ⚠️ |

## Consecuencias

### Diagrama de Impactos

```mermaid
mindmap
  root((Runtime Config))
    Positivos
      Una imagen
        Dev/Staging/Prod
        Mismo artefacto
      Config dinámica
        kubectl edit configmap
        rollout restart 30s
      K8s nativo
        ConfigMaps
        GitOps
      Dev local
        .env funciona igual
        Sin cambios
      Type safe
        TypeScript
        Validación compile time
    Negativos
      Complejidad inicial
        3 etapas entender
        Build Runtime Frontend
      Variables expuestas
        window.__RUNTIME_CONFIG__
        Pero no son secretos
      Dos fuentes verdad
        .env local
        ConfigMap K8s
      Requiere restart
        kubectl rollout restart
        30 60 segundos
```

### Positivas

✅ **Una imagen, múltiples ambientes**: Mismo artefacto para dev, staging y prod

✅ **Configuración dinámica**: Cambiar ConfigMap + rollout restart (< 1 minuto)

✅ **Nativo de Kubernetes**: Usa ConfigMaps como debe ser

✅ **GitOps**: ConfigMaps versionados en Git, deployment declarativo

✅ **Backward compatible**: Desarrollo local sigue usando `.env` sin cambios

✅ **Type-safe**: TypeScript valida las variables en tiempo de desarrollo

✅ **Debugging**: `curl http://localhost:8080/config.js` muestra la config actual

✅ **Sin overhead**: El archivo se genera una vez al startup, no en cada request

✅ **Separación de concerns**: Configuración separada del código

### Negativas

⚠️ **Complejidad inicial**: Requiere entender el flujo de 3 etapas (build → runtime → frontend)

⚠️ **Variables expuestas al cliente**: Todo en `window.__RUNTIME_CONFIG__` es visible (pero no son secretos)

⚠️ **Dos fuentes de verdad**: `.env` local vs ConfigMap en K8s (pero esto es intencional)

⚠️ **Requiere restart**: Cambios en ConfigMap necesitan `kubectl rollout restart` (30-60 segundos)

### Riesgos y Mitigaciones

```mermaid
graph TB
    subgraph Riesgos["⚠️ Riesgos Identificados"]
        R1[config.js no se genera]
        R2[Valores incorrectos en ConfigMap]
        R3[Dev usa variable incorrecta]
        R4[Desincronización .env vs ConfigMap]
    end

    subgraph Mitigaciones["✅ Mitigaciones"]
        M1[Logging detallado<br/>Healthcheck valida pod]
        M2[Validación en deployment<br/>Rollback automático K8s]
        M3[Type-safe TypeScript<br/>Helper functions]
        M4[Documentación clara<br/>Defaults razonables]
    end

    R1 -->|Alto impacto<br/>Baja prob| M1
    R2 -->|Medio impacto<br/>Media prob| M2
    R3 -->|Bajo impacto<br/>Media prob| M3
    R4 -->|Bajo impacto<br/>Media prob| M4

    style Riesgos fill:#ffebee
    style Mitigaciones fill:#e8f5e9
```

## Implementación

### Estructura de Archivos

```mermaid
graph TB
    subgraph CW["services/citizen-web/"]
        IH[index.html<br/>Carga config.js]
        DF[Dockerfile<br/>Multi-stage build]
        EP[docker-entrypoint.sh<br/>Genera config.js]
        NC[nginx.conf.template<br/>API Gateway]

        subgraph SRC["src/"]
            subgraph CFG["shared/config/"]
                RC[runtimeConfig.ts<br/>Utility]
                FF[featureFlags.ts<br/>Usa runtime config]
            end
            subgraph UTL["shared/utils/"]
                ENV[env.ts<br/>Usa runtime config]
            end
        end

        subgraph K8S["k8s/"]
            CM[configmap.yaml<br/>40+ variables]
            DEP[deployment.yaml<br/>envFrom]
        end
    end

    IH -.-> RC
    DF --> EP
    EP --> NC
    RC --> FF
    RC --> ENV
    CM --> DEP

    style CW fill:#e3f2fd
    style SRC fill:#fff3e0
    style CFG fill:#fff9c4
    style UTL fill:#fff9c4
    style K8S fill:#c8e6c9
```

### Timeline de Implementación

```mermaid
gantt
    title Implementación Runtime Config
    dateFormat HH:mm
    axisFormat %H:%M

    section Diseño
    Spike y diseño           :done, d1, 00:00, 2h

    section Frontend
    runtimeConfig.ts         :done, f1, 02:00, 1h
    Actualizar featureFlags  :done, f2, after f1, 1h
    Actualizar env.ts        :done, f3, after f2, 1h

    section Docker
    Modificar Dockerfile     :done, d2, 05:00, 1h
    docker-entrypoint.sh     :done, d3, after d2, 1h

    section Kubernetes
    ConfigMap y Deployment   :done, k1, 07:00, 1h

    section Testing
    Tests unitarios          :done, t1, 08:00, 1h
    Build Docker             :done, t2, after t1, 1h

    section Docs
    ADR y documentación      :done, doc1, 10:00, 2h
```

## Métricas de Éxito

```mermaid
graph LR
    subgraph Antes["❌ Antes"]
        A1[Rebuild: 5-10 min]
        A2[Cambio config: 5-10 min]
        A3[Imágenes: 3]
        A4[Líneas CI/CD: +50]
    end

    subgraph Despues["✅ Después"]
        D1[Rebuild: 0 min]
        D2[Cambio config: 30-60 seg]
        D3[Imágenes: 1]
        D4[Líneas CI/CD: +0]
    end

    A1 -.->|Mejora| D1
    A2 -.->|Mejora| D2
    A3 -.->|Mejora| D3
    A4 -.->|Mejora| D4

    style Antes fill:#ffcdd2
    style Despues fill:#c8e6c9
```

| Métrica | Antes | Después | Objetivo |
|---------|-------|---------|----------|
| **Tiempo rebuild por cambio config** | 5-10 min | 0 min | 0 min |
| **Tiempo aplicar cambio config** | 5-10 min | 30-60 seg | < 2 min |
| **Imágenes Docker por ambiente** | 3 | 1 | 1 |
| **Líneas código workflow CI/CD** | +50 | +0 | Minimizar |
| **Tests pasando** | 100% | 100% | 100% |

## Referencias

### Patrones de Arquitectura

- **12-Factor App - Config**: https://12factor.net/config
- **Kubernetes Configuration Best Practices**: https://kubernetes.io/docs/concepts/configuration/configmap/

### Implementaciones Similares

- **Create React App - Runtime Environment Variables**
- **Nginx with envsubst**

### Documentación Interna

- **ADR-0001**: Frontend monolítico con React + Vite
- **RNF-02**: Requisitos de escalabilidad
- **RNF-05**: Requisitos de mantenibilidad

## Aprobación

**Decisión tomada por**: Equipo de desarrollo
**Aprobado por**: Arquitecto de soluciones
**Fecha de aprobación**: 2025-11-07

## Revisiones

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-11-07 | Versión inicial |

---

**Estado actual**: ✅ Implementado y en revisión
**Próximos pasos**: Testing en ambiente de staging, validación en producción

