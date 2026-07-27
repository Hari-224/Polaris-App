import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import plannerService from '../services/plannerService';
import LearningDayCard from '../components/LearningDayCard';
import LearningPlanProgress from '../components/LearningPlanProgress';

export default function LearningPlanDetails() {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAddingDay, setIsAddingDay] = useState(false);
  const [newDayData, setNewDayData] = useState({ title: '', description: '' });
  const [actionLoading, setActionLoading] = useState(false);

  const fetchPlanDetails = async () => {
    try {
      setLoading(true);
      const result = await plannerService.getPlanDetails(id);
      if (result.success) {
        setPlan(result.data);
      } else {
        setError(result.message || 'Failed to retrieve plan details');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error loading plan details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlanDetails();
  }, [id]);

  const handleToggleComplete = async (dayId, completed) => {
    try {
      const result = await plannerService.completeDay(id, dayId, completed);
      if (result.success) {
        setPlan(result.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating day completion status');
    }
  };

  const handleUpdateDay = async (dayId, data) => {
    try {
      const result = await plannerService.updateDay(id, dayId, data);
      if (result.success) {
        setPlan((prevPlan) => {
          const updatedDays = prevPlan.days.map((day) =>
            day.id === dayId ? { ...day, ...result.data } : day
          );
          return { ...prevPlan, days: updatedDays };
        });
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating day details');
      throw err;
    }
  };

  const handleDeleteDay = async (dayId) => {
    if (!window.confirm('Are you sure you want to delete this day? Day numbers for subsequent days will be automatically adjusted.')) {
      return;
    }

    try {
      await plannerService.deleteDay(id, dayId);
      await fetchPlanDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting day');
    }
  };

  const handleAddDaySubmit = async (e) => {
    e.preventDefault();
    if (!newDayData.title.trim()) {
      alert('Day title is required');
      return;
    }

    setActionLoading(true);
    try {
      const result = await plannerService.addDay(id, newDayData);
      if (result.success) {
        setIsAddingDay(false);
        setNewDayData({ title: '', description: '' });
        await fetchPlanDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding new day');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateResource = async (dayId, resourceData) => {
    try {
      const result = await plannerService.updateDayResource(id, dayId, resourceData);
      if (result.success) {
        // Reload plan details to correctly calculate statistics and update cards
        const updatedResult = await plannerService.getPlanDetails(id);
        if (updatedResult.success) {
          setPlan(updatedResult.data);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error linking day resource');
    }
  };

  const getRemainingDays = () => {
    if (!plan || !plan.days) return 0;
    const completedCount = plan.days.filter((d) => d.completed).length;
    return plan.days.length - completedCount;
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-500">
        <div className="inline-block animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-sm">Loading roadmap details...</p>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/planner" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-all">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Planner
        </Link>
        <div className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-center text-red-400">
          {error || 'Learning plan not found.'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back button and Meta info */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link
          to="/planner"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-all"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Planner
        </Link>

        <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold self-start sm:self-auto ${
          plan.status === 'COMPLETED'
            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            : 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
        }`}>
          {plan.status}
        </span>
      </div>

      {/* Main Stats Card */}
      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">{plan.topic}</h1>
          <p className="text-xs text-slate-500">Plan started on {new Date(plan.createdAt).toLocaleDateString()}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-3 py-4 border-y border-slate-950/40">
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Duration</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block">{plan.numberOfDays} Days Total</span>
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Daily Target</span>
            <span className="text-base font-bold text-slate-200 mt-0.5 block">{plan.dailyStudyHours} hrs/day</span>
          </div>
          <div className="text-left">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Days Remaining</span>
            <span className="text-base font-bold text-sky-400 mt-0.5 block">{getRemainingDays()} Days</span>
          </div>
        </div>

        {/* Completion percentage bar */}
        <div className="max-w-xl">
          <LearningPlanProgress percentage={plan.completionPercentage} />
        </div>
      </div>

      {/* Roadmap Days List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-900 pb-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Day-Wise Roadmap</h2>
          
          <button
            onClick={() => setIsAddingDay(!isAddingDay)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-800 hover:text-white px-4 py-2.5 text-xs font-semibold text-slate-300 transition-all"
          >
            {isAddingDay ? 'Cancel Add Day' : 'Add Custom Day'}
          </button>
        </div>

        {/* Inline Add Day Form */}
        {isAddingDay && (
          <form onSubmit={handleAddDaySubmit} className="rounded-2xl border border-slate-800 bg-slate-900/20 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Add New Study Day</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newDayData.title}
                onChange={(e) => setNewDayData({ ...newDayData, title: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none"
                placeholder="Day Topic Title (e.g. Setting up JWT Configuration)"
                required
              />
              <textarea
                value={newDayData.description}
                onChange={(e) => setNewDayData({ ...newDayData, description: e.target.value })}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white focus:border-sky-500 focus:outline-none h-16 resize-none"
                placeholder="Enter quick description of tasks for this day..."
              />
            </div>
            <button
              type="submit"
              disabled={actionLoading}
              className="rounded-xl bg-sky-500 hover:bg-sky-400 text-xs font-semibold text-slate-950 px-4 py-2 transition-all disabled:opacity-50"
            >
              {actionLoading ? 'Saving Day...' : 'Save Day'}
            </button>
          </form>
        )}

        {/* Days grid/stack */}
        {plan.days && plan.days.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {plan.days.map((day) => (
              <LearningDayCard
                key={day.id}
                day={day}
                onToggleComplete={handleToggleComplete}
                onUpdateDay={handleUpdateDay}
                onDeleteDay={handleDeleteDay}
                onUpdateResource={handleUpdateResource}
                planId={id}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-12 text-center text-slate-500">
            No study days configured. Add custom days to build your roadmap.
          </div>
        )}
      </div>
    </div>
  );
}
