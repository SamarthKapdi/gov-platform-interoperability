import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchWithAuth } from '../lib/api';

const WORKFLOW_STEPS = [
  'SUBMITTED',
  'IDENTITY_VERIFIED',
  'DEPT_B_VERIFICATION',
  'GRIEVANCE_CHECK',
  'OFFICIAL_REVIEW',
  'APPROVED',
  'SERVICE_ISSUED'
];

export default function Tracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const citizenId = user.id || user.sub;
      fetchWithAuth(`/api/workflow/instances?citizen_id=${citizenId}`)
        .then(data => {
          setApplications(data || []);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [user]);

  const getStatusColor = (status) => {
    if (status === 'SERVICE_ISSUED' || status === 'APPROVED') return 'bg-emerald-100 text-emerald-800';
    if (status === 'REJECTED') return 'bg-rose-100 text-rose-800';
    return 'bg-amber-100 text-amber-800';
  };

  const getStepIndex = (state) => {
    return WORKFLOW_STEPS.indexOf(state);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Unified Application Tracker</h1>
        <p className="mt-2 text-slate-600 max-w-2xl">Monitor your government service requests across all departments in one place.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse text-slate-500">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
          No applications found.
        </div>
      ) : (
        <div className="space-y-8">
          {applications.map(app => {
            const currentIndex = getStepIndex(app.current_state);
            return (
              <div key={app.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <span className="font-mono text-sm font-bold text-slate-500">{app.application_id}</span>
                      <span className={`px-2.5 py-1 text-xs font-bold rounded-full tracking-wider ${getStatusColor(app.current_state)}`}>
                        {app.current_state.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900">{app.workflow_type || 'Service Application'}</h2>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-slate-500">Submitted</div>
                    <div className="font-semibold text-slate-800">{new Date(app.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                
                <div className="p-6 overflow-x-auto">
                  <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Workflow Progress</h3>
                  
                  <div className="relative min-w-[800px]">
                    <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full" />
                    
                    <div className="relative flex justify-between">
                      {WORKFLOW_STEPS.map((step, idx) => {
                        let stepStatus = 'UPCOMING';
                        if (currentIndex > idx) stepStatus = 'COMPLETED';
                        else if (currentIndex === idx) stepStatus = 'CURRENT';

                        return (
                          <div key={idx} className="flex flex-col items-center w-32 relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-white ${
                              stepStatus === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                              stepStatus === 'CURRENT' ? 'bg-amber-500 text-white ring-4 ring-amber-100' : 
                              'bg-slate-200 text-slate-400'
                            }`}>
                              {stepStatus === 'COMPLETED' ? (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                              ) : (
                                <span className="text-xs font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <div className="mt-3 text-center">
                              <div className={`text-[10px] font-bold ${stepStatus === 'CURRENT' ? 'text-slate-900' : 'text-slate-500'}`}>{step.replace(/_/g, ' ')}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <div>
                      <div className="text-sm font-bold text-blue-900">Previous State</div>
                      <div className="text-sm text-blue-800 mt-1">{app.previous_state ? app.previous_state.replace(/_/g, ' ') : 'None'}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
