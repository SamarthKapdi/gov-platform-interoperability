import React, { useEffect, useState } from 'react';

const Node = ({ title, subtitle, status, port, colorClass }) => (
  <div className={`p-4 rounded-xl border-2 shadow-lg flex flex-col items-center justify-center text-center ${colorClass} bg-white min-w-[150px]`}>
    <div className={`w-3 h-3 rounded-full mb-2 ${status === 'ONLINE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
    <div className="font-bold text-slate-900 text-sm">{title}</div>
    {subtitle && <div className="text-xs text-slate-500 mt-1">{subtitle}</div>}
    {port && <div className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded mt-2">:{port}</div>}
  </div>
);

const Architecture = () => {
  const [health, setHealth] = useState({});

  useEffect(() => {
    let mounted = true;

    const checkHealth = async () => {
      const services = {
        gateway: '/health',
        identity: '/api/auth/health',
        mdm: '/api/mdm/health',
        consent: '/api/consent/health',
        workflow: '/api/workflow/health',
        bus: '/api/events/health',
        audit: '/api/audit/health',
        adapterA: '/api/deptA/health',
        adapterB: '/api/deptB/health',
        adapterC: '/api/deptC/health',
        deptA: '/api/raw-deptA/health',
        deptB: '/api/raw-deptB/health',
        deptC: '/api/raw-deptC/health'
      };

      const newHealth = {
        citizen: 'ONLINE',
        official: 'ONLINE',
      };

      for (const [key, path] of Object.entries(services)) {
        try {
          // Fast timeout for health checks
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 2000);
          
          const res = await fetch(path, { signal: controller.signal });
          clearTimeout(timeoutId);
          
          newHealth[key] = res.ok ? 'ONLINE' : 'OFFLINE';
        } catch (e) {
          newHealth[key] = 'OFFLINE';
        }
      }

      if (mounted) {
        setHealth(newHealth);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-6 animate-fade-in p-6 bg-slate-50 min-h-full">
      <div className="border-b border-slate-200 pb-4 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Platform Architecture</h1>
        <p className="text-sm font-bold text-amber-600 tracking-wider mt-1">CONNECT EXISTING SYSTEMS. DO NOT REPLACE THEM.</p>
      </div>

      <div className="max-w-5xl mx-auto space-y-12 py-8 relative">
        {/* Presentation Layer */}
        <div className="flex flex-col items-center space-y-4">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Presentation Layer</h2>
          <div className="flex justify-center gap-8">
            <Node title="Citizen Portal" status={health.citizen} colorClass="border-slate-300" port="3005" />
            <Node title="Official Dashboard" status={health.official} colorClass="border-slate-300" port="4000" />
            <Node title="Admin Console" status="ONLINE" colorClass="border-slate-300" />
          </div>
        </div>

        {/* Gateway */}
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-0.5 bg-slate-300"></div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">API Gateway</h2>
          <Node title="Kong / Express Gateway" subtitle="Auth & Routing" status={health.gateway} colorClass="border-slate-800 bg-slate-50" port="3000" />
        </div>

        {/* Core Services */}
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-0.5 bg-slate-300"></div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Core Service Layer</h2>
          <div className="flex flex-wrap justify-center gap-4 border-2 border-slate-200 rounded-2xl p-6 bg-slate-100 w-full relative">
            <Node title="Identity Service" status={health.identity} colorClass="border-blue-400" port="3020" />
            <Node title="MDM Engine" subtitle="Golden Record" status={health.mdm} colorClass="border-amber-500" port="3030" />
            <Node title="Consent Manager" status={health.consent} colorClass="border-blue-400" port="3040" />
            <Node title="Workflow Engine" status={health.workflow} colorClass="border-blue-400" port="3060" />
            <Node title="Audit & Security" status={health.audit} colorClass="border-blue-400" port="3070" />
            
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-xs px-4 py-1 rounded-full font-mono">
              Event Bus (RabbitMQ / Kafka)
            </div>
          </div>
        </div>

        {/* Adapters */}
        <div className="flex flex-col items-center space-y-4 pt-4">
          <div className="h-8 w-0.5 bg-slate-300"></div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Adapter Layer (Interoperability)</h2>
          <div className="flex justify-center gap-8 w-full">
            <Node title="Adapter A" subtitle="JSON Normalizer" status={health.adapterA} colorClass="border-amber-400 bg-amber-50" port="3011" />
            <Node title="Adapter B" subtitle="XML to JSON" status={health.adapterB} colorClass="border-amber-400 bg-amber-50" port="3012" />
            <Node title="Adapter C" subtitle="Custom Protocol" status={health.adapterC} colorClass="border-amber-400 bg-amber-50" port="3013" />
          </div>
        </div>

        {/* Source Systems */}
        <div className="flex flex-col items-center space-y-4">
          <div className="flex justify-center gap-24 w-full">
            <div className="h-8 w-0.5 bg-slate-300"></div>
            <div className="h-8 w-0.5 bg-slate-300"></div>
            <div className="h-8 w-0.5 bg-slate-300"></div>
          </div>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Department Systems (Existing)</h2>
          <div className="flex justify-center gap-8 w-full">
            <Node title="Dept A: Civic" subtitle="REST / JSON" status={health.deptA} colorClass="border-slate-800 bg-slate-800 text-white" port="3001" />
            <Node title="Dept B: Employment" subtitle="SOAP / XML" status={health.deptB} colorClass="border-slate-800 bg-slate-800 text-white" port="3002" />
            <Node title="Dept C: Welfare" subtitle="Custom" status={health.deptC} colorClass="border-slate-800 bg-slate-800 text-white" port="3003" />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Architecture;
