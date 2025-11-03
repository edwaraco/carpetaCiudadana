/**
 * i18n Configuration
 * Internationalization setup for the application
 */

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files using aliases
import commonEs from '@/locales/es/common.json';
import identityEs from '@/locales/es/identity.json';
import authenticationEs from '@/locales/es/authentication.json';
import documentsEs from '@/locales/es/documents.json';
import folderEs from '@/locales/es/folder.json';
import portabilityEs from '@/locales/es/portability.json';
import requestsEs from '@/locales/es/requests.json';
import auditEs from '@/locales/es/audit.json';
import notificationsEs from '@/locales/es/notifications.json';

// Define available namespaces
export const namespaces = [
  'common',
  'identity',
  'authentication',
  'documents',
  'folder',
  'portability',
  'requests',
  'audit',
  'notifications',
] as const;

// Define resources type
export const resources = {
  es: {
    common: commonEs,
    identity: identityEs,
    authentication: authenticationEs,
    documents: documentsEs,
    folder: folderEs,
    portability: portabilityEs,
    requests: requestsEs,
    audit: auditEs,
    notifications: notificationsEs,
  },
} as const;

// Initialize i18next
i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es', // Default language (Spanish for Colombian citizens)
    fallbackLng: 'es',
    defaultNS: 'common',
    ns: namespaces,

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React-specific options
    react: {
      useSuspense: true,
    },

    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
  });

export default i18n;

