export default function LearningResources() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Learning Resources</h1>
        <p className="text-slate-400 mb-6">Manage, save and resume learning from your preferred materials like YouTube videos, documentation, and online courses.</p>
        
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-12 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-4">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Resource Manager</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-4">
            Link and structure your chosen tutorials, books, and blogs to stay organized.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-3 py-1 text-xs font-medium text-sky-400">
            Coming in Future Phase
          </span>
        </div>
      </div>
    </div>
  );
}
