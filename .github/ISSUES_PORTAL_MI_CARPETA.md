# Issues - Portal Mi Carpeta (Experiencia de Usuario)

## Índice de Issues

- [Issue #0: Scaffolding del Proyecto Frontend](#issue-0-scaffolding-del-proyecto-frontend)
- [Issue #1: Registro de Usuarios (Ciudadanos)](#issue-1-registro-de-usuarios-ciudadanos)
- [Issue #2: Autenticación de Usuarios (Login)](#issue-2-autenticación-de-usuarios-login)
- [Issue #3: Gestión de Carpeta del Usuario](#issue-3-gestión-de-carpeta-del-usuario)
- [Issue #4: Autenticación de Documentos](#issue-4-autenticación-de-documentos)
- [Issue #5: Transferencia de Ciudadano (Portabilidad)](#issue-5-transferencia-de-ciudadano-portabilidad)

---

## Issue #0: Scaffolding del Proyecto Frontend

### Labels
`infrastructure`, `setup`, `frontend`, `high-priority`

### Título
Configurar arquitectura base y scaffolding del portal Mi Carpeta

### Descripción

Como equipo de desarrollo, necesitamos configurar la arquitectura base del proyecto frontend para establecer las bases técnicas que soportarán todas las funcionalidades del portal "Mi Carpeta".

**Contexto:**
- **Proyecto:** Carpeta Ciudadana - Portal Frontend
- **Stack Tecnológico:** React 18, TypeScript, Material-UI, Vite
- **Arquitectura:** DDD (Domain-Driven Design) con Bounded Contexts
- **Ubicación:** `/services/carpeta-ciudadana-frontend/`

### Objetivos

1. Establecer estructura de carpetas escalable
2. Configurar herramientas de desarrollo
3. Implementar componentes base reutilizables
4. Configurar routing y navegación
5. Establecer patrones de integración con APIs

---

### Criterios de Aceptación

#### **1. Estructura de Carpetas (DDD)**

- [ ] Organizar proyecto siguiendo arquitectura hexagonal por bounded contexts:

```
src/
├── shared/                           # Código compartido entre contextos
│   ├── components/                   # Componentes UI reutilizables
│   │   ├── Layout/
│   │   │   ├── Layout.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Footer.tsx
│   │   ├── forms/                    # Componentes de formulario
│   │   │   ├── TextField.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── DatePicker.tsx
│   │   ├── feedback/                 # Componentes de feedback
│   │   │   ├── Alert.tsx
│   │   │   ├── Snackbar.tsx
│   │   │   ├── Loader.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── navigation/
│   │       ├── ProtectedRoute.tsx
│   │       └── Breadcrumbs.tsx
│   ├── hooks/                        # Hooks reutilizables
│   │   ├── useAuth.ts
│   │   ├── useApi.ts
│   │   ├── useForm.ts
│   │   └── useNotification.ts
│   ├── utils/                        # Utilidades
│   │   ├── httpClient.ts
│   │   ├── api.types.ts
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   └── constants.ts
│   ├── types/                        # Types compartidos
│   │   ├── common.types.ts
│   │   └── api.types.ts
│   └── theme/                        # Tema Material-UI
│       ├── theme.ts
│       ├── colors.ts
│       └── typography.ts
│
├── contexts/                         # Bounded Contexts (DDD)
│   ├── identity/                     # Identidad y Registro
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   └── validation.ts
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   │   └── IdentityApiService.ts
│   │   │   ├── mocks/
│   │   │   │   └── IdentityMockService.ts
│   │   │   └── IIdentityService.ts
│   │   ├── hooks/
│   │   │   ├── useRegisterCitizen.ts
│   │   │   └── useValidateCitizen.ts
│   │   └── components/
│   │       ├── RegisterCitizenForm.tsx
│   │       └── CitizenInfo.tsx
│   │
│   ├── authentication/               # Autenticación y Autorización
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   └── auth.types.ts
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   │   └── AuthApiService.ts
│   │   │   └── IAuthService.ts
│   │   ├── hooks/
│   │   │   ├── useLogin.ts
│   │   │   ├── useLogout.ts
│   │   │   └── useAuthContext.ts
│   │   ├── components/
│   │   │   ├── LoginForm.tsx
│   │   │   └── SessionExpiredDialog.tsx
│   │   └── context/
│   │       └── AuthContext.tsx
│   │
│   ├── personal-folder/              # Carpeta Personal
│   │   ├── domain/
│   │   │   ├── types.ts
│   │   │   ├── document.types.ts
│   │   │   └── validation.ts
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   │   └── DocumentApiService.ts
│   │   │   └── IDocumentService.ts
│   │   ├── hooks/
│   │   │   ├── useUploadDocument.ts
│   │   │   ├── useListDocuments.ts
│   │   │   └── useDownloadDocument.ts
│   │   └── components/
│   │       ├── DocumentList.tsx
│   │       ├── DocumentCard.tsx
│   │       ├── UploadDocumentForm.tsx
│   │       ├── DocumentPreview.tsx
│   │       └── StorageQuotaIndicator.tsx
│   │
│   ├── certification/                # Firma y Certificación
│   │   ├── domain/
│   │   │   └── types.ts
│   │   ├── infrastructure/
│   │   │   ├── api/
│   │   │   │   └── CertificationApiService.ts
│   │   │   └── ICertificationService.ts
│   │   ├── hooks/
│   │   │   └── useAuthenticateDocument.ts
│   │   └── components/
│   │       └── AuthenticateDocumentForm.tsx
│   │
│   └── portability/                  # Gestión de Portabilidad
│       ├── domain/
│       │   ├── types.ts
│       │   └── operator.types.ts
│       ├── infrastructure/
│       │   ├── api/
│       │   │   └── PortabilityApiService.ts
│       │   └── IPortabilityService.ts
│       ├── hooks/
│       │   ├── useGetOperators.ts
│       │   └── useInitiatePortability.ts
│       └── components/
│           ├── OperatorSelector.tsx
│           ├── InitiatePortabilityForm.tsx
│           └── PortabilityStatus.tsx
│
├── pages/                            # Páginas/Vistas
│   ├── Home.tsx
│   ├── Login.tsx
│   ├── Register.tsx
│   ├── Dashboard.tsx
│   ├── Documents.tsx
│   ├── Portability.tsx
│   ├── InstitutionalDashboard.tsx
│   └── NotFound.tsx
│
├── App.tsx                           # Componente raíz
├── main.tsx                          # Entry point
└── vite-env.d.ts                     # Types de Vite
```

#### **2. Configuración de Herramientas**

- [ ] Configurar ESLint con reglas para React, TypeScript y accesibilidad
- [ ] Configurar Prettier para formateo consistente
- [ ] Configurar Husky para pre-commit hooks
- [ ] Configurar path aliases en `tsconfig.json`:
  ```json
  {
    "compilerOptions": {
      "paths": {
        "@/*": ["./src/*"],
        "@shared/*": ["./src/shared/*"],
        "@contexts/*": ["./src/contexts/*"],
        "@pages/*": ["./src/pages/*"]
      }
    }
  }
  ```
- [ ] Configurar variables de entorno con `.env.example`

#### **3. Tema y Diseño (Material-UI)**

- [ ] Crear tema personalizado siguiendo guía de gobierno colombiano:
  - Paleta de colores accesible (WCAG AA)
  - Tipografía clara y legible
  - Espaciado consistente
- [ ] Configurar breakpoints responsive:
  - Mobile: 320px - 768px
  - Tablet: 769px - 1024px
  - Desktop: 1025px+
- [ ] Implementar ThemeProvider en App.tsx
- [ ] Crear componentes base con tema aplicado

#### **4. Routing y Navegación**

- [ ] Configurar React Router v6 con rutas principales:
  ```typescript
  // Rutas públicas
  /                     → Home/Landing
  /login                → Login
  /registro             → Register

  // Rutas protegidas - Ciudadanos
  /dashboard            → Dashboard Ciudadano
  /documentos           → Gestión de Documentos
  /portabilidad         → Transferencia de Operador

  // Rutas protegidas - Funcionarios
  /institucional/dashboard         → Dashboard Institucional
  /institucional/autenticar        → Autenticar Documentos
  ```
- [ ] Implementar `ProtectedRoute` component con validación de JWT
- [ ] Implementar redirección automática según rol (ciudadano/funcionario)
- [ ] Configurar 404 page

#### **5. HTTP Client y API Integration**

- [ ] Configurar Axios instance con:
  - Base URL desde variables de entorno
  - Interceptors para agregar JWT automáticamente
  - Interceptor de errores para manejo global
  - Timeout configurable
- [ ] Crear types para responses de MinTIC API
- [ ] Implementar error handling centralizado
- [ ] Crear abstracción de servicios (IService interfaces)

**Ejemplo:**
```typescript
// shared/utils/httpClient.ts
import axios from 'axios';

const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

// Request interceptor - Agregar JWT
httpClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor - Manejo de errores
httpClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirigir a login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default httpClient;
```

#### **6. Context API / State Management**

- [ ] Implementar AuthContext para manejo de autenticación global:
  - Usuario actual
  - JWT token
  - Rol (ciudadano/funcionario)
  - Métodos: login, logout, refreshToken
- [ ] Implementar NotificationContext para notificaciones/alertas globales
- [ ] Considerar Zustand para estado complejo (documentos, portabilidad)

#### **7. Componentes Base Reutilizables**

- [ ] Implementar componentes compartidos:
  - **Layout:** Header, Sidebar, Footer
  - **Forms:** TextField, Select, FileUpload, DatePicker (wrapping Material-UI)
  - **Feedback:** Alert, Snackbar, Loader, ErrorBoundary
  - **Navigation:** ProtectedRoute, Breadcrumbs
- [ ] Documentar componentes con JSDoc
- [ ] Crear Storybook (opcional) para catálogo de componentes

#### **8. Testing Setup**

- [ ] Configurar Jest + React Testing Library
- [ ] Configurar `setupTests.ts` con matchers de jest-dom
- [ ] Crear utilities de testing:
  - `renderWithProviders` (Router + Theme + Auth)
  - Mock de httpClient
  - Mock de MinTIC API responses
- [ ] Escribir tests básicos para componentes compartidos
- [ ] Configurar coverage mínimo (80%)

#### **9. Accessibility (A11y)**

- [ ] Configurar eslint-plugin-jsx-a11y
- [ ] Implementar labels semánticos en formularios
- [ ] Asegurar navegación por teclado en todos los componentes
- [ ] Implementar roles ARIA donde sea necesario
- [ ] Validar contraste de colores (WCAG AA)

#### **10. Docker y Deployment**

- [ ] Validar `Dockerfile` existente
- [ ] Validar `nginx.conf` para SPA routing
- [ ] Crear `docker-compose.yml` para desarrollo local
- [ ] Documentar comandos de build y deployment

#### **11. Documentación**

- [ ] Actualizar `README.md` con:
  - Estructura del proyecto
  - Scripts disponibles
  - Guía de desarrollo
  - Convenciones de código
  - Guía de contribución
- [ ] Crear `CONTRIBUTING.md` con:
  - Proceso de PR
  - Estándares de código
  - Guía de testing
- [ ] Documentar arquitectura DDD y bounded contexts

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Estructura de carpetas implementada y documentada
- [ ] Configuración de herramientas funcionando (ESLint, Prettier, Husky)
- [ ] Tema Material-UI aplicado y responsive
- [ ] Routing configurado con ProtectedRoute
- [ ] HTTP client configurado con interceptors
- [ ] AuthContext implementado
- [ ] Componentes base creados y testeados (coverage > 80%)
- [ ] Build de producción exitoso (`npm run build`)
- [ ] Documentación actualizada
- [ ] PR aprobado y mergeado a `main`

---

### Referencias

- **Arquitectura:** `/CLAUDE.md` - Estructura de monorepo
- **Requisitos Funcionales:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md`
- **DDD Análisis:** `/docs/informacion_cruda/ddd_analisis/ddd__analisis.md`
- **Proyecto Actual:** `/services/carpeta-ciudadana-frontend/`

---

### Dependencias

- Node.js >= 20.0.0
- npm >= 10.0.0
- Acceso a APIs de MinTIC (dev/staging environment)

---

### Estimación

**Esfuerzo:** 13-21 horas

**Breakdown:**
- Estructura de carpetas y organización: 3h
- Configuración de herramientas: 2h
- Tema y componentes base: 5h
- Routing y navegación: 2h
- HTTP client y API integration: 3h
- Context API: 2h
- Testing setup: 2h
- Documentación: 2h

---

### Notas Técnicas

1. **Path Aliases:** Facilita imports limpios (`@shared/components/Layout` vs `../../../shared/components/Layout`)
2. **Barrel Exports:** Usar `index.ts` en cada carpeta para facilitar imports
3. **Lazy Loading:** Considerar code splitting para páginas (`React.lazy`)
4. **Memoization:** Usar `React.memo`, `useMemo`, `useCallback` para optimización
5. **Error Boundaries:** Implementar en nivel de página y componentes críticos

---

### Issues Relacionados

Este issue es prerequisito para:
- Issue #1: Registro de Usuarios
- Issue #2: Login de Usuarios
- Issue #3: Gestión de Carpeta
- Issue #4: Autenticación de Documentos
- Issue #5: Transferencia de Operador

---

## Issue #1: Registro de Usuarios (Ciudadanos)

### Labels
`feature`, `frontend`, `identity-context`, `high-priority`

### Título
Implementar flujo de registro de ciudadanos en portal Mi Carpeta

### Descripción

Como ciudadano colombiano, quiero registrarme en el portal "Mi Carpeta" para obtener mi carpeta ciudadana y acceder a mis documentos digitales.

**Contexto:**
- **Bounded Context:** Identidad y Registro
- **Requisito Funcional:** FR-CU-01, FR-CU-02
- **Stack Actual:** React 18, TypeScript, Material-UI, React Hook Form
- **Arquitectura:** Ya existe `RegisterCitizenForm.tsx` y hooks base en `/src/contexts/identity/`

---

### Criterios de Aceptación

#### **UI/UX**

- [ ] **Diseñar pantalla de registro responsive** (`/pages/Register.tsx`)
  - Layout centrado con logo del operador
  - Título: "Registro - Carpeta Ciudadana"
  - Breadcrumb: Inicio > Registro
  - Footer con enlaces a términos y condiciones

- [ ] **Formulario de registro con React Hook Form** (`RegisterCitizenForm.tsx`)
  - **Campo: Número de Identificación**
    - Type: number
    - Requerido: ✅
    - Validación: 6-12 dígitos numéricos
    - Placeholder: "Ej: 1234567890"
    - Botón "Validar" al lado (verificar si ya está registrado)

  - **Campo: Nombre Completo**
    - Type: text
    - Requerido: ✅
    - Validación: Mínimo 3 caracteres
    - Placeholder: "Ej: Carlos Andrés Caro"

  - **Campo: Dirección**
    - Type: text
    - Requerido: ✅
    - Placeholder: "Ej: Cra 54 # 45-67"

  - **Campo: Email**
    - Type: email
    - Requerido: ✅
    - Validación: Formato email válido
    - Placeholder: "ejemplo@correo.com"

  - **Campo: Contraseña**
    - Type: password
    - Requerido: ✅
    - Validación: Mínimo 8 caracteres, 1 mayúscula, 1 número
    - Toggle para mostrar/ocultar contraseña

  - **Campo: Confirmar Contraseña**
    - Type: password
    - Requerido: ✅
    - Validación: Debe coincidir con contraseña

  - **Campo: Operador**
    - Type: select (dropdown)
    - Requerido: ✅
    - Opciones cargadas dinámicamente desde backend/MinTIC
    - Placeholder: "Seleccione su operador"

- [ ] **Indicadores de validación en tiempo real**
  - Mostrar ✅ verde cuando campo es válido
  - Mostrar ❌ rojo y mensaje de error cuando campo es inválido
  - Validar mientras usuario escribe (debounce 300ms)

- [ ] **Mensajes de error claros y accesibles**
  - Errores debajo de cada campo con color rojo
  - Aria-live para lectores de pantalla
  - Lenguaje claro y en español

- [ ] **Estados de carga (Loaders)**
  - Skeleton loader mientras carga lista de operadores
  - Spinner en botón "Validar ID" durante validación
  - Spinner en botón "Registrarse" durante registro
  - Deshabilitar formulario durante operaciones asíncronas

- [ ] **Responsive Design**
  - Mobile (320px-768px): Formulario en columna única
  - Tablet (769px-1024px): Formulario centrado
  - Desktop (1025px+): Formulario máximo 600px de ancho

#### **Funcionalidad**

- [ ] **Validación de ciudadano existente** (`useValidateCitizen.ts`)
  - Implementar hook que llame a `/apis/validateCitizen/{id}`
  - **Flujo:**
    1. Usuario ingresa ID y hace clic en "Validar"
    2. Request GET a `/apis/validateCitizen/{id}`
    3. **Respuesta 200:** Ciudadano disponible → Mostrar ✅ "ID disponible para registro"
    4. **Respuesta 204:** Ya registrado → Mostrar ❌ "Este ID ya está registrado. ¿Desea iniciar sesión?"
    5. **Respuesta 501:** Parámetros incorrectos → Mostrar error de validación
    6. **Respuesta 500:** Error de servidor → Mostrar mensaje genérico "Error al validar ID"
  - Bloquear botón "Registrarse" si ID no está validado

- [ ] **Registro de ciudadano** (`useRegisterCitizen.ts`)
  - Implementar hook que llame a `/apis/registerCitizen`
  - **Payload:**
    ```json
    {
      "id": 1234567890,
      "name": "Carlos Andrés Caro",
      "address": "Cra 54 # 45-67",
      "email": "caro@mymail.com",
      "operatorId": "65ca0a00d833e984e2608756",
      "operatorName": "Operador Ciudadano"
    }
    ```
  - **Flujo:**
    1. Usuario completa formulario y hace clic en "Registrarse"
    2. Validar todos los campos localmente
    3. Request POST a `/apis/registerCitizen`
    4. **Respuesta 201:** Éxito → Mostrar success message + redirigir a `/login`
    5. **Respuesta 501:** Datos incorrectos → Mostrar errores específicos en campos
    6. **Respuesta 500:** Error de servidor → Mostrar mensaje genérico

- [ ] **Manejo de errores robusto**
  - Capturar errores de red (timeout, sin conexión)
  - Mostrar Snackbar/Alert con mensaje de error
  - Permitir reintentar operación
  - Log de errores en consola (desarrollo) y servicio de monitoreo (producción)

- [ ] **Registro de auditoría** (lado backend, validar integración)
  - Cada registro exitoso debe generar log con:
    - Timestamp
    - ID del ciudadano
    - Operador seleccionado
    - IP del cliente
    - User-agent

#### **Navegación**

- [ ] **Configurar ruta `/registro`** en React Router
  - Ruta pública (accesible sin autenticación)
  - Meta tags para SEO: título, descripción

- [ ] **Redirección post-registro**
  - Éxito → Redirigir a `/login` con query param `?registered=true`
  - En `/login`, mostrar mensaje: "Registro exitoso. Inicie sesión con sus credenciales."

- [ ] **Enlace a login si usuario ya registrado**
  - Mostrar link "¿Ya tienes cuenta? Inicia sesión" debajo del formulario
  - Si validación retorna 204, mostrar botón "Ir a Login"

#### **Testing**

- [ ] **Unit Tests** (`RegisterCitizenForm.test.tsx`)
  - Renderizado correcto del formulario
  - Validación de campos requeridos
  - Validación de formato email
  - Validación de coincidencia de contraseñas
  - Validación de formato de ID (numérico, longitud)

- [ ] **Integration Tests** (`useRegisterCitizen.test.ts`)
  - Mock de API `/apis/validateCitizen/{id}` con diferentes respuestas
  - Mock de API `/apis/registerCitizen` con éxito y errores
  - Verificar que se llama a API con payload correcto
  - Verificar manejo de errores de red

- [ ] **E2E Test** (Playwright/Cypress)
  - Flujo completo de registro exitoso
  - Navegación a `/registro`
  - Llenar formulario
  - Validar ID
  - Submit
  - Verificar redirección a `/login`

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Formulario responsive en mobile, tablet, desktop
- [ ] Validación de ID funcional con feedback visual
- [ ] Registro exitoso redirige a login
- [ ] Manejo de errores implementado con mensajes claros
- [ ] Tests unitarios y de integración pasan (coverage > 80%)
- [ ] E2E test pasa en CI/CD
- [ ] Accesibilidad validada (navegación por teclado, screen readers)
- [ ] Code review aprobado
- [ ] Documentación actualizada en README

---

### Referencias

- **Requisitos:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md#1-crear-ciudadano`
- **Swagger MinTIC:**
  - `/apis/registerCitizen` (POST)
  - `/apis/validateCitizen/{id}` (GET)
- **Código Actual:**
  - `/src/contexts/identity/components/RegisterCitizenForm.tsx`
  - `/src/contexts/identity/hooks/useRegisterCitizen.ts`
  - `/src/contexts/identity/hooks/useValidateCitizen.ts`

---

### Dependencias

- **Issue #0:** Scaffolding del proyecto (debe estar completo)
- **Backend:** Endpoints de MinTIC expuestos
  - `GET /apis/validateCitizen/{id}`
  - `POST /apis/registerCitizen`
- **Backend:** Endpoint para obtener lista de operadores
  - `GET /apis/getOperators`

---

### Estimación

**Esfuerzo:** 5-8 horas

**Breakdown:**
- UI/Formulario: 2h
- Lógica de validación: 1.5h
- Integración con API: 1.5h
- Testing: 2h
- Refinamiento y bugs: 1h

---

### Mockups/Wireframes

```
┌─────────────────────────────────────────┐
│  [Logo Operador]  Carpeta Ciudadana     │
├─────────────────────────────────────────┤
│  Inicio > Registro                      │
│                                         │
│  Registro de Ciudadano                  │
│  ════════════════════════                │
│                                         │
│  [ Número de Identificación* ]  [Validar]│
│  ✅ ID disponible                        │
│                                         │
│  [ Nombre Completo* ]                   │
│                                         │
│  [ Dirección* ]                         │
│                                         │
│  [ Email* ]                             │
│                                         │
│  [ Contraseña* ]  👁                    │
│  💡 Mínimo 8 caracteres, 1 mayúscula... │
│                                         │
│  [ Confirmar Contraseña* ]              │
│                                         │
│  [ Seleccione su operador ▼ ]          │
│                                         │
│  [    Registrarse    ]                  │
│                                         │
│  ¿Ya tienes cuenta? Inicia sesión       │
└─────────────────────────────────────────┘
```

---

## Issue #2: Autenticación de Usuarios (Login)

### Labels
`feature`, `frontend`, `authentication-context`, `high-priority`, `security`

### Título
Implementar sistema de autenticación seguro para ciudadanos y funcionarios

### Descripción

Como usuario (ciudadano o funcionario), quiero autenticarme de forma segura para acceder a mi carpeta personal o institucional.

**Contexto:**
- **Bounded Context:** Autenticación y Autorización
- **Requisito Funcional:** FR-AU-01, FR-AU-02, FR-AU-03
- **Stack Actual:** React 18, TypeScript, Material-UI, JWT (jwt-decode)
- **Arquitectura:** Necesita creación de módulo `/src/contexts/authentication/`

---

### Criterios de Aceptación

#### **UI/UX**

- [ ] **Diseñar pantalla de login responsive** (`/pages/Login.tsx`)
  - Layout centrado con logo del operador
  - Título: "Iniciar Sesión - Carpeta Ciudadana"
  - Imagen/ilustración de bienvenida (opcional)

- [ ] **Formulario de login** (`LoginForm.tsx`)
  - **Campo: Email / Usuario**
    - Type: text/email
    - Requerido: ✅
    - Placeholder: "Correo electrónico o usuario"
    - Autocomplete: "username"

  - **Campo: Contraseña**
    - Type: password
    - Requerido: ✅
    - Placeholder: "Contraseña"
    - Toggle para mostrar/ocultar contraseña
    - Autocomplete: "current-password"

  - **Selector de Tipo de Usuario**
    - Radio buttons / Toggle
    - Opciones: "Ciudadano" | "Funcionario Institucional"
    - Default: "Ciudadano"
    - Visual: Iconos diferenciados (👤 Ciudadano | 🏛️ Funcionario)

  - **Checkbox: "Recordarme"**
    - Opcional
    - Persistir sesión por 7 días si está marcado
    - Si no, sesión expira al cerrar navegador

- [ ] **Botones y enlaces**
  - Botón "Iniciar Sesión" (primary, full-width)
  - Link "¿Olvidaste tu contraseña?" → `/recuperar-contrasena` (future)
  - Link "¿No tienes cuenta? Regístrate" → `/registro`

- [ ] **Estados de carga y feedback**
  - Spinner en botón "Iniciar Sesión" durante autenticación
  - Deshabilitar formulario durante login
  - Mostrar errores debajo del formulario (no por campo individual)
  - Error genérico: "Credenciales incorrectas" (no especificar si es email o contraseña por seguridad)

- [ ] **Mensaje de registro exitoso**
  - Si viene de `/registro` con query `?registered=true`
  - Mostrar Alert success: "✅ Registro exitoso. Inicia sesión con tus credenciales."

- [ ] **Responsive Design**
  - Mobile: Formulario ocupa 90% del ancho
  - Tablet/Desktop: Formulario máximo 450px centrado

#### **Funcionalidad - Autenticación**

- [ ] **Implementar hook `useLogin`** (`/hooks/useLogin.ts`)
  - Request POST a `/api/auth/login`
  - **Payload:**
    ```json
    {
      "email": "caro@mymail.com",
      "password": "MiPassword123",
      "userType": "citizen" | "institutional"
    }
    ```
  - **Respuesta exitosa (200):**
    ```json
    {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "refresh_token_here",
      "user": {
        "id": "uuid-here",
        "email": "caro@mymail.com",
        "name": "Carlos Andrés Caro",
        "role": "citizen" | "institutional_staff"
      }
    }
    ```
  - **Respuesta error (401):**
    ```json
    {
      "error": "Invalid credentials"
    }
    ```

- [ ] **Almacenar JWT y datos de usuario**
  - Guardar `token` en `localStorage` (si "Recordarme") o `sessionStorage`
  - Guardar `refreshToken` en `localStorage` (si "Recordarme") o `sessionStorage`
  - Guardar datos de usuario en AuthContext
  - Decodificar JWT para extraer:
    - `exp`: Timestamp de expiración
    - `role`: Rol del usuario (citizen, institutional_staff)
    - `permissions`: Array de permisos

- [ ] **Implementar AuthContext** (`/context/AuthContext.tsx`)
  - **Estado:**
    ```typescript
    interface AuthState {
      isAuthenticated: boolean;
      user: User | null;
      token: string | null;
      role: 'citizen' | 'institutional_staff' | null;
      permissions: string[];
    }
    ```
  - **Métodos:**
    - `login(email, password, userType)`: Autenticar usuario
    - `logout()`: Cerrar sesión y limpiar storage
    - `refreshToken()`: Renovar token expirado
    - `checkAuth()`: Verificar si usuario sigue autenticado (al cargar app)

- [ ] **Auto-logout por inactividad**
  - Implementar timer de inactividad (15 minutos configurable)
  - Escuchar eventos: `mousemove`, `keydown`, `click`, `scroll`
  - Resetear timer en cada evento
  - Al expirar: Mostrar dialog "Sesión expirada" → logout

- [ ] **Refresh token automático**
  - Si JWT expira durante sesión activa:
    1. Detectar expiración (comparar `exp` vs timestamp actual)
    2. Request POST a `/api/auth/refresh` con `refreshToken`
    3. Actualizar `token` en storage
    4. Reintentar request original
  - Si refresh falla: logout forzado

- [ ] **Registro de auditoría** (lado backend, validar integración)
  - Cada intento de login (exitoso y fallido) debe generar log con:
    - Timestamp
    - Email/usuario
    - Tipo de usuario
    - IP del cliente
    - User-agent
    - Resultado (success/failed)

#### **Funcionalidad - Diferenciación de Roles**

- [ ] **Ciudadanos**
  - Role: `citizen`
  - Permisos: Ver/editar su carpeta, subir documentos, iniciar portabilidad
  - Redirigir a: `/dashboard`

- [ ] **Funcionarios Institucionales**
  - Role: `institutional_staff`
  - Permisos: Ver documentos compartidos, solicitar documentos, autenticar documentos
  - Redirigir a: `/institucional/dashboard`

- [ ] **Validar permisos en rutas**
  - Usar `ProtectedRoute` component
  - Ejemplo:
    ```tsx
    <ProtectedRoute
      path="/documentos"
      allowedRoles={['citizen']}
      element={<Documents />}
    />
    ```

#### **Navegación**

- [ ] **Configurar ruta `/login`**
  - Ruta pública
  - Si usuario ya está autenticado, redirigir a dashboard correspondiente

- [ ] **Redirección post-login**
  - **Ciudadanos:** Redirigir a `/dashboard`
  - **Funcionarios:** Redirigir a `/institucional/dashboard`
  - Si usuario intentó acceder a ruta protegida, redirigir a esa ruta después de login

- [ ] **Implementar ProtectedRoute** (`/shared/components/navigation/ProtectedRoute.tsx`)
  - Verificar `isAuthenticated` desde AuthContext
  - Verificar rol permitido
  - Si no autenticado: Redirigir a `/login?redirect=/ruta-original`
  - Si autenticado pero sin permisos: Mostrar 403 Forbidden

#### **Seguridad**

- [ ] **Control de acceso granular** (FR-AU-03)
  - Implementar función `hasPermission(permission: string)`
  - Verificar permisos antes de mostrar botones/secciones sensibles
  - Ejemplo: Solo mostrar "Autenticar Documento" si usuario tiene permiso `authenticate_documents`

- [ ] **Validación de tokens**
  - Validar firma del JWT (backend)
  - Verificar expiración antes de cada request
  - Rechazar tokens manipulados

- [ ] **Limpiar tokens al cerrar sesión**
  - Remover de localStorage/sessionStorage
  - Limpiar AuthContext
  - Invalidar token en backend (opcional, lista negra)

- [ ] **CSRF Protection** (si aplica)
  - Si backend usa cookies, implementar CSRF token
  - Enviar token en header `X-CSRF-Token`

#### **Testing**

- [ ] **Unit Tests** (`LoginForm.test.tsx`)
  - Renderizado correcto del formulario
  - Validación de campos requeridos
  - Toggle de contraseña funciona
  - Selector de tipo de usuario cambia estado

- [ ] **Integration Tests** (`useLogin.test.ts`)
  - Mock de API `/api/auth/login` con éxito
  - Mock de API con error 401
  - Verificar que se almacena token en storage
  - Verificar que AuthContext se actualiza

- [ ] **Tests de expiración de JWT**
  - Simular JWT expirado
  - Verificar que se llama a refresh token
  - Verificar logout si refresh falla

- [ ] **Tests de redirección basada en roles**
  - Login como ciudadano → Redirige a `/dashboard`
  - Login como funcionario → Redirige a `/institucional/dashboard`

- [ ] **E2E Tests**
  - Flujo completo de login exitoso
  - Login con credenciales incorrectas
  - Auto-logout por inactividad
  - Refresh token automático

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Login funcional para ciudadanos y funcionarios
- [ ] JWT almacenado y decodificado correctamente
- [ ] AuthContext implementado y funcional
- [ ] ProtectedRoute redirige correctamente
- [ ] Auto-logout por inactividad funciona
- [ ] Refresh token automático funciona
- [ ] Tests unitarios y de integración pasan (coverage > 80%)
- [ ] E2E tests pasan
- [ ] Accesibilidad validada
- [ ] Code review aprobado
- [ ] Documentación actualizada

---

### Referencias

- **Requisitos:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md#2-autenticación-de-usuarios`
- **Backend Endpoints:**
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `POST /api/auth/logout`

---

### Dependencias

- **Issue #0:** Scaffolding (AuthContext, ProtectedRoute)
- **Backend:** Endpoints de autenticación implementados
- **Backend:** Generación y validación de JWT

---

### Estimación

**Esfuerzo:** 8-13 horas

**Breakdown:**
- UI/Formulario: 2h
- Lógica de login y AuthContext: 3h
- Refresh token y auto-logout: 2h
- ProtectedRoute y redirección: 1.5h
- Testing: 3h
- Refinamiento: 1.5h

---

### Mockups/Wireframes

```
┌─────────────────────────────────────────┐
│  [Logo]  Carpeta Ciudadana              │
│                                         │
│     Iniciar Sesión                      │
│     ════════════════                     │
│                                         │
│  Tipo de usuario:                       │
│  ◉ Ciudadano    ○ Funcionario           │
│                                         │
│  [ Email o usuario* ]                   │
│                                         │
│  [ Contraseña* ]  👁                    │
│                                         │
│  ☐ Recordarme                           │
│                                         │
│  [    Iniciar Sesión    ]               │
│                                         │
│  ¿Olvidaste tu contraseña?              │
│  ¿No tienes cuenta? Regístrate          │
└─────────────────────────────────────────┘
```

---

## Issue #3: Gestión de Carpeta del Usuario

### Labels
`feature`, `frontend`, `personal-folder-context`, `high-priority`, `ux-critical`

### Título
Implementar dashboard de gestión de documentos para ciudadanos

### Descripción

Como ciudadano, quiero gestionar mis documentos (visualizar, subir, descargar, organizar) en mi carpeta personal para tener control sobre mi información digital.

**Contexto:**
- **Bounded Context:** Carpeta Personal
- **Requisito Funcional:** FR-SD-01, FR-SD-02, FR-SD-03, FR-SD-04
- **Stack Actual:** React 18, TypeScript, Material-UI, Axios
- **Arquitectura:** Necesita módulo `/src/contexts/personal-folder/`

---

### Criterios de Aceptación

#### **UI/UX - Dashboard Principal**

- [ ] **Diseñar layout de dashboard** (`/pages/Dashboard.tsx`)
  - Header con logo, nombre de usuario, botón de logout
  - Sidebar de navegación:
    - 📁 Mis Documentos (activo)
    - 📊 Estadísticas
    - 🔄 Portabilidad
    - ⚙️ Configuración
  - Área principal de contenido
  - Breadcrumbs: Inicio > Mis Documentos

- [ ] **Barra superior de acciones**
  - Botón "Subir Documento" (primary, destacado)
  - Barra de búsqueda: "Buscar por título, tipo, entidad..."
  - Toggle vista: Lista | Grid
  - Filtros dropdown:
    - Tipo de documento (Todos, Certificados, Temporales)
    - Contexto (Educación, Salud, Notaría, etc.)
    - Fecha (Última semana, Último mes, Último año, Personalizado)

- [ ] **Indicador de cuota de almacenamiento** (`StorageQuotaIndicator.tsx`)
  - Solo para documentos temporales
  - Progress bar visual:
    - Verde: 0-79%
    - Amarillo: 80-99%
    - Rojo: 100%
  - Texto: "45 de 100 documentos temporales (230 MB de 500 MB)"
  - Icono de advertencia cuando alcanza 80%
  - Alert cuando alcanza 100%

- [ ] **Lista/Grid de documentos** (`DocumentList.tsx`)
  - **Vista Lista:** Tabla con columnas:
    - Icono (según tipo de archivo)
    - Título
    - Tipo (Badge: Certificado/Temporal)
    - Contexto
    - Fecha de subida
    - Tamaño
    - Acciones (👁️ Ver, ⬇️ Descargar, 🗑️ Eliminar*)

  - **Vista Grid:** Cards con:
    - Thumbnail/preview (si es imagen) o icono
    - Título
    - Badge: Certificado/Temporal
    - Fecha
    - Acciones en hover

- [ ] **Paginación**
  - Mostrar 20 documentos por página
  - Controles: Primera, Anterior, [1][2][3]..., Siguiente, Última
  - Mostrar total: "Mostrando 1-20 de 145 documentos"

- [ ] **Estado vacío**
  - Si no hay documentos: Mostrar ilustración + mensaje
  - "No tienes documentos aún"
  - Botón "Subir tu primer documento"

- [ ] **Responsive**
  - Mobile: Sidebar colapsable, lista en formato card
  - Tablet: Sidebar fijo, grid 2 columnas
  - Desktop: Sidebar + grid 3-4 columnas

#### **UI/UX - Subir Documentos**

- [ ] **Modal de subida** (`UploadDocumentForm.tsx`)
  - Trigger: Click en "Subir Documento"
  - Modal fullscreen (mobile) / centrado (desktop)

- [ ] **Área de drag & drop**
  - "Arrastra tu archivo aquí o haz clic para seleccionar"
  - Formatos aceptados: PDF, JPEG, PNG, DOCX
  - Validación de tamaño:
    - **Certificados:** Sin límite
    - **Temporales:** Individual max 50MB
  - Preview del archivo seleccionado

- [ ] **Formulario de metadata**
  - **Tipo de documento:**
    - Radio buttons: ◉ Certificado | ○ Temporal
    - Help text: "Documentos certificados tienen almacenamiento ilimitado"

  - **Clasificación** (select):
    - CEDULA
    - DIPLOMA
    - ACTA_GRADO
    - CERTIFICADO_MEDICO
    - ESCRITURA
    - DECLARACION_RENTA
    - OTRO (permite campo de texto libre)

  - **Título del documento** (text):
    - Requerido
    - Max 100 caracteres
    - Placeholder: "Ej: Diploma Ingeniería de Sistemas"

  - **Contexto** (select):
    - EDUCACION
    - NOTARIA
    - REGISTRADURIA
    - SALUD
    - GOBIERNO
    - OTRO

  - **Entidad avaladora** (text):
    - Opcional para temporales
    - Requerido para certificados
    - Placeholder: "Ej: Universidad EAFIT"

  - **Fecha de emisión** (date picker):
    - Opcional
    - Max: Hoy

  - **Fecha de vigencia** (date picker):
    - Opcional
    - Min: Fecha de emisión

  - **Tags** (chip input):
    - Opcional
    - Múltiples tags separados por coma
    - Placeholder: "Ej: universidad, posgrado, 2023"

- [ ] **Progreso de carga**
  - Progress bar: 0-100%
  - Texto: "Subiendo... 45%"
  - Botón "Cancelar" (abortar upload)
  - Success: "✅ Documento subido exitosamente"

- [ ] **Validaciones**
  - Si es temporal y cuota llena: Bloquear upload + mensaje error
  - Si archivo supera 50MB y es temporal: Mostrar error
  - Si formato no soportado: Mostrar error

#### **Funcionalidad - Almacenamiento**

- [ ] **Subir documentos certificados** (`useUploadDocument.ts`)
  - Request POST a `/api/documents/upload`
  - **Payload (multipart/form-data):**
    ```
    file: [archivo binario]
    metadata: {
      type: "certified" | "temporary",
      classification: "DIPLOMA",
      title: "Diploma Ingeniería de Sistemas",
      context: "EDUCACION",
      issuer: "Universidad EAFIT",
      issueDate: "2020-12-15",
      expirationDate: null,
      tags: ["universidad", "ingeniería"]
    }
    ```
  - **Backend debe:**
    - Calcular hash SHA-256 del archivo
    - Almacenar en S3/storage
    - Guardar metadata en DB con UUID único
    - Retornar información del documento creado

- [ ] **Subir documentos temporales**
  - Misma lógica que certificados
  - Validar cuota antes de subir:
    - Request GET a `/api/documents/quota`
    - Response: `{ usedDocuments: 45, maxDocuments: 100, usedSpace: 230MB, maxSpace: 500MB }`
  - Si cuota llena: Bloquear upload

- [ ] **Notificaciones de cuota**
  - Al alcanzar 80%: Mostrar Snackbar warning
  - Al alcanzar 100%: Mostrar Alert error permanente en dashboard

- [ ] **Calcular hash SHA-256 en frontend** (opcional, para validación)
  - Usar Web Crypto API
  - Enviar hash con metadata
  - Backend valida coincidencia

#### **Funcionalidad - Visualización**

- [ ] **Listar documentos con paginación** (`useListDocuments.ts`)
  - Request GET a `/api/documents?page=1&limit=20&sortBy=uploadDate&order=desc`
  - **Query params:**
    - `page`: Número de página (default: 1)
    - `limit`: Documentos por página (default: 20)
    - `sortBy`: Campo de ordenamiento (uploadDate, title, type)
    - `order`: asc | desc
    - `type`: certified | temporary | all
    - `context`: EDUCACION | SALUD | ...
    - `search`: Búsqueda por título/tags
  - **Response:**
    ```json
    {
      "documents": [ /* array de documentos */ ],
      "pagination": {
        "currentPage": 1,
        "totalPages": 8,
        "totalDocuments": 145,
        "hasNext": true,
        "hasPrevious": false
      }
    }
    ```

- [ ] **Vista previa de documentos** (`DocumentPreview.tsx`)
  - Modal/drawer que abre al hacer clic en documento
  - **PDF:** Renderizar con `react-pdf` o iframe
  - **Imagen:** Mostrar en tamaño completo
  - **DOCX:** Mostrar mensaje "Previsualización no disponible, descarga el archivo"
  - Botones: Cerrar, Descargar, Eliminar (si es temporal)

- [ ] **Descargar documentos** (`useDownloadDocument.ts`)
  - Request GET a `/api/documents/{id}/download`
  - **Backend debe:**
    - Generar URL pre-firmada (S3 signed URL)
    - URL expira en 5 minutos
    - Retornar URL
  - **Frontend:**
    - Abrir URL en nueva pestaña
    - Mostrar mensaje "Descargando..."
    - Registrar descarga en auditoría

- [ ] **Filtros y búsqueda**
  - Búsqueda por título/tags: Debounce 300ms
  - Filtros se acumulan (AND): tipo=certificado + contexto=educacion
  - Al cambiar filtro: Reset a página 1
  - Mostrar filtros activos como chips removibles

#### **Funcionalidad - Recepción de Documentos**

- [ ] **Notificaciones de documentos recibidos**
  - Badge en sidebar "Mis Documentos" con contador
  - Lista de documentos no leídos al inicio del dashboard
  - Alert: "Tienes 3 documentos nuevos"

- [ ] **Marcar documentos como leídos**
  - Request PATCH a `/api/documents/{id}/mark-read`
  - Actualizar badge al marcar

- [ ] **Extracción automática de metadatos**
  - Backend extrae metadatos de PDFs firmados
  - Mostrar metadatos en vista de documento

#### **Funcionalidad - Eliminación** (solo temporales)

- [ ] **Eliminar documentos temporales**
  - Botón 🗑️ solo visible en documentos temporales
  - Confirmación: "¿Seguro que deseas eliminar este documento? Esta acción no se puede deshacer."
  - Request DELETE a `/api/documents/{id}`
  - Actualizar lista y cuota después de eliminar
  - Mostrar toast: "Documento eliminado exitosamente"

- [ ] **Documentos certificados NO eliminables**
  - Ocultar botón eliminar
  - Si se intenta eliminar: Error "Los documentos certificados no se pueden eliminar"

#### **Testing**

- [ ] **Unit Tests**
  - `DocumentList.tsx`: Renderizado de lista y grid
  - `UploadDocumentForm.tsx`: Validación de formulario
  - `StorageQuotaIndicator.tsx`: Cálculo de porcentaje y colores

- [ ] **Integration Tests**
  - `useUploadDocument.ts`: Upload exitoso y validación de cuota
  - `useListDocuments.ts`: Paginación, filtros, búsqueda
  - `useDownloadDocument.ts`: Generación de URL pre-firmada

- [ ] **E2E Tests**
  - Flujo completo: Login → Dashboard → Subir documento → Ver lista → Descargar
  - Flujo: Intentar subir documento temporal con cuota llena
  - Flujo: Eliminar documento temporal

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Dashboard responsive funcional
- [ ] Upload de documentos certificados y temporales funciona
- [ ] Cuota de almacenamiento se calcula correctamente
- [ ] Paginación, filtros y búsqueda funcionan
- [ ] Vista previa y descarga de documentos funciona
- [ ] Eliminación de documentos temporales funciona
- [ ] Notificaciones de documentos recibidos funcionales
- [ ] Tests pasan (coverage > 80%)
- [ ] Accesibilidad validada
- [ ] Code review aprobado

---

### Referencias

- **Requisitos:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md#3-subir-documentos`
- **Backend Endpoints:**
  - `POST /api/documents/upload`
  - `GET /api/documents?page&limit&filters`
  - `GET /api/documents/{id}/download`
  - `PATCH /api/documents/{id}/mark-read`
  - `DELETE /api/documents/{id}`
  - `GET /api/documents/quota`

---

### Dependencias

- **Issue #0:** Scaffolding
- **Issue #2:** Login (AuthContext)
- **Backend:** Endpoints de gestión de documentos
- **Storage:** S3 o servicio de almacenamiento

---

### Estimación

**Esfuerzo:** 13-21 horas

**Breakdown:**
- Dashboard UI: 3h
- Upload form + drag&drop: 3h
- Lista/grid + paginación: 2h
- Filtros y búsqueda: 2h
- Preview y descarga: 2h
- Cuota y notificaciones: 2h
- Testing: 4h
- Refinamiento: 3h

---

## Issue #4: Autenticación de Documentos

### Labels
`feature`, `frontend`, `certification-context`, `institutional`, `medium-priority`

### Título
Implementar flujo de autenticación/firma digital de documentos

### Descripción

Como entidad institucional, quiero autenticar documentos usando el servicio de MinTIC para garantizar su autenticidad legal.

**Contexto:**
- **Bounded Context:** Firma y Certificación
- **Requisito Funcional:** FR-AF-01
- **Stack Actual:** React 18, TypeScript, Material-UI
- **Usuario Objetivo:** Funcionarios institucionales (no ciudadanos)
- **Arquitectura:** Módulo `/src/contexts/certification/`

---

### Criterios de Aceptación

#### **UI/UX**

- [ ] **Crear pantalla de autenticación de documentos** (`/pages/InstitutionalAuthenticateDocument.tsx`)
  - Solo accesible para usuarios con rol `institutional_staff`
  - Layout con sidebar institucional
  - Breadcrumb: Dashboard Institucional > Autenticar Documento

- [ ] **Formulario de autenticación** (`AuthenticateDocumentForm.tsx`)
  - **Campo: ID del Ciudadano**
    - Type: number
    - Requerido: ✅
    - Validación: Numérico, 6-12 dígitos
    - Placeholder: "Ej: 1234567890"
    - Botón "Verificar Ciudadano" (validar que existe)
    - Mostrar nombre del ciudadano después de verificar

  - **Campo: Documento a Autenticar**
    - File upload o selección de documento existente
    - Formatos: PDF, JPEG, PNG
    - Max 50MB
    - Preview del documento antes de autenticar

  - **Campo: Título del Documento**
    - Type: text
    - Requerido: ✅
    - Max 100 caracteres
    - Placeholder: "Ej: Diploma de Grado"

  - **Información de la entidad** (read-only, auto-filled)
    - Nombre de la entidad (del usuario autenticado)
    - Funcionario que realiza la acción
    - Fecha y hora de autenticación

- [ ] **Preview del documento**
  - Mostrar preview antes de enviar autenticación
  - Botón "Ver documento completo" (modal fullscreen)

- [ ] **Estado del proceso**
  - Estado: pending | uploading | authenticating | success | error
  - Progress bar durante upload y autenticación
  - Success: "✅ Documento autenticado exitosamente"
  - Error: Mostrar mensaje específico según código de error

- [ ] **Confirmación antes de enviar**
  - Dialog de confirmación:
    - "¿Confirma que desea autenticar este documento?"
    - Resumen: Ciudadano, Título, Entidad
    - Advertencia: "Esta acción es irreversible"
  - Botones: Cancelar | Confirmar

#### **Funcionalidad**

- [ ] **Verificar ciudadano** (`useValidateCitizen.ts`)
  - Reutilizar hook de Identity context
  - Request GET a `/apis/validateCitizen/{id}`
  - Mostrar nombre del ciudadano si existe
  - Bloquear autenticación si ciudadano no existe

- [ ] **Subir documento a storage**
  - Request POST a `/api/institutional/documents/upload`
  - Obtener URL pública del documento (S3 signed URL)
  - URL debe ser accesible públicamente para MinTIC

- [ ] **Autenticar documento** (`useAuthenticateDocument.ts`)
  - Request POST a `/api/mintic/authenticateDocument` (proxy a MinTIC)
  - **Payload:**
    ```json
    {
      "idCitizen": 1234567890,
      "UrlDocument": "https://bucket.s3.amazonaws.com/documento.pdf?AWSAccessKeyId=...",
      "documentTitle": "Diploma de Grado"
    }
    ```
  - **Respuestas:**
    - **200:** Éxito → Mostrar confirmación + registrar auditoría
    - **204:** Sin contenido → Error genérico
    - **501:** Parámetros incorrectos → Mostrar errores de validación
    - **500:** Error de aplicación → Mostrar mensaje genérico

- [ ] **Actualizar metadatos del documento**
  - Después de autenticación exitosa:
    - Marcar documento como `authenticated: true`
    - Agregar `authenticatedBy`: Nombre de funcionario
    - Agregar `authenticatedAt`: Timestamp
    - Agregar `authenticatedEntity`: Nombre de entidad

- [ ] **Registrar auditoría**
  - Request POST a `/api/audit/authenticate`
  - **Datos:**
    - Funcionario (ID, nombre, email)
    - Ciudadano (ID, nombre)
    - Documento (ID, título, URL)
    - Entidad (ID, nombre)
    - Resultado (success/error)
    - Timestamp

#### **Navegación**

- [ ] **Configurar ruta `/institucional/autenticar-documento`**
  - Ruta protegida: Solo `institutional_staff`
  - Si ciudadano intenta acceder: Redirigir a `/dashboard` con error

- [ ] **Redirección post-autenticación**
  - Éxito → Redirigir a `/institucional/documentos` con mensaje de éxito
  - Mostrar documento recién autenticado en lista

- [ ] **Link en sidebar institucional**
  - Agregar opción "Autenticar Documento" en sidebar

#### **Testing**

- [ ] **Unit Tests**
  - `AuthenticateDocumentForm.tsx`: Validación de formulario
  - Validación de ID de ciudadano
  - Preview de documento funciona

- [ ] **Integration Tests**
  - Mock de MinTIC API `/apis/authenticateDocument`
  - Test con respuesta 200 (éxito)
  - Test con respuesta 501 (error de parámetros)
  - Test con respuesta 500 (error de servidor)

- [ ] **E2E Test**
  - Login como funcionario → Navegar a autenticar → Llenar formulario → Autenticar → Verificar éxito

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Formulario de autenticación funcional
- [ ] Integración con MinTIC API funciona
- [ ] Auditoría registra correctamente
- [ ] Solo funcionarios pueden acceder
- [ ] Tests pasan (coverage > 80%)
- [ ] Code review aprobado

---

### Referencias

- **Requisitos:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md#4-autenticarfirmar-documentos`
- **Swagger MinTIC:** `/apis/authenticateDocument` (POST)
- **Backend Endpoints:**
  - `POST /api/mintic/authenticateDocument` (proxy)
  - `POST /api/institutional/documents/upload`
  - `POST /api/audit/authenticate`

---

### Dependencias

- **Issue #0:** Scaffolding
- **Issue #2:** Login (roles institucionales)
- **Backend:** Proxy a MinTIC `/apis/authenticateDocument`
- **Storage:** S3 con URLs públicas

---

### Estimación

**Esfuerzo:** 5-8 horas

**Breakdown:**
- UI/Formulario: 2h
- Integración con MinTIC API: 2h
- Auditoría: 1h
- Testing: 2h
- Refinamiento: 1h

---

## Issue #5: Transferencia de Ciudadano (Portabilidad)

### Labels
`feature`, `frontend`, `portability-context`, `medium-priority`, `complex`

### Título
Implementar flujo de transferencia entre operadores (portabilidad)

### Descripción

Como ciudadano, quiero transferir mi carpeta a otro operador para cambiar de proveedor manteniendo mis datos e identidad.

**Contexto:**
- **Bounded Context:** Gestión de Portabilidad
- **Requisito Funcional:** FR-TO-01, FR-TO-02, FR-TO-03, FR-TO-04, FR-TO-06
- **Stack Actual:** React 18, TypeScript, Material-UI
- **Arquitectura:** Ya existe `/src/contexts/portability/` con componentes base

---

### Criterios de Aceptación

#### **UI/UX - Inicio de Portabilidad**

- [ ] **Diseñar pantalla de portabilidad** (`/pages/Portability.tsx`)
  - Breadcrumb: Dashboard > Cambiar de Operador
  - Título: "Transferencia de Operador (Portabilidad)"
  - Secciones:
    1. Información actual
    2. Selección de nuevo operador
    3. Advertencias y confirmación

- [ ] **Sección 1: Información Actual**
  - Card con datos actuales:
    - Operador actual: [Nombre]
    - Documentos totales: [X certificados + Y temporales]
    - Espacio utilizado: [XXX MB]
    - Fecha de registro: [DD/MM/YYYY]

- [ ] **Sección 2: Selección de Operador** (`OperatorSelector.tsx`)
  - Lista de operadores disponibles (excluyendo operador actual)
  - Cada operador muestra:
    - Logo (si disponible)
    - Nombre
    - URL de transferencia (truncada)
    - Botón "Seleccionar"
  - Operador seleccionado: Highlighted con check ✓

- [ ] **Sección 3: Advertencias**
  - Alert box con avisos importantes:
    - ⏰ "El proceso puede tomar hasta 72 horas"
    - 📦 "Todos tus documentos (certificados y temporales) serán transferidos"
    - 🔒 "Tu identidad (email y datos personales) permanece inmutable"
    - ⚠️ "Durante la transferencia, no podrás acceder a tu carpeta"
    - 📬 "Los documentos que lleguen durante la transferencia se entregarán al nuevo operador"

- [ ] **Confirmación explícita**
  - Checkbox: "He leído y entiendo las condiciones de la transferencia"
  - Input de confirmación: "Escribe 'TRANSFERIR' para confirmar"
  - Botón "Iniciar Transferencia" (disabled hasta que confirme)

- [ ] **Modal de confirmación final**
  - Dialog:
    - "¿Estás seguro que deseas transferirte a [Nombre Operador]?"
    - Resumen de la transferencia
    - Botones: Cancelar | Confirmar Transferencia

#### **UI/UX - Progreso de Transferencia**

- [ ] **Pantalla de progreso** (`PortabilityStatus.tsx`)
  - Stepper con pasos:
    1. ✓ Solicitud iniciada
    2. ⏳ Desregistro del operador actual
    3. ⏳ Transferencia de datos (P2P)
    4. ⏳ Registro en nuevo operador
    5. ⏳ Validación de integridad

- [ ] **Estados de cada paso**
  - pending: Gris, ⏳
  - in_progress: Azul, spinner
  - completed: Verde, ✓
  - failed: Rojo, ✗

- [ ] **Notificación de documentos en tránsito**
  - Si hay documentos llegando durante transferencia:
    - Alert: "X documentos llegaron durante la transferencia y serán entregados al nuevo operador"

- [ ] **Botón de soporte**
  - Si algo falla: Botón "Contactar Soporte"

#### **Funcionalidad - Consulta de Operadores**

- [ ] **Obtener lista de operadores** (`useGetOperators.ts`)
  - Request GET a `/apis/getOperators` (MinTIC)
  - **Response:**
    ```json
    [
      {
        "OperatorId": "65ca0a00d833e984e2608756",
        "operatorName": "Operador 123",
        "transferAPIURL": "http://mioperador.com/api/transferCitizen"
      }
    ]
    ```
  - Filtrar operador actual de la lista
  - Cachear lista por 1 hora
  - Actualizar cache periódicamente (cada 1 hora)

#### **Funcionalidad - Proceso de Transferencia**

- [ ] **Validar identidad del ciudadano**
  - Verificar JWT vigente
  - Re-autenticar con contraseña antes de iniciar transferencia
  - Dialog: "Por seguridad, confirma tu contraseña"

- [ ] **Iniciar transferencia** (`useInitiatePortability.ts`)
  - Request POST a `/api/portability/initiate`
  - **Payload:**
    ```json
    {
      "citizenId": 1234567890,
      "targetOperatorId": "65ca0a00d833e984e2608757",
      "targetOperatorName": "Nuevo Operador",
      "currentOperatorId": "65ca0a00d833e984e2608756"
    }
    ```
  - Backend orquesta el proceso:
    1. Desregistrar ciudadano (`/apis/unregisterCitizen`)
    2. Exportar todos los documentos y metadatos
    3. Transferir P2P al operador destino
    4. Registrar ciudadano en nuevo operador (`/apis/registerCitizen`)
    5. Validar integridad de documentos transferidos

- [ ] **Polling de estado de transferencia**
  - Mientras transferencia está en progreso:
    - Poll cada 10 segundos a `/api/portability/status/{transferId}`
    - **Response:**
      ```json
      {
        "transferId": "uuid",
        "status": "pending" | "desregistering" | "transferring" | "registering" | "validating" | "completed" | "failed",
        "currentStep": 2,
        "totalSteps": 5,
        "documentsInTransit": 3,
        "error": null | "Error message"
      }
      ```
  - Actualizar UI según estado

- [ ] **Finalización de transferencia**
  - **Éxito:**
    - Cerrar sesión automáticamente
    - Redirigir a página de confirmación: "Transferencia completada. Inicia sesión en tu nuevo operador."
    - Mostrar URL del nuevo operador

  - **Fallo:**
    - Mostrar error específico
    - Opciones: Reintentar | Contactar Soporte
    - Logs de auditoría con detalles del error

#### **Funcionalidad - Gestión de Documentos en Tránsito**

- [ ] **Encolar documentos durante portabilidad**
  - Backend detecta que ciudadano está en portabilidad
  - Documentos entrantes se encolan en lugar de entregarse
  - Request GET a `/api/portability/pending-documents`
  - Mostrar contador en UI de portabilidad

- [ ] **Entregar documentos después de portabilidad**
  - Después de registro exitoso en nuevo operador:
    - Backend transfiere documentos en cola al nuevo operador
    - Notificar al ciudadano sobre documentos pendientes

- [ ] **Validar que NO haya pérdida de documentos**
  - Backend valida hash SHA-256 de cada documento transferido
  - Comparar cantidad de documentos antes/después
  - Si hay discrepancia: Marcar transferencia como failed

#### **Navegación**

- [ ] **Configurar ruta `/portabilidad`**
  - Ruta protegida: Solo ciudadanos autenticados
  - Mostrar opción en sidebar principal

- [ ] **Bloquear acceso durante portabilidad**
  - Si usuario en portabilidad intenta acceder a dashboard:
    - Redirigir a `/portabilidad/status`
    - Mostrar solo progreso de transferencia

- [ ] **Página de confirmación post-transferencia**
  - Ruta: `/portabilidad/completada`
  - No requiere autenticación (sesión ya cerrada)
  - Mostrar resumen de transferencia

#### **Testing**

- [ ] **Unit Tests**
  - `OperatorSelector.tsx`: Renderizado de lista de operadores
  - `InitiatePortabilityForm.tsx`: Validación de confirmación
  - `PortabilityStatus.tsx`: Actualización de estado según polling

- [ ] **Integration Tests**
  - Mock de MinTIC API `/apis/getOperators`
  - Mock de API `/api/portability/initiate`
  - Mock de polling `/api/portability/status`
  - Test de encolamiento de documentos en tránsito

- [ ] **E2E Tests**
  - Flujo completo: Login → Portabilidad → Seleccionar operador → Confirmar → Ver progreso
  - Test de transferencia exitosa (mock backend)
  - Test de transferencia fallida

---

### Definición de Hecho (DoD)

- [ ] Todos los criterios de aceptación completados
- [ ] Lista de operadores se carga correctamente
- [ ] Proceso de transferencia se inicia correctamente
- [ ] Polling de estado funciona y actualiza UI
- [ ] Documentos en tránsito se manejan correctamente
- [ ] Validación de integridad funciona
- [ ] Tests pasan (coverage > 80%)
- [ ] Code review aprobado

---

### Referencias

- **Requisitos:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md#5-transferencia-de-operador`
- **Swagger MinTIC:**
  - `/apis/getOperators` (GET)
  - `/apis/registerTransferEndPoint` (POST)
  - `/apis/unregisterCitizen` (POST)
  - `/apis/registerCitizen` (POST)
- **Código Actual:**
  - `/src/contexts/portability/components/OperatorSelector.tsx`
  - `/src/contexts/portability/components/InitiatePortabilityForm.tsx`

---

### Dependencias

- **Issue #0:** Scaffolding
- **Issue #2:** Login (AuthContext)
- **Backend:** Endpoints de portabilidad
  - `GET /apis/getOperators`
  - `POST /api/portability/initiate`
  - `GET /api/portability/status/{id}`
  - `GET /api/portability/pending-documents`
- **Backend:** Implementación de transferencia P2P
- **Backend:** Mecanismo de cola para documentos en tránsito

---

### Estimación

**Esfuerzo:** 13-21 horas

**Breakdown:**
- UI de selección de operador: 2h
- UI de confirmación y advertencias: 2h
- UI de progreso (stepper): 2h
- Lógica de inicio de transferencia: 3h
- Polling de estado: 2h
- Gestión de documentos en tránsito: 3h
- Testing: 4h
- Refinamiento: 3h

---

## Resumen de Estimaciones

| Issue | Título | Estimación | Prioridad |
|-------|--------|------------|-----------|
| #0 | Scaffolding del Proyecto | 13-21h | Alta |
| #1 | Registro de Usuarios | 5-8h | Alta |
| #2 | Login de Usuarios | 8-13h | Alta |
| #3 | Gestión de Carpeta | 13-21h | Alta |
| #4 | Autenticación de Documentos | 5-8h | Media |
| #5 | Transferencia de Operador | 13-21h | Media |
| **TOTAL** | | **57-92h** | |

---

## Orden de Implementación Recomendado

1. **Issue #0** - Scaffolding (prerequisito para todos)
2. **Issue #2** - Login (base para autenticación)
3. **Issue #1** - Registro (permite crear usuarios de prueba)
4. **Issue #3** - Gestión de Carpeta (funcionalidad principal)
5. **Issue #4** - Autenticación de Documentos (funcionalidad institucional)
6. **Issue #5** - Transferencia de Operador (funcionalidad avanzada)

---

## Notas para Implementación

### Issues Adicionales Recomendados (Future Work)

- **Issue #6:** Sistema de notificaciones en tiempo real (WebSockets)
- **Issue #7:** Logs de auditoría y trazabilidad completa
- **Issue #8:** Accesibilidad WCAG 2.1 AA
- **Issue #9:** Modo offline para consulta de documentos
- **Issue #10:** Onboarding/tutorial para nuevos usuarios
- **Issue #11:** Recuperación de contraseña
- **Issue #12:** Gestión de perfil de usuario

### Consideraciones de UX

1. **Usabilidad para Baja Alfabetización Tecnológica (RNF-07):**
   - Usar iconografía clara
   - Mensajes en lenguaje sencillo
   - Flujos guiados paso a paso
   - Tooltips explicativos
   - Video tutoriales opcionales

2. **Performance:**
   - Lazy loading de rutas
   - Code splitting por bounded context
   - Optimización de imágenes
   - Caching de lista de operadores

3. **Seguridad:**
   - Validación de inputs en frontend y backend
   - Sanitización de inputs (XSS prevention)
   - HTTPS obligatorio
   - CORS configurado correctamente

4. **Accesibilidad:**
   - Navegación por teclado
   - Screen reader compatible
   - Contraste de colores (WCAG AA)
   - Labels descriptivos

### Stack Tecnológico Confirmado

```json
{
  "frontend": {
    "framework": "React 18",
    "language": "TypeScript 5.3",
    "ui": "Material-UI 5.15",
    "routing": "React Router 6.20",
    "forms": "React Hook Form 7.49",
    "http": "Axios 1.6",
    "state": "Zustand 4.4 (opcional)",
    "build": "Vite 5.0",
    "testing": "Jest + React Testing Library"
  },
  "backend_apis": {
    "mintic": "Swagger APIs de MinTIC",
    "operator": "APIs custom del operador"
  }
}
```

---

## Contacto y Soporte

Para preguntas sobre estos issues:
- Revisar documentación en `/docs/`
- Consultar `CLAUDE.md` para guía del proyecto
- Revisar requisitos funcionales consolidados

---

**Última actualización:** 2025-10-21
**Autor:** Equipo de Desarrollo Carpeta Ciudadana
**Versión:** 1.0

