import React, { useState } from 'react';
import { getCitizenRecord } from '../lib/api';

const Search = () => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await getCitizenRecord(query);
      setResult(data);
    } catch (err) {
      if (err.message.includes('403')) {
        setError('ACCESS BLOCKED: You do not have consent to view this cross-department record.');
      } else {
        setError('No citizen found or server unavailable.');
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview' },
    { id: 'applications', name: 'Applications' },
    { id: 'source', name: 'Source Records' },
    { id: 'consent', name: 'Consent' }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-end border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Citizen 360</h1>
          <p className="text-sm text-slate-500">Search and view unified citizen records across all connected departments.</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-4 max-w-3xl">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">Search</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm transition-colors"
                placeholder="Search by Golden ID, Name, or Mobile (Try: citizen1 or 1234567890)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {error && (
        <div className={`p-4 rounded-lg border-l-4 ${error.includes('BLOCKED') ? 'bg-rose-50 border-rose-500 text-rose-800' : 'bg-amber-50 border-amber-500 text-amber-800'}`}>
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className={`h-5 w-5 ${error.includes('BLOCKED') ? 'text-rose-500' : 'text-amber-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-bold">{error}</p>
              {error.includes('BLOCKED') && (
                <p className="text-xs mt-1 text-rose-600">The citizen has either not granted consent or has revoked consent for this operation. This security feature is working as intended.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {result && result.citizen && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-900 text-white p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-amber-500 opacity-20"></div>
            <div className="flex flex-col md:flex-row justify-between md:items-end relative z-10">
              <div>
                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Golden Citizen Record</h2>
                <div className="flex items-center space-x-4">
                  <h3 className="text-3xl font-extrabold">{result.citizen.name}</h3>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full border border-emerald-500/30">VERIFIED</span>
                </div>
                <div className="mt-2 text-slate-300 font-mono">ID: {result.citizen.canonical_id}</div>
              </div>
              <div className="mt-4 md:mt-0 flex space-x-6 text-sm">
                <div>
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">DOB</div>
                  <div>{result.citizen.date_of_birth}</div>
                </div>
                <div>
                  <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Mobile</div>
                  <div>{result.citizen.mobile}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-b border-slate-200 bg-slate-50 px-6">
            <nav className="-mb-px flex space-x-8">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-amber-500 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">MDM Resolution Score</h4>
                    <div className="text-2xl font-bold text-emerald-600">{(result.citizen.confidence_score * 100).toFixed(1)}%</div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${result.citizen.confidence_score * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Connected Source Systems</h4>
                    <div className="text-2xl font-bold text-slate-900">{result.departmentLinks?.length || 0}</div>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Active Consents</h4>
                    <div className="text-2xl font-bold text-slate-900">1</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'source' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex space-x-3 mb-6">
                  <svg className="w-5 h-5 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <p className="text-sm text-blue-800">
                    <strong>Interoperability active.</strong> This view demonstrates how the adapter layer normalizes fragmented legacy identifiers into the Golden Record.
                  </p>
                </div>
                
                {result.departmentLinks?.map(link => (
                  <div key={link.department} className="border border-slate-200 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start gap-4 hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded">{link.department}</span>
                        <span className="text-sm font-mono text-slate-500">{link.department_id}</span>
                      </div>
                      <div className="text-sm text-slate-600 mt-2">
                        Matched on: <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-800">{link.department_id_field}</span>
                      </div>
                    </div>
                    {result[link.department] ? (
                      <div className="bg-slate-900 text-emerald-400 p-3 rounded-md w-full md:w-auto overflow-x-auto">
                        <pre className="text-[10px] font-mono leading-relaxed">{JSON.stringify(result[link.department], null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="bg-rose-50 text-rose-700 border border-rose-200 px-4 py-2 rounded-md text-sm font-bold flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Access Blocked by Citizen Consent
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {(activeTab === 'applications' || activeTab === 'consent') && (
              <div className="text-center py-12 bg-slate-50 border border-slate-200 border-dashed rounded-lg">
                <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                <h3 className="text-sm font-bold text-slate-900">No data available</h3>
                <p className="text-sm text-slate-500 mt-1">This module is connected to the event bus and will populate when activity occurs.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Search;
