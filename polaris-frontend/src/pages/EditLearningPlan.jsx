import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import plannerService from '../services/plannerService';
import CreatePlanForm from '../components/CreatePlanForm';

export default function EditLearningPlan() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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

    fetchPlanDetails();
  }, [id]);

  const handleEditSubmit = async (formData) => {
    const result = await plannerService.updatePlan(id, {
      topic: formData.topic,
      dailyStudyHours: formData.dailyStudyHours
    });
    if (result.success) {
      navigate('/planner');
    }
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Back button */}
      <Link
        to="/planner"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-all"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Planner
      </Link>

      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl">
        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white">Edit Learning Plan</h2>
          <p className="text-sm text-slate-400">Update learning parameters for your topic roadmap.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <div className="inline-block animate-spin h-6 w-6 border-4 border-sky-500 border-t-transparent rounded-full mb-2"></div>
            <p className="text-xs">Loading plan configuration...</p>
          </div>
        ) : plan ? (
          <CreatePlanForm
            initialData={plan}
            onSubmit={handleEditSubmit}
            buttonText="Save Configuration"
          />
        ) : (
          <p className="text-sm text-slate-500 text-center">Config unavailable</p>
        )}
      </div>
    </div>
  );
}
