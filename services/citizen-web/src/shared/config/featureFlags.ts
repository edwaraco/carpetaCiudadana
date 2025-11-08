/**
 * Feature Flags Configuration
 *
 * Este archivo centraliza todas las feature flags del sistema.
 * Las flags se configuran mediante runtime config (Kubernetes) o variables de entorno (.env).
 *
 * Para habilitar/deshabilitar features:
 * - En Kubernetes: Actualizar ConfigMap citizen-web-config
 * - En desarrollo local: Actualizar .env con VITE_FEATURE_[NOMBRE]=true/false
 *
 * @example
 * // En .env
 * VITE_FEATURE_PORTABILITY=true
 * VITE_FEATURE_DOCUMENT_REQUESTS=false
 */

/**
 * Tipo que define todas las feature flags disponibles
 * Cada flag controla la funcionalidad completa (menú, quick actions, componentes)
 */
export type FeatureFlag =
  // Funcionalidades principales
  | 'PORTABILITY'              // Cambio de operador (menú, quick action, página)
  | 'DOCUMENT_REQUESTS'        // Solicitudes de documentos (menú, quick action, página)
  | 'DOCUMENTS'                // Gestión de documentos (menú, quick action, página)
  | 'UPLOAD_DOCUMENTS'         // Subir documentos (quick action, tab de upload)
  | 'DOWNLOAD_DOCUMENTS'       // Descargar documentos
  | 'DELETE_DOCUMENTS'         // Eliminar documentos
  | 'NOTIFICATIONS'            // Sistema de notificaciones (menú, badge, página)

  // Features del Dashboard
  | 'STORAGE_STATS'            // Estadísticas de almacenamiento
  | 'RECENT_ACTIVITY'          // Actividad reciente (placeholder)

  // Autenticación
  | 'MFA'                      // Autenticación multifactor
  | 'REGISTRATION'             // Registro de nuevos usuarios

  // Auditoría
  | 'AUDIT_LOGS'               // Logs de auditoría;

/**
 * Configuración por defecto de feature flags
 * Se usa cuando no hay variable de entorno definida
 */
const DEFAULT_FLAGS: Record<FeatureFlag, boolean> = {
  // Funcionalidades principales - habilitadas por defecto
  PORTABILITY: true,
  DOCUMENT_REQUESTS: true,
  DOCUMENTS: true,
  UPLOAD_DOCUMENTS: true,
  DOWNLOAD_DOCUMENTS: true,
  DELETE_DOCUMENTS: true,
  NOTIFICATIONS: true,

  // Features del Dashboard
  STORAGE_STATS: true,
  RECENT_ACTIVITY: false,  // Placeholder - deshabilitado por defecto

  // Autenticación
  MFA: false,  // Se controla también con VITE_MFA_REQUIRED
  REGISTRATION: true,

  // Auditoría
  AUDIT_LOGS: true,
};

/**
 * Obtiene el valor de una feature flag desde runtime config o variables de entorno
 * @param flag - Nombre de la feature flag
 * @returns true si la feature está habilitada, false en caso contrario
 */
function getEnvFeatureFlag(flag: FeatureFlag): boolean {
  const envKey = `VITE_FEATURE_${flag}`;

  // Try runtime config first (Kubernetes/Docker)
  const config = window.__RUNTIME_CONFIG__;
  const runtimeValue = config ? config[envKey as keyof typeof config] : undefined;

  // Fallback to build-time env (local development)
  const envValue = runtimeValue !== undefined ? runtimeValue : import.meta.env[envKey];

  // Si no está definida, usar valor por defecto
  if (envValue === undefined) {
    return DEFAULT_FLAGS[flag];
  }

  // Convertir string a boolean
  if (typeof envValue === 'string') {
    return envValue.toLowerCase() === 'true';
  }

  return Boolean(envValue);
}

/**
 * Objeto con todas las feature flags del sistema
 * Se actualiza automáticamente cuando cambian las variables de entorno
 */
export const featureFlags: Record<FeatureFlag, boolean> = {
  // Funcionalidades principales
  PORTABILITY: getEnvFeatureFlag('PORTABILITY'),
  DOCUMENT_REQUESTS: getEnvFeatureFlag('DOCUMENT_REQUESTS'),
  DOCUMENTS: getEnvFeatureFlag('DOCUMENTS'),
  UPLOAD_DOCUMENTS: getEnvFeatureFlag('UPLOAD_DOCUMENTS'),
  DOWNLOAD_DOCUMENTS: getEnvFeatureFlag('DOWNLOAD_DOCUMENTS'),
  DELETE_DOCUMENTS: getEnvFeatureFlag('DELETE_DOCUMENTS'),
  NOTIFICATIONS: getEnvFeatureFlag('NOTIFICATIONS'),

  // Features del Dashboard
  STORAGE_STATS: getEnvFeatureFlag('STORAGE_STATS'),
  RECENT_ACTIVITY: getEnvFeatureFlag('RECENT_ACTIVITY'),

  // Autenticación
  MFA: getEnvFeatureFlag('MFA'),
  REGISTRATION: getEnvFeatureFlag('REGISTRATION'),

  // Auditoría
  AUDIT_LOGS: getEnvFeatureFlag('AUDIT_LOGS'),
};

/**
 * Verifica si una feature flag está habilitada
 * @param flag - Nombre de la feature flag a verificar
 * @returns true si la feature está habilitada, false en caso contrario
 *
 * @example
 * if (isFeatureEnabled('PORTABILITY')) {
 *   // Mostrar opción de portabilidad
 * }
 */
export function isFeatureEnabled(flag: FeatureFlag): boolean {
  return featureFlags[flag];
}

/**
 * Verifica si todas las features especificadas están habilitadas
 * @param flags - Array de feature flags a verificar
 * @returns true si todas las features están habilitadas
 *
 * @example
 * if (areAllFeaturesEnabled(['PORTABILITY', 'DOCUMENT_REQUESTS'])) {
 *   // Todas las features están habilitadas
 * }
 */
export function areAllFeaturesEnabled(flags: FeatureFlag[]): boolean {
  return flags.every(flag => isFeatureEnabled(flag));
}

/**
 * Verifica si al menos una de las features especificadas está habilitada
 * @param flags - Array de feature flags a verificar
 * @returns true si al menos una feature está habilitada
 *
 * @example
 * if (isAnyFeatureEnabled(['PORTABILITY', 'DOCUMENT_REQUESTS'])) {
 *   // Al menos una feature está habilitada
 * }
 */
export function isAnyFeatureEnabled(flags: FeatureFlag[]): boolean {
  return flags.some(flag => isFeatureEnabled(flag));
}

/**
 * Obtiene todas las features habilitadas
 * @returns Array con los nombres de las features habilitadas
 *
 * @example
 * const enabled = getEnabledFeatures();
 * console.log('Features habilitadas:', enabled);
 */
export function getEnabledFeatures(): FeatureFlag[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => enabled)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Obtiene todas las features deshabilitadas
 * @returns Array con los nombres de las features deshabilitadas
 */
export function getDisabledFeatures(): FeatureFlag[] {
  return Object.entries(featureFlags)
    .filter(([_, enabled]) => !enabled)
    .map(([flag]) => flag as FeatureFlag);
}

/**
 * Modo de desarrollo - permite logging de feature flags
 */
if (import.meta.env.DEV) {
  console.log('[Feature Flags] Configuración actual:', featureFlags);
  console.log('[Feature Flags] Features habilitadas:', getEnabledFeatures());
  console.log('[Feature Flags] Features deshabilitadas:', getDisabledFeatures());
}

