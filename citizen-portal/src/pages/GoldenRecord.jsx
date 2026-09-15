import { useState, useEffect } from 'react';
import { getCitizenProfile } from '../lib/api';
import { useAuth } from '../hooks/useAuth';

export default function GoldenRecord() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getCitizenProfile((user.id || user.sub));
        setProfile(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (user?.id || user?.sub) fetchProfile();
  }, [user]);

  if (loading) return <div className="py-12 text-center animate-pulse text-slate-500">Loading unified record...</div>;
  if (error) return <div className="py-12 text-center text-rose-600">Error: {error}</div>;
  if (!profile || !profile.citizen) return <div className="py-12 text-center text-slate-500">No record found.</div>;

  const c = profile.citizen;
  const links = profile.departmentLinks || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Your Unified Government Record</h1>
          <p className="mt-2 text-slate-600 max-w-2xl">This Golden Record is dynamically resolved by the MAHA-SETU Master Data Management engine. It unifies your fragmented identities across departments without copying data into a central database.</p>
        </div>
        <div className="mt-4 md:mt-0 flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-md">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <span className="text-sm font-bold text-emerald-800">IDENTITY RESOLVED</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-amber-500 opacity-20"></div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Golden Citizen ID</h3>
              <p className="font-mono text-xl text-amber-400 font-bold">{c.canonical_id}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
                <div className="text-lg font-semibold text-slate-900">{c.name}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Birth</label>
                <div className="text-lg font-semibold text-slate-900">{c.date_of_birth}</div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mobile</label>
                <div className="text-lg font-semibold text-slate-900">{c.mobile}</div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-500">Match Confidence</span>
                  <span className="text-sm font-bold text-emerald-600">{(c.confidence_score * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${c.confidence_score * 100}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-6 border-b border-slate-100 pb-2">Source Provenance</h3>
            <div className="space-y-4">
              {links.map((link) => {
                const deptData = profile[link.department];
                return (
                  <div key={link.department} className="border border-slate-200 rounded-lg p-4 flex flex-col sm:flex-row gap-4 justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded">{link.department}</span>
                        <span className="font-mono text-sm text-slate-500">{link.department_id}</span>
                      </div>
                      <div className="text-sm text-slate-700">
                        Linked via: <span className="font-mono bg-slate-50 px-1 py-0.5 rounded border border-slate-200">{link.department_id_field}</span>
                      </div>
                    </div>
                    {deptData ? (
                      <div className="text-sm bg-slate-50 p-3 rounded border border-slate-100 w-full sm:w-auto">
                        <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Source Record</div>
                        <pre className="text-xs font-mono text-slate-600 overflow-x-auto whitespace-pre-wrap break-all max-w-[200px]">{JSON.stringify(deptData, null, 2)}</pre>
                      </div>
                    ) : (
                      <div className="text-sm bg-rose-50 text-rose-700 border border-rose-200 px-3 py-1 rounded font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        Access Blocked
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-md text-sm text-blue-800 flex items-start space-x-3">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>Because you are the citizen, you can see all your source records. When an official views this Golden Record, they will only see the source records for which you have granted explicit consent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
