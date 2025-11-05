# Feature Flags - Carpeta Ciudadana Frontend

Sistema de Feature Flags para controlar la visibilidad y disponibilidad de funcionalidades en el frontend del operador.

## Tabla de Contenidos

- [¿Qué son los Feature Flags?](#qué-son-los-feature-flags)
- [Configuración](#configuración)
- [Features Disponibles](#features-disponibles)
- [Uso](#uso)
  - [En Componentes](#en-componentes)
  - [Con Hooks](#con-hooks)
  - [En Lógica JavaScript/TypeScript](#en-lógica-javascripttypescript)
- [Ejemplos](#ejemplos)
- [Mejores Prácticas](#mejores-prácticas)

## ¿Qué son los Feature Flags?

Los Feature Flags (banderas de características) permiten habilitar o deshabilitar funcionalidades completas del sistema sin necesidad de cambiar código. Cada flag controla:

- **Menú de navegación**: Si aparece la opción en el sidebar
- **Quick Actions**: Si aparece el botón de acción rápida en el dashboard
- **Páginas y componentes**: Si se renderiza la funcionalidad completa
- **Operaciones**: Descarga, eliminación, etc.

## Configuración

### Variables de Entorno

Las feature flags se configuran en el archivo `.env` usando el prefijo `VITE_FEATURE_`:

```bash
# Habilitar portabilidad (menú + quick action + página)
VITE_FEATURE_PORTABILITY=true

# Deshabilitar solicitudes de documentos
VITE_FEATURE_DOCUMENT_REQUESTS=false
```

### Valores por Defecto

Si no se especifica una variable de entorno, se usa el valor por defecto definido en `src/shared/config/featureFlags.ts`.

## Features Disponibles

### Funcionalidades Principales

| Feature Flag | Descripción | Default | Controla |
|-------------|-------------|---------|----------|
| `PORTABILITY` | Cambio de operador | `true` | Menú Portabilidad + Quick Action + Página de portabilidad |
| `DOCUMENT_REQUESTS` | Solicitudes de documentos | `true` | Menú Solicitudes + Quick Action + Página de solicitudes |
| `DOCUMENTS` | Gestión de documentos | `true` | Menú Documentos + Quick Action + Página de documentos |
| `UPLOAD_DOCUMENTS` | Subir documentos | `true` | Quick Action "Subir Documento" + Tab de upload |
| `DOWNLOAD_DOCUMENTS` | Descargar documentos | `true` | Botón de descarga en lista de documentos |
| `DELETE_DOCUMENTS` | Eliminar documentos | `true` | Botón de eliminar en lista de documentos |

### Dashboard

| Feature Flag | Descripción | Default |
|-------------|-------------|---------|
| `STORAGE_STATS` | Estadísticas de almacenamiento | `true` |
| `RECENT_ACTIVITY` | Actividad reciente (placeholder) | `false` |

### Autenticación

| Feature Flag | Descripción | Default |
|-------------|-------------|---------|
| `MFA` | Autenticación multifactor | `false` |
| `REGISTRATION` | Registro de nuevos usuarios | `true` |

### Auditoría

| Feature Flag | Descripción | Default |
|-------------|-------------|---------|
| `AUDIT_LOGS` | Logs de auditoría | `true` |

## Uso

### En Componentes

Usa el componente `<FeatureToggle>` para mostrar u ocultar contenido:

```tsx
import { FeatureToggle } from '@/shared/components/FeatureToggle';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Solo se muestra si PORTABILITY está habilitado */}
      <FeatureToggle feature="PORTABILITY">
        <PortabilityButton />
      </FeatureToggle>

      {/* Solo se muestra si STORAGE_STATS está habilitado */}
      <FeatureToggle feature="STORAGE_STATS">
        <StorageStatsCard />
      </FeatureToggle>
    </div>
  );
}
```

### Con Hooks

#### Hook simple: `useFeatureFlag`

Para verificar una sola feature flag:

```tsx
import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';

function PortabilitySection() {
  const isPortabilityEnabled = useFeatureFlag('PORTABILITY');

  if (!isPortabilityEnabled) {
    return null;
  }

  return <PortabilityContent />;
}
```

#### Hook múltiple: `useFeatureFlags`

Para verificar múltiples flags:

```tsx
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlag';

function Dashboard() {
  const features = useFeatureFlags();

  return (
    <div>
      {features.isEnabled('STORAGE_STATS') && <StorageStats />}
      {features.isEnabled('RECENT_ACTIVITY') && <RecentActivity />}
      {features.isEnabled('PORTABILITY') && <PortabilityWidget />}
    </div>
  );
}
```

#### Verificar todas las flags: `useAllFeatureFlags`

Todas las flags deben estar habilitadas:

```tsx
import { useAllFeatureFlags } from '@/shared/hooks/useFeatureFlag';

function AdvancedFeature() {
  const allEnabled = useAllFeatureFlags(['PORTABILITY', 'DOCUMENT_REQUESTS']);

  if (!allEnabled) {
    return <div>Funcionalidad completa no disponible</div>;
  }

  return <AdvancedContent />;
}
```

#### Verificar al menos una flag: `useAnyFeatureFlag`

Al menos una flag debe estar habilitada:

```tsx
import { useAnyFeatureFlag } from '@/shared/hooks/useFeatureFlag';

function DocumentActions() {
  const hasAnyAction = useAnyFeatureFlag(['DOWNLOAD_DOCUMENTS', 'DELETE_DOCUMENTS']);

  if (!hasAnyAction) {
    return null;
  }

  return <ActionButtons />;
}
```

### En Lógica JavaScript/TypeScript

Para verificar flags fuera de componentes React:

```typescript
import { isFeatureEnabled, areAllFeaturesEnabled, isAnyFeatureEnabled } from '@/shared/config/featureFlags';

// Verificar una flag
if (isFeatureEnabled('PORTABILITY')) {
  console.log('Portabilidad habilitada');
}

// Verificar múltiples flags (todas)
if (areAllFeaturesEnabled(['PORTABILITY', 'DOCUMENT_REQUESTS'])) {
  console.log('Todas habilitadas');
}

// Verificar múltiples flags (al menos una)
if (isAnyFeatureEnabled(['DOWNLOAD_DOCUMENTS', 'DELETE_DOCUMENTS'])) {
  console.log('Al menos una habilitada');
}
```

## Ejemplos

### Ejemplo 1: Menú de Navegación

```tsx
import { FeatureToggle } from '@/shared/components/FeatureToggle';

function NavigationMenu() {
  return (
    <nav>
      <FeatureToggle feature="DOCUMENTS">
        <MenuItem to="/documents">Documentos</MenuItem>
      </FeatureToggle>

      <FeatureToggle feature="DOCUMENT_REQUESTS">
        <MenuItem to="/requests">Solicitudes</MenuItem>
      </FeatureToggle>

      <FeatureToggle feature="PORTABILITY">
        <MenuItem to="/portability">Portabilidad</MenuItem>
      </FeatureToggle>
    </nav>
  );
}
```

### Ejemplo 2: Quick Actions

```tsx
import { FeatureToggle } from '@/shared/components/FeatureToggle';

function QuickActions() {
  return (
    <Grid container spacing={2}>
      <FeatureToggle feature="UPLOAD_DOCUMENTS">
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Subir Documento"
            icon={<UploadIcon />}
            onClick={handleUpload}
          />
        </Grid>
      </FeatureToggle>

      <FeatureToggle feature="DOCUMENTS">
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Mis Documentos"
            icon={<FolderIcon />}
            onClick={handleMyDocuments}
          />
        </Grid>
      </FeatureToggle>

      <FeatureToggle feature="DOCUMENT_REQUESTS">
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Solicitudes"
            icon={<RequestIcon />}
            badge={pendingCount}
            onClick={handleRequests}
          />
        </Grid>
      </FeatureToggle>

      <FeatureToggle feature="PORTABILITY">
        <Grid item xs={12} sm={6} md={3}>
          <QuickActionCard
            title="Cambiar Operador"
            icon={<SwapIcon />}
            onClick={handlePortability}
          />
        </Grid>
      </FeatureToggle>
    </Grid>
  );
}
```

### Ejemplo 3: Acciones en Lista de Documentos

```tsx
import { useFeatureFlags } from '@/shared/hooks/useFeatureFlag';

function DocumentListItem({ document }) {
  const features = useFeatureFlags();

  return (
    <ListItem>
      <ListItemText primary={document.name} />
      <ListItemActions>
        {features.isEnabled('DOWNLOAD_DOCUMENTS') && (
          <IconButton onClick={() => handleDownload(document)}>
            <DownloadIcon />
          </IconButton>
        )}

        {features.isEnabled('DELETE_DOCUMENTS') && (
          <IconButton onClick={() => handleDelete(document)}>
            <DeleteIcon />
          </IconButton>
        )}
      </ListItemActions>
    </ListItem>
  );
}
```

### Ejemplo 4: Rutas Protegidas

```tsx
import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';
import { Navigate } from 'react-router-dom';

function PortabilityPage() {
  const isEnabled = useFeatureFlag('PORTABILITY');

  if (!isEnabled) {
    return <Navigate to="/dashboard" replace />;
  }

  return <PortabilityContent />;
}
```

## Mejores Prácticas

### 1. Un Flag por Funcionalidad

Cada feature flag controla una funcionalidad completa (menú + quick action + página + operaciones).

❌ **Incorrecto**:
```bash
VITE_FEATURE_NAV_PORTABILITY=true
VITE_FEATURE_QUICK_ACTION_PORTABILITY=true
VITE_FEATURE_PAGE_PORTABILITY=true
```

✅ **Correcto**:
```bash
VITE_FEATURE_PORTABILITY=true
```

### 2. Usa el Componente `<FeatureToggle>` en JSX

Es más legible que usar hooks con condicionales:

❌ **Menos legible**:
```tsx
function Dashboard() {
  const isEnabled = useFeatureFlag('PORTABILITY');

  return (
    <div>
      {isEnabled && <PortabilityButton />}
    </div>
  );
}
```

✅ **Más legible**:
```tsx
function Dashboard() {
  return (
    <div>
      <FeatureToggle feature="PORTABILITY">
        <PortabilityButton />
      </FeatureToggle>
    </div>
  );
}
```

### 3. Usa Hooks para Lógica Compleja

Cuando necesites verificar flags en lógica de negocio:

```tsx
function DocumentActions() {
  const features = useFeatureFlags();

  const handleAction = () => {
    if (features.isEnabled('DOWNLOAD_DOCUMENTS')) {
      downloadDocument();
    }

    if (features.isEnabled('AUDIT_LOGS')) {
      logAction('document_action');
    }
  };

  return <Button onClick={handleAction}>Procesar</Button>;
}
```

### 4. Documentar las Flags

Al agregar una nueva feature flag:

1. Agregar el tipo en `featureFlags.ts`
2. Agregar el valor por defecto en `DEFAULT_FLAGS`
3. Agregar la inicialización en `featureFlags` object
4. Documentar en este README

### 5. Testing

Al desarrollar con flags, prueba ambos estados:

```typescript
// En tests
describe('PortabilityButton', () => {
  it('should render when feature is enabled', () => {
    // Mock VITE_FEATURE_PORTABILITY=true
  });

  it('should not render when feature is disabled', () => {
    // Mock VITE_FEATURE_PORTABILITY=false
  });
});
```

### 6. Valores por Defecto Seguros

Define valores por defecto sensatos en producción:

- Funcionalidades estables: `true`
- Funcionalidades experimentales: `false`
- Funcionalidades en desarrollo: `false`

---

## Testing

**Por defecto, todas las feature flags están habilitadas en tests** para garantizar que los tests pasen sin configuración especial.

### Uso Básico en Tests

```typescript
import { render, screen } from '@testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';

describe('MyComponent', () => {
  it('should hide portability when disabled', () => {
    // Deshabilitar feature específica
    mockFeatureFlagsForTest({ PORTABILITY: false });

    render(<MyComponent />);

    expect(screen.queryByText('Portability')).not.toBeInTheDocument();
  });

  it('should show all features by default', () => {
    // No necesita configuración - todas habilitadas por defecto
    render(<MyComponent />);

    expect(screen.getByText('Portability')).toBeInTheDocument();
  });
});
```

### Documentación Completa de Testing

Para una guía completa sobre testing con feature flags, incluyendo ejemplos y mejores prácticas, consulta:

**[src/test/README_FEATURE_FLAGS.md](./src/test/README_FEATURE_FLAGS.md)**

---

## Debugging

En modo desarrollo, el sistema imprime en consola:

```
[Feature Flags] Configuración actual: { PORTABILITY: true, ... }
[Feature Flags] Features habilitadas: ['PORTABILITY', 'DOCUMENTS', ...]
[Feature Flags] Features deshabilitadas: ['RECENT_ACTIVITY', 'MFA']
```

Revisa la consola del navegador al iniciar la aplicación.

