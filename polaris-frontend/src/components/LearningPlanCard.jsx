import { Link } from 'react-router-dom';
import LearningPlanProgress from './LearningPlanProgress';

export default function LearningPlanCard({ plan, onDelete }) {
  const { id, topic, numberOfDays, dailyStudyHours, status, completionPercentage } = plan;

  return (
    <div className="rounded-2xl border border-slate-900 bg-slate-900/50 p-6 shadow-xl backdrop-blur-xl hover:border-slate-800 transition-all flex flex-col justify-between h-full">
      <div className="space-y-4">
        {/* Topic Header & Status */}
        <div className="flex justify-between items-start gap-4">
          <h4 className="text-lg font-bold text-white tracking-tight line-clamp-2">{topic}</h4>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
              status === 'COMPLETED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
            }`}
          >
            {status}
          </span>
        </div>

        {/* Plan Info */}
        <div className="grid grid-cols-2 gap-4 text-xs py-2 border-y border-slate-950/40">
          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider">Duration</span>
            <span className="text-slate-200 font-semibold mt-0.5 block">{numberOfDays} Days</span>
          </div>
          <div>
            <span className="text-slate-500 font-semibold block uppercase tracking-wider">Daily Hours</span>
            <span className="text-slate-200 font-semibold mt-0.5 block">{dailyStudyHours} hrs/day</span>
          </div>
        </div>

        {/* Progress Bar */}
        <LearningPlanProgress percentage={completionPercentage} />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-950/40">
        <Link
          to={`/planner/${id}`}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 py-2.5 transition-all border border-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          View Roadmap
        </Link>
        
        <Link
          to={`/planner/${id}/edit`}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-400 hover:text-white transition-all"
          title="Edit Topic & hours"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </Link>

        <button
          onClick={() => onDelete(id)}
          className="p-2.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-all"
          title="Delete Plan"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
