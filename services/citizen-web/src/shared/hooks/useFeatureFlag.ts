import { useMemo } from 'react';
import { type FeatureFlag, isFeatureEnabled, areAllFeaturesEnabled, isAnyFeatureEnabled } from '@/shared/config/featureFlags';

/**
 * Hook personalizado para verificar feature flags en componentes React
 *
 * @param flag - Nombre de la feature flag a verificar
 * @returns true si la feature está habilitada, false en caso contrario
 *
 * @example
 * function PortabilitySection() {
 *   const isPortabilityEnabled = useFeatureFlag('PORTABILITY');
 *
 *   if (!isPortabilityEnabled) {
 *     return null;
 *   }
 *
 *   return <PortabilityContent />;
 * }
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  return useMemo(() => isFeatureEnabled(flag), [flag]);
}

/**
 * Hook para verificar múltiples feature flags (todas deben estar habilitadas)
 *
 * @param flags - Array de feature flags a verificar
 * @returns true si todas las features están habilitadas
 *
 * @example
 * function AdvancedFeature() {
 *   const allEnabled = useAllFeatureFlags(['PORTABILITY', 'DOCUMENT_REQUESTS']);
 *
 *   if (!allEnabled) {
 *     return <div>Algunas funcionalidades no están disponibles</div>;
 *   }
 *
 *   return <AdvancedContent />;
 * }
 */
export function useAllFeatureFlags(flags: FeatureFlag[]): boolean {
  return useMemo(() => areAllFeaturesEnabled(flags), [flags]);
}

/**
 * Hook para verificar múltiples feature flags (al menos una debe estar habilitada)
 *
 * @param flags - Array de feature flags a verificar
 * @returns true si al menos una feature está habilitada
 *
 * @example
 * function DocumentSection() {
 *   const hasAnyDocFeature = useAnyFeatureFlag(['UPLOAD_DOCUMENTS', 'DOCUMENT_MANAGEMENT']);
 *
 *   if (!hasAnyDocFeature) {
 *     return null;
 *   }
 *
 *   return <DocumentContent />;
 * }
 */
export function useAnyFeatureFlag(flags: FeatureFlag[]): boolean {
  return useMemo(() => isAnyFeatureEnabled(flags), [flags]);
}

/**
 * Hook que retorna un objeto con métodos helper para feature flags
 * Útil cuando necesitas verificar múltiples flags en el mismo componente
 *
 * @returns Objeto con métodos helper
 *
 * @example
 * function Dashboard() {
 *   const features = useFeatureFlags();
 *
 *   return (
 *     <div>
 *       {features.isEnabled('NAV_DASHBOARD') && <DashboardNav />}
 *       {features.isEnabled('STORAGE_STATS') && <StorageStats />}
 *       {features.isEnabled('RECENT_ACTIVITY') && <RecentActivity />}
 *     </div>
 *   );
 * }
 */
export function useFeatureFlags() {
  return useMemo(() => ({
    isEnabled: (flag: FeatureFlag) => isFeatureEnabled(flag),
    areAllEnabled: (flags: FeatureFlag[]) => areAllFeaturesEnabled(flags),
    isAnyEnabled: (flags: FeatureFlag[]) => isAnyFeatureEnabled(flags),
  }), []);
}

