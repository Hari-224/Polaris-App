import { useState } from 'react';

export default function CreatePlanForm({ onSubmit, initialData = null, buttonText = 'Create Learning Plan' }) {
  const [formData, setFormData] = useState({
    topic: initialData?.topic || '',
    numberOfDays: initialData?.numberOfDays || 7,
    dailyStudyHours: initialData?.dailyStudyHours || 2,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.topic.trim().length < 3 || formData.topic.trim().length > 200) {
      setError('Topic must be between 3 and 200 characters');
      return;
    }
    if (formData.numberOfDays < 1 || formData.numberOfDays > 365) {
      setError('Number of days must be between 1 and 365');
      return;
    }
    if (formData.dailyStudyHours < 1 || formData.dailyStudyHours > 12) {
      setError('Daily study hours must be between 1 and 12');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Topic Input */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-300 block">Learning Topic</label>
        <input
          type="text"
          value={formData.topic}
          onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
          placeholder="e.g., Spring Boot, React with Vite, Advanced SQL"
          required
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
        />
        <p className="text-[10px] text-slate-500">Provide a clear description of what topic you plan to master.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Days count */}
        {initialData === null && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300 block">Number of Days</label>
            <input
              type="number"
              min={1}
              max={365}
              value={formData.numberOfDays}
              onChange={(e) => setFormData({ ...formData, numberOfDays: parseInt(e.target.value, 10) || 0 })}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
            />
            <p className="text-[10px] text-slate-500">Duration in days (1 to 365).</p>
          </div>
        )}

        {/* Daily hours */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300 block">Daily Study Hours</label>
          <input
            type="number"
            min={1}
            max={12}
            value={formData.dailyStudyHours}
            onChange={(e) => setFormData({ ...formData, dailyStudyHours: parseInt(e.target.value, 10) || 0 })}
            required
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-white focus:border-sky-500 focus:outline-none"
          />
          <p className="text-[10px] text-slate-500">Planned hours per day (1 to 12).</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-sky-500 py-3 text-sm font-semibold text-slate-950 transition-all hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Processing...' : buttonText}
      </button>
    </form>
  );
}
