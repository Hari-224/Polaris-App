import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';
import plannerService from '../services/plannerService';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = authService.getUser();
  const userName = user?.firstName || 'Learner';

  const [stats, setStats] = useState({
    overallProgress: 0,
    totalPlans: 0,
    activePlans: 0,
  });
  const [productivity, setProductivity] = useState({
    learningTimeMins: 0,
    focusScore: 0,
    sessionsCount: 0,
    xpGained: 0,
  });
  const [userXp, setUserXp] = useState(user?.xp || 0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        // Refresh User profile to sync real-time XP
        try {
          const userProfileResult = await authService.getCurrentUser();
          if (userProfileResult.success && userProfileResult.data) {
            setUserXp(userProfileResult.data.xp || 0);
            localStorage.setItem('polaris_user', JSON.stringify(userProfileResult.data));
          }
        } catch (profileErr) {
          console.error('Failed to reload real-time user profile', profileErr);
        }

        // Fetch plans details
        const plansResponse = await plannerService.getPlans();
        let total = 0;
        let active = 0;
        let avgProgress = 0.0;
        if (plansResponse.success && plansResponse.data) {
          const plansList = plansResponse.data;
          total = plansList.length;
          active = plansList.filter((p) => p.status === 'ACTIVE').length;
          const totalProgress = plansList.reduce((acc, p) => acc + (p.completionPercentage || 0), 0);
          avgProgress = total === 0 ? 0.0 : Math.round((totalProgress / total) * 10.0) / 10.0;
        }

        // Fetch learning sessions from API to calculate productivity metrics
        let totalTimeSecs = 0;
        let totalFocusScoreSum = 0;
        let count = 0;
        try {
          const sessionsResponse = await plannerService.getPlans(); // wait, we can hit `/api/plans/sessions` via raw api interceptor or mapping
          // Let's call our sessions endpoint directly using our api client
          const apiModule = await import('../services/api');
          const api = apiModule.default;
          const sessRes = await api.get('/plans/sessions');
          if (sessRes.data && sessRes.data.success && sessRes.data.data) {
            const list = sessRes.data.data;
            count = list.length;
            list.forEach((s) => {
              totalTimeSecs += s.activeLearningTime || 0;
              const sFocus = s.activeLearningTime > 0 ? ((s.focusedTime || 0) / s.activeLearningTime) * 100.0 : 100.0;
              totalFocusScoreSum += sFocus;
            });
          }
        } catch (sessErr) {
          console.error('Error loading sessions for dashboard productivity', sessErr);
        }

        setStats({
          overallProgress: avgProgress,
          totalPlans: total,
          activePlans: active,
        });

        const activeMins = Math.round(totalTimeSecs / 60);
        setProductivity({
          learningTimeMins: activeMins,
          focusScore: count === 0 ? 0 : Math.round(totalFocusScoreSum / count),
          sessionsCount: count,
          xpGained: activeMins * 5, // mock study productivity gains for day
        });

      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-900 bg-gradient-to-r from-slate-900 to-indigo-950/40 p-8 shadow-2xl">
        <div className="absolute right-0 top-0 h-full w-1/3 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-400 via-indigo-500 to-transparent pointer-events-none" />
        <div className="max-w-2xl space-y-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome back, {userName}!
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Guidance Engine Active. Focus on building real-time comprehension and learning consistency instead of ticking simple checklist boxes.
          </p>
        </div>
      </div>

      {/* Polaris Learning Productivity Dashboard stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Today's Productivity Index */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Today's Productivity</p>
            <p className="text-2xl font-bold text-white mt-1">
              {productivity.sessionsCount > 0 ? 'High' : 'No Activity'}
            </p>
          </div>
        </div>

        {/* Focus Score */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Focus Score</p>
            <p className="text-2xl font-bold text-white mt-1">{productivity.focusScore}%</p>
          </div>
        </div>

        {/* Active Study / Learning Time */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Learning Time</p>
            <p className="text-2xl font-bold text-white mt-1">{productivity.learningTimeMins} mins</p>
          </div>
        </div>

        {/* Current Study Streak */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Current Streak</p>
            <p className="text-2xl font-bold text-white mt-1">1 day</p>
          </div>
        </div>

        {/* Learning Progress */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-3-4H9" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Learning Progress</p>
            <p className="text-2xl font-bold text-white mt-1">{stats.overallProgress}%</p>
          </div>
        </div>

        {/* Real-time Accumulated XP */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">XP Points</p>
            <p className="text-2xl font-bold text-white mt-1">{userXp} XP</p>
          </div>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="grid gap-6 md:grid-cols-3">
        
        {/* Left Columns - Goals & Actionable Cards */}
        <div className="md:col-span-2 space-y-6">
          {/* Today's Goal Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 shadow-lg backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Today's Learning Goal</h3>
            <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/30 p-8 text-center space-y-4">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-800 text-slate-400">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2m-3-4H9" />
                </svg>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">No learning goal created yet</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">Create a day-wise roadmap using the AI Learning Planner to start scheduling your roadmap progress.</p>
              </div>
              <Link to="/planner/create" className="inline-flex items-center justify-center rounded-xl bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-md transition-all hover:bg-sky-400">
                Create Learning Plan
              </Link>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 shadow-lg backdrop-blur-xl">
            <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <button 
                onClick={() => navigate('/planner')}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-left transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Continue Learning</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Resume your recent topic</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/focus')}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-left transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Start Focus Session</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Shield against distractions</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/quiz')}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-left transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Generate Quiz</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Evaluate topic understanding</p>
                </div>
              </button>

              <button 
                onClick={() => navigate('/analytics')}
                className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/30 p-4 text-left transition-all hover:bg-slate-900 hover:border-slate-700"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">View Analytics</h4>
                  <p className="text-xs text-slate-500 mt-0.5">Analyze learning metrics</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Right Columns - Progress Chart, Activity, Recommendations */}
        <div className="space-y-6">
          {/* Weekly Progress Chart Placeholder */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 shadow-lg backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-4">Weekly Progress</h3>
            <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-8 text-center flex flex-col items-center justify-center h-48">
              <svg className="h-8 w-8 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
              </svg>
              <p className="text-sm font-semibold text-white">Weekly Progress Coming Soon</p>
              <p className="text-[10px] text-slate-500 mt-1">Consistency metrics chart placeholder</p>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 shadow-lg backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-3">AI Recommendation Feed</h3>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "No recommendations available yet."
            </p>
          </div>

          {/* Recent Activity */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 shadow-lg backdrop-blur-xl">
            <h3 className="text-base font-bold text-white mb-3">Recent Activity Logs</h3>
            <p className="text-xs text-slate-500 leading-relaxed italic">
              "No recent learning activity."
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
