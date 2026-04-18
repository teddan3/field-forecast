import { useState, useEffect, useCallback, useRef } from 'react';
import echo from './echo';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface LiveMatch {
  id: number;
  date: string;
  timestamp: number;
  status: string;
  status_long: string;
  elapsed: number | null;
  is_live: boolean;
  competition: {
    id: number;
    name: string;
    country: string;
    logo: string;
    round: string | null;
  };
  home_team: {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
  };
  away_team: {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
  };
  score: {
    home: number | null;
    away: number | null;
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
  };
  venue: { name: string | null; city: string | null };
}

export function useLiveScores(pollIntervalMs: number = 30000) {
  const [matches, setMatches] = useState<LiveMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/live-scores`);
      const data = await response.json();
      
      if (data.success) {
        setMatches(data.data as LiveMatch[]);
        setLastUpdate(new Date());
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch matches');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleScoreUpdate = useCallback((eventData: { match?: LiveMatch }) => {
    if (eventData.match) {
      setMatches(prev => {
        const index = prev.findIndex(m => m.id === eventData.match!.id);
        if (index >= 0) {
          const updated = [...prev];
          updated[index] = eventData.match;
          return updated;
        }
        return [eventData.match, ...prev];
      });
      setLastUpdate(new Date());
    } else {
      fetchMatches();
    }
  }, [fetchMatches]);

  useEffect(() => {
    echo.connect();

    echo.on('connected', () => setConnectionStatus('connected'));
    echo.on('disconnected', () => setConnectionStatus('disconnected'));
    echo.on('polling', () => {
      setConnectionStatus('polling');
      fetchMatches();
    });
    echo.on('score_update', handleScoreUpdate);

    fetchMatches();

    intervalRef.current = setInterval(fetchMatches, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      echo.off('score_update', handleScoreUpdate);
    };
  }, [fetchMatches, handleScoreUpdate, pollIntervalMs]);

  const liveMatches = matches.filter(m => m.is_live);
  const todayMatches = matches.filter(m => !m.is_live);

  return {
    matches,
    liveMatches,
    todayMatches,
    loading,
    error,
    lastUpdate,
    connectionStatus,
    refetch: fetchMatches
  };
}

export function useMatchDetail(matchId: number) {
  const [match, setMatch] = useState<LiveMatch | null>(null);
  const [odds, setOdds] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMatch = useCallback(async () => {
    if (!matchId) return;

    try {
      setLoading(true);
      
      const [matchRes, oddsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/live-scores/${matchId}`),
        fetch(`${API_BASE_URL}/api/odds/${matchId}`)
      ]);

      const matchData = await matchRes.json();
      const oddsData = await oddsRes.json();

      if (matchData.success) {
        setMatch(matchData.data);
      } else {
        setError(matchData.message || 'Match not found');
      }

      if (oddsData.success) {
        setOdds(oddsData.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, [matchId]);

  useEffect(() => {
    echo.subscribe(`match.${matchId}`);

    echo.on(`match.${matchId}.update`, (data: { match: LiveMatch }) => {
      setMatch(data.match);
    });

    fetchMatch();

    return () => {
      echo.unsubscribe(`match.${matchId}`);
    };
  }, [matchId, fetchMatch]);

  return { match, odds, loading, error, refetch: fetchMatch };
}

export function useTeamForm(teamId: number) {
  const [form, setForm] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/teams/${teamId}/form`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setForm(data.data);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  return { form, loading, error };
}

export default echo;