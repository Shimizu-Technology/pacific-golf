import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, MotionConfig } from 'framer-motion';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useAuthToken } from '../hooks/useAuthToken';
import {
  Building2,
  Plus,
  Users,
  Trophy,
  ChevronRight,
  Loader2,
  AlertCircle,
  Shield,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { api, type AccessRequestRecord } from '../services/api';

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const ease = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease } },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  primary_color: string;
  contact_email: string | null;
  contact_phone: string | null;
  website_url: string | null;
  subscription_status: string;
  tournament_count: number;
  admin_count: number;
  created_at: string;
}

export const SuperAdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { getToken } = useAuthToken();
  const { user, loading: userLoading, isSuperAdmin } = useCurrentUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [accessRequests, setAccessRequests] = useState<AccessRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-super admins
    if (!userLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [userLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    async function fetchDashboardData() {
      if (!isSuperAdmin) return;
      
      try {
        const token = await getToken();
        if (!token) {
          throw new Error('Missing auth token');
        }

        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }

        const [orgData, requestData] = await Promise.all([
          response.json(),
          api.getAccessRequestsWithToken(token),
        ]);
        setOrganizations(orgData);
        setAccessRequests(requestData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    }

    if (isSuperAdmin) {
      fetchDashboardData();
    }
  }, [isSuperAdmin, getToken]);

  const updateRequestStatus = async (id: number, status: AccessRequestRecord['status']) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Missing auth token');

      const updated = await api.updateAccessRequestStatusWithToken(token, id, status);
      setAccessRequests((prev) => prev.map((row) => (row.id === id ? updated : row)));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update request status';
      setError(message);
    }
  };

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Error</h2>
          <p className="text-stone-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-700 hover:text-emerald-800"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalTournaments = organizations.reduce((sum, org) => sum + org.tournament_count, 0);
  const totalAdmins = organizations.reduce((sum, org) => sum + org.admin_count, 0);
  const openRequests = accessRequests.filter((item) => item.status === 'new' || item.status === 'contacted').length;
  const statCards = [
    {
      label: 'Organizations',
      value: organizations.length,
      icon: Building2,
      iconClasses: 'bg-cyan-100 text-cyan-700',
    },
    {
      label: 'Total Tournaments',
      value: totalTournaments,
      icon: Trophy,
      iconClasses: 'bg-emerald-100 text-emerald-700',
    },
    {
      label: 'Total Admins',
      value: totalAdmins,
      icon: Users,
      iconClasses: 'bg-violet-100 text-violet-700',
    },
    {
      label: 'Open Access Requests',
      value: openRequests,
      icon: Mail,
      iconClasses: 'bg-amber-100 text-amber-700',
    },
  ];

  return (
    <MotionConfig reducedMotion="user">
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, ease }}
        className="border-b border-stone-800 bg-gradient-to-r from-stone-900 via-slate-900 to-stone-800 text-white"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-2xl ring-1 ring-white/20">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-display font-bold tracking-tight">Super Admin Dashboard</h1>
                <p className="text-slate-300 text-sm">
                  Manage all organizations and tournaments
                </p>
              </div>
            </div>
            <Link
              to="/super-admin/organizations/new"
              className="flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white shadow-brand transition-colors hover:bg-emerald-700"
            >
              <Plus className="w-5 h-5" />
              New Organization
            </Link>
          </div>
        </div>
      </motion.header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 rounded-2xl border border-stone-200 bg-white px-5 py-4 text-sm text-stone-600 shadow-soft">
          Platform overview for organization setup, access-request triage, and cross-tenant operations.
        </div>
        {/* Stats */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} variants={fadeUp} className="rounded-2xl border border-stone-200 bg-white p-6 shadow-soft">
                <div className="flex min-h-[86px] items-center gap-4">
                  <div className={`rounded-xl p-3 ${card.iconClasses}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col justify-center">
                    <p className="text-sm text-stone-500">{card.label}</p>
                    <p className="text-2xl font-bold leading-tight text-stone-900">{card.value}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Organizations List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25, ease }}
          className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft"
        >
          <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Organizations</h2>
          </div>

          {organizations.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-stone-300" />
              <h3 className="mb-2 text-lg font-medium text-stone-900">No organizations yet</h3>
              <p className="mb-6 text-stone-500">Get started by creating your first organization.</p>
              <Link
                to="/super-admin/organizations/new"
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-emerald-700"
              >
                <Plus className="w-5 h-5" />
                Create Organization
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-200">
              {organizations.map((org, index) => (
                <motion.div
                  key={org.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.3 + index * 0.05, ease }}
                  className="p-6 transition-colors hover:bg-stone-50"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex items-start gap-4">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-12 h-12 rounded-xl object-contain bg-stone-100"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-lg font-bold"
                          style={{ backgroundColor: org.primary_color }}
                        >
                          {org.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-stone-900">{org.name}</h3>
                        <p className="text-sm text-stone-500">/{org.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 sm:gap-8">
                      <div className="text-center min-w-[80px]">
                        <p className="text-2xl font-bold text-stone-900">{org.tournament_count}</p>
                        <p className="text-xs text-stone-500">Tournaments</p>
                      </div>
                      <div className="text-center min-w-[80px]">
                        <p className="text-2xl font-bold text-stone-900">{org.admin_count}</p>
                        <p className="text-xs text-stone-500">Admins</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/${org.slug}/admin`}
                          className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                          title="Go to org admin"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/super-admin/organizations/${org.id}`}
                          className="rounded-lg p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
                          title="Edit organization"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="mt-3 ml-16 text-sm text-stone-600">{org.description}</p>
                  )}

                  <div className="mt-3 ml-16 flex flex-wrap items-center gap-3 text-sm text-stone-500">
                    {org.contact_email && (
                      <span>{org.contact_email}</span>
                    )}
                    {org.website_url && (
                      <a
                        href={org.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:text-emerald-800"
                      >
                        Website ↗
                      </a>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.subscription_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {org.subscription_status}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3, ease }}
          className="mt-8 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft"
        >
          <div className="border-b border-stone-200 bg-stone-50/80 px-6 py-4">
            <h2 className="text-lg font-semibold text-stone-900">Access Requests</h2>
          </div>

          {accessRequests.length === 0 ? (
            <p className="px-6 py-8 text-sm text-stone-500">No requests submitted yet.</p>
          ) : (
            <div className="divide-y divide-stone-200">
              {accessRequests.map((request) => (
                <div key={request.id} className="px-6 py-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-900">{request.organization_name}</p>
                      <p className="text-sm text-stone-600">
                        {request.contact_name} • {request.email}
                        {request.phone ? ` • ${request.phone}` : ''}
                      </p>
                      {request.notes && <p className="mt-2 text-sm text-stone-500">{request.notes}</p>}
                      <p className="mt-2 text-xs text-stone-400">
                        Source: {request.source} • Submitted {new Date(request.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={request.status}
                        onChange={(e) =>
                          updateRequestStatus(
                            request.id,
                            e.target.value as AccessRequestRecord['status']
                          )
                        }
                        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm font-medium capitalize text-stone-700"
                      >
                        <option value="new">new</option>
                        <option value="contacted">contacted</option>
                        <option value="qualified">qualified</option>
                        <option value="closed">closed</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <Link
            to="/super-admin/organizations/new"
            className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-emerald-100 p-3 transition-colors group-hover:bg-emerald-200">
                <Building2 className="w-6 h-6 text-emerald-700" />
              </div>
              <div>
                <h3 className="font-semibold text-stone-900">Create New Organization</h3>
                <p className="text-sm text-stone-500">Set up a new golf organization</p>
              </div>
              <ChevronRight className="ml-auto w-5 h-5 text-stone-400" />
            </div>
          </Link>
        </motion.div>
      </main>
    </div>
    </MotionConfig>
  );
};

export default SuperAdminDashboard;
