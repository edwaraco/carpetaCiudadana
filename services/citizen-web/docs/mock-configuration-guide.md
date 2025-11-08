# Guía de Configuración de Mocks Granulares

Esta guía explica cómo utilizar el sistema de mocks granulares para facilitar la integración incremental de servicios backend.

## Conceptos Clave

### Master Switch (`VITE_USE_MOCKS`)

El master switch controla si los mocks están habilitados a nivel global:

- **`VITE_USE_MOCKS=true`**: Habilita el sistema de mocks (usa configuración granular)
- **`VITE_USE_MOCKS=false`**: Deshabilita TODOS los mocks (todos los servicios usan APIs reales)

### Control Granular por Contexto

Cuando `VITE_USE_MOCKS=true`, puedes controlar individualmente cada contexto/servicio:

```bash
VITE_MOCK_AUTHENTICATION=true   # Mock habilitado
VITE_MOCK_DOCUMENTS=false       # Mock deshabilitado (usa API real)
VITE_MOCK_CARPETA=false         # Mock deshabilitado (usa API real)
```

## Casos de Uso

### Escenario 1: Desarrollo Completo con Mocks

**Situación**: Desarrollo frontend sin backend disponible.

**.env**:
```bash
VITE_USE_MOCKS=true

# Todos los contextos usan mocks (configuración por defecto)
# No necesitas especificar cada VITE_MOCK_* individualmente
```

**Resultado**:
- Todos los servicios usan implementaciones mock
- Frontend completamente funcional sin backend
- Ideal para desarrollo UI/UX inicial

**Console output esperado**:
```
[Mock Config] Configuración actual: {
  USE_MOCKS_GLOBAL: true,
  Contextos mockeados: ['AUTHENTICATION', 'IDENTITY', 'DOCUMENTS', 'CARPETA', ...],
  Contextos reales: []
}
🔧 [Authentication] Using MOCK Service
🔧 [Documents] Using MOCK Service
🔧 [Carpeta] Using MOCK Service
...
```

---

### Escenario 2: Integración Incremental - Carpeta y Documents

**Situación**: Backend de Carpeta y Documents está listo, quieres integrarlos pero mantener otros servicios mockeados.

**.env**:
```bash
VITE_USE_MOCKS=true

# Deshabilitar solo los mocks que tienen backend listo
VITE_MOCK_CARPETA=false
VITE_MOCK_DOCUMENTS=false

# Otros contextos mantienen mocks (no necesitas especificarlos)
```

**Resultado**:
- `folderService` usa `FolderApiService` (API real)
- `documentService` usa `DocumentApiService` (API real)
- Resto de servicios usan mocks
- Integración incremental sin afectar otras funcionalidades

**Console output esperado**:
```
[Mock Config] Configuración actual: {
  USE_MOCKS_GLOBAL: true,
  Contextos mockeados: ['AUTHENTICATION', 'IDENTITY', 'PORTABILITY', ...],
  Contextos reales: ['CARPETA', 'DOCUMENTS']
}
🚀 [Carpeta] Using REAL API Service
🚀 [Documents] Using REAL API Service
🔧 [Authentication] Using MOCK Service
🔧 [Identity] Using MOCK Service
...
```

---

### Escenario 3: Producción - Sin Mocks

**Situación**: Todos los backends están listos, despliegue a producción.

**.env.production**:
```bash
VITE_USE_MOCKS=false

# No necesitas especificar VITE_MOCK_* individualmente
# El master switch deshabilitado fuerza todos los servicios a usar APIs reales
```

**Resultado**:
- Todos los servicios usan implementaciones API reales
- Sin overhead de mocks en producción
- Configuración simple con una sola variable

**Console output esperado**:
```
[Mock Config] Configuración actual: {
  USE_MOCKS_GLOBAL: false,
  Contextos mockeados: [],
  Contextos reales: ['AUTHENTICATION', 'IDENTITY', 'DOCUMENTS', 'CARPETA', ...]
}
🚀 [Authentication] Using REAL API Service
🚀 [Documents] Using REAL API Service
🚀 [Carpeta] Using REAL API Service
...
```

---

### Escenario 4: Testing de Integración Específica

**Situación**: Quieres probar solo la integración de Authentication sin afectar el resto del desarrollo.

**.env**:
```bash
VITE_USE_MOCKS=true

# Deshabilitar solo Authentication para testing
VITE_MOCK_AUTHENTICATION=false

# Todos los demás servicios usan mocks
```

**Resultado**:
- `authService` usa `AuthApiService` (API real)
- Resto de servicios usan mocks
- Aislamiento de la prueba de integración

---

## Configuración por Contexto

### Contextos Disponibles

| Variable de Entorno | Contexto | Descripción |
|---------------------|----------|-------------|
| `VITE_MOCK_AUTHENTICATION` | Authentication | Login, logout, session |
| `VITE_MOCK_IDENTITY` | Identity | Registro y validación de ciudadanos |
| `VITE_MOCK_DOCUMENTS` | Documents | CRUD de documentos |
| `VITE_MOCK_CARPETA` | Carpeta | Carpeta personal (folder) |
| `VITE_MOCK_PORTABILITY` | Portability | Cambio de operador |
| `VITE_MOCK_REQUESTS` | Requests | Solicitudes de documentos |
| `VITE_MOCK_NOTIFICATIONS` | Notifications | Sistema de notificaciones |
| `VITE_MOCK_AUDIT` | Audit | Logs de auditoría |

### Valores Por Defecto

Si `VITE_USE_MOCKS=true` y NO especificas una variable `VITE_MOCK_*`, el valor por defecto es **`true`** (mock habilitado).

**Ejemplo**:
```bash
VITE_USE_MOCKS=true
# VITE_MOCK_DOCUMENTS no está definido
# Resultado: VITE_MOCK_DOCUMENTS = true (usa mock)
```

---

## Debugging y Verificación

### Console Logs en Desarrollo

El sistema automáticamente loguea la configuración en modo desarrollo:

```javascript
// En la consola del navegador verás:
[Mock Config] Configuración actual: {
  USE_MOCKS_GLOBAL: true,
  Contextos mockeados: ['AUTHENTICATION', 'IDENTITY', ...],
  Contextos reales: ['CARPETA', 'DOCUMENTS']
}

🚀 [Carpeta] Using REAL API Service
🚀 [Documents] Using REAL API Service
🔧 [Authentication] Using MOCK Service
```

### Verificación Programática

Puedes verificar la configuración en runtime:

```typescript
import { shouldUseMock, getMockConfigSummary } from '@/shared/config/mockConfig';

// Verificar un contexto específico
if (shouldUseMock('DOCUMENTS')) {
  console.log('Documents está usando mock');
} else {
  console.log('Documents está usando API real');
}

// Obtener resumen completo
const summary = getMockConfigSummary();
console.log('Resumen:', summary);
```

---

## Mejores Prácticas

### 1. Integración Incremental

Deshabilita mocks uno a uno conforme los backends estén listos:

**Semana 1**:
```bash
VITE_USE_MOCKS=true
VITE_MOCK_AUTHENTICATION=false  # Backend de auth listo
```

**Semana 2**:
```bash
VITE_USE_MOCKS=true
VITE_MOCK_AUTHENTICATION=false
VITE_MOCK_CARPETA=false         # Backend de carpeta listo
```

**Semana 3**:
```bash
VITE_USE_MOCKS=true
VITE_MOCK_AUTHENTICATION=false
VITE_MOCK_CARPETA=false
VITE_MOCK_DOCUMENTS=false       # Backend de documentos listo
```

### 2. Testing Local con Backend Parcial

Si tienes algunos microservicios corriendo localmente:

```bash
VITE_USE_MOCKS=true
VITE_MOCK_CARPETA=false         # Microservicio corriendo en :8081
VITE_MOCK_DOCUMENTS=false       # Microservicio corriendo en :8082
# Resto usa mocks
```

### 3. Archivo .env Local

Crea un `.env.local` (git-ignored) para tu configuración personal:

```bash
# .env.local
VITE_USE_MOCKS=true
VITE_MOCK_CARPETA=false    # Estoy desarrollando la integración de carpeta
```

### 4. CI/CD Environments

Configura diferentes perfiles para CI/CD:

**.env.development**:
```bash
VITE_USE_MOCKS=true  # Todos los mocks habilitados
```

**.env.staging**:
```bash
VITE_USE_MOCKS=false  # Todos los backends disponibles en staging
```

**.env.production**:
```bash
VITE_USE_MOCKS=false  # Sin mocks en producción
```

---

## Troubleshooting

### Problema: Cambios no se reflejan

**Solución**: Reinicia el servidor de desarrollo después de cambiar `.env`:

```bash
# Ctrl+C para detener
npm run dev
```

### Problema: Todos los servicios usan API real cuando no debería

**Verificar**: Revisa que `VITE_USE_MOCKS=true` esté correctamente configurado.

```bash
# Incorrecto
VITE_USE_MOCKS=TRUE   # Debe ser lowercase 'true'

# Correcto
VITE_USE_MOCKS=true
```

### Problema: Mock específico no se deshabilita

**Verificar**: Asegúrate de que la variable esté correctamente nombrada:

```bash
# Incorrecto
VITE_MOCK_FOLDER=false         # Nombre incorrecto

# Correcto
VITE_MOCK_CARPETA=false        # Nombre correcto del contexto
```

---

## Arquitectura Técnica

### Flujo de Decisión

```mermaid
graph TD
    A[Factory crea servicio] --> B{VITE_USE_MOCKS?}
    B -->|false| C[Usar API Service]
    B -->|true| D{VITE_MOCK_[CONTEXTO]?}
    D -->|false| C
    D -->|true| E[Usar Mock Service]
    D -->|undefined| F{Default config?}
    F -->|true| E
    F -->|false| C
```

### Estructura de Código

```
src/
├── shared/
│   └── config/
│       └── mockConfig.ts          # Configuración granular de mocks
└── contexts/
    ├── documents/
    │   └── infrastructure/
    │       ├── index.ts            # Factory que usa shouldUseMock('DOCUMENTS')
    │       ├── api/
    │       │   └── DocumentApiService.ts
    │       └── mocks/
    │           └── DocumentMockService.ts
    └── folder/
        └── infrastructure/
            ├── index.ts            # Factory que usa shouldUseMock('CARPETA')
            ├── api/
            │   └── FolderApiService.ts
            └── mocks/
                └── FolderMockService.ts
```

---

## Migración desde Sistema Anterior

Si usabas `VITE_USE_MOCK_API`, migra así:

**Antes**:
```bash
VITE_USE_MOCK_API=true
```

**Ahora**:
```bash
VITE_USE_MOCKS=true
```

**Con control granular**:
```bash
VITE_USE_MOCKS=true
VITE_MOCK_CARPETA=false    # Nuevo: control por contexto
```

---

## Referencias

- **Código fuente**: `src/shared/config/mockConfig.ts`
- **Archivo de ejemplo**: `.env.example`
- **Feature flags**: Ver `docs/feature-flags-guide.md` (si existe)

