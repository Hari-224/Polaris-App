export default function Footer() {
  return (
    <footer className="border-t border-slate-900 bg-slate-950 py-12 text-slate-400">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500 font-bold text-slate-950">
              P
            </div>
            <span className="text-lg font-bold text-white">Polaris</span>
          </div>
          <p className="text-center text-sm text-slate-500 md:text-left">
            AI-Powered Learning Guidance Platform. Empowering disciplined self-learners.
          </p>
          <p className="text-xs text-slate-600">
            &copy; {new Date().getFullYear()} Polaris. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
