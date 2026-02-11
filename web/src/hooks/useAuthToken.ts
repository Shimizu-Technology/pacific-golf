import { useAuth } from '@clerk/clerk-react';
import { useGolferAuth } from '../contexts/GolferAuthContext';
import { useCallback } from 'react';

/**
 * Hook that provides an auth token from either:
 * 1. Clerk (for admin users)
 * 2. Golfer session (for golfers accessing their scorecard)
 * 
 * Usage:
 * const { getToken, isAuthenticated, authType } = useAuthToken();
 * const token = await getToken();
 */
export function useAuthToken() {
  const { getToken: getClerkToken, isSignedIn: isClerkSignedIn } = useAuth();
  const { isAuthenticated: isGolferAuthenticated, token: golferToken } = useGolferAuth();

  // Determine auth type and status
  const authType = isClerkSignedIn ? 'clerk' : isGolferAuthenticated ? 'golfer' : null;
  const isAuthenticated = isClerkSignedIn || isGolferAuthenticated;

  // Get token from available auth source
  const getToken = useCallback(async (): Promise<string | null> => {
    // Prefer Clerk auth if available (admin)
    if (isClerkSignedIn) {
      try {
        const token = await getClerkToken();
        return token;
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
        return null;
      }
    }

    // Fall back to golfer auth
    if (isGolferAuthenticated && golferToken) {
      return golferToken;
    }

    return null;
  }, [isClerkSignedIn, getClerkToken, isGolferAuthenticated, golferToken]);

  return {
    getToken,
    isAuthenticated,
    authType,
    isClerkAuth: isClerkSignedIn,
    isGolferAuth: isGolferAuthenticated && !isClerkSignedIn,
  };
}

export default useAuthToken;
