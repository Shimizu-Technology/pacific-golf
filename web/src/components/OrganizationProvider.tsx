import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrganizationStore } from '../stores/organizationStore';
import { api } from '../services/api';

interface OrganizationProviderProps {
  children: React.ReactNode;
  fallbackPath?: string;
}

/**
 * OrganizationProvider fetches and provides organization context based on URL slug.
 * Wraps routes that need organization context.
 */
export function OrganizationProvider({ 
  children, 
  fallbackPath = '/admin/login' 
}: OrganizationProviderProps) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  const navigate = useNavigate();
  const { organization, setOrganization, setLoading, setError, isLoading, error } = useOrganizationStore();

  useEffect(() => {
    async function fetchOrganization() {
      if (!orgSlug) {
        setError('Organization not specified');
        return;
      }

      // Skip fetch if we already have this org
      if (organization?.slug === orgSlug) {
        return;
      }

      setLoading(true);
      try {
        const response = await api.get(`/organizations/${orgSlug}`);
        setOrganization(response.data);
      } catch (err: any) {
        console.error('Failed to fetch organization:', err);
        if (err.response?.status === 404) {
          setError('Organization not found');
          navigate(fallbackPath, { replace: true });
        } else {
          setError(err.message || 'Failed to load organization');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchOrganization();
  }, [orgSlug, organization?.slug, navigate, fallbackPath, setOrganization, setLoading, setError]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error && !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Organization Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * Hook to get current organization from context
 */
export function useOrganization() {
  const { organization, isLoading, error } = useOrganizationStore();
  return { organization, isLoading, error };
}
