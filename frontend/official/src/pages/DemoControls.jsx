/* TEST FIXTURE - Development and Testing Utilities */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

const DemoControls = () => {
  const { user, token } = useAuth();
  const [feedback, setFeedback] = useState([]);

  if (user?.role !== 'admin') {
    return <div className="p-6 text-rose-600 font-bold">Access Denied</div>;
  }

  const addFeedback = (msg, type) => {
    setFeedback(prev => [{ msg, type, id: Date.now() }, ...prev].slice(0, 5));
  };

  const handleAction = async (name, url, method = 'POST', isGateway = false, bodyData = {}) => {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (isGateway && token) headers['Authorization'] = `Bearer ${token}`;
      
      const options = { method, headers };
      if (method === 'POST' || method === 'PUT' || method === 'PATCH') {
        options.body = JSON.stringify(bodyData);
      }
      
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      addFeedback(`${name} succeeded.`, 'success');
    } catch (err) {
      addFeedback(`${name} failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="bg-rose-100 border-l-4 border-rose-500 p-4 rounded shadow-sm mb-6">
        <p className="text-sm font-bold text-rose-700">DEMO CONTROLS - Administrative use only</p>
      </div>

      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Demo Control Centre</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <button onClick={() => handleAction('Simulate Dept B Outage', '/api/raw-deptB/admin/simulate-outage', 'POST', false, {})} className="bg-slate-900 text-white font-bold py-3 px-6 rounded hover:bg-slate-800 transition">
          Simulate Dept B Outage
        </button>
        <button onClick={() => handleAction('Restore Dept B', '/api/raw-deptB/admin/restore', 'POST', false, {})} className="bg-emerald-600 text-white font-bold py-3 px-6 rounded hover:bg-emerald-700 transition">
          Restore Dept B
        </button>
        <button onClick={() => handleAction('Create Test Application', '/api/workflow/instances', 'POST', true, { applicationId: 'TEST-APP-001', citizenId: 'usr-demo', serviceName: 'Test Service', department: 'DEPT_A' })} className="bg-amber-500 text-slate-900 font-bold py-3 px-6 rounded hover:bg-amber-600 transition">
          Create Test Application
        </button>
        <button onClick={() => handleAction('Trigger MDM Match', '/api/mdm/match', 'POST', false, {})} className="bg-blue-600 text-white font-bold py-3 px-6 rounded hover:bg-blue-700 transition">
          Trigger MDM Match
        </button>
        <button onClick={() => handleAction('Advance Demo Workflow', '/api/workflow/instances/wf-demo-001/advance', 'POST', true, {})} className="bg-indigo-600 text-white font-bold py-3 px-6 rounded hover:bg-indigo-700 transition">
          Advance Demo Workflow
        </button>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded p-4 h-64 overflow-y-auto">
        <h3 className="font-bold text-slate-700 mb-2">Action Feedback</h3>
        {feedback.length === 0 && <p className="text-sm text-slate-500">No actions executed yet.</p>}
        {feedback.map(f => (
          <div key={f.id} className={`text-sm py-1 ${f.type === 'error' ? 'text-rose-600' : 'text-emerald-600'}`}>
            {new Date(f.id).toLocaleTimeString()} - {f.msg}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DemoControls;
