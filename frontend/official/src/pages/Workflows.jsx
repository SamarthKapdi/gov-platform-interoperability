import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getWorkflows } from '../lib/api';

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
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchWorkflowsList = async () => {
    try {
      const data = await getWorkflows();
      const wfs = Array.isArray(data) ? data : (data.data || []);
      setWorkflows(wfs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsList();
    const interval = setInterval(fetchWorkflowsList, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAdvance = async (id) => {
    setActionLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/workflow/instances/${id}/advance`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (!res.ok) {
        setError(`${data.error}: ${data.reason || 'Transition failed'}`);
      } else {
        setWorkflows(prev => prev.map(w => w.id === id ? data : w));
      }
    } catch (err) {
      setError('Failed to advance workflow');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWorkflows = workflows.filter(w => {
    if (statusFilter === 'All') return true;
    if (statusFilter === 'Completed' && w.current_state === 'SERVICE_ISSUED') return true;
    if (statusFilter === 'In Progress' && w.current_state !== 'SUBMITTED' && w.current_state !== 'SERVICE_ISSUED') return true;
    return w.current_state === statusFilter.toUpperCase().replace(' ', '_');
  });

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workflow Orchestration</h1>
          <p className="text-sm text-slate-500">Persisted state machine executing across interconnected systems.</p>
        </div>
      </div>

      <div className="flex space-x-2">
        {['All', 'SUBMITTED', 'In Progress', 'APPROVED', 'Completed'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded text-sm font-bold ${statusFilter === status ? 'bg-amber-500 text-slate-900' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            {status}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded shadow-sm">
          <div className="flex">
            <svg className="h-5 w-5 text-rose-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            <p className="text-sm font-bold text-rose-700">{error}</p>
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center animate-pulse text-slate-500">Loading orchestration engine...</div>
      ) : filteredWorkflows.length === 0 ? (
        <div className="py-24 text-center text-slate-500 bg-white rounded-xl border border-slate-200">No workflows found.</div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
          {filteredWorkflows.map(workflow => {
            const currentIndex = STATES.indexOf(workflow.current_state);
            const isExpanded = expandedId === workflow.id;

            return (
              <div key={workflow.id} className="transition-colors hover:bg-slate-50">
                <div 
                  className="p-6 flex flex-col md:flex-row justify-between items-start md:items-center cursor-pointer"
                  onClick={() => setExpandedId(isExpanded ? null : workflow.id)}
                >
                  <div className="flex items-center space-x-4">
                    <div>
                      <div className="text-sm font-bold text-slate-900">{workflow.application_id || 'Application'}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">ID: {workflow.id} | Citizen: {workflow.citizen_id}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 mt-4 md:mt-0">
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status</div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-sm mt-1 ${
                        currentIndex === STATES.length - 1 ? 'bg-emerald-100 text-emerald-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {workflow.current_state.replace(/_/g, ' ')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Updated</div>
                      <div className="text-xs text-slate-600 font-mono mt-1">{new Date(workflow.updated_at).toLocaleString()}</div>
                    </div>
                    <svg className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 bg-slate-50 border-t border-slate-100">
                    <div className="relative py-8 overflow-x-auto">
                      <div className="absolute top-1/2 left-10 right-10 h-1 bg-slate-200 -translate-y-1/2 z-0" />
                      
                      <div className="relative z-10 flex justify-between min-w-[800px]">
                        {STATES.map((state, index) => {
                          const isCompleted = index < currentIndex;
                          const isCurrent = index === currentIndex;
                          
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
                    
                    <div className="flex justify-end pt-6 border-t border-slate-200 mt-4">
                      {currentIndex < STATES.length - 1 && (
                        <button 
                          onClick={() => handleAdvance(workflow.id)}
                          disabled={actionLoading}
                          className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow-lg disabled:opacity-50 text-sm"
                        >
                          {actionLoading ? 'Advancing...' : 'Advance Step'}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Workflows;
