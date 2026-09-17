import { useState, useEffect } from 'react';
import { getCitizenConsents, grantConsent, revokeConsent } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function Consent() {
  const { user } = useAuth();
  const [consents, setConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // New Consent Form State
  const [showNew, setShowNew] = useState(false);
  const [requestingDept, setRequestingDept] = useState('');
  const [grantingDept, setGrantingDept] = useState('');
  const [purpose, setPurpose] = useState('');
  const [dataScope, setDataScope] = useState('');

  const fetchConsents = async () => {
    try {
      const data = await getCitizenConsents((user.id || user.sub));
      setConsents(data);
    } catch (err) {
      setError('Failed to load consent records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id || user?.sub) fetchConsents();
  }, [user]);

  const handleGrant = async (e) => {
    e.preventDefault();
    try {
      await grantConsent({
        citizenId: (user.id || user.sub),
        grantingDept: requestingDept,
        requestingDept,
        dataScope,
        purpose
      });
      setShowNew(false);
      fetchConsents();
    } catch (err) {
      alert('Failed to grant consent');
    }
  };

  const handleRevoke = async (id) => {
    if (window.confirm('Are you sure you want to revoke this access? This may block ongoing official requests.')) {
      try {
        await revokeConsent(id);
        fetchConsents();
      } catch (err) {
        alert('Failed to revoke consent');
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Consent Centre</h1>
          <p className="mt-2 text-slate-600 max-w-2xl">You stay in control of cross-department data sharing. MAHA-SETU follows the DEPA framework, ensuring officials only see the source data you explicitly permit.</p>
        </div>
        <button
          onClick={() => setShowNew(!showNew)}
          className="mt-4 md:mt-0 bg-blue-800 hover:bg-blue-900 text-white px-5 py-2.5 rounded-md font-medium text-sm transition-colors shadow-sm"
        >
          {showNew ? 'Cancel' : '+ Grant New Access'}
        </button>
      </div>

      {showNew && (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 mb-8 border-t-4 border-t-blue-800">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Grant Data Access</h3>
          <form onSubmit={handleGrant} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Requesting Department</label>
              <select className="w-full border border-slate-300 rounded-md p-2" required value={requestingDept} onChange={e => {
                setRequestingDept(e.target.value);
                setGrantingDept(e.target.value);
              }}>
                <option value="">Select...</option>
                <option value="DEPT_A">Department A (Civic)</option>
                <option value="DEPT_B">Department B (Employment)</option>
                <option value="DEPT_C">Department C (Welfare)</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Data Scope</label>
              <select className="w-full border border-slate-300 rounded-md p-2" required value={dataScope} onChange={e => setDataScope(e.target.value)}>
                <option value="">Select...</option>
                <option value="employment_status">Employment Status</option>
                <option value="identity_verification">Identity Verification</option>
                <option value="grievance_records">Grievance Records</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Purpose of Access</label>
              <input type="text" className="w-full border border-slate-300 rounded-md p-2" placeholder="e.g. Application Processing" required value={purpose} onChange={e => setPurpose(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-md transition-colors">
                Authorize Access
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center animate-pulse text-slate-500">Loading consent records...</div>
      ) : error ? (
        <div className="py-12 text-center text-rose-600">{error}</div>
      ) : consents.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
          No active or past consent grants found.
        </div>
      ) : (
        <div className="space-y-4">
          {consents.map((c) => (
            <div key={c.id} className={`bg-white border rounded-xl overflow-hidden shadow-sm transition-all ${c.status === 'ACTIVE' ? 'border-emerald-200 border-l-4 border-l-emerald-500' : 'border-slate-200 opacity-75'}`}>
              <div className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center space-x-3">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                      {c.status}
                    </span>
                    <span className="text-sm font-mono text-slate-500 truncate max-w-[150px] sm:max-w-xs">{c.id}</span>
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Requesting</span>
                      <span className="font-semibold text-slate-800">{c.requesting_dept}</span>
                    </div>
                    <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path></svg>
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Providing</span>
                      <span className="font-semibold text-slate-800">{c.granting_dept}</span>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Purpose:</span> {c.purpose}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-sm text-slate-600"><span className="font-semibold text-slate-700">Scope:</span> <span className="font-mono bg-slate-100 px-1 rounded">{c.data_scope}</span></span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end space-y-3 w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0">
                  <div className="text-xs text-slate-500 text-right">
                    <div>Granted: {new Date(c.granted_at).toLocaleDateString()}</div>
                    {c.status === 'ACTIVE' ? (
                      <div>Expires: {new Date(c.expires_at).toLocaleDateString()}</div>
                    ) : (
                      <div className="text-rose-600 font-bold">Revoked: {new Date(c.revoked_at).toLocaleDateString()}</div>
                    )}
                  </div>
                  {c.status === 'ACTIVE' && (
                    <button
                      onClick={() => handleRevoke(c.id)}
                      className="w-full md:w-auto bg-white border border-rose-600 text-rose-600 hover:bg-rose-50 px-4 py-1.5 rounded-md text-sm font-bold transition-colors"
                    >
                      REVOKE ACCESS
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
