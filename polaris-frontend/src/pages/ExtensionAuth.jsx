import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import authService from '../services/authService';

export default function ExtensionAuth() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deviceId = searchParams.get('device_id');

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getUser();
    if (!currentUser) {
      const redirectUrl = deviceId
        ? `/login?redirect=/extension-auth?device_id=${encodeURIComponent(deviceId)}`
        : '/login?redirect=/extension-auth';
      navigate(redirectUrl);
    } else {
      setUser(currentUser);
    }
  }, [navigate, deviceId]);

  const handleAuthorize = async () => {
    if (!deviceId) {
      setError('Missing Device Identifier. Please click "Connect to Polaris" directly from the extension popup.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const response = await authService.authorizeExtension(deviceId);

      if (response && response.success) {
        setAuthorized(true);
      } else {
        setError(response?.message || 'Failed to authorize Chrome Extension.');
      }
    } catch (err) {
      console.error('Authorization error:', err);
      setError(err.response?.data?.message || 'Error connecting extension to Polaris backend.');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 font-extrabold text-slate-950 text-2xl shadow-lg shadow-sky-500/20">
          P
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-white">Authorize Polaris Extension</h1>
          <p className="text-xs text-slate-400">
            Connect your Polaris student profile to the Polaris Chrome Extension for focus tracking.
          </p>
        </div>

        {authorized ? (
          <div className="space-y-6 animate-fade-in">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-xs font-semibold text-emerald-400 space-y-2">
              <svg className="mx-auto h-10 w-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm font-bold text-white">Extension Successfully Connected!</p>
              <p className="text-slate-400 font-normal">
                Your Chrome Extension has been granted an authorization token. You can close this window.
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 py-3.5 text-sm font-bold shadow-lg transition-all"
            >
              Return to Polaris Dashboard
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Account</span>
                <span className="text-xs font-semibold text-sky-400">{user.email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Student Name</span>
                <span className="text-xs font-semibold text-white">
                  {user.firstName ? `${user.firstName} ${user.lastName || ''}` : 'Polaris Student'}
                </span>
              </div>
              {deviceId && (
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Device ID</span>
                  <span className="text-xs font-mono text-slate-400 truncate max-w-[180px]">{deviceId}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-xs text-red-400 font-medium">
                {error}
              </div>
            )}

            <button
              onClick={handleAuthorize}
              disabled={loading}
              className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 py-3.5 text-sm font-bold shadow-lg transition-all disabled:opacity-50"
            >
              {loading ? 'Authorizing Extension...' : 'Authorize this Chrome Extension'}
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="w-full text-xs text-slate-500 hover:text-slate-400 transition-colors"
            >
              Cancel and Return to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
