import { useState, useEffect } from 'react';
import focusService from '../services/focusService';
import plannerService from '../services/plannerService';

export default function FocusSession() {
  const [activeSession, setActiveSession] = useState(null);
  const [plans, setPlans] = useState([]);
  const [selectedDayId, setSelectedDayId] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [focusRes, plansRes] = await Promise.all([
        focusService.getActiveFocus(),
        plannerService.getPlans()
      ]);

      if (focusRes.success && focusRes.data) {
        setActiveSession(focusRes.data);
      } else {
        setActiveSession(null);
      }

      if (plansRes.success && plansRes.data) {
        setPlans(plansRes.data);
      }
    } catch (err) {
      console.error('Error loading focus page data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    let interval = null;
    if (activeSession && activeSession.status === 'ACTIVE') {
      const startTime = new Date(activeSession.startTime).getTime();
      interval = setInterval(() => {
        const now = new Date().getTime();
        setElapsedSeconds(Math.max(0, Math.floor((now - startTime) / 1000)));
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession]);

  const handleStartFocus = async () => {
    try {
      setActionLoading(true);
      const dayId = selectedDayId ? parseInt(selectedDayId, 10) : null;
      const res = await focusService.startFocus(dayId);
      if (res.success) {
        setActiveSession(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error starting Focus Session');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStopFocus = async () => {
    try {
      setActionLoading(true);
      const sessionId = activeSession ? activeSession.id : null;
      const res = await focusService.endFocus(sessionId);
      if (res.success) {
        setActiveSession(null);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error stopping Focus Session');
    } finally {
      setActionLoading(false);
    }
  };

  const formatTimer = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Flatten days from active learning plans for topic selection
  const allDays = plans.flatMap((p) =>
    (p.days || []).map((d) => ({
      id: d.id,
      label: `${p.topic} - Day ${d.dayNumber}: ${d.title}`,
    }))
  );

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm">Loading Focus Shield...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Focus Session Shield</h1>
        <p className="text-sm text-slate-400">
          Activate Focus Mode to shield against distractions and enable automatic telemetry tracking via the Polaris Chrome Extension.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl space-y-8 text-center">
        {activeSession ? (
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 text-xs font-bold text-emerald-400 border border-emerald-500/20 animate-pulse">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Focus Session Active
            </div>

            <div className="py-6">
              <span className="text-6xl font-extrabold tracking-tight text-white font-mono">
                {formatTimer(elapsedSeconds)}
              </span>
              <p className="text-xs text-slate-500 mt-2">Active Study Time</p>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300">Chrome Extension Status</p>
              <p>Automatically tracking YouTube videos, Documentation articles & Focus metrics.</p>
            </div>

            <button
              onClick={handleStopFocus}
              disabled={actionLoading}
              className="w-full rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 py-3 text-sm font-bold transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Stopping Session...' : 'Stop Focus Session'}
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-left">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                Link Focus Session to Learning Task (Optional)
              </label>
              <select
                value={selectedDayId}
                onChange={(e) => setSelectedDayId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-xs text-white focus:border-sky-500 focus:outline-none"
              >
                <option value="">-- General Focus Session (No specific task) --</option>
                {allDays.map((day) => (
                  <option key={day.id} value={day.id}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Focus Mode Rules
              </div>
              <ul className="list-disc pl-4 space-y-1">
                <li>Tracking operates strictly during an active Focus Session.</li>
                <li>Productive sites (YouTube, MDN, LeetCode, GitHub, Spring Docs) are automatically analyzed.</li>
                <li>Private inputs, passwords, or unrelated tabs are NEVER recorded.</li>
              </ul>
            </div>

            <button
              onClick={handleStartFocus}
              disabled={actionLoading}
              className="w-full rounded-2xl bg-sky-500 hover:bg-sky-400 text-slate-950 py-3.5 text-sm font-bold shadow-lg transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Starting Session...' : 'Start Focus Session'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
