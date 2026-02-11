import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Trophy, 
  RefreshCw, 
  Users, 
  Clock, 
  ChevronUp,
  ChevronDown,
  Minus,
  ArrowLeft,
  Wifi,
  WifiOff
} from 'lucide-react';

interface LeaderboardEntry {
  position: number;
  golfer_id?: number;
  group_id?: number;
  name?: string;
  team_name?: string;
  group_number?: number;
  total_strokes: number;
  total_relative: number;
  holes_completed: number;
  thru: number;
  display_score: string | null;
  golfers?: { id: number; name: string }[];
}

interface Tournament {
  id: string;
  name: string;
  format: string;
  total_holes: number;
  total_par: number;
}

interface LeaderboardData {
  tournament: Tournament;
  scoring_type: 'individual' | 'team';
  leaderboard: LeaderboardEntry[];
  last_updated: string;
}

export const LeaderboardPage: React.FC = () => {
  const { orgSlug, tournamentSlug } = useParams<{ orgSlug: string; tournamentSlug: string }>();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchLeaderboard = useCallback(async () => {
    try {
      // First get tournament ID from org/slug
      const tournamentRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/organizations/${orgSlug}/tournaments/${tournamentSlug}`
      );
      
      if (!tournamentRes.ok) throw new Error('Tournament not found');
      const tournamentData = await tournamentRes.json();
      
      // Then fetch leaderboard (API returns tournament directly, not wrapped)
      const tournamentId = tournamentData.id || tournamentData.tournament?.id;
      const leaderboardRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/v1/tournaments/${tournamentId}/scores/leaderboard`
      );
      
      if (!leaderboardRes.ok) throw new Error('Failed to load leaderboard');
      const leaderboardData = await leaderboardRes.json();
      
      setData(leaderboardData);
      setLastRefresh(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, [orgSlug, tournamentSlug]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchLeaderboard]);

  const getPositionStyle = (position: number) => {
    switch (position) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 2:
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-white text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (relative: number) => {
    if (relative < 0) return 'text-red-600'; // Under par (good)
    if (relative > 0) return 'text-brand-600'; // Over par
    return 'text-gray-900'; // Even
  };

  const getScoreIcon = (relative: number) => {
    if (relative < 0) return <ChevronDown className="w-4 h-4 text-red-500" />;
    if (relative > 0) return <ChevronUp className="w-4 h-4 text-brand-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-green-500 mx-auto mb-4" />
          <p className="text-gray-400">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Trophy className="w-10 h-10 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Leaderboard Unavailable</h2>
          <p className="text-gray-400 mb-8 leading-relaxed">
            {error || 'The leaderboard is currently unavailable. This could be because the tournament hasn\'t started yet or scores haven\'t been entered.'}
          </p>
          <Link
            to={`/${orgSlug}/tournaments/${tournamentSlug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg shadow-green-600/25"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tournament
          </Link>
        </div>
      </div>
    );
  }

  const { tournament, scoring_type, leaderboard } = data;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                to={`/${orgSlug}/tournaments/${tournamentSlug}`}
                className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>
              <h1 className="text-xl font-bold text-white">{tournament.name}</h1>
              <p className="text-gray-400 text-sm">
                Live Leaderboard • Par {tournament.total_par}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg ${
                  autoRefresh 
                    ? 'bg-green-900/50 text-green-400' 
                    : 'bg-gray-700 text-gray-400'
                }`}
                title={autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
              >
                {autoRefresh ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              </button>
              <button
                onClick={fetchLeaderboard}
                className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Updated {formatTime(lastRefresh)}
            </span>
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {leaderboard.length} {scoring_type === 'team' ? 'teams' : 'players'}
            </span>
          </div>
        </div>
      </header>

      {/* Leaderboard */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {leaderboard.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-300 mb-2">No Scores Yet</h2>
            <p className="text-gray-500">Scores will appear here as they're entered.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry) => (
              <div
                key={entry.golfer_id || entry.group_id}
                className={`rounded-lg border p-4 ${getPositionStyle(entry.position)}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Position */}
                    <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center">
                      {entry.position <= 3 ? (
                        <Trophy className={`w-5 h-5 ${
                          entry.position === 1 ? 'text-yellow-400' :
                          entry.position === 2 ? 'text-gray-400' :
                          'text-orange-400'
                        }`} />
                      ) : (
                        <span className="text-white font-bold">{entry.position}</span>
                      )}
                    </div>

                    {/* Name */}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {scoring_type === 'team' ? entry.team_name : entry.name}
                      </p>
                      {scoring_type === 'team' && entry.golfers && (
                        <p className="text-xs text-gray-500">
                          {entry.golfers.map(g => g.name).join(' • ')}
                        </p>
                      )}
                      {entry.group_number && (
                        <p className="text-xs text-gray-500">Group {entry.group_number}</p>
                      )}
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end">
                      {getScoreIcon(entry.total_relative)}
                      <span className={`text-2xl font-bold ${getScoreColor(entry.total_relative)}`}>
                        {entry.display_score || 'E'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">
                      {entry.total_strokes} strokes • Thru {entry.thru}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 py-3">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-500 text-sm">
            Powered by Pacific Golf • Scores update every 30 seconds
          </p>
        </div>
      </footer>
    </div>
  );
};
