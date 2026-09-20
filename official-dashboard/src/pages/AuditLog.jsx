import React, { useState, useEffect } from 'react';
import { getAuditLogs } from '../lib/api';

const AuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getAuditLogs();
        const logsArray = Array.isArray(data) ? data : (data.data || []);
        setLogs(logsArray);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => filterAction === 'ALL' || log.action === filterAction);
  const actions = ['ALL', ...new Set(logs.map(l => l.action))];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Security Audit Log</h1>
          <p className="text-sm text-slate-500">Immutable record of all cross-department access and consent changes.</p>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-bold text-slate-700">Filter by Action:</label>
        <select 
          value={filterAction} 
          onChange={(e) => setFilterAction(e.target.value)}
          className="border border-slate-300 rounded p-2 text-sm bg-white"
        >
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center animate-pulse text-slate-500">Loading audit ledger...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No audit events found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-900 text-slate-300 border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Timestamp</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Actor</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Action</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Entity Type</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Entity ID</th>
                  <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLogs.map((log) => (
                  <tr key={log.id || log.timestamp} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-500 text-xs">{new Date(log.timestamp).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-700">{log.actor}</span>
                      <span className="ml-2 text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">{log.role}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800">{log.action}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-xs">{log.entity_type || log.resource}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 truncate max-w-xs">{log.entity_id || '-'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        log.result === 'SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                        log.result === 'BLOCKED' ? 'bg-rose-100 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {log.result}
                      </span>
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

export default AuditLog;
