# Testing con Feature Flags

Esta guía explica cómo trabajar con feature flags en tus tests.

## Comportamiento por Defecto

**Por defecto, todas las feature flags están habilitadas en tests**. Esto garantiza que tus tests no fallen debido a features deshabilitadas.

El mock se configura automáticamente en `src/test/setup.ts` y se aplica a todos los tests.

## Uso Básico

### Opción 1: Usar el Comportamiento por Defecto (Recomendado)

La mayoría de tus tests no necesitan configuración especial:

```typescript
import { render, screen } from '@testing-library/react';
import { DashboardPage } from '@/pages/DashboardPage';

describe('DashboardPage', () => {
  it('should render all quick actions', () => {
    render(<DashboardPage />);

    // Todas las features están habilitadas, todos los botones aparecen
    expect(screen.getByText('Subir Documento')).toBeInTheDocument();
    expect(screen.getByText('Mis Documentos')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Cambiar Operador')).toBeInTheDocument();
  });
});
```

### Opción 2: Deshabilitar Features Específicas

Cuando necesites probar el comportamiento con features deshabilitadas:

```typescript
import { render, screen } from '@testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
import { DashboardPage } from '@/pages/DashboardPage';

describe('DashboardPage', () => {
  it('should hide portability when disabled', () => {
    // Deshabilitar solo portabilidad
    mockFeatureFlagsForTest({ PORTABILITY: false });

    render(<DashboardPage />);

    expect(screen.queryByText('Cambiar Operador')).not.toBeInTheDocument();
    // Otros botones siguen apareciendo
    expect(screen.getByText('Subir Documento')).toBeInTheDocument();
  });
});
```

### Opción 3: Configurar Múltiples Features

```typescript
import { render, screen } from '@/testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
import { DashboardPage } from '@/pages/DashboardPage';

describe('DashboardPage with limited features', () => {
  it('should only show documents features', () => {
    mockFeatureFlagsForTest({
      PORTABILITY: false,
      DOCUMENT_REQUESTS: false,
      UPLOAD_DOCUMENTS: true,
      DOCUMENTS: true,
    });

    render(<DashboardPage />);

    expect(screen.getByText('Mis Documentos')).toBeInTheDocument();
    expect(screen.queryByText('Cambiar Operador')).not.toBeInTheDocument();
    expect(screen.queryByText('Solicitudes')).not.toBeInTheDocument();
  });
});
```

## Funciones Disponibles

### `mockFeatureFlagsForTest(overrides)`

Sobrescribe feature flags específicas para un test.

```typescript
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';

mockFeatureFlagsForTest({
  PORTABILITY: false,
  DOCUMENTS: true
});
```

### `resetFeatureFlagsForTest()`

Resetea todas las features a su estado por defecto (todas habilitadas).

**No necesitas llamar esto manualmente** - se ejecuta automáticamente después de cada test en `afterEach()`.

```typescript
import { resetFeatureFlagsForTest } from '@/test/mocks/featureFlags';

afterEach(() => {
  resetFeatureFlagsForTest(); // Ya se hace automáticamente
});
```

### `disableAllFeatureFlagsForTest()`

Deshabilita todas las feature flags. Útil para probar estados "vacíos".

```typescript
import { disableAllFeatureFlagsForTest } from '@/test/mocks/featureFlags';

it('should show empty state when no features enabled', () => {
  disableAllFeatureFlagsForTest();

  render(<MyComponent />);

  expect(screen.getByText('No features available')).toBeInTheDocument();
});
```

## Ejemplos Completos

### Ejemplo 1: Test de Navegación

```typescript
import { render, screen } from '@testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
import { Layout } from '@/shared/components/Layout';

describe('Layout Navigation', () => {
  it('should show all menu items by default', () => {
    render(<Layout />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Documentos')).toBeInTheDocument();
    expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    expect(screen.getByText('Portabilidad')).toBeInTheDocument();
  });

  it('should hide portability menu when disabled', () => {
    mockFeatureFlagsForTest({ PORTABILITY: false });

    render(<Layout />);

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Portabilidad')).not.toBeInTheDocument();
  });
});
```

### Ejemplo 2: Test de Document List

```typescript
import { render, screen } from '@testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
import { DocumentList } from '@/contexts/documents/components/DocumentList';

describe('DocumentList', () => {
  it('should show download and delete buttons by default', () => {
    render(<DocumentList />);

    expect(screen.getByLabelText('Download')).toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('should hide download button when disabled', () => {
    mockFeatureFlagsForTest({ DOWNLOAD_DOCUMENTS: false });

    render(<DocumentList />);

    expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Delete')).toBeInTheDocument();
  });

  it('should hide both buttons when disabled', () => {
    mockFeatureFlagsForTest({
      DOWNLOAD_DOCUMENTS: false,
      DELETE_DOCUMENTS: false,
    });

    render(<DocumentList />);

    expect(screen.queryByLabelText('Download')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Delete')).not.toBeInTheDocument();
  });
});
```

### Ejemplo 3: Test de Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { mockFeatureFlagsForTest } from '@/test/mocks/featureFlags';
import { useFeatureFlag } from '@/shared/hooks/useFeatureFlag';

describe('useFeatureFlag', () => {
  it('should return true by default', () => {
    const { result } = renderHook(() => useFeatureFlag('PORTABILITY'));

    expect(result.current).toBe(true);
  });

  it('should return false when disabled', () => {
    mockFeatureFlagsForTest({ PORTABILITY: false });

    const { result } = renderHook(() => useFeatureFlag('PORTABILITY'));

    expect(result.current).toBe(false);
  });
});
```

## Mejores Prácticas

### ✅ DO - Usar comportamiento por defecto

```typescript
// Por defecto todas las features están habilitadas - test simple
it('should render component', () => {
  render(<MyComponent />);
  expect(screen.getByText('Content')).toBeInTheDocument();
});
```

### ✅ DO - Deshabilitar solo lo necesario

```typescript
// Deshabilita solo la feature que estás probando
it('should hide upload when disabled', () => {
  mockFeatureFlagsForTest({ UPLOAD_DOCUMENTS: false });
  render(<DocumentsPage />);
  expect(screen.queryByText('Upload')).not.toBeInTheDocument();
});
```

### ❌ DON'T - Habilitar todo manualmente

```typescript
// No necesario - ya está habilitado por defecto
it('should show feature', () => {
  mockFeatureFlagsForTest({ PORTABILITY: true }); // ❌ Innecesario
  render(<MyComponent />);
});
```

### ❌ DON'T - Resetear manualmente en afterEach

```typescript
// No necesario - ya se hace automáticamente
afterEach(() => {
  resetFeatureFlagsForTest(); // ❌ Innecesario
});
```

## Troubleshooting

### Problema: Los tests fallan con features deshabilitadas

**Solución**: Por defecto todas las features están habilitadas. Si tus tests fallan, verifica que no estés deshabilitando features que el componente necesita.

### Problema: Los cambios de feature flags no se aplican

**Solución**: Asegúrate de llamar `mockFeatureFlagsForTest()` ANTES de renderizar el componente:

```typescript
// ✅ Correcto
it('test', () => {
  mockFeatureFlagsForTest({ PORTABILITY: false });
  render(<Component />);
});

// ❌ Incorrecto
it('test', () => {
  render(<Component />);
  mockFeatureFlagsForTest({ PORTABILITY: false }); // Muy tarde
});
```

### Problema: Un test afecta a otro

**Solución**: Los mocks se resetean automáticamente después de cada test. Si experimentas interferencia, verifica que no estés usando mocks globales adicionales.

## Arquitectura

```
src/
├── shared/
│   └── config/
│       └── featureFlags.ts          # Código de producción (limpio)
└── test/
    ├── mocks/
    │   └── featureFlags.ts          # Mocks para testing
    ├── setup.ts                      # Configuración global (mock automático)
    └── README_FEATURE_FLAGS.md       # Esta documentación
```

**Separación clara**: El código de producción (`shared/config/featureFlags.ts`) no contiene lógica de testing. Los mocks están completamente separados en `test/mocks/`.

