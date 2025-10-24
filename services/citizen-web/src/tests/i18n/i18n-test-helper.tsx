/**
 * i18n Test Helper
 * Utilities for testing components with i18n
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files for testing
import commonEs from '@/locales/es/common.json';
import identityEs from '@/locales/es/identity.json';
import authenticationEs from '@/locales/es/authentication.json';
import documentsEs from '@/locales/es/documents.json';
import folderEs from '@/locales/es/folder.json';
import portabilityEs from '@/locales/es/portability.json';
import requestsEs from '@/locales/es/requests.json';
import auditEs from '@/locales/es/audit.json';

// Create i18n instance for testing
const i18nForTests = i18n.createInstance();

i18nForTests
  .use(initReactI18next)
  .init({
    lng: 'es',
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: ['common', 'identity', 'authentication', 'documents', 'folder', 'portability', 'requests', 'audit'],
    resources: {
      es: {
        common: commonEs,
        identity: identityEs,
        authentication: authenticationEs,
        documents: documentsEs,
        folder: folderEs,
        portability: portabilityEs,
        requests: requestsEs,
        audit: auditEs,
      },
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false, // Disable suspense for testing
    },
  });

/**
 * Custom render function that wraps components with i18n provider
 */
export function renderWithI18n(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, {
    wrapper: ({ children }) => (
      <I18nextProvider i18n={i18nForTests}>
        {children}
      </I18nextProvider>
    ),
    ...options,
  });
}

// Re-export everything from testing-library
// eslint-disable-next-line react-refresh/only-export-components
export * from '@testing-library/react';

// Export the test i18n instance
export { i18nForTests };

