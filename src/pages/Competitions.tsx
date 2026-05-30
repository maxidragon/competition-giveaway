import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCompetitions } from '../logic/wca';
import { getToken, getCachedUser, clearAuth } from '../logic/auth';
import type { Competition, WCAUser } from '../logic/types';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  if (s.getFullYear() !== e.getFullYear()) {
    return `${s.toLocaleDateString('en', { ...opts, year: 'numeric' })} – ${e.toLocaleDateString('en', { ...opts, year: 'numeric' })}`;
  }
  if (s.getMonth() !== e.getMonth()) {
    return `${s.toLocaleDateString('en', opts)} – ${e.toLocaleDateString('en', { ...opts, year: 'numeric' })}`;
  }
  return `${s.toLocaleDateString('en', opts)}–${e.getDate()}, ${e.getFullYear()}`;
}

function getStatus(c: Competition, todayStr: string): 'in-progress' | 'upcoming' | 'recent' {
  if (c.start_date <= todayStr && c.end_date >= todayStr) return 'in-progress';
  if (c.start_date > todayStr) return 'upcoming';
  return 'recent';
}

function filterAndSort(comps: Competition[], today: Date): Competition[] {
  const todayStr = today.toISOString().slice(0, 10);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().slice(0, 10);

  const priority = { 'in-progress': 0, upcoming: 1, recent: 2 };

  return comps
    .filter((c) => c.end_date >= weekAgoStr)
    .sort((a, b) => {
      const sa = getStatus(a, todayStr);
      const sb = getStatus(b, todayStr);
      if (sa !== sb) return priority[sa] - priority[sb];
      // Same group: in-progress + upcoming → ascending by start; recent → descending by end
      if (sa === 'recent') return b.end_date.localeCompare(a.end_date);
      return a.start_date.localeCompare(b.start_date);
    });
}

export default function Competitions() {
  const navigate = useNavigate();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const user = getCachedUser() as WCAUser | null;
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  useEffect(() => {
    const token = getToken();
    if (!token) { navigate('/', { replace: true }); return; }

    getMyCompetitions(token)
      .then((data) => setCompetitions(filterAndSort(data, today)))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [navigate]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleSignOut() {
    clearAuth();
    navigate('/', { replace: true });
  }

  const statusBadge = (c: Competition) => {
    const s = getStatus(c, todayStr);
    if (s === 'in-progress') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-green-900/40 text-green-400 border border-green-700/50">
          In progress
        </span>
      );
    }
    if (s === 'upcoming') {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-900/30 text-blue-400 border border-blue-700/40">
          Upcoming
        </span>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-semibold text-slate-100">My Competitions</h1>
          {user && (
            <div className="flex items-center gap-3">
              {user.avatar?.thumb_url && (
                <img src={user.avatar.thumb_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              )}
              <span className="text-sm text-slate-300 hidden sm:block">{user.name}</span>
              <button
                onClick={handleSignOut}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-500">
            <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            Loading competitions...
          </div>
        )}

        {error && (
          <div className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && competitions.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p>No competitions found in the past week or upcoming.</p>
            <p className="text-sm mt-1 text-slate-600">Only competitions you organise or delegate are shown.</p>
          </div>
        )}

        {!loading && competitions.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-4">
            {competitions.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/competition/${c.id}`)}
                className="text-left p-5 rounded-xl border border-slate-700 bg-slate-800 hover:border-blue-500/60 hover:bg-slate-700/60 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-slate-100 group-hover:text-white transition-colors leading-snug">
                    {c.name}
                  </div>
                  {statusBadge(c)}
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm text-slate-400">
                  <span>{formatDateRange(c.start_date, c.end_date)}</span>
                  <span className="text-slate-600">·</span>
                  <span>{c.city}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
