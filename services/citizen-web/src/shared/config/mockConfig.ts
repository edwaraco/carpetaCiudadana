/**
 * Mock Configuration
 *
 * Este archivo centraliza la configuración de mocks del sistema.
 * Permite control granular por contexto/servicio para facilitar la integración incremental.
 *
 * Configuración mediante variables de entorno:
 * - VITE_USE_MOCKS: Habilita/deshabilita todos los mocks (master switch)
 * - VITE_MOCK_[CONTEXTO]: Control granular por contexto
 *
 * Compatible con tests (process.env) y Vite (import.meta.env)
 *
 * @example
 * // En .env - Deshabilitar todos los mocks
 * VITE_USE_MOCKS=false
 *
 * @example
 * // En .env - Usar mocks excepto para carpeta
 * VITE_USE_MOCKS=true
 * VITE_MOCK_CARPETA=false
 *
 * @example
 * // En código
 * if (shouldUseMock('DOCUMENTS')) {
 *   return new DocumentMockService();
 * } else {
 *   return new DocumentApiService();
 * }
 */

// Check if we're in test environment (Jest/Vitest compatibility)
const isTest = typeof process !== 'undefined' && process.env.NODE_ENV === 'test';

// In test mode, use process.env. In Vite mode, use import.meta.env
const env = isTest ? process.env : import.meta.env;

/**
 * Contextos/servicios disponibles para mockear
 * Cada uno corresponde a un bounded context del sistema
 */
export type MockableContext =
  | 'AUTHENTICATION'     // Autenticación y autorización
  | 'IDENTITY'          // Identidad y registro de ciudadanos
  | 'DOCUMENTS'         // Gestión de documentos
  | 'CARPETA'           // Carpeta personal (folder)
  | 'PORTABILITY'       // Portabilidad entre operadores
  | 'REQUESTS'          // Solicitudes de documentos
  | 'NOTIFICATIONS'     // Notificaciones
  | 'AUDIT';            // Auditoría

/**
 * Configuración por defecto de mocks por contexto
 * Cuando VITE_USE_MOCKS=true, se usa esta configuración
 * para cada contexto a menos que se especifique lo contrario
 */
const DEFAULT_MOCK_CONFIG: Record<MockableContext, boolean> = {
  AUTHENTICATION: true,
  IDENTITY: true,
  DOCUMENTS: true,
  CARPETA: true,
  PORTABILITY: true,
  REQUESTS: true,
  NOTIFICATIONS: true,
  AUDIT: true,
};

/**
 * Obtiene el valor del master switch de mocks desde variables de entorno
 * @returns true si los mocks están habilitados globalmente
 */
function getUseMocksGlobal(): boolean {
  const envValue = env.VITE_USE_MOCKS;

  // Si no está definida, usar mocks por defecto en desarrollo
  if (envValue === undefined) {
    return isTest ? true : env.DEV === true;
  }

  // Convertir string a boolean
  if (typeof envValue === 'string') {
    return envValue.toLowerCase() === 'true';
  }

  return Boolean(envValue);
}

/**
 * Obtiene la configuración de mock para un contexto específico
 * @param context - Nombre del contexto
 * @returns true si el mock está habilitado para ese contexto
 */
function getMockConfigForContext(context: MockableContext): boolean {
  const envKey = `VITE_MOCK_${context}`;
  const envValue = env[envKey];

  // Si no está definida, usar valor por defecto
  if (envValue === undefined) {
    return DEFAULT_MOCK_CONFIG[context];
  }

  // Convertir string a boolean
  if (typeof envValue === 'string') {
    return envValue.toLowerCase() === 'true';
  }

  return Boolean(envValue);
}

/**
 * Master switch: Habilita/deshabilita todos los mocks
 */
export const USE_MOCKS_GLOBAL = getUseMocksGlobal();

/**
 * Configuración granular de mocks por contexto
 * Solo se aplica si USE_MOCKS_GLOBAL === true
 */
export const mockConfig: Record<MockableContext, boolean> = {
  AUTHENTICATION: getMockConfigForContext('AUTHENTICATION'),
  IDENTITY: getMockConfigForContext('IDENTITY'),
  DOCUMENTS: getMockConfigForContext('DOCUMENTS'),
  CARPETA: getMockConfigForContext('CARPETA'),
  PORTABILITY: getMockConfigForContext('PORTABILITY'),
  REQUESTS: getMockConfigForContext('REQUESTS'),
  NOTIFICATIONS: getMockConfigForContext('NOTIFICATIONS'),
  AUDIT: getMockConfigForContext('AUDIT'),
};

/**
 * Determina si se debe usar el mock para un contexto específico
 *
 * Lógica:
 * 1. Si USE_MOCKS_GLOBAL === false, retorna false (sin mocks)
 * 2. Si USE_MOCKS_GLOBAL === true, verifica la configuración granular del contexto
 *
 * @param context - Contexto a verificar
 * @returns true si se debe usar el mock para ese contexto
 *
 * @example
 * // Ejemplo 1: VITE_USE_MOCKS=false
 * shouldUseMock('DOCUMENTS') // => false (master switch deshabilitado)
 *
 * @example
 * // Ejemplo 2: VITE_USE_MOCKS=true, VITE_MOCK_CARPETA=false
 * shouldUseMock('DOCUMENTS') // => true (mock habilitado)
 * shouldUseMock('CARPETA')   // => false (mock deshabilitado para carpeta)
 *
 * @example
 * // Ejemplo 3: VITE_USE_MOCKS=true, sin configuración granular
 * shouldUseMock('DOCUMENTS') // => true (usa configuración por defecto)
 */
export function shouldUseMock(context: MockableContext): boolean {
  // Si el master switch está deshabilitado, no usar mocks
  if (!USE_MOCKS_GLOBAL) {
    return false;
  }

  // Si el master switch está habilitado, verificar configuración granular
  return mockConfig[context];
}

/**
 * Obtiene todos los contextos que están usando mocks
 * @returns Array con los nombres de los contextos mockeados
 */
export function getMockedContexts(): MockableContext[] {
  if (!USE_MOCKS_GLOBAL) {
    return [];
  }

  return Object.entries(mockConfig)
    .filter(([_, enabled]) => enabled)
    .map(([context]) => context as MockableContext);
}

/**
 * Obtiene todos los contextos que están usando servicios reales
 * @returns Array con los nombres de los contextos no mockeados
 */
export function getRealServiceContexts(): MockableContext[] {
  if (!USE_MOCKS_GLOBAL) {
    return Object.keys(mockConfig) as MockableContext[];
  }

  return Object.entries(mockConfig)
    .filter(([_, enabled]) => !enabled)
    .map(([context]) => context as MockableContext);
}

/**
 * Obtiene un resumen de la configuración de mocks
 * @returns Objeto con información sobre el estado de los mocks
 */
export function getMockConfigSummary() {
  return {
    globalEnabled: USE_MOCKS_GLOBAL,
    mockedContexts: getMockedContexts(),
    realServiceContexts: getRealServiceContexts(),
    config: USE_MOCKS_GLOBAL ? mockConfig : null,
  };
}

/**
 * Modo de desarrollo - permite logging de configuración de mocks
 */
if (!isTest && env.DEV) {
  console.log('[Mock Config] Configuración actual:', {
    'USE_MOCKS_GLOBAL': USE_MOCKS_GLOBAL,
    'Contextos mockeados': getMockedContexts(),
    'Contextos reales': getRealServiceContexts(),
  });
}

