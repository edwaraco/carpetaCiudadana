# Sistema de Internacionalización (i18n)

Este proyecto utiliza **i18next** y **react-i18next** para gestionar las traducciones de la aplicación.

## 📁 Estructura de Archivos

```
src/
├── i18n/
│   ├── config.ts       # Configuración de i18next
│   ├── types.ts        # Tipos de TypeScript para traducciones
│   ├── index.ts        # Exports principales
│   └── README.md       # Esta documentación
└── locales/
    └── es/             # Traducciones en español (idioma principal)
        ├── common.json          # Traducciones comunes (navegación, acciones, errores)
        ├── identity.json        # Dominio de Identidad y Registro
        ├── authentication.json  # Dominio de Autenticación
        ├── documents.json       # Dominio de Documentos
        ├── folder.json          # Dominio de Carpeta Personal
        ├── portability.json     # Dominio de Portabilidad
        ├── requests.json        # Dominio de Solicitudes
        └── audit.json           # Dominio de Auditoría
```

## 🚀 Uso Básico

### En Componentes Funcionales

```typescript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  // Usar el namespace 'common' por defecto
  const { t } = useTranslation();

  return <h1>{t('app.name')}</h1>;
  // Output: "Carpeta Ciudadana"
}
```

### Con Namespace Específico

```typescript
import { useTranslation } from 'react-i18next';

function FormularioRegistro() {
  // Especificar el namespace 'identity'
  const { t } = useTranslation('identity');

  return (
    <div>
      <h1>{t('registration.title')}</h1>
      {/* Output: "Registro de Ciudadano" */}

      <p>{t('registration.subtitle')}</p>
      {/* Output: "Regístrese como nuevo ciudadano..." */}
    </div>
  );
}
```

### Con Múltiples Namespaces

```typescript
import { useTranslation } from 'react-i18next';

function MiComponente() {
  const { t } = useTranslation(['identity', 'common']);

  return (
    <div>
      {/* Namespace por defecto (identity) */}
      <h1>{t('registration.title')}</h1>

      {/* Namespace específico usando prefijo */}
      <button>{t('common:actions.save')}</button>
    </div>
  );
}
```

### Interpolación de Variables

```typescript
const { t } = useTranslation('identity');

// En el JSON: "alreadyRegistered": "Esta cédula ya está registrada con {{operator}}"
const mensaje = t('registration.form.cedula.alreadyRegistered', {
  operator: 'MiCarpeta Colombia'
});
// Output: "Esta cédula ya está registrada con MiCarpeta Colombia"
```

### Traducciones con Pluralización

Aunque actualmente el proyecto solo usa español, i18next soporta pluralización:

```json
{
  "documents": "{{count}} documento",
  "documents_other": "{{count}} documentos"
}
```

```typescript
t('documents', { count: 1 });  // "1 documento"
t('documents', { count: 5 });  // "5 documentos"
```

## 📝 Organización de Traducciones

### Por Dominio DDD

Las traducciones están organizadas siguiendo los **bounded contexts** del proyecto:

- **common.json**: Traducciones compartidas (navegación, acciones, validaciones)
- **identity.json**: Registro e información de ciudadanos
- **authentication.json**: Login, MFA, sesiones
- **documents.json**: Gestión de documentos (carga, compartir, eliminación)
- **folder.json**: Carpeta personal, almacenamiento, configuración
- **portability.json**: Transferencia entre operadores
- **requests.json**: Solicitudes de documentos
- **audit.json**: Auditoría y trazabilidad

### Estructura de Claves

Usar nomenclatura jerárquica con puntos:

```json
{
  "featureName": {
    "section": {
      "key": "valor"
    },
    "form": {
      "fieldName": {
        "label": "Etiqueta",
        "placeholder": "Placeholder",
        "helperText": "Texto de ayuda",
        "error": "Mensaje de error"
      }
    }
  }
}
```

**Ejemplo:**

```json
{
  "registration": {
    "title": "Registro de Ciudadano",
    "form": {
      "cedula": {
        "label": "Cédula de Ciudadanía",
        "helperText": "Ingrese su número de identificación",
        "invalid": "La cédula debe tener entre 6 y 10 dígitos"
      }
    }
  }
}
```

## 🔧 Configuración

### Idioma por Defecto

El idioma por defecto es **español (es)**, configurado en `src/i18n/config.ts`:

```typescript
i18n.init({
  lng: 'es',
  fallbackLng: 'es',
  // ...
});
```

### Agregar un Nuevo Idioma

1. Crear carpeta `src/locales/[código]/` (ej: `en` para inglés)
2. Crear archivos JSON con las traducciones
3. Importar en `src/i18n/config.ts`:

```typescript
import commonEn from '@/locales/en/common.json';

export const resources = {
  es: { /* ... */ },
  en: {
    common: commonEn,
    // ...
  }
};
```

### Cambiar Idioma Dinámicamente

```typescript
import { useTranslation } from 'react-i18next';

function LanguageSelector() {
  const { i18n } = useTranslation();

  const cambiarIdioma = (idioma: string) => {
    i18n.changeLanguage(idioma);
  };

  return (
    <select onChange={(e) => cambiarIdioma(e.target.value)}>
      <option value="es">Español</option>
      <option value="en">English</option>
    </select>
  );
}
```

## ✅ Buenas Prácticas

### 1. Usar el Lenguaje Ubicuo del Dominio

Usar los términos del **ubiquitous language** definido en el proyecto:

✅ **Correcto:**
```json
{
  "document": {
    "certified": "Documento Certificado",
    "temporary": "Documento Temporal",
    "issuance": "Emisión",
    "authorization": "Autorización de Envío"
  }
}
```

❌ **Incorrecto:**
```json
{
  "document": {
    "official": "Documento Oficial",  // Usar "Certificado"
    "upload": "Subir archivo"         // Usar "Almacenar documento"
  }
}
```

### 2. Evitar Textos Hardcodeados

✅ **Correcto:**
```typescript
<Button>{t('common:actions.save')}</Button>
```

❌ **Incorrecto:**
```typescript
<Button>Guardar</Button>
```

### 3. Agrupar por Contexto

Mantener las traducciones agrupadas por funcionalidad:

```json
{
  "login": {
    "title": "...",
    "form": { /* ... */ },
    "actions": { /* ... */ },
    "errors": { /* ... */ }
  }
}
```

### 4. TypeScript Type Safety

Los tipos están configurados automáticamente. TypeScript te ayudará con autocompletado:

```typescript
// TypeScript sugerirá las claves disponibles
t('registration.title');  // ✅ Autocompletado
t('registro.titulo');     // ❌ Error de tipo
```

### 5. Validaciones de Formularios

Para mensajes de validación, usar traducciones con interpolación:

```typescript
{
  required: t('common:validation.required', {
    field: t('registration.form.cedula.label')
  })
}
// Output: "Cédula de Ciudadanía es obligatorio"
```

## 🛠️ Comandos Útiles

### Agregar Nueva Traducción

1. Abrir el archivo JSON correspondiente en `src/locales/es/`
2. Agregar la clave en el contexto apropiado
3. Usar en el componente con `t('namespace:clave')`

### Verificar Traducciones Faltantes

En desarrollo, i18next mostrará warnings en consola si una clave no existe.

## 📚 Referencias

- [i18next Documentation](https://www.i18next.com/)
- [react-i18next Documentation](https://react.i18next.com/)
- [Proyecto: Lenguaje Ubicuo (DDD)](../../../docs/informacion_cruda/ddd_analisis/1_lenguaje_ubicuo.md)

