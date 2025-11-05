/**
 * Carpeta Context Hook
 * Provides carpetaId from the authenticated user's session
 *
 * The carpetaId is obtained from the user object returned during login
 * and is available through the AuthContext.
 */

import { useAuth } from '@/contexts/authentication/context/AuthContext';

/**
 * Custom hook to get the current user's carpetaId
 *
 * Strategy:
 * 1. Get the authenticated user from AuthContext
 * 2. Return the carpetaId from user.carpetaId
 * 3. If user is not authenticated, throw an error
 * 4. If carpetaId is missing from user object, throw an error
 *
 * @returns carpetaId string (UUID format)
 * @throws Error if user is not authenticated or carpetaId is not available
 *
 * @example
 * const MyComponent = () => {
 *   const carpetaId = useCarpetaId(); // Will throw if not available
 *
 *   // Use carpetaId in API calls (guaranteed to be non-null)
 *   const response = await documentService.getDocuments(carpetaId);
 * }
 */
export const useCarpetaId = (): string => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    throw new Error(
      'useCarpetaId: User is not authenticated. ' +
      'This hook must be used within authenticated routes only.'
    );
  }

  if (!user.carpetaId) {
    throw new Error(
      'useCarpetaId: No carpetaId found in user object. ' +
      'The login response must include carpetaId in the user object. ' +
      'Please verify the authentication service is returning the complete user data.'
    );
  }

  return user.carpetaId;
};


