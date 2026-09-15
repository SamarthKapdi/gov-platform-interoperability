import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const WORKFLOW_ID = 'wf-demo-001';

const STATES = [
  'SUBMITTED',
  'IDENTITY_VERIFIED',
  'DEPT_B_VERIFICATION',
  'GRIEVANCE_CHECK',
  'OFFICIAL_REVIEW',
  'APPROVED',
  'SERVICE_ISSUED'
];

const Workflows = () => {
  const { token } = useAuth();
  const [workflow, setWorkflow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWorkflow = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/workflow/instances/${WORKFLOW_ID}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) setWorkflow(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflow();
    // Poll for live updates
    const interval = setInterval(fetchWorkflow, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async () => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:3000/api/workflow/instances/${WORKFLOW_ID}/advance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`${data.error}: ${data.reason || 'Transition failed'}`);
      } else {
        setWorkflow(data);
      }
    } catch (err) {
      setError('Failed to advance workflow');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return <div className="py-24 text-center animate-pulse text-slate-500">Loading orchestration engine...</div>;
  }

  if (!workflow) {
    return <div className="py-24 text-center text-slate-500">No workflow found.</div>;
  }

  const currentIndex = STATES.indexOf(workflow.current_state);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Orchestration</h1>
          <p className="text-sm text-slate-500">Persisted state machine executing across interconnected systems.</p>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-rose-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="space-y-12">
          
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
            <div>
              <div className="text-sm font-bold text-slate-900">Application: {workflow.application_id}</div>
              <div className="text-xs text-slate-500 font-mono mt-1">Instance: {workflow.id}</div>
            </div>
            <div className={`px-4 py-2 rounded-full text-xs font-bold shadow-sm ${
              currentIndex === STATES.length - 1 ? 'bg-emerald-100 text-emerald-800' :
              error ? 'bg-rose-100 text-rose-800' :
              'bg-amber-100 text-amber-800 animate-pulse'
            }`}>
              {workflow.current_state.replace(/_/g, ' ')}
            </div>
          </div>
          
          <div className="relative py-8 overflow-x-auto">
            <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-1/2 z-0" />
            
            <div className="relative z-10 flex justify-between min-w-[800px]">
              {STATES.map((state, index) => {
                const isCompleted = index < currentIndex;
                const isCurrent = index === currentIndex;
                const isFuture = index > currentIndex;
                
                return (
                  <div key={state} className="flex flex-col items-center w-32 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 border-white shadow-md z-10 transition-colors ${
                      isCompleted ? 'bg-emerald-500 text-white' :
                      isCurrent ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                      'bg-slate-200 text-slate-400'
                    }`}>
                      {isCompleted ? <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg> : <span className="font-bold text-sm">{index + 1}</span>}
                    </div>
                    <div className="mt-4 text-center">
                      <div className={`text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent ? 'text-amber-600' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                      }`}>
                        {state.replace(/_/g, ' ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="flex justify-between items-center pt-6 border-t border-slate-100">
            <div className="text-xs text-slate-500 font-mono">
              Last updated: {new Date(workflow.updated_at).toLocaleString()}
            </div>
            {currentIndex < STATES.length - 1 && (
              <button 
                onClick={handleAdvance}
                disabled={actionLoading}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg transition-colors shadow-lg disabled:opacity-50"
              >
                {actionLoading ? 'Advancing...' : 'Advance Workflow Step'}
              </button>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Workflows;
