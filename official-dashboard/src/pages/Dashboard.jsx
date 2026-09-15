import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

const StatCard = ({ title, value, icon, trend, alert }) => (
  <div className={`bg-white rounded-xl border ${alert ? 'border-rose-300 shadow-rose-100' : 'border-slate-200 shadow-sm'} p-6 relative overflow-hidden`}>
    {alert && <div className="absolute top-0 right-0 w-2 h-full bg-rose-500"></div>}
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-3xl font-extrabold text-slate-900">{value}</h3>
        {trend && <p className={`text-sm font-medium mt-2 ${trend.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>{trend} from yesterday</p>}
      </div>
      <div className={`p-3 rounded-lg ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>
        {icon}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  
  // Mock data for the Operations Pulse timeline
  const pulseEvents = [
    { time: '14:32:24', type: 'SUCCESS', title: 'Application MS-2026-001842 Approved', actor: 'Official A' },
    { time: '14:32:18', type: 'CONSENT', title: 'Consent Granted by MH-GOLD-000184', actor: 'Dept A → Dept B' },
    { time: '14:28:05', type: 'EXCEPTION', title: 'Legacy XML Timeout on Dept B', actor: 'System' },
    { time: '14:25:11', type: 'INFO', title: 'MDM Identity Resolution Created Record', actor: 'System' },
    { time: '14:20:00', type: 'SUCCESS', title: 'Workflow Step Advanced', actor: 'Official B' }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* Platform Status Banner */}
      <div className="bg-slate-900 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center shadow-lg border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500 opacity-10"></div>
        <div className="relative z-10 flex items-center space-x-4 mb-4 md:mb-0">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <div className="w-4 h-4 bg-emerald-500 rounded-full animate-ping absolute"></div>
            <div className="w-4 h-4 bg-emerald-500 rounded-full relative z-10"></div>
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">ALL SYSTEMS OPERATIONAL</h2>
            <p className="text-slate-400 text-sm">MAHA-SETU Platform Health is nominal</p>
          </div>
        </div>
        <div className="relative z-10 flex space-x-3">
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">API GATEWAY</span>
            <span className="text-sm font-mono text-emerald-400">12ms</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">MDM ENGINE</span>
            <span className="text-sm font-mono text-emerald-400">45ms</span>
          </div>
          <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 flex flex-col items-center">
            <span className="text-xs text-slate-400 font-bold">CONSENT</span>
            <span className="text-sm font-mono text-emerald-400">18ms</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Active Workflows" 
          value="1,432" 
          trend="+12%"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>} 
        />
        <StatCard 
          title="SLA At Risk" 
          value="24" 
          alert={true}
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>} 
        />
        <StatCard 
          title="Integration Exceptions" 
          value="3" 
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>} 
        />
        <StatCard 
          title="Consent Events" 
          value="8,901" 
          trend="+5%"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Connected Interoperability Departments</h3>
            <div className="space-y-4">
              {[
                { id: 'DEPT_A', name: 'Department of Civic Services', type: 'REST / JSON', latency: '12ms', status: 'ONLINE' },
                { id: 'DEPT_B', name: 'State Employment Registry', type: 'LEGACY XML', latency: '48ms', status: 'ONLINE' },
                { id: 'DEPT_C', name: 'Welfare & Benefits', type: 'CUSTOM SOAP', latency: '85ms', status: 'DEGRADED' },
              ].map(dept => (
                <div key={dept.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="flex items-center space-x-4 mb-2 sm:mb-0">
                    <div className={`w-3 h-3 rounded-full ${dept.status === 'ONLINE' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                    <div>
                      <div className="font-bold text-slate-900">{dept.name}</div>
                      <div className="text-xs text-slate-500 font-mono mt-1">{dept.id} | {dept.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-400">LATENCY</div>
                      <div className="font-mono text-slate-700">{dept.latency}</div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-800 font-bold text-sm bg-blue-50 px-3 py-1 rounded border border-blue-200">
                      View Adapter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden h-full">
            <div className="bg-slate-900 p-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest flex items-center">
                <svg className="w-4 h-4 mr-2 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Operational Pulse
              </h3>
            </div>
            <div className="p-4 space-y-0 relative">
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-slate-100 z-0"></div>
              {pulseEvents.map((evt, i) => (
                <div key={i} className="relative z-10 flex items-start space-x-4 py-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${
                      evt.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                      evt.type === 'CONSENT' ? 'bg-blue-100 text-blue-600' :
                      evt.type === 'EXCEPTION' ? 'bg-rose-100 text-rose-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {evt.type === 'SUCCESS' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                      {evt.type === 'CONSENT' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>}
                      {evt.type === 'EXCEPTION' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>}
                      {evt.type === 'INFO' && <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{evt.title}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1 py-0.5 rounded">{evt.time}</span>
                      <span className="text-xs text-slate-500">{evt.actor}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
