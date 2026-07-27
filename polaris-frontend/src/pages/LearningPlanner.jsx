import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import plannerService from '../services/plannerService';
import LearningPlanCard from '../components/LearningPlanCard';

export default function LearningPlanner() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, ACTIVE, COMPLETED

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await plannerService.getPlans();
      if (response.success) {
        setPlans(response.data || []);
      } else {
        setError(response.message || 'Failed to retrieve plans');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error connecting to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this learning plan? This will permanently delete all day-wise progress.')) {
      return;
    }

    try {
      const response = await plannerService.deletePlan(id);
      if (response.success) {
        setPlans(plans.filter((p) => p.id !== id));
      } else {
        alert(response.message || 'Failed to delete plan');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error deleting plan');
    }
  };

  // Filter plans based on search search and tab choice
  const filteredPlans = plans.filter((plan) => {
    const matchesSearch = plan.topic.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTab = 
      activeTab === 'ALL' || 
      (activeTab === 'ACTIVE' && plan.status === 'ACTIVE') || 
      (activeTab === 'COMPLETED' && plan.status === 'COMPLETED');
    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Learning Planner</h1>
          <p className="text-sm text-slate-400 mt-1">Design day-wise roadmaps and manage your custom self-learning guides.</p>
        </div>
        <Link
          to="/planner/create"
          className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-sky-500/20 transition-all hover:bg-sky-400"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create New Plan
        </Link>
      </div>

      {/* Control Area (Tabs and Search) */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-slate-900 pb-5">
        {/* Tabs switcher */}
        <div className="flex gap-1.5 bg-slate-900/60 p-1.5 rounded-xl border border-slate-900 max-w-md self-start">
          {['ALL', 'ACTIVE', 'COMPLETED'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-lg px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? 'bg-sky-500 text-slate-950 shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab.toLowerCase()} plans
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative max-w-md w-full">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search learning plans..."
            className="w-full rounded-xl border border-slate-800 bg-slate-900/30 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-sky-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Error View state */}
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Main Grid View */}
      {loading ? (
        <div className="py-20 text-center text-slate-500">
          <div className="inline-block animate-spin h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-sm">Fetching your learning plans...</p>
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPlans.map((plan) => (
            <LearningPlanCard key={plan.id} plan={plan} onDelete={handleDelete} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/10 p-16 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-slate-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">No plans found</h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {searchTerm 
                ? "No plans match your current search parameters." 
                : "Get started by generating your first day-by-day learning roadmap guide."}
            </p>
          </div>
          {!searchTerm && (
            <Link
              to="/planner/create"
              className="inline-flex items-center gap-1.5 rounded-xl bg-sky-500 px-4 py-2.5 text-xs font-semibold text-slate-950 transition-all hover:bg-sky-400"
            >
              Create First Plan
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
