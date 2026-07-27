export default function Achievements() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Achievements & Streaks</h1>
        <p className="text-slate-400 mb-6">Track your unlocked badges, XP points, levels, learning consistency streaks and global achievements.</p>
        
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Gamification System</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Earn level-ups, collect progress badges, and compete with other consistent learners.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            Coming in Future Phase
          </span>
        </div>
      </div>
    </div>
  );
}
