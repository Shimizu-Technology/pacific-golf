import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useCurrentUser } from '../hooks/useCurrentUser';
import {
  Building2,
  Plus,
  Users,
  Trophy,
  Calendar,
  ChevronRight,
  Loader2,
  AlertCircle,
  Shield,
  ExternalLink,
} from 'lucide-react';

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
  const { getToken } = useAuth();
  const { user, loading: userLoading, isSuperAdmin } = useCurrentUser();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect non-super admins
    if (!userLoading && !isSuperAdmin) {
      navigate('/');
    }
  }, [userLoading, isSuperAdmin, navigate]);

  useEffect(() => {
    async function fetchOrganizations() {
      if (!isSuperAdmin) return;
      
      try {
        const token = await getToken();
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

        const data = await response.json();
        setOrganizations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    }

    if (isSuperAdmin) {
      fetchOrganizations();
    }
  }, [isSuperAdmin, getToken]);

  if (userLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // Will redirect
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-green-600 hover:text-green-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  const totalTournaments = organizations.reduce((sum, org) => sum + org.tournament_count, 0);
  const totalAdmins = organizations.reduce((sum, org) => sum + org.admin_count, 0);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/10 rounded-xl">
                <Shield className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Super Admin Dashboard</h1>
                <p className="text-slate-300 text-sm">
                  Manage all organizations and tournaments
                </p>
              </div>
            </div>
            <Link
              to="/super-admin/organizations/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-xl font-semibold transition-colors shadow-lg shadow-green-600/25"
            >
              <Plus className="w-5 h-5" />
              New Organization
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Organizations</p>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl">
                <Trophy className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Tournaments</p>
                <p className="text-2xl font-bold text-gray-900">{totalTournaments}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-xl">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Admins</p>
                <p className="text-2xl font-bold text-gray-900">{totalAdmins}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Organizations List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Organizations</h2>
          </div>

          {organizations.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
              <p className="text-gray-500 mb-6">Get started by creating your first organization.</p>
              <Link
                to="/super-admin/organizations/new"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Organization
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {org.logo_url ? (
                        <img
                          src={org.logo_url}
                          alt={org.name}
                          className="w-12 h-12 rounded-xl object-contain bg-gray-100"
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
                        <h3 className="font-semibold text-gray-900">{org.name}</h3>
                        <p className="text-sm text-gray-500">/{org.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{org.tournament_count}</p>
                        <p className="text-xs text-gray-500">Tournaments</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{org.admin_count}</p>
                        <p className="text-xs text-gray-500">Admins</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/${org.slug}/admin`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Go to org admin"
                        >
                          <ExternalLink className="w-5 h-5" />
                        </Link>
                        <Link
                          to={`/super-admin/organizations/${org.id}`}
                          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit organization"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {org.description && (
                    <p className="mt-3 text-sm text-gray-600 ml-16">{org.description}</p>
                  )}

                  <div className="mt-3 ml-16 flex items-center gap-4 text-sm text-gray-500">
                    {org.contact_email && (
                      <span>{org.contact_email}</span>
                    )}
                    {org.website_url && (
                      <a
                        href={org.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-green-600 hover:text-green-700"
                      >
                        Website ↗
                      </a>
                    )}
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        org.subscription_status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {org.subscription_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link
            to="/super-admin/organizations/new"
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Create New Organization</h3>
                <p className="text-sm text-gray-500">Set up a new golf organization</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 ml-auto" />
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
