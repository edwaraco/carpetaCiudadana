/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_USE_MOCK_API: string;
  readonly VITE_OPERATOR_ID: string;
  readonly VITE_OPERATOR_NAME: string;
  readonly VITE_MFA_REQUIRED: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

