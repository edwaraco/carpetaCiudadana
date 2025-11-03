import { type ReactNode } from 'react';
import { type FeatureFlag, isFeatureEnabled } from '@/shared/config/featureFlags';

/**
 * Props para el componente FeatureToggle
 */
interface FeatureToggleProps {
  /**
   * Feature flag a verificar
   */
  feature: FeatureFlag;

  /**
   * Contenido a mostrar si la feature está habilitada
   */
  children: ReactNode;
}

/**
 * Componente que muestra u oculta contenido basado en feature flags
 * Si la feature está deshabilitada, no muestra nada
 *
 * @example
 * <FeatureToggle feature="PORTABILITY">
 *   <PortabilityButton />
 * </FeatureToggle>
 */
export function FeatureToggle({ feature, children }: FeatureToggleProps) {
  if (!isFeatureEnabled(feature)) {
    return null;
  }

  return <>{children}</>;
}

