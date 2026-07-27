export default function LearningPlanProgress({ percentage }) {
  const percent = Math.min(100, Math.max(0, percentage || 0));

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-500 font-semibold uppercase tracking-wider">Progress</span>
        <span className="text-sky-400 font-bold">{percent}%</span>
      </div>
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
