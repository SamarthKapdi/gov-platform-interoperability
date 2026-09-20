import React, { useState, useEffect } from 'react';

const Interoperability = () => {
  const [health, setHealth] = useState({
    A: { status: 'UNKNOWN', latency: 0 },
    B: { status: 'UNKNOWN', latency: 0 },
    C: { status: 'UNKNOWN', latency: 0 }
  });
  const [expanded, setExpanded] = useState(null);
  const [data, setData] = useState({});

  useEffect(() => {
    const checkHealth = async (id, port) => {
      const start = Date.now();
      try {
        const res = await fetch(`http://localhost:${port}/health`);
        if (res.ok) setHealth(prev => ({ ...prev, [id]: { status: 'ONLINE', latency: Date.now() - start, time: new Date().toLocaleTimeString() } }));
        else throw new Error('Not OK');
      } catch (err) {
        setHealth(prev => ({ ...prev, [id]: { status: 'OFFLINE', latency: 0, time: new Date().toLocaleTimeString() } }));
      }
    };
    checkHealth('A', 3001);
    checkHealth('B', 3002);
    checkHealth('C', 3003);
    
    const interval = setInterval(() => {
      checkHealth('A', 3001);
      checkHealth('B', 3002);
      checkHealth('C', 3003);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchAdapterData = async (dept) => {
    if (expanded === dept) {
      setExpanded(null);
      return;
    }
    setExpanded(dept);
    if (!data[dept]) {
      try {
        let rawPort, normPort, rawPath, normPath;
        if (dept === 'A') {
          rawPort = 3001; normPort = 3011; rawPath = '/registry/citizens'; normPath = '/citizens';
        } else if (dept === 'B') {
          rawPort = 3002; normPort = 3012; rawPath = '/registry/applicants'; normPath = '/citizens';
        } else {
          rawPort = 3003; normPort = 3013; rawPath = '/registry/beneficiaries'; normPath = '/citizens';
        }

        const [rawRes, normRes] = await Promise.all([
          fetch(`http://localhost:${rawPort}${rawPath}`),
          fetch(`http://localhost:${normPort}${normPath}`)
        ]);

        if (!rawRes.ok || !normRes.ok) throw new Error('Failed to fetch from department or adapter');

        const rawText = await rawRes.text();
        const normJson = await normRes.json();

        // Just take the first record to keep the UI clean
        let rawDisplay = rawText;
        if (rawText.startsWith('[')) {
          const arr = JSON.parse(rawText);
          rawDisplay = JSON.stringify(arr[0], null, 2);
        } else if (rawText.includes('<Applicant>')) {
          rawDisplay = rawText.substring(0, rawText.indexOf('</Applicant>') + 12) + '\n...';
        }

        setData(prev => ({ 
          ...prev, 
          [dept]: { 
            raw: rawDisplay, 
            normalized: normJson[0] 
          } 
        }));
      } catch (e) {
        setData(prev => ({ 
          ...prev, 
          [dept]: { 
            raw: `ERROR: ${e.message}. Department may be down.`, 
            normalized: { error: 'Adapter failed to process data' } 
          } 
        }));
      }
    }
  };

  const depts = [
    { id: 'A', name: 'Department of Civic Services (DEPT_A)', protocol: 'REST / JSON', port: 3001 },
    { id: 'B', name: 'State Employment Registry (DEPT_B)', protocol: 'LEGACY XML', port: 3002 },
    { id: 'C', name: 'Welfare & Benefits (DEPT_C)', protocol: 'CUSTOM SCHEMA', port: 3003 }
  ];

  return (
    <div className="space-y-6 animate-fade-in p-6">
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Interoperability Centre</h1>
        <p className="text-sm text-slate-500">Live data transformation pipeline and department integration status.</p>
      </div>

      <div className="space-y-4">
        {depts.map(dept => (
          <div key={dept.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div 
              className="p-4 flex flex-col md:flex-row justify-between items-center cursor-pointer hover:bg-slate-50 transition"
              onClick={() => fetchAdapterData(dept.id)}
            >
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${health[dept.id].status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                <div>
                  <h3 className="font-bold text-slate-900">{dept.name}</h3>
                  <p className="text-xs text-slate-500 font-mono">Port {dept.port} | {dept.protocol}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-slate-400 uppercase">Last Request</div>
                <div className="text-sm font-mono text-slate-700">{health[dept.id].time || 'Pending...'}</div>
                <div className="text-xs font-mono text-slate-500 mt-1">{health[dept.id].latency}ms latency</div>
              </div>
            </div>
            
            {expanded === dept.id && (
              <div className="border-t border-slate-200 p-6 bg-slate-50 flex flex-col md:flex-row gap-6">
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Raw Source Data</h4>
                  <pre className="bg-slate-900 text-slate-300 p-4 rounded text-xs font-mono overflow-auto h-48">
                    {data[dept.id] ? (typeof data[dept.id].raw === 'string' ? data[dept.id].raw : JSON.stringify(data[dept.id].raw, null, 2)) : 'Loading...'}
                  </pre>
                </div>
                <div className="flex items-center justify-center">
                  <svg className="w-8 h-8 text-amber-500 rotate-90 md:rotate-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Canonical JSON (Adapter Output)</h4>
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded text-xs font-mono overflow-auto h-48">
                    {data[dept.id] ? JSON.stringify(data[dept.id].normalized, null, 2) : 'Loading...'}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Interoperability;
