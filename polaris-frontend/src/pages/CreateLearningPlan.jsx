import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import plannerService from '../services/plannerService';
import CreatePlanForm from '../components/CreatePlanForm';

export default function CreateLearningPlan() {
  const navigate = useNavigate();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('Consulting AI planner...');

  const handleCreateSubmit = async (data) => {
    setIsGenerating(true);
    setError('');
    
    // Cycle through messages to make it look responsive and premium
    const messages = [
      'Consulting AI planner...',
      'Structuring roadmap topics...',
      'Optimizing study hours...',
      'Writing action-oriented descriptions...',
      'Finalizing your study plan...'
    ];
    let msgIdx = 0;
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % messages.length;
      setLoadingMessage(messages[msgIdx]);
    }, 2000);

    try {
      const result = await plannerService.createPlan(data);
      clearInterval(interval);
      if (result.success) {
        navigate(`/planner/${result.data.id}`);
      } else {
        setError(result.message || 'Roadmap generation failed.');
        setIsGenerating(false);
      }
    } catch (err) {
      clearInterval(interval);
      const message = err.response?.data?.message || 'Error communicating with Groq AI API. Please verify the API key configure settings.';
      setError(message);
      setIsGenerating(false);
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

      <div className="rounded-3xl border border-slate-900 bg-slate-900/50 p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Full-screen Loading Overlay for AI generation */}
        {isGenerating && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative">
              {/* Outer ring */}
              <div className="h-16 w-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
              {/* Inner pulsed logo */}
              <div className="absolute inset-0 flex items-center justify-center font-bold text-sky-400 text-lg animate-pulse">
                P
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Generating AI Study Roadmap</h3>
              <p className="text-xs text-sky-400 font-semibold animate-pulse">{loadingMessage}</p>
              <p className="text-[10px] text-slate-500 max-w-xs pt-2">This utilizes Groq LLM to format a structured study path. Please wait for a few seconds...</p>
            </div>
          </div>
        )}

        <div className="space-y-2 mb-8">
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Create Learning Plan</h2>
          <p className="text-sm text-slate-400">Design your customized study schedule. The system will consult Groq AI to generate a detailed topic roadmap for you.</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        <CreatePlanForm onSubmit={handleCreateSubmit} buttonText="Generate AI Roadmap" />
      </div>
    </div>
  );
}
