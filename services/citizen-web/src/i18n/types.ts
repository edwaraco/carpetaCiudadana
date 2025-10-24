/**
 * i18n Type Definitions
 * TypeScript types for type-safe translations
 */

import { resources, namespaces } from './config';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['es'];
    ns: typeof namespaces;
  }
}

export type TranslationNamespace = (typeof namespaces)[number];

