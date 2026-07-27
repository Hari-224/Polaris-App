import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="space-y-24 py-12">
      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-6 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-4 py-1.5 text-xs font-semibold text-sky-400">
            <span>AI-Powered Learning Guidance Platform</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
            Navigate Your Self-Learning Journey with Precision
          </h1>
          <p className="text-lg text-slate-400">
            Polaris provides structured roadmaps, distraction-free focus sessions, adaptive quizzes, and performance guidance to keep you disciplined and consistent.
          </p>
          <div className="flex items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="rounded-xl bg-sky-500 px-6 py-3.5 text-base font-semibold text-slate-950 shadow-lg shadow-sky-500/25 transition-all hover:bg-sky-400"
            >
              Get Started for Free
            </Link>
            <Link
              to="/login"
              className="rounded-xl border border-slate-800 bg-slate-900 px-6 py-3.5 text-base font-semibold text-slate-200 transition-all hover:bg-slate-800 hover:text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* About Polaris Section */}
      <section id="about" className="mx-auto max-w-7xl px-6">
        <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 md:p-12">
          <div className="mx-auto max-w-3xl space-y-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white">What is Polaris?</h2>
            <p className="text-base text-slate-300">
              Polaris is <strong>NOT</strong> a Learning Management System (LMS). It does not replace YouTube, ChatGPT, documentation, or online courses.
            </p>
            <p className="text-base text-slate-400">
              Students already know <em>where</em> to learn. Polaris helps them know <strong>what</strong> to learn, <strong>when</strong> to learn, <strong>how much</strong> to learn, whether they understood the material, and what to revise next.
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="mx-auto max-w-7xl px-6 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-3xl font-bold tracking-tight text-white">Core Pillars of Guidance</h2>
          <p className="text-slate-400">Everything you need to master self-study without distractions</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">1</div>
            <h3 className="text-xl font-bold text-white">AI Learning Planner</h3>
            <p className="text-sm text-slate-400">Input your target topic and study days to generate a structured, day-by-day learning roadmap.</p>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">2</div>
            <h3 className="text-xl font-bold text-white">Resource Manager</h3>
            <p className="text-sm text-slate-400">Choose and save your preferred study materials—YouTube tutorials, docs, or books—and track your progress.</p>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">3</div>
            <h3 className="text-xl font-bold text-white">Focus Shield</h3>
            <p className="text-sm text-slate-400">On-demand Focus Sessions paired with site-blocking capabilities to shield you from online distractions.</p>
          </div>

          <div className="rounded-2xl border border-slate-900 bg-slate-900/40 p-6 space-y-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 font-bold">4</div>
            <h3 className="text-xl font-bold text-white">Adaptive Quizzes</h3>
            <p className="text-sm text-slate-400">Evaluate topic comprehension through dynamic MCQs, pinpoint weak concepts, and get personalized revision advice.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
