import { api } from '../services/api';
import { getAdminAuthToken } from './clerkToken';

const DEFAULT_DASHBOARD_PATH = '/admin/dashboard';

type TokenGetter = (options?: { template?: string }) => Promise<string | null>;

export async function resolveBestDashboardPath(
  getToken: TokenGetter,
  explicitPath?: string
): Promise<string> {
  if (explicitPath) return explicitPath;

  try {
    const token = await getAdminAuthToken(getToken);
    if (!token) return DEFAULT_DASHBOARD_PATH;

    // Super admins should always land on the platform dashboard first.
    const currentAdmin = await api.getCurrentAdminWithToken(token);
    if (currentAdmin?.is_super_admin) {
      return '/super-admin';
    }

    const organizations = await api.getMyOrganizationsWithToken(token);

    if (Array.isArray(organizations) && organizations.length === 1 && organizations[0]?.slug) {
      return `/${organizations[0].slug}/admin`;
    }

    if (Array.isArray(organizations) && organizations.length > 1) {
      return '/super-admin';
    }

    return DEFAULT_DASHBOARD_PATH;
  } catch {
    return DEFAULT_DASHBOARD_PATH;
  }
}
