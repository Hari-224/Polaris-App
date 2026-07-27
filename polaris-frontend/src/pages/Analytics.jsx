export default function Analytics() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Learning Analytics</h1>
        <p className="text-slate-400 mb-6">Gain data-driven insights into your study habits, consistency, focus scores, and progress trends.</p>
        
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Performance Analytics</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Track focus metrics, daily streaks, weekly summary charts, and parent updates.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            Coming in Future Phase
          </span>
        </div>
      </div>
    </div>
  );
}
