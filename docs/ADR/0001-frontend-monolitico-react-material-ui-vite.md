# ADR-0001: Arquitectura Frontend Monolítica con React, Material-UI y Vite

## Estado
**Aceptado** - 2025-10-21

## Contexto

El sistema Carpeta Ciudadana requiere desarrollar interfaces de usuario para tres tipos de actores principales:

1. **Ciudadanos:** Gestión de carpeta personal, visualización/descarga de documentos, inicio de portabilidad
2. **Funcionarios Institucionales:** Autenticación de documentos, solicitudes a ciudadanos, consulta de documentos compartidos
3. **Administradores del Operador:** Gestión de configuración, monitoreo, auditoría

### Desafíos Identificados

1. **Complejidad de Desarrollo:** Múltiples frontends independientes (microfrontends) aumentarían la complejidad operacional para un equipo académico/inicial
2. **Compartición de Código:** Existe solapamiento significativo en componentes UI (formularios, autenticación, visualización de documentos)
3. **Consistencia de UX:** Se requiere experiencia de usuario coherente entre diferentes roles
4. **Tiempo de Desarrollo:** El proyecto es académico con tiempo limitado (1 semestre)
5. **Equipo Reducido:** Equipo de 3-4 desarrolladores sin experiencia previa en microfrontends

### Requisitos No Funcionales Relevantes

- **RNF-21:** MTTR < 4 horas para correcciones críticas (requiere simplicidad de deployment)
- **RNF-22:** Cobertura de pruebas > 85% (más fácil con codebase unificado)
- **RNF-23:** Modificabilidad - Adición de nuevas features con mínima modificación de componentes
- **RNF-25:** Tasa de éxito del 90% en flujos principales (requiere UX consistente)
- **RNF-27:** Accesibilidad WCAG 2.1 AA (más fácil de implementar con componentes compartidos)

## Decisión

Implementaremos un **frontend monolítico modular** usando:

### 1. Arquitectura Monolítica (Single SPA)

- **Un solo proyecto frontend** ubicado en `/services/carpeta-ciudadana-frontend/`
- **Organización modular interna** usando Domain-Driven Design (DDD) con Bounded Contexts
- **Separación lógica** mediante rutas y componentes específicos por rol
- **Code splitting** a nivel de rutas para optimizar carga inicial

**Estructura:**
```
src/
├── contexts/               # Bounded Contexts (DDD)
│   ├── identity/           # Identidad y Registro
│   ├── authentication/     # Autenticación y Autorización
│   ├── personal-folder/    # Carpeta Personal
│   ├── certification/      # Firma y Certificación
│   └── portability/        # Gestión de Portabilidad
├── shared/                 # Componentes compartidos
└── pages/                  # Vistas por rol
    ├── citizen/
    ├── institutional/
    └── admin/
```

### 2. React 20 como Framework

**Razones:**

1. **Ecosistema Maduro:** Amplia disponibilidad de librerías para todas las necesidades del proyecto
2. **Experiencia del Equipo:** Conocimiento previo de React en el equipo de desarrollo
3. **Componentes Funcionales y Hooks:** Código más limpio y reutilizable
4. **Performance:** React 20 incluye mejoras en Concurrent Rendering, Automatic Batching y optimizaciones adicionales de rendimiento
5. **Testing:** Excelente soporte con React Testing Library y Jest
6. **Comunidad:** Mayor comunidad en Colombia para soporte y recursos

**Alternativas Consideradas:**
- **Vue.js:** Menos experiencia del equipo, curva de aprendizaje
- **Angular:** Demasiado complejo para el alcance del proyecto, curva de aprendizaje empinada
- **Svelte:** Ecosistema menos maduro, menos recursos disponibles

### 3. Material-UI (MUI) v5 como UI Library

**Razones:**

1. **Componentes Pre-construidos:** Acelera desarrollo con 50+ componentes listos para usar
2. **Accesibilidad por Defecto:** Componentes MUI cumplen WCAG 2.1 AA out-of-the-box (cumple RNF-27)
3. **Tema Personalizable:** Permite adaptar diseño a guía de gobierno colombiano
4. **Responsive por Defecto:** Grid system y breakpoints integrados
5. **Documentación Excelente:** Documentación completa en español disponible
6. **TypeScript Support:** Primera clase, mejora calidad de código
7. **Consistencia Visual:** Diseño coherente sin necesidad de diseñador UI dedicado

**Alternativas Consideradas:**
- **Ant Design:** Diseño muy orientado a China, menos personalizable
- **Chakra UI:** Menos componentes complejos (DataGrid, DatePicker)
- **Tailwind CSS:** Requiere más tiempo para crear componentes desde cero
- **Bootstrap:** Menos moderno, no tan bien integrado con React

### 4. Vite como Build Tool

**Razones:**

1. **Velocidad de Desarrollo:** Hot Module Replacement (HMR) instantáneo
2. **Build Optimizado:** Genera bundles más pequeños que Webpack
3. **Configuración Mínima:** Zero-config para proyectos React + TypeScript
4. **ESM Nativo:** Aprovecha módulos ES nativos del navegador
5. **Plugins:** Ecosistema de plugins en crecimiento
6. **Developer Experience:** Tiempo de inicio < 1 segundo vs 10-30 segundos de CRA

**Comparación de Tiempos (proyecto medio):**
```
Herramienta    | Dev Server Start | HMR    | Production Build
---------------|------------------|--------|------------------
Vite           | 0.8s            | 50ms   | 25s
Webpack (CRA)  | 15s             | 300ms  | 90s
```

**Alternativas Consideradas:**
- **Create React App (CRA):** Lento, configuración rígida, casi deprecated
- **Webpack:** Configuración compleja, más lento que Vite
- **Parcel:** Menos control sobre configuración

## Consecuencias

### Positivas

1. ✅ **Desarrollo Rápido:** Un solo codebase reduce overhead de configuración y deployment
2. ✅ **Compartición de Código:** Componentes, hooks y utilidades reutilizables sin necesidad de npm packages separados
3. ✅ **Testing Simplificado:** Una sola suite de tests, más fácil alcanzar RNF-22 (>85% coverage)
4. ✅ **CI/CD Simple:** Un solo pipeline de build y deployment
5. ✅ **Consistencia UX:** Mismo design system para todos los roles
6. ✅ **Menor Complejidad Operacional:** Un solo servidor web, un solo dominio
7. ✅ **Onboarding Rápido:** Nuevos desarrolladores solo necesitan entender un proyecto
8. ✅ **Type Safety:** TypeScript aplicado en todo el codebase
9. ✅ **Accesibilidad Garantizada:** Material-UI cumple RNF-27 por defecto
10. ✅ **Performance:** Vite optimiza tiempos de desarrollo y build

### Negativas

1. ❌ **Escalabilidad de Equipo:** Si el equipo crece >10 desarrolladores, puede haber conflictos de merge
2. ❌ **Deployment Acoplado:** Un bug en cualquier módulo afecta deploy de todo el frontend
3. ❌ **Carga Inicial:** Bundle inicial puede ser grande (mitigado con code splitting)
4. ❌ **Tecnología Compartida:** Todos los roles deben usar el mismo stack (React/MUI)
5. ❌ **Riesgo de Acoplamiento:** Sin disciplina, los bounded contexts pueden acoplarse

### Mitigaciones

1. **Code Splitting por Rutas:**
   ```typescript
   const CitizenDashboard = lazy(() => import('@pages/citizen/Dashboard'));
   const InstitutionalDashboard = lazy(() => import('@pages/institutional/Dashboard'));
   ```

2. **Lazy Loading de Módulos:**
   - Cargar módulos de ciudadanos solo si usuario es ciudadano
   - Cargar módulos institucionales solo si usuario es funcionario

3. **Arquitectura Modular Estricta:**
   - Enforcing de dependencias con ESLint rules
   - Cada bounded context es independiente
   - Comunicación entre contextos solo a través de eventos o shared state

4. **Feature Flags:**
   - Habilitar/deshabilitar features específicas por rol sin redeployment

5. **Monitoreo de Bundle Size:**
   - Alertas si bundle supera thresholds definidos
   - Análisis de bundle con `vite-plugin-bundle-analyzer`

## Alternativas Consideradas

### Opción A: Microfrontends con Module Federation

**Pros:**
- Deployment independiente por equipo
- Escalabilidad para equipos grandes
- Tecnologías independientes por módulo

**Cons:**
- Complejidad operacional elevada (>3x)
- Requiere orquestador (shell application)
- Compartir estado es complejo
- Testing E2E más difícil
- Overhead para equipo académico

**Razón de Rechazo:** Demasiado complejo para el alcance y tamaño de equipo actual. YAGNI (You Aren't Gonna Need It).

### Opción B: Frontends Separados por Rol

**Pros:**
- Separación total por actor
- Deployment independiente

**Cons:**
- Duplicación masiva de código
- Inconsistencia de UX
- 3x esfuerzo de mantenimiento
- Difícil cumplir RNF-22 (coverage)

**Razón de Rechazo:** Duplicación innecesaria, violación de DRY.

### Opción C: Monolito sin Organización Modular

**Pros:**
- Máxima simplicidad inicial

**Cons:**
- No escalable
- Violación de RNF-23 (modificabilidad)
- Acoplamiento inevitable
- Difícil de testear

**Razón de Rechazo:** Falta de estructura para proyecto de 6 meses+ de mantenimiento.

## Métricas de Éxito

Mediremos el éxito de esta decisión con:

1. **Tiempo de Build:**
   - Target: Build de producción < 60 segundos
   - Medición: CI/CD pipeline time

2. **Bundle Size:**
   - Target: Initial load < 300KB (gzipped)
   - Target: Total bundle < 2MB (gzipped)
   - Medición: `npm run build` output

3. **Developer Experience:**
   - Target: Dev server start < 2 segundos
   - Target: HMR < 100ms
   - Medición: Vite metrics

4. **Test Coverage:**
   - Target: > 85% coverage (RNF-22)
   - Medición: Jest coverage report

5. **Accessibility:**
   - Target: 100% WCAG 2.1 AA compliance (RNF-27)
   - Medición: Lighthouse accessibility score > 95

6. **Time to First Byte (TTFB):**
   - Target: < 200ms
   - Medición: Lighthouse performance

## Notas de Implementación

### Stack Tecnológico Completo

```json
{
  "framework": "React 20",
  "language": "TypeScript 5.3",
  "ui": "Material-UI 5.15",
  "buildTool": "Vite 5.0",
  "routing": "React Router 6.20",
  "forms": "React Hook Form 7.49",
  "httpClient": "Axios 1.6",
  "stateManagement": "Zustand 4.4 (opcional, Context API por defecto)",
  "testing": {
    "unit": "Jest 29.7 + React Testing Library 14.1",
    "e2e": "Playwright (futuro)"
  },
  "linting": "ESLint 8.55 + Prettier",
  "deployment": "Docker + Nginx"
}
```

### Configuración de Vite Optimizada

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'utils': ['axios', 'date-fns', 'jwt-decode']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  resolve: {
    alias: {
      '@': '/src',
      '@shared': '/src/shared',
      '@contexts': '/src/contexts',
      '@pages': '/src/pages'
    }
  }
});
```

### Organización de Rutas

```typescript
// App.tsx
function App() {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Register />} />

      {/* Rutas protegidas - Ciudadanos */}
      <Route element={<ProtectedRoute allowedRoles={['citizen']} />}>
        <Route path="/dashboard" element={<CitizenDashboard />} />
        <Route path="/documentos" element={<Documents />} />
        <Route path="/portabilidad" element={<Portability />} />
      </Route>

      {/* Rutas protegidas - Funcionarios */}
      <Route element={<ProtectedRoute allowedRoles={['institutional_staff']} />}>
        <Route path="/institucional/dashboard" element={<InstitutionalDashboard />} />
        <Route path="/institucional/autenticar" element={<AuthenticateDocument />} />
      </Route>
    </Routes>
  );
}
```

## Revisión Futura

Esta decisión debe revisarse si:

1. **Equipo crece a >10 desarrolladores:** Considerar migración a microfrontends
2. **Bundle size supera 5MB:** Reevaluar estrategia de code splitting
3. **Diferentes tecnologías por rol:** Si ciudadanos necesitan mobile app nativa vs web para institucionales
4. **Deployment independiente crítico:** Si negocio requiere releases independientes por módulo

**Fecha de próxima revisión:** 2026-04-01 (6 meses después de inicio de desarrollo)

## Referencias

- **Requisitos Funcionales:** `/docs/informacion_cruda/requisitos_funcionales_consolidados.md`
- **Requisitos No Funcionales:** `/docs/informacion_cruda/requisitos_no_funcionales.md`
  - RNF-21: MTTR < 4h
  - RNF-22: Coverage > 85%
  - RNF-23: Modificabilidad
  - RNF-25: Tasa de éxito 90%
  - RNF-27: WCAG 2.1 AA
- **DDD Análisis:** `/docs/informacion_cruda/ddd_analisis/ddd__analisis.md`
- **Proyecto Frontend:** `/services/carpeta-ciudadana-frontend/`
- **React 20 Docs:** https://react.dev/
- **Material-UI Docs:** https://mui.com/
- **Vite Docs:** https://vitejs.dev/

## Autores

- **Decisión Propuesta por:** Equipo de Desarrollo Carpeta Ciudadana
- **Revisado por:** Arquitecto de Software
- **Aprobado por:** Tech Lead

---

**Versión:** 1.0
**Última Actualización:** 2025-10-21

