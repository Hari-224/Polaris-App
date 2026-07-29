import { useState } from 'react';
import focusService from '../services/focusService';

export default function LearningDayCard({ day, onToggleComplete, onUpdateDay, onDeleteDay, onUpdateResource, planId }) {
  const {
    id,
    dayNumber,
    title,
    description,
    learningObjectives = [],
    estimatedStudyMinutes = 60,
    difficulty = 'Medium',
    resourceType,
    selectedResourceUrl,
    selectedResourceTitle,
    resumeUrl,
    videoId,
    status = 'NOT_STARTED',
    watchPercentage = 0,
    videoCompleted = false,
  } = day;

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ title: title || '', description: description || '' });
  const [error, setError] = useState('');

  const difficultyColors = {
    Easy: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    Hard: 'bg-red-500/10 text-red-400 border border-red-500/20',
  };

  const statusColors = {
    NOT_STARTED: 'bg-slate-500/10 text-slate-400 border border-slate-500/20',
    LEARNING: 'bg-sky-500/10 text-sky-400 border border-sky-500/20',
    NEEDS_REVISION: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    MASTERED: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
  };

  const handleSaveEdit = async () => {
    try {
      await onUpdateDay(id, formData);
      setIsEditing(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setError('');
    try {
      await onUpdateResource(id, {
        resourceUrl: selectedResourceUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
        resourceTitle: selectedResourceTitle || 'Linked Video',
        resourceType: 'YouTube',
        watchPercentage: watchPercentage,
        status: newStatus,
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Error updating status';
      setError(msg);
    }
  };

  const handleIUnderstood = async () => {
    setError('');
    try {
      await onToggleComplete(id, true);
    } catch (err) {
      const msg = err.response?.data?.message || 'You must study a resource before mastering this task.';
      setError(msg);
    }
  };

  const sanitizeUrl = (url) => {
    if (!url || typeof url !== 'string') return null;
    if (url.includes('youtube.com/results') || url.includes('search_query=')) return null;
    return url.trim();
  };

  const validResumeUrl = sanitizeUrl(resumeUrl);
  const validResourceUrl = sanitizeUrl(selectedResourceUrl);
  const targetWatchUrl = validResumeUrl || validResourceUrl || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : null);

  const handleOpenVideo = async () => {
    const searchQueryUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title || '')}`;
    const openUrl = targetWatchUrl && targetWatchUrl.trim().length > 0 ? targetWatchUrl : searchQueryUrl;

    try {
      await focusService.startFocus(id);
      if (onUpdateResource) {
        await onUpdateResource(id, {
          resourceUrl: openUrl,
          resourceTitle: title || 'Learning Video',
          resourceType: 'YouTube',
          status: 'LEARNING',
        });
      }
    } catch (e) {
      // Fallback
    }

    window.open(openUrl, '_blank');
  };

  return (
    <div className={`rounded-2xl border transition-all p-6 space-y-4 ${
      status === 'MASTERED' 
        ? 'border-emerald-500/20 bg-emerald-950/5' 
        : 'border-slate-900 bg-slate-900/30 hover:border-slate-800'
    }`}>
      {/* Day, Difficulty & Estimated Time */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
            status === 'MASTERED' 
              ? 'bg-emerald-500/10 text-emerald-400' 
              : 'bg-slate-800 text-slate-300'
          }`}>
            {dayNumber}
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${difficultyColors[difficulty] || difficultyColors.Medium}`}>
            {difficulty}
          </span>
          <span className="text-[10px] text-slate-500 font-semibold">{estimatedStudyMinutes} mins</span>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-2">
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white transition-all"
              title="Edit Day Details"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveEdit}
                className="p-1.5 rounded-lg border border-emerald-500/30 hover:border-emerald-500 bg-emerald-950/20 text-emerald-400 transition-all"
                title="Save Changes"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                onClick={() => {
                  setFormData({ title, description });
                  setIsEditing(false);
                }}
                className="p-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/50 text-slate-400 hover:text-white transition-all"
                title="Cancel Edit"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <button
            onClick={() => onDeleteDay(id)}
            className="p-1.5 rounded-lg border border-slate-800 hover:border-red-500 bg-slate-900/50 text-slate-400 hover:text-red-400 transition-all"
            title="Delete Day"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Title & Description */}
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none"
          />
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-sky-500 focus:outline-none h-20 resize-none"
          />
        </div>
      ) : (
        <div className="space-y-1">
          <h4 className={`text-base font-bold transition-all ${status === 'MASTERED' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
            {title}
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed min-h-[1.5rem]">
            {description}
          </p>
        </div>
      )}

      {/* Objectives bulleted list */}
      {learningObjectives && learningObjectives.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Learning Objectives</span>
          <ul className="space-y-1 text-xs text-slate-400 pl-4 list-disc">
            {learningObjectives.map((obj, index) => (
              <li key={index} className="leading-relaxed">{obj}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Display error if status mapping fails study rules */}
      {error && (
        <p className="text-[10px] font-semibold text-red-400 bg-red-950/20 border border-red-500/20 p-2 rounded-lg leading-normal">
          {error}
        </p>
      )}

      {/* Progress & Study Status Display */}
      <div className="space-y-2 pt-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-500 font-semibold uppercase tracking-wider">Progress</span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statusColors[status] || statusColors.NOT_STARTED}`}>
            {status === 'NOT_STARTED' && 'Not Started'}
            {status === 'LEARNING' && 'Learning'}
            {status === 'NEEDS_REVISION' && 'Needs Revision'}
            {status === 'MASTERED' && 'Mastered'}
          </span>
        </div>
        
        <div className="flex justify-between items-center text-[10px] text-slate-400">
          <span>Active study time watch progress:</span>
          <span className="font-bold text-sky-400">
            {watchPercentage > 0 ? `Watched ${watchPercentage}%` : 'Not Started'}
          </span>
        </div>
        {watchPercentage > 0 && (
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div 
              className="h-full bg-sky-500 rounded-full"
              style={{ width: `${watchPercentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Resource selector Section */}
      <div className="pt-3 border-t border-slate-950/40 space-y-2.5">
        {targetWatchUrl ? (
          <div className="flex items-center justify-between gap-4 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{selectedResourceTitle || 'Linked Video'}</p>
              <p className="text-[10px] text-slate-500 mt-0.5 truncate">{targetWatchUrl}</p>
            </div>
            <button
              onClick={handleOpenVideo}
              className="flex items-center gap-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 px-3 py-1.5 text-xs font-bold border border-sky-500/20 shrink-0"
            >
              Continue Watching
            </button>
          </div>
        ) : (
          <button
            onClick={handleOpenVideo}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-800 bg-slate-950/40 hover:bg-slate-800 text-slate-400 hover:text-white px-4 py-2.5 text-xs font-bold transition-all"
          >
            <svg className="h-4 w-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.107C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.388.511a3.003 3.003 0 0 0-2.11 2.107C0 8.053 0 12 0 12s0 3.947.502 5.837a3.003 3.003 0 0 0 2.11 2.107C4.495 20.455 12 20.455 12 20.455s7.505 0 9.388-.511a3.003 3.003 0 0 0 2.11-2.107C24 15.947 24 12 24 12s0-3.947-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
            Find Video on YouTube
          </button>
        )}
      </div>

      {/* Day Status Actions & Override */}
      <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-950/40">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="rounded-lg border border-slate-800 bg-slate-950 text-slate-300 px-2 py-1 text-xs focus:border-sky-500 focus:outline-none"
          >
            <option value={status} disabled>{status.replace('_', ' ')} (Backend Calculated)</option>
            {status !== 'NEEDS_REVISION' && <option value="NEEDS_REVISION">Request Revision</option>}
          </select>
        </div>

        <div className="flex items-center gap-2">
          {status !== 'MASTERED' && (
            <button
              onClick={handleIUnderstood}
              className="rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 px-3 py-1 text-xs font-bold transition-all"
            >
              I Understood
            </button>
          )}

          <button
            onClick={() => alert('Quiz functionality will evaluate topic understanding and grant Mastered status upon passing.')}
            className="rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-800 text-slate-300 hover:text-white px-3 py-1 text-xs font-bold transition-all"
          >
            Take Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
