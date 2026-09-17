import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { fetchWithAuth } from '../lib/api';

const SERVICES = {
  'Caste Certificate': 'DEPT_C',
  'Income Certificate': 'DEPT_C',
  'Domicile Certificate': 'DEPT_A',
  'Property Registration': 'DEPT_A'
};

export default function SubmitApplication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [serviceName, setServiceName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successId, setSuccessId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!serviceName) return;
    
    setLoading(true);
    setError('');

    const randomId = 'MS-2026-' + Math.floor(100000 + Math.random() * 900000);
    const department = SERVICES[serviceName];

    try {
      await fetchWithAuth('/api/workflow/instances', {
        method: 'POST',
        body: JSON.stringify({
          applicationId: randomId,
          citizenId: user.id || user.sub,
          workflowType: serviceName,
          serviceName: serviceName,
          department: department
        })
      });
      setSuccessId(randomId);
    } catch (err) {
      setError(err.message || 'Failed to submit application.');
      setLoading(false);
    }
  };

  if (successId) {
    return (
      <div className="max-w-2xl mx-auto mt-12 animate-fade-in">
        <div className="bg-white border-t-4 border-emerald-500 rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Submitted Successfully</h2>
          <p className="text-slate-600 mb-6">Your application has been logged and is now being processed.</p>
          <div className="bg-slate-50 border border-slate-200 rounded-lg py-4 px-6 mb-8 inline-block">
            <span className="text-sm text-slate-500 block mb-1">Application ID</span>
            <span className="text-xl font-mono font-bold text-slate-900">{successId}</span>
          </div>
          <div>
            <button
              onClick={() => navigate('/tracker')}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-md transition-colors"
            >
              Go to Unified Tracker
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <div className="bg-slate-900 text-white rounded-t-xl p-8 border-b-4 border-amber-500">
        <h1 className="text-3xl font-extrabold tracking-tight mb-2">Submit New Application</h1>
        <p className="text-slate-300">Apply for government services seamlessly across all departments.</p>
      </div>

      <div className="bg-white border border-slate-200 border-t-0 rounded-b-xl shadow-md p-8">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Select Service</label>
            <select
              className="w-full border border-slate-300 rounded-md p-3 text-slate-900 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all outline-none"
              required
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
            >
              <option value="">-- Choose a service --</option>
              {Object.keys(SERVICES).map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Processing Department</label>
            <input
              type="text"
              className="w-full border border-slate-200 rounded-md p-3 bg-slate-100 text-slate-500 cursor-not-allowed"
              disabled
              value={serviceName ? SERVICES[serviceName] : ''}
              placeholder="Auto-selected based on service"
            />
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !serviceName}
              className={`w-full font-bold py-3 px-4 rounded-md transition-all ${
                loading || !serviceName 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-sm'
              }`}
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
