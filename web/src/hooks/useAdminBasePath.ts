import { useParams } from 'react-router-dom';

export function useAdminBasePath() {
  const { orgSlug } = useParams<{ orgSlug?: string }>();
  const basePath = orgSlug ? `/${orgSlug}/admin` : '/admin';

  const adminPath = (suffix: string) => {
    const cleaned = suffix.startsWith('/') ? suffix.slice(1) : suffix;
    return `${basePath}/${cleaned}`;
  };

  return {
    orgSlug,
    isOrgScopedAdmin: Boolean(orgSlug),
    basePath,
    adminPath,
  };
}

