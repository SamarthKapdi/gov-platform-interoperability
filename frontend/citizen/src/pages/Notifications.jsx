import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchWithAuth } from '../lib/api';

export default function Notifications() {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const citizenId = user.id || user.sub;
      
      const fetchEvents = async () => {
        try {
          const data = await fetchWithAuth(`/api/events/citizen/${citizenId}`);
          if (data && data.length > 0) {
            setEvents(data);
          } else {
            throw new Error('No specific events');
          }
        } catch (err) {
          try {
            const fallbackData = await fetchWithAuth('/api/events/recent?limit=20');
            setEvents(fallbackData || []);
          } catch (fallbackErr) {
            console.error(fallbackErr);
            setEvents([]);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchEvents();
      const interval = setInterval(fetchEvents, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const getEventIconInfo = (type) => {
    const t = type.toUpperCase();
    if (t.includes('CONSENT')) {
      return {
        color: 'bg-emerald-100 text-emerald-600 border-emerald-200',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      };
    } else if (t.includes('EXCEPTION') || t.includes('ERROR') || t.includes('FAILED')) {
      return {
        color: 'bg-rose-100 text-rose-600 border-rose-200',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      };
    } else {
      return {
        color: 'bg-blue-100 text-blue-600 border-blue-200',
        icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications & Activity</h1>
        <p className="mt-2 text-slate-600">Track all events, updates, and data access requests related to your profile.</p>
      </div>

      {loading ? (
        <div className="py-12 text-center animate-pulse text-slate-500">Loading events...</div>
      ) : events.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl border-dashed">
          No notifications found.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-4 md:ml-6 space-y-8 pb-8">
          {events.map((event, idx) => {
            const info = getEventIconInfo(event.event_type || '');
            let summary = '';
            
            if (event.payload) {
              try {
                const payloadObj = typeof event.payload === 'string' ? JSON.parse(event.payload) : event.payload;
                summary = payloadObj.summary || payloadObj.message || JSON.stringify(payloadObj);
              } catch (e) {
                summary = event.payload;
              }
            }

            return (
              <div key={event.id || idx} className="relative pl-8 md:pl-10">
                <div className={`absolute -left-5 md:-left-6 p-2 rounded-full border-2 bg-white ${info.color}`}>
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {info.icon}
                  </svg>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-2">
                    <span className="font-bold text-slate-900">{event.event_type}</span>
                    <span className="text-sm font-mono text-slate-500 mt-1 md:mt-0">
                      {new Date(event.timestamp || event.created_at).toLocaleString()}
                    </span>
                  </div>
                  {summary && (
                    <div className="text-slate-600 text-sm bg-slate-50 p-3 rounded-md border border-slate-100">
                      {summary}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
