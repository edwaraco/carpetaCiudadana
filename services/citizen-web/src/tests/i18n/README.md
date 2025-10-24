# Testing con i18n

Esta carpeta contiene utilidades para facilitar el testing de componentes que usan i18next.

## 📁 Archivos

- **`i18n-test-helper.tsx`**: Helper para renderizar componentes con i18n en tests

## 🚀 Uso

### Renderizar Componentes con i18n

En lugar de usar `render` de `@testing-library/react`, usa `renderWithI18n`:

```typescript
import { screen } from '@testing-library/react';
import { renderWithI18n } from '@/tests/i18n/i18n-test-helper';
import MiComponente from './MiComponente';

describe('MiComponente', () => {
  it('muestra texto traducido', () => {
    renderWithI18n(<MiComponente />);

    // Buscar por el texto en español
    expect(screen.getByText('Registro de Ciudadano')).toBeInTheDocument();
  });
});
```

### Mockear Hooks

Cuando tus componentes usan custom hooks, necesitas mockearlos:

```typescript
import { vi } from 'vitest';

vi.mock('../hooks/useRegisterCitizen', () => ({
  useRegisterCitizen: vi.fn(() => ({
    registerCitizen: vi.fn(),
    isLoading: false,
    error: null,
    data: null,
  })),
}));

describe('FormularioRegistro', () => {
  it('llama a registerCitizen con datos correctos', async () => {
    const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');
    const registerMock = vi.fn();

    vi.mocked(useRegisterCitizen).mockReturnValue({
      registerCitizen: registerMock,
      isLoading: false,
      error: null,
      data: null,
    });

    // ... resto del test
  });
});
```

### Verificar Traducciones

Usa expresiones regulares para verificar textos traducidos:

```typescript
// ✅ Flexible - funciona si cambian mayúsculas/minúsculas
expect(screen.getByText(/registro de ciudadano/i)).toBeInTheDocument();

// ✅ Exacto - para textos específicos
expect(screen.getByText('Cédula de Ciudadanía')).toBeInTheDocument();

// ✅ Interpolación - verificar variables
expect(screen.getByText(/Esta cédula ya está registrada con MiCarpeta/i)).toBeInTheDocument();
```

### Testing de Estados de Carga

```typescript
it('muestra estado de carga', async () => {
  const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');

  vi.mocked(useRegisterCitizen).mockReturnValue({
    registerCitizen: vi.fn(),
    isLoading: true, // Estado de carga
    error: null,
    data: null,
  });

  renderWithI18n(<RegisterCitizenForm />);

  expect(screen.getByText(/Registrando.../i)).toBeInTheDocument();
});
```

### Testing de Errores

```typescript
it('muestra mensajes de error', async () => {
  const { useRegisterCitizen } = await import('../hooks/useRegisterCitizen');

  vi.mocked(useRegisterCitizen).mockReturnValue({
    registerCitizen: vi.fn(),
    isLoading: false,
    error: new Error('Error de conexión'),
    data: null,
  });

  renderWithI18n(<RegisterCitizenForm />);

  expect(screen.getByText(/Error de conexión/i)).toBeInTheDocument();
});
```

### Testing de Validaciones

```typescript
it('valida campos obligatorios', async () => {
  const user = userEvent.setup();
  renderWithI18n(<RegisterCitizenForm />);

  const submitButton = screen.getByRole('button', { name: /Registrar/i });
  await user.click(submitButton);

  await waitFor(() => {
    expect(screen.getByText(/cédula es obligatori/i)).toBeInTheDocument();
    expect(screen.getByText(/Nombre Completo es obligatorio/i)).toBeInTheDocument();
  });
});
```

## 🎯 Buenas Prácticas

### 1. Usar Regex Case-Insensitive

```typescript
// ✅ Correcto - tolerante a cambios
screen.getByText(/registro de ciudadano/i)

// ❌ Evitar - frágil
screen.getByText('Registro De Ciudadano')
```

### 2. Usar getByLabelText para Campos de Formulario

```typescript
// ✅ Correcto - accesible
screen.getByLabelText(/Cédula de Ciudadanía/i)

// ❌ Evitar - no accesible
screen.getByPlaceholderText(/Ingrese su cédula/i)
```

### 3. Limpiar Mocks Entre Tests

```typescript
describe('MiComponente', () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Limpia todos los mocks
  });

  it('test 1', () => {
    // ...
  });

  it('test 2', () => {
    // Los mocks están limpios aquí
  });
});
```

### 4. Testing de Interpolación

```typescript
it('muestra operador en mensaje de error', async () => {
  vi.mocked(useValidateCitizen).mockReturnValue({
    validateCitizen: vi.fn(),
    isLoading: false,
    data: {
      available: false,
      currentOperator: 'MiCarpeta Colombia',
    },
  });

  renderWithI18n(<RegisterCitizenForm />);

  // Verificar que el operador se interpoló correctamente
  expect(
    screen.getByText(/Esta cédula ya está registrada con MiCarpeta Colombia/i)
  ).toBeInTheDocument();
});
```

### 5. Testing de Estados Múltiples

```typescript
it('cambia entre estados de validación', async () => {
  const { useValidateCitizen } = await import('../hooks/useValidateCitizen');
  const user = userEvent.setup();

  // Estado inicial: validando
  vi.mocked(useValidateCitizen).mockReturnValue({
    validateCitizen: vi.fn(),
    isLoading: true,
    data: null,
  });

  const { rerender } = renderWithI18n(<RegisterCitizenForm />);

  expect(screen.getByText(/Validando.../i)).toBeInTheDocument();

  // Estado final: disponible
  vi.mocked(useValidateCitizen).mockReturnValue({
    validateCitizen: vi.fn(),
    isLoading: false,
    data: { available: true, currentOperator: null },
  });

  rerender(<RegisterCitizenForm />);

  expect(screen.getByText(/Cédula disponible para registro/i)).toBeInTheDocument();
});
```

## 🔧 Configuración de i18n en Tests

El helper configura automáticamente i18next con:
- **Idioma**: Español (es)
- **Suspense deshabilitado**: Para testing síncrono
- **Todos los namespaces**: Disponibles en los tests
- **Traducciones completas**: De todos los archivos JSON

No necesitas configuración adicional, solo importa y usa `renderWithI18n`.

## 📚 Referencias

- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest](https://vitest.dev/)
- [react-i18next Testing](https://react.i18next.com/misc/testing)

