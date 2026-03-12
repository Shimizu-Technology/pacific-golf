import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useOrganization } from '../components/OrganizationProvider';
import { useAuthToken } from '../hooks/useAuthToken';
import { AlertCircle, Calendar, ChevronRight, DollarSign, Loader2, Plus, Settings, Trophy, Users } from 'lucide-react';
import { OrgAdminLayout } from '../components/OrgAdminLayout';

interface TournamentSummary {
  id: string;
  name: string;
  slug: string;
  date: string;
  status: 'draft' | 'open' | 'closed' | 'completed';
  registration_count: number;
  capacity: number | null;
  revenue: number;
}

interface OrgStats {
  total_tournaments: number;
  active_tournaments: number;
  total_registrations: number;
  total_revenue: number;
}

export const OrgAdminDashboard: React.FC = () => {
  const { organization, isLoading: orgLoading } = useOrganization();
  const { getToken } = useAuthToken();
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState<TournamentSummary[]>([]);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        // Get Clerk token
        const token = await getToken();
        if (!token) {
          throw new Error('Not authenticated');
        }
        
        // Fetch tournaments for this organization
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/tournaments`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch tournaments');
        }

        const data = await response.json();
        setTournaments(data.tournaments || []);
        setStats(data.stats || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [organization, getToken]);

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Error</h2>
          <p className="text-stone-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <p className="text-stone-600">Organization not found</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-green-100 text-green-700',
      closed: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-brand-100 text-brand-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.draft}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  return (
    <OrgAdminLayout
      orgName={organization.name}
      orgSlug={organization.slug}
      primaryColor={organization.primary_color}
      title="Admin Dashboard"
      subtitle="Organization operations and tournament control"
      tournaments={tournaments.map((t) => ({ slug: t.slug, name: t.name }))}
      rightActions={
        <Link
          to={`/${organization.slug}/admin/settings`}
          className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
      }
    >
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <StatCard
            label="Total Tournaments"
            value={stats.total_tournaments}
            icon={<Trophy className="h-5 w-5 text-cyan-700" />}
            iconWrap="bg-cyan-100"
          />
          <StatCard
            label="Active Now"
            value={stats.active_tournaments}
            icon={<Calendar className="h-5 w-5 text-emerald-700" />}
            iconWrap="bg-emerald-100"
          />
          <StatCard
            label="Total Registrations"
            value={stats.total_registrations}
            icon={<Users className="h-5 w-5 text-violet-700" />}
            iconWrap="bg-violet-100"
          />
          <StatCard
            label="Total Revenue"
            value={formatCurrency(stats.total_revenue)}
            icon={<DollarSign className="h-5 w-5 text-amber-700" />}
            iconWrap="bg-amber-100"
          />
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
        <div className="flex items-center justify-between border-b border-stone-200 bg-stone-50/80 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-900">Tournaments</h2>
          <button
            onClick={() => navigate(`/${organization.slug}/admin/tournaments/new`)}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            New Tournament
          </button>
        </div>

        {tournaments.length === 0 ? (
          <div className="p-12 text-center">
            <Trophy className="mx-auto mb-4 h-12 w-12 text-stone-300" />
            <h3 className="mb-2 text-lg font-medium text-stone-900">No tournaments yet</h3>
            <p className="mb-6 text-stone-500">Create your first tournament to get started.</p>
            <button
              onClick={() => navigate(`/${organization.slug}/admin/tournaments/new`)}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Create Tournament
            </button>
          </div>
        ) : (
          <div className="divide-y divide-stone-200">
            {tournaments.map((tournament) => (
              <Link
                key={tournament.id}
                to={`/${organization.slug}/admin/tournaments/${tournament.slug}`}
                className="flex flex-wrap items-center justify-between gap-4 p-6 transition-colors hover:bg-stone-50"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-stone-900">{tournament.name}</h3>
                  <p className="mt-1 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {formatDate(tournament.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {tournament.registration_count}
                      {tournament.capacity && ` / ${tournament.capacity}`}
                    </span>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {getStatusBadge(tournament.status)}
                  <span className="font-medium text-stone-900">{formatCurrency(tournament.revenue)}</span>
                  <ChevronRight className="h-5 w-5 text-stone-400" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </OrgAdminLayout>
  );
};

function StatCard({
  label,
  value,
  icon,
  iconWrap,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  iconWrap: string;
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-soft">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg p-2.5 ${iconWrap}`}>{icon}</div>
        <div>
          <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-stone-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
