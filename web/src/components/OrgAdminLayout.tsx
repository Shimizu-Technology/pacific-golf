import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Building2, Calendar, ClipboardCheck, LayoutDashboard, Settings } from 'lucide-react';
import { adjustColor } from '../utils/colors';

interface OrgAdminTournamentNavItem {
  slug: string;
  name: string;
}

interface OrgAdminLayoutProps {
  orgName: string;
  orgSlug: string;
  primaryColor?: string;
  title: string;
  subtitle?: string;
  tournaments?: OrgAdminTournamentNavItem[];
  currentTournamentSlug?: string;
  rightActions?: React.ReactNode;
  children: React.ReactNode;
}

export const OrgAdminLayout: React.FC<OrgAdminLayoutProps> = ({
  orgName,
  orgSlug,
  primaryColor = '#1e40af',
  title,
  subtitle,
  tournaments = [],
  currentTournamentSlug,
  rightActions,
  children,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const primaryDark = adjustColor(primaryColor, -0.18);

  const selectedTournamentSlug = currentTournamentSlug || tournaments[0]?.slug;

  const menu = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      path: `/${orgSlug}/admin`,
      enabled: true,
    },
    {
      id: 'tournament',
      label: 'Tournament',
      icon: Calendar,
      path: selectedTournamentSlug ? `/${orgSlug}/admin/tournaments/${selectedTournamentSlug}` : '',
      enabled: Boolean(selectedTournamentSlug),
    },
    {
      id: 'checkin',
      label: 'Check-In',
      icon: ClipboardCheck,
      path: selectedTournamentSlug ? `/${orgSlug}/admin/tournaments/${selectedTournamentSlug}/checkin` : '',
      enabled: Boolean(selectedTournamentSlug),
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      path: `/${orgSlug}/admin/settings`,
      enabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50">
      <header
        className="border-b border-stone-800 text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryDark} 0%, ${primaryColor} 40%, ${adjustColor(primaryColor, 0.08)} 100%)`,
        }}
      >
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-white/10 p-2.5 ring-1 ring-white/20">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-white/70">{orgName}</p>
                <h1 className="text-2xl font-display font-bold tracking-tight">{title}</h1>
                {subtitle && <p className="text-sm text-white/80">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {tournaments.length > 0 && (
                <select
                  value={selectedTournamentSlug}
                  onChange={(e) => navigate(`/${orgSlug}/admin/tournaments/${e.target.value}`)}
                  className="min-w-[220px] rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-sm text-white outline-none backdrop-blur"
                >
                  {tournaments.map((tournament) => (
                    <option key={tournament.slug} value={tournament.slug} className="text-stone-900">
                      {tournament.name}
                    </option>
                  ))}
                </select>
              )}
              {rightActions}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:px-8">
        <aside className="rounded-2xl border border-stone-200 bg-white p-3 shadow-soft">
          <nav className="space-y-1">
            {menu.map((item) => {
              const Icon = item.icon;
              const isActive = item.enabled && (location.pathname === item.path || location.pathname.startsWith(`${item.path}/`));
              if (!item.enabled) {
                return (
                  <div
                    key={item.id}
                    className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm text-stone-400"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-brand-800 text-white'
                      : 'text-stone-600 hover:bg-brand-50 hover:text-brand-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
};

