import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, Tournament } from '../services/api';

interface TournamentContextType {
  tournaments: Tournament[];
  currentTournament: Tournament | null;
  isLoading: boolean;
  error: string | null;
  setCurrentTournament: (tournament: Tournament | null) => void;
  refreshTournaments: () => Promise<void>;
}

const TournamentContext = createContext<TournamentContextType | undefined>(undefined);

interface TournamentProviderProps {
  children: ReactNode;
  orgSlug?: string;
  initialTournamentSlug?: string;
}

export function TournamentProvider({ children, orgSlug, initialTournamentSlug }: TournamentProviderProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [currentTournament, setCurrentTournamentState] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTournaments = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getTournaments();
      const scopedData = orgSlug
        ? data.filter((t) => t.organization_slug === orgSlug)
        : data;
      setTournaments(scopedData);
      
      // Deep-link tournament slug must win over previously selected tournament.
      const preferredTournament = initialTournamentSlug
        ? scopedData.find((t) => t.slug === initialTournamentSlug)
        : null;
      if (preferredTournament) {
        setCurrentTournamentState(preferredTournament);
        api.setCurrentTournament(preferredTournament.id);
        return;
      }

      // If current tournament no longer exists in scope, clear it.
      if (currentTournament && !scopedData.some((t) => t.id === currentTournament.id)) {
        setCurrentTournamentState(null);
        api.setCurrentTournament(null);
      }

      // If no current tournament is set, try open then most recent.
      if (!currentTournament) {
        const openTournament = scopedData.find(t => t.status === 'open');
        if (openTournament) {
          setCurrentTournamentState(openTournament);
          api.setCurrentTournament(openTournament.id);
        } else if (scopedData.length > 0) {
          // Fall back to the most recent tournament
          const mostRecent = [...scopedData].sort((a, b) => b.year - a.year || b.id - a.id)[0];
          setCurrentTournamentState(mostRecent);
          api.setCurrentTournament(mostRecent.id);
        } else {
          // Critical: clear shared API context so stale tournament IDs don't leak across orgs.
          setCurrentTournamentState(null);
          api.setCurrentTournament(null);
          const scopedKey = orgSlug ? `currentTournamentId:${orgSlug}` : 'currentTournamentId';
          localStorage.removeItem(scopedKey);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tournaments');
    } finally {
      setIsLoading(false);
    }
  };

  const setCurrentTournament = (tournament: Tournament | null) => {
    setCurrentTournamentState(tournament);
    api.setCurrentTournament(tournament?.id || null);
    
    // Save to localStorage for persistence
    const scopedKey = orgSlug ? `currentTournamentId:${orgSlug}` : 'currentTournamentId';
    if (tournament) {
      localStorage.setItem(scopedKey, tournament.id.toString());
    } else {
      localStorage.removeItem(scopedKey);
    }
  };

  // Load tournaments on mount
  useEffect(() => {
    const loadTournaments = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getTournaments();
        const scopedData = orgSlug
          ? data.filter((t) => t.organization_slug === orgSlug)
          : data;
        setTournaments(scopedData);
        
        // Deep-link tournament slug must win over localStorage for deterministic context.
        if (initialTournamentSlug) {
          const initialTournament = scopedData.find((t) => t.slug === initialTournamentSlug);
          if (initialTournament) {
            setCurrentTournamentState(initialTournament);
            api.setCurrentTournament(initialTournament.id);
            return;
          }
        }

        // Try to restore from localStorage next (scoped by org when available)
        const scopedKey = orgSlug ? `currentTournamentId:${orgSlug}` : 'currentTournamentId';
        const savedId = localStorage.getItem(scopedKey);
        if (savedId) {
          const savedTournament = scopedData.find(t => t.id === parseInt(savedId));
          if (savedTournament) {
            setCurrentTournamentState(savedTournament);
            api.setCurrentTournament(savedTournament.id);
            return;
          }
        }

        // Otherwise, find the open tournament
        const openTournament = scopedData.find(t => t.status === 'open');
        if (openTournament) {
          setCurrentTournamentState(openTournament);
          api.setCurrentTournament(openTournament.id);
        } else if (scopedData.length > 0) {
          // Fall back to the most recent tournament
          const mostRecent = [...scopedData].sort((a, b) => b.year - a.year || b.id - a.id)[0];
          setCurrentTournamentState(mostRecent);
          api.setCurrentTournament(mostRecent.id);
        } else {
          // Critical: clear shared API context so stale tournament IDs don't leak across orgs.
          setCurrentTournamentState(null);
          api.setCurrentTournament(null);
          localStorage.removeItem(scopedKey);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournaments');
      } finally {
        setIsLoading(false);
      }
    };

    loadTournaments();
  }, [orgSlug, initialTournamentSlug]);

  return (
    <TournamentContext.Provider
      value={{
        tournaments,
        currentTournament,
        isLoading,
        error,
        setCurrentTournament,
        refreshTournaments,
      }}
    >
      {children}
    </TournamentContext.Provider>
  );
}

export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error('useTournament must be used within a TournamentProvider');
  }
  return context;
}

