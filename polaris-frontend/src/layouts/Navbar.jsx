import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

export default function Navbar() {
  const navigate = useNavigate();
  const isAuthenticated = authService.isAuthenticated();
  const user = authService.getUser();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500 font-bold text-slate-950 shadow-lg shadow-sky-500/20">
            P
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Polaris</span>
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          <Link to="/" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Home
          </Link>
          <a href="#about" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
            About Polaris
          </a>
          <a href="#features" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
            Features
          </a>
          {isAuthenticated && (
            <Link to="/dashboard" className="text-sm font-medium text-slate-300 transition-colors hover:text-white">
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-slate-400">
                {user?.firstName}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-lg border border-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900 hover:text-white"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-900 hover:text-white"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-md transition-all hover:bg-sky-400"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
