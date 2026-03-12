import { Organization, Tournament } from '../services/api';

export type ThemePreset = 'classic' | 'premium' | 'minimal' | 'event';

export interface ResolvedTournamentBranding {
  themePreset: ThemePreset;
  primaryColor: string;
  accentColor: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  signatureImageUrl: string | null;
}

const DEFAULT_PRIMARY_COLOR = '#047857';

function normalizePreset(value: string | undefined | null): ThemePreset {
  if (value === 'premium' || value === 'minimal' || value === 'event') return value;
  return 'classic';
}

export function resolveTournamentBranding(
  organization: Organization | null | undefined,
  tournament: Tournament | null | undefined
): ResolvedTournamentBranding {
  const useOrgBranding = tournament?.use_org_branding ?? true;
  const primaryFromOrg = organization?.primary_color || DEFAULT_PRIMARY_COLOR;

  const primaryColor = useOrgBranding
    ? primaryFromOrg
    : tournament?.primary_color_override || primaryFromOrg;

  const logoUrl = useOrgBranding
    ? organization?.logo_url || null
    : tournament?.logo_url_override || organization?.logo_url || null;

  const bannerUrl = useOrgBranding
    ? organization?.banner_url || null
    : tournament?.banner_url_override || organization?.banner_url || null;

  return {
    themePreset: normalizePreset(tournament?.theme_preset),
    primaryColor,
    accentColor: useOrgBranding ? null : tournament?.accent_color_override || null,
    logoUrl,
    bannerUrl,
    signatureImageUrl: useOrgBranding ? null : tournament?.signature_image_url_override || null,
  };
}
