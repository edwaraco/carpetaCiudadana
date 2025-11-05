/**
 * Carpeta Context Hook
 * Provides carpetaId from localStorage
 *
 * The carpetaId is obtained during login by calling GET /carpetas/cedula/{cedula}
 * and stored in localStorage for the duration of the session.
 */

/**
 * Custom hook to get the current user's carpetaId
 *
 * Strategy (Option A from architecture docs):
 * 1. After login, call GET /carpetas/cedula/{cedula} to get carpetaId
 * 2. Store carpetaId in localStorage using storeCarpetaId()
 * 3. This hook reads carpetaId from localStorage
 * 4. If not found, throw error (user not logged in or carpeta not created)
 *
 * @returns carpetaId string (UUID format)
 * @throws Error if carpetaId is not available
 *
 * @example
 * const MyComponent = () => {
 *   const carpetaId = useCarpetaId();
 *   // Use carpetaId in API calls
 *   const response = await documentService.getDocuments(carpetaId);
 * }
 */
export const useCarpetaId = (): string => {
  const carpetaId = localStorage.getItem('carpetaId');

  if (!carpetaId) {
    throw new Error(
      'No carpetaId found in localStorage. ' +
      'User must be logged in and have a carpeta created. ' +
      'Please ensure the login flow calls GET /carpetas/cedula/{cedula} and stores the carpetaId.'
    );
  }

  return carpetaId;
};

/**
 * Helper function to store carpetaId after login
 * Should be called from AuthContext after successful authentication
 *
 * @param carpetaId - The carpetaId (UUID) obtained from GET /carpetas/cedula/{cedula}
 *
 * @example
 * // In AuthContext.tsx login method:
 * const loginResponse = await authService.login(credentials);
 * if (loginResponse.success) {
 *   // Fetch carpeta by cedula
 *   const carpetaResponse = await httpClient.get(`/carpetas/cedula/${credentials.cedula}`);
 *   if (carpetaResponse.success && carpetaResponse.data) {
 *     storeCarpetaId(carpetaResponse.data.carpetaId);
 *   }
 * }
 */
export const storeCarpetaId = (carpetaId: string): void => {
  if (!carpetaId) {
    console.warn('Attempted to store empty carpetaId');
    return;
  }

  localStorage.setItem('carpetaId', carpetaId);
  console.info(`CarpetaId stored: ${carpetaId}`);
};

/**
 * Helper function to clear carpetaId on logout
 * Should be called from AuthContext logout method
 *
 * @example
 * // In AuthContext.tsx logout method:
 * clearCarpetaId();
 * localStorage.removeItem('auth_token');
 * localStorage.removeItem('auth_user');
 */
export const clearCarpetaId = (): void => {
  localStorage.removeItem('carpetaId');
  console.info('CarpetaId cleared from localStorage');
};

