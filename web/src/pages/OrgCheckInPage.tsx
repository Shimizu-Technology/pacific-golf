import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useOrganization } from '../components/OrganizationProvider';
import { 
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  AlertCircle,
  Loader2,
  CheckCircle,
  XCircle,
  DollarSign,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Golfer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string | null;
  registration_status: 'confirmed' | 'waitlist' | 'cancelled';
  payment_status: 'paid' | 'unpaid' | 'refunded';
  payment_method: string | null;
  checked_in_at: string | null;
}

interface Stats {
  total: number;
  checked_in: number;
  paid: number;
  unpaid: number;
}

export const OrgCheckInPage: React.FC = () => {
  const { tournamentSlug } = useParams<{ tournamentSlug: string }>();
  const { organization, isLoading: orgLoading } = useOrganization();
  
  const [golfers, setGolfers] = useState<Golfer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'not_checked_in' | 'checked_in'>('not_checked_in');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus search on load
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [loading]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = async () => {
    if (!organization || !tournamentSlug) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/admin/organizations/${organization.slug}/tournaments/${tournamentSlug}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();
      const confirmedGolfers = (data.golfers || []).filter(
        (g: Golfer) => g.registration_status === 'confirmed'
      );
      setGolfers(confirmedGolfers);
      
      setStats({
        total: confirmedGolfers.length,
        checked_in: confirmedGolfers.filter((g: Golfer) => g.checked_in_at).length,
        paid: confirmedGolfers.filter((g: Golfer) => g.payment_status === 'paid').length,
        unpaid: confirmedGolfers.filter((g: Golfer) => g.payment_status === 'unpaid').length,
      });
      
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [organization, tournamentSlug]);

  // Filtered golfers
  const filteredGolfers = useMemo(() => {
    let filtered = [...golfers];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        g => g.name.toLowerCase().includes(term) ||
             g.email.toLowerCase().includes(term) ||
             g.phone.includes(term)
      );
    }

    // Status filter
    if (filter === 'checked_in') {
      filtered = filtered.filter(g => g.checked_in_at);
    } else if (filter === 'not_checked_in') {
      filtered = filtered.filter(g => !g.checked_in_at);
    }

    // Sort: not checked in first, then by name
    filtered.sort((a, b) => {
      if (a.checked_in_at && !b.checked_in_at) return 1;
      if (!a.checked_in_at && b.checked_in_at) return -1;
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }, [golfers, searchTerm, filter]);

  const handleCheckIn = async (golfer: Golfer) => {
    if (processingId) return;
    
    setProcessingId(golfer.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/golfers/${golfer.id}/check_in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to check in');

      // Update local state immediately
      setGolfers(prev => prev.map(g => 
        g.id === golfer.id 
          ? { ...g, checked_in_at: new Date().toISOString() }
          : g
      ));
      
      setStats(prev => prev ? {
        ...prev,
        checked_in: prev.checked_in + 1,
      } : null);

      toast.success(`✓ ${golfer.name} checked in!`, { duration: 2000 });
      
      // Clear search to show next person
      if (searchTerm) {
        setSearchTerm('');
        searchInputRef.current?.focus();
      }
    } catch (err) {
      toast.error('Failed to check in. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleUndoCheckIn = async (golfer: Golfer) => {
    if (processingId) return;
    
    setProcessingId(golfer.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/golfers/${golfer.id}/undo_check_in`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to undo check-in');

      // Update local state immediately
      setGolfers(prev => prev.map(g => 
        g.id === golfer.id 
          ? { ...g, checked_in_at: null }
          : g
      ));
      
      setStats(prev => prev ? {
        ...prev,
        checked_in: Math.max(0, prev.checked_in - 1),
      } : null);

      toast.success(`${golfer.name} check-in undone`);
    } catch (err) {
      toast.error('Failed to undo check-in');
    } finally {
      setProcessingId(null);
    }
  };

  // Keyboard shortcut: Enter to check in first result
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && filteredGolfers.length === 1 && !filteredGolfers[0].checked_in_at) {
        handleCheckIn(filteredGolfers[0]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredGolfers]);

  if (orgLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-white" />
      </div>
    );
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p>{error || 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to={`/${organization.slug}/admin/tournaments/${tournamentSlug}`}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="font-bold text-lg">Check-In</h1>
              <p className="text-sm text-gray-400">{organization.name}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {isOnline ? (
              <Wifi className="w-5 h-5 text-green-500" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-500" />
            )}
            <button
              onClick={fetchData}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      {stats && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-green-500" />
                <span className="text-2xl font-bold">{stats.checked_in}</span>
                <span className="text-gray-400">/ {stats.total}</span>
              </div>
              
              <div className="h-8 w-px bg-gray-700" />
              
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  {stats.paid} paid
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="w-4 h-4 text-red-500" />
                  {stats.unpaid} unpaid
                </span>
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Updated {lastRefresh.toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="px-4 py-4 bg-gray-800/50">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search by name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            )}
          </div>
          
          {/* Filter tabs */}
          <div className="flex gap-2 mt-3">
            {[
              { key: 'not_checked_in', label: 'Not Checked In' },
              { key: 'checked_in', label: 'Checked In' },
              { key: 'all', label: 'All' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key as typeof filter)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      <main className="px-4 py-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {filteredGolfers.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {searchTerm ? 'No golfers match your search' : 'No golfers to show'}
            </div>
          ) : (
            filteredGolfers.map((golfer) => (
              <div
                key={golfer.id}
                className={`flex items-center justify-between p-4 rounded-xl transition ${
                  golfer.checked_in_at
                    ? 'bg-green-900/30 border border-green-800'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    golfer.checked_in_at ? 'bg-green-600' : 'bg-gray-700'
                  }`}>
                    {golfer.checked_in_at ? (
                      <UserCheck className="w-6 h-6" />
                    ) : (
                      <UserX className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg">{golfer.name}</span>
                      {golfer.payment_status === 'unpaid' && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs rounded-full flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          UNPAID
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{golfer.phone}</p>
                  </div>
                </div>

                <div>
                  {golfer.checked_in_at ? (
                    <button
                      onClick={() => handleUndoCheckIn(golfer)}
                      disabled={processingId === golfer.id}
                      className="px-4 py-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 disabled:opacity-50"
                    >
                      {processingId === golfer.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Undo'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleCheckIn(golfer)}
                      disabled={processingId === golfer.id}
                      className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 font-semibold text-lg"
                    >
                      {processingId === golfer.id ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        'Check In'
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {/* Keyboard hint */}
          {filteredGolfers.length === 1 && !filteredGolfers[0].checked_in_at && (
            <p className="text-center text-sm text-gray-500 mt-4">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded">Enter</kbd> to check in
            </p>
          )}
        </div>
      </main>
    </div>
  );
};
