import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getExceptions, retryException } from '../lib/api';

const Exceptions = () => {
  const [exceptions, setExceptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchExceptions = async () => {
    try {
      const data = await getExceptions();
      setExceptions(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExceptions();
  }, []);

  const handleRetry = async (id) => {
    setActionLoading(id);
    try {
      await retryException(id);
      await fetchExceptions();
    } catch (err) {
      alert('Retry failed');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Integration Exceptions</h1>
          <p className="text-sm text-slate-500">Dead-letter queue for failed cross-department event deliveries.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-slate-500">Loading dead-letter queue...</div>
        ) : exceptions.length === 0 ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <svg className="w-12 h-12 text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            <h3 className="text-lg font-bold text-slate-900">Zero Active Exceptions</h3>
            <p className="text-sm">All cross-department integrations are functioning normally.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Exception ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Failure Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Department</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Retries</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exceptions.map((exc) => (
                  <tr key={exc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-600">{exc.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-900">{exc.type}</td>
                    <td className="px-6 py-4"><span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">{exc.department}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${exc.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {exc.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{exc.retry_count} / 3</td>
                    <td className="px-6 py-4">
                      {exc.status !== 'RESOLVED' && (
                        <button
                          onClick={() => handleRetry(exc.id)}
                          disabled={actionLoading === exc.id}
                          className="bg-amber-100 hover:bg-amber-200 text-amber-800 px-3 py-1.5 rounded font-bold text-xs transition-colors disabled:opacity-50"
                        >
                          {actionLoading === exc.id ? 'Retrying...' : 'FORCE RETRY'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Exceptions;
