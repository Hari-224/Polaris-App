import authService from '../services/authService';

export default function Profile() {
  const user = authService.getUser();

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">My Profile</h1>
        <p className="text-slate-400 mb-6">Manage your account credentials, preferences, and student-parent dashboard connection settings.</p>
        
        {user && (
          <div className="max-w-xl rounded-2xl border border-slate-800 bg-slate-950/40 p-6 space-y-4 mb-6 text-left">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Full Name</span>
              <p className="text-base font-semibold text-white mt-1">{user.firstName} {user.lastName}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Email Address</span>
              <p className="text-base font-semibold text-white mt-1">{user.email}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Account Role</span>
              <p className="text-base font-semibold text-sky-400 mt-1">{user.role}</p>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8 text-center max-w-xl">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400 mb-3">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <h4 className="text-sm font-semibold text-white mb-1">Parent Account Linking</h4>
          <p className="text-xs text-slate-500 mb-3">
            Connect parent dashboard accounts to share focus stats and goals.
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[10px] font-medium text-sky-400">
            Coming in Future Phase
          </span>
        </div>
      </div>
    </div>
  );
}
