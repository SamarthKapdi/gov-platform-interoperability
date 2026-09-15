import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

// Mocked fetcher for demonstration since we might not have a dedicated application service yet
const fetchApplications = async () => {
  return [
    {
      id: 'MS-2026-001842',
      service: 'State Employment Registration',
      department: 'DEPT_B',
      submittedAt: '2026-08-10T10:00:00Z',
      status: 'PENDING_APPROVAL',
      lastAction: 'Identity cross-verified with Civic Registry (Dept A)',
      slaStatus: 'ON_TRACK',
      workflowSteps: [
        { name: 'Application Received', status: 'COMPLETED', time: 'Aug 10' },
        { name: 'Identity Verified (Dept A)', status: 'COMPLETED', time: 'Aug 11' },
        { name: 'Consent Granted', status: 'COMPLETED', time: 'Aug 12' },
        { name: 'Official Review', status: 'CURRENT', time: 'Pending' },
        { name: 'Registration Issued', status: 'UPCOMING', time: '-' }
      ]
    },
    {
      id: 'MS-2025-992110',
      service: 'Civic Utility Subsidy',
      department: 'DEPT_C',
      submittedAt: '2025-11-05T09:30:00Z',
      status: 'COMPLETED',
      lastAction: 'Subsidy active and linked to Golden ID',
      slaStatus: 'COMPLETED',
      workflowSteps: [
        { name: 'Application Received', status: 'COMPLETED', time: 'Nov 05' },
        { name: 'Identity Verified', status: 'COMPLETED', time: 'Nov 06' },
        { name: 'Income Verified (Dept B)', status: 'COMPLETED', time: 'Nov 07' },
        { name: 'Approved', status: 'COMPLETED', time: 'Nov 08' }
      ]
    }
  ];
};

export default function Tracker() {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApplications().then(data => {
      setApplications(data);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800';
      case 'PENDING_APPROVAL': return 'bg-amber-100 text-amber-800';
      case 'REJECTED': return 'bg-rose-100 text-rose-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Unified Application Tracker</h1>
        <p className="mt-2 text-slate-600 max-w-2xl">Monitor your government service requests across all departments in one place. No more logging into separate portals to check your status.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse text-slate-500">Loading applications...</div>
      ) : (
        <div className="space-y-8">
          {applications.map(app => (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center space-x-3 mb-1">
                    <span className="font-mono text-sm font-bold text-slate-500">{app.id}</span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-900">{app.service}</h2>
                  <div className="text-sm text-slate-600 mt-1">
                    Processing Department: <span className="font-semibold text-slate-800">{app.department}</span>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="text-slate-500">Submitted</div>
                  <div className="font-semibold text-slate-800">{new Date(app.submittedAt).toLocaleDateString()}</div>
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6">Workflow Progress</h3>
                
                <div className="relative">
                  <div className="absolute top-4 left-0 w-full h-1 bg-slate-100 rounded-full" />
                  
                  <div className="relative flex justify-between">
                    {app.workflowSteps.map((step, idx) => (
                      <div key={idx} className="flex flex-col items-center w-1/5 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 border-4 border-white ${
                          step.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 
                          step.status === 'CURRENT' ? 'bg-amber-500 text-white ring-4 ring-amber-100' : 
                          'bg-slate-200 text-slate-400'
                        }`}>
                          {step.status === 'COMPLETED' ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                          ) : (
                            <span className="text-xs font-bold">{idx + 1}</span>
                          )}
                        </div>
                        <div className="mt-3 text-center">
                          <div className={`text-xs font-bold ${step.status === 'CURRENT' ? 'text-slate-900' : 'text-slate-500'}`}>{step.name}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">{step.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="mt-8 bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-start space-x-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <div>
                    <div className="text-sm font-bold text-blue-900">Latest Update</div>
                    <div className="text-sm text-blue-800 mt-1">{app.lastAction}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
