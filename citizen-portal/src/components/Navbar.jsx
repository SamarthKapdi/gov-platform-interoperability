import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navItemClass = (path) => `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
    location.pathname === path ? 'bg-slate-800 text-amber-500' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
  }`;

  return (
    <nav className="bg-slate-900 shadow-lg border-b border-amber-500/20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-500 rounded-sm flex items-center justify-center font-bold text-slate-900 shadow-sm">
                M
              </div>
              <span className="font-extrabold text-xl tracking-wide text-white">MAHA-SETU</span>
            </div>
            {user && (
              <div className="hidden md:flex space-x-1">
                <Link to="/record" className={navItemClass('/record')}>Golden Record</Link>
                <Link to="/tracker" className={navItemClass('/tracker')}>Unified Tracker</Link>
                <Link to="/consent" className={navItemClass('/consent')}>Consent Centre</Link>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-6">
            {user && (
              <>
                <div className="flex flex-col items-end hidden sm:flex">
                  <span className="text-sm font-bold text-white">{user.username}</span>
                  <span className="text-xs text-emerald-400 font-medium">Verified Citizen</span>
                </div>
                <button
                  onClick={logout}
                  className="bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 px-4 py-2 rounded-md text-sm font-medium transition-all"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
