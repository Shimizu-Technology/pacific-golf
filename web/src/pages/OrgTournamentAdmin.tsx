import React, { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuthToken } from '../hooks/useAuthToken';
import { useOrganization } from '../components/OrganizationProvider';
import { OrgAdminLayout } from '../components/OrgAdminLayout';
import { 
  Users, 
  DollarSign, 
  ArrowLeft,
  Search,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  Building2,
  UserCheck,
  UserPlus,
  CreditCard,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import toast from 'react-hot-toast';
import { AddGolferModal } from '../components/AddGolferModal';
import { EditGolferModal } from '../components/EditGolferModal';

interface Golfer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  registration_status: 'confirmed' | 'waitlist' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'refunded';
  payment_method: string | null;
  payment_type: string | null;
  notes: string | null;
  checked_in_at: string | null;
  created_at: string;
}

interface Tournament {
  id: string;
  name: string;
  slug: string;
  event_date: string;
  status: string;
  entry_fee: number;
  max_golfers: number | null;
}

interface TournamentNavOption {
  slug: string;
  name: string;
}

interface Stats {
  total_registrations: number;
  confirmed: number;
  waitlisted: number;
  cancelled: number;
  paid: number;
  unpaid: number;
  checked_in: number;
  revenue: number;
}

export const OrgTournamentAdmin: React.FC = () => {
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();
  const { organization, isLoading: orgLoading } = useOrganization();
  const { getToken } = useAuthToken();
  
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tournamentOptions, setTournamentOptions] = useState<TournamentNavOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [checkinFilter, setCheckinFilter] = useState('all');
  
  // Sorting
  const [sortColumn, setSortColumn] = useState<'name' | 'created_at'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Selected golfer for detail view
  const [selectedGolfer, setSelectedGolfer] = useState<Golfer | null>(null);
  
  // Add golfer modal
  const [showAddGolferModal, setShowAddGolferModal] = useState(false);
  
  // Edit golfer modal
  const [editingGolfer, setEditingGolfer] = useState<Golfer | null>(null);
  
  // Action loading states
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchData = async () => {
    if (!organization || !tournamentSlug) return;

    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        throw new Error('Not authenticated');
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/tournaments/${tournamentSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch tournament data');
      }

      const data = await response.json();
      setTournament(data.tournament);
      setGolfers(data.golfers || []);
      setStats(data.stats || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchTournamentOptions();
  }, [organization, tournamentSlug, getToken]);

  const fetchTournamentOptions = async () => {
    if (!organization) return;

    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/tournaments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;
      const data = await response.json();
      const options: TournamentNavOption[] = (data.tournaments || []).map((t: { slug: string; name: string }) => ({
        slug: t.slug,
        name: t.name,
      }));
      setTournamentOptions(options);
    } catch {
      // Non-fatal for this page; keep current tournament view available.
    }
  };

  // Filtered and sorted golfers
  const filteredGolfers = useMemo(() => {
    let filtered = [...golfers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        g => g.name.toLowerCase().includes(term) ||
             g.email.toLowerCase().includes(term) ||
             g.phone.includes(term) ||
             (g.company && g.company.toLowerCase().includes(term))
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(g => g.registration_status === statusFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(g => g.payment_status === paymentFilter);
    }

    // Check-in filter
    if (checkinFilter === 'checked_in') {
      filtered = filtered.filter(g => g.checked_in_at);
    } else if (checkinFilter === 'not_checked_in') {
      filtered = filtered.filter(g => !g.checked_in_at);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortColumn === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [golfers, searchTerm, statusFilter, paymentFilter, checkinFilter, sortColumn, sortDirection]);

  const handleSort = (column: 'name' | 'created_at') => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCheckIn = async (golfer: Golfer) => {
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/golfers/${golfer.id}/check_in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to check in golfer');

      toast.success(`${golfer.name} checked in!`);
      fetchData(); // Refresh data
    } catch (err) {
      toast.error('Failed to check in golfer');
    }
  };

  const handleCancelRegistration = async (golfer: Golfer) => {
    if (!confirm(`Cancel registration for ${golfer.name}? This cannot be undone.`)) {
      return;
    }

    setActionLoading(`cancel-${golfer.id}`);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization?.slug}/tournaments/${tournamentSlug}/golfers/${golfer.id}/cancel`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel registration');
      }

      toast.success(`${golfer.name}'s registration cancelled`);
      setSelectedGolfer(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel registration');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (golfer: Golfer) => {
    if (!confirm(`Refund ${golfer.name}? This will mark the payment as refunded and cancel the registration.`)) {
      return;
    }

    setActionLoading(`refund-${golfer.id}`);
    try {
      const token = await getToken();
      if (!token) throw new Error('Not authenticated');
      
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization?.slug}/tournaments/${tournamentSlug}/golfers/${golfer.id}/refund`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to process refund');
      }

      toast.success(`Refund recorded for ${golfer.name}`);
      setSelectedGolfer(null);
      fetchData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process refund');
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Company', 'Status', 'Payment', 'Checked In', 'Registered'];
    const rows = filteredGolfers.map(g => [
      g.name,
      g.email,
      g.phone,
      g.company || '',
      g.registration_status,
      g.payment_status,
      g.checked_in_at ? 'Yes' : 'No',
      new Date(g.created_at).toLocaleDateString(),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tournamentSlug}-registrations.csv`;
    a.click();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: 'Pacific/Guam',
    });
  };

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      confirmed: 'bg-green-100 text-green-700',
      waitlist: 'bg-yellow-100 text-yellow-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      paid: 'bg-green-100 text-green-700',
      unpaid: 'bg-red-100 text-red-700',
      refunded: 'bg-gray-100 text-gray-700',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !organization || !tournament) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-stone-900 mb-2">Error</h2>
          <p className="text-stone-600">{error || 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <OrgAdminLayout
      orgName={organization.name}
      orgSlug={organization.slug}
      primaryColor={organization.primary_color}
      title={tournament.name}
      subtitle="Tournament management"
      tournaments={tournamentOptions}
      currentTournamentSlug={tournamentSlug}
      rightActions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddGolferModal(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <UserPlus className="h-4 w-4" />
            Add Golfer
          </button>
          <Link
            to={`/${organization.slug}/admin/tournaments/${tournamentSlug}/checkin`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
          >
            <UserCheck className="h-4 w-4" />
            Check-In Mode
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Users className="h-7 w-7 text-emerald-700" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Registered</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.confirmed}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <CreditCard className="h-7 w-7 text-cyan-700" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Paid</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.paid}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <UserCheck className="h-7 w-7 text-violet-700" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Checked In</p>
                  <p className="text-2xl font-bold text-stone-900">{stats.checked_in}</p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <DollarSign className="h-7 w-7 text-amber-700" />
                <div>
                  <p className="text-xs uppercase tracking-wide text-stone-500">Revenue</p>
                  <p className="text-2xl font-bold text-stone-900">{formatCurrency(stats.revenue)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters & Actions */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
          <div className="border-b border-stone-200 p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-xl border border-stone-300 bg-white py-2 pl-10 pr-4 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Status</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="waitlist">Waitlist</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Payment</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>

                <select
                  value={checkinFilter}
                  onChange={(e) => setCheckinFilter(e.target.value)}
                  className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="all">All Check-in</option>
                  <option value="checked_in">Checked In</option>
                  <option value="not_checked_in">Not Checked In</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={fetchData}
                  className="rounded-lg p-2 text-stone-600 transition-colors hover:bg-stone-100"
                  title="Refresh"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
                <button
                  onClick={exportCSV}
                  className="flex items-center gap-2 rounded-lg bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>
          </div>

          {/* Results count */}
          <div className="bg-stone-50 px-4 py-2 text-sm text-stone-600">
            Showing {filteredGolfers.length} of {golfers.length} registrations
          </div>
        </div>

        {/* Golfers Table */}
        <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-stone-200 bg-stone-50">
                <tr>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-stone-600 hover:bg-stone-100"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Name
                      {sortColumn === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Contact</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Payment</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Check-in</th>
                  <th 
                    className="cursor-pointer px-4 py-3 text-left text-sm font-medium text-stone-600 hover:bg-stone-100"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center gap-1">
                      Registered
                      {sortColumn === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {filteredGolfers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-stone-500">
                      {golfers.length === 0 ? 'No registrations yet' : 'No results match your filters'}
                    </td>
                  </tr>
                ) : (
                  filteredGolfers.map((golfer) => (
                    <tr 
                      key={golfer.id} 
                      className="cursor-pointer hover:bg-stone-50"
                      onClick={() => setSelectedGolfer(golfer)}
                    >
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-stone-900">{golfer.name}</p>
                          {golfer.company && (
                            <p className="text-sm text-stone-500">{golfer.company}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-stone-900">{golfer.email}</p>
                          <p className="text-stone-500">{golfer.phone}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(golfer.registration_status)}
                      </td>
                      <td className="px-4 py-3">
                        {getPaymentBadge(golfer.payment_status)}
                      </td>
                      <td className="px-4 py-3">
                        {golfer.checked_in_at ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-stone-300" />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-stone-500">
                        {formatDate(golfer.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {!golfer.checked_in_at && golfer.registration_status === 'confirmed' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCheckIn(golfer);
                            }}
                            className="rounded bg-emerald-600 px-3 py-1 text-sm text-white transition-colors hover:bg-emerald-700"
                          >
                            Check In
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Golfer Detail Modal */}
        {selectedGolfer && (
          <div 
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedGolfer(null)}
          >
            <div 
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="border-b border-stone-200 p-6">
                <h3 className="text-xl font-semibold text-stone-900">{selectedGolfer.name}</h3>
                <div className="flex gap-2 mt-2">
                  {getStatusBadge(selectedGolfer.registration_status)}
                  {getPaymentBadge(selectedGolfer.payment_status)}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-stone-400" />
                  <span>{selectedGolfer.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-stone-400" />
                  <span>{selectedGolfer.phone}</span>
                </div>
                {selectedGolfer.company && (
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-stone-400" />
                    <span>{selectedGolfer.company}</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-stone-400" />
                  <span>Registered: {formatDate(selectedGolfer.created_at)}</span>
                </div>
                {selectedGolfer.checked_in_at && (
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-green-500" />
                    <span>Checked in: {formatDate(selectedGolfer.checked_in_at)}</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-stone-200 p-6">
                {/* Primary Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedGolfer(null)}
                    className="flex-1 rounded-lg px-4 py-2 text-stone-600 transition-colors hover:bg-stone-100"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setEditingGolfer(selectedGolfer);
                      setSelectedGolfer(null);
                    }}
                    className="flex-1 rounded-lg bg-stone-900 px-4 py-2 text-white transition-colors hover:bg-stone-800"
                  >
                    Edit
                  </button>
                  {!selectedGolfer.checked_in_at && selectedGolfer.registration_status === 'confirmed' && (
                    <button
                      onClick={() => {
                        handleCheckIn(selectedGolfer);
                        setSelectedGolfer(null);
                      }}
                      className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-white transition-colors hover:bg-emerald-700"
                    >
                      Check In
                    </button>
                  )}
                </div>

                {/* Danger Actions */}
                {selectedGolfer.registration_status !== 'cancelled' && (
                  <div className="flex gap-3 border-t border-stone-200 pt-3">
                    {selectedGolfer.payment_status === 'paid' && (
                      <button
                        onClick={() => handleRefund(selectedGolfer)}
                        disabled={actionLoading === `refund-${selectedGolfer.id}`}
                        className="flex-1 rounded-lg bg-amber-600 px-4 py-2 text-white transition-colors hover:bg-amber-700 disabled:opacity-50"
                      >
                        {actionLoading === `refund-${selectedGolfer.id}` ? 'Processing...' : 'Refund'}
                      </button>
                    )}
                    <button
                      onClick={() => handleCancelRegistration(selectedGolfer)}
                      disabled={actionLoading === `cancel-${selectedGolfer.id}`}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700 disabled:opacity-50"
                    >
                      {actionLoading === `cancel-${selectedGolfer.id}` ? 'Cancelling...' : 'Cancel Registration'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </OrgAdminLayout>

      {/* Add Golfer Modal */}
      {tournament && (
        <AddGolferModal
          isOpen={showAddGolferModal}
          onClose={() => setShowAddGolferModal(false)}
          onSuccess={fetchData}
          tournamentId={tournament.id}
          tournamentSlug={tournamentSlug || ''}
          orgSlug={organization?.slug || ''}
          entryFee={tournament.entry_fee || 0}
        />
      )}

      {/* Edit Golfer Modal */}
      {tournament && (
        <EditGolferModal
          isOpen={editingGolfer !== null}
          onClose={() => setEditingGolfer(null)}
          onSuccess={fetchData}
          golfer={editingGolfer}
          tournamentSlug={tournamentSlug || ''}
          orgSlug={organization?.slug || ''}
          entryFee={tournament.entry_fee || 0}
        />
      )}
    
    </>
  );
};
