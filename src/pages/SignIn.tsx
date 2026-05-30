import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthUrl } from '../logic/wca';
import { getMe } from '../logic/wca';
import { setToken, setCachedUser, isAuthenticated } from '../logic/auth';

export default function SignIn() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/competitions', { replace: true });
      return;
    }

    const hash = window.location.hash;
    if (!hash) return;

    const params = new URLSearchParams(hash.slice(1));
    const accessToken = params.get('access_token');
    const expiresIn = params.get('expires_in');

    if (!accessToken || !expiresIn) return;

    window.history.replaceState(null, '', window.location.pathname);
    setLoading(true);

    setToken(accessToken, parseInt(expiresIn, 10));

    getMe(accessToken)
      .then((user) => {
        setCachedUser(user);
        navigate('/competitions', { replace: true });
      })
      .catch(() => {
        setError('Failed to fetch user info. Please try again.');
        setLoading(false);
      });
  }, [navigate]);


  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-100">Competition Giveaway</h1>
          <p className="text-slate-400 mt-1 text-sm">Manage giveaways for your WCA competitions</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 flex flex-col gap-4">

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-900/30 border border-red-700 text-red-300 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing you in...
            </div>
          ) : (
            <a
              href={getAuthUrl()}
              className={[
                'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-white transition-colors',
                'bg-slate-700 cursor-not-allowed opacity-50',
                'bg-blue-600 hover:bg-blue-500 active:bg-blue-700',
              ].join(' ')}
            >
              <svg width="20" height="20" viewBox="0 0 40 40" fill="white">
                <path d="M20 0C8.95 0 0 8.95 0 20s8.95 20 20 20 20-8.95 20-20S31.05 0 20 0zm0 8c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6 2.69-6 6-6zm0 24c-5 0-9.45-2.56-12-6.44C8.03 22.79 15.97 21 20 21c4.03 0 11.97 1.79 12 4.56C29.45 29.44 25 32 20 32z" />
              </svg>
              Sign in with WCA
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
