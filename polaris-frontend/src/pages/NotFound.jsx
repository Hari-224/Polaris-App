import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-16rem)] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-6xl font-extrabold text-sky-400">404</h1>
      <h2 className="mt-4 text-2xl font-bold text-white">Page Not Found</h2>
      <p className="mt-2 text-slate-400">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="mt-6 rounded-xl bg-sky-500 px-6 py-2.5 text-sm font-semibold text-slate-950 transition-all hover:bg-sky-400"
      >
        Return to Home
      </Link>
    </div>
  );
}
