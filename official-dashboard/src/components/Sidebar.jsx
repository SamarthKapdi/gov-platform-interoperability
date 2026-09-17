import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { logout, user } = useAuth();

  const navClass = ({ isActive }) =>
    `flex items-center px-4 py-3 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-amber-500 text-slate-900 border-r-4 border-amber-600'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`;

  const iconClass = ({ isActive }) =>
    `mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`;

  return (
    <div className="flex flex-col w-64 bg-slate-900 border-r border-slate-800 shadow-xl h-full">
      <div className="flex items-center justify-center h-20 border-b border-slate-800 px-6">
        <div className="flex items-center space-x-3 w-full">
          <div className="h-8 w-8 bg-amber-500 rounded flex items-center justify-center font-bold text-slate-900 shadow-sm shrink-0">
            M
          </div>
          <span className="text-white font-extrabold tracking-widest uppercase text-sm truncate">MAHA-SETU</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1">
          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-4">Command</div>
          <NavLink to="/dashboard" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Operations Overview
              </>
            )}
          </NavLink>

          <NavLink to="/search" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Citizen 360 Search
              </>
            )}
          </NavLink>

          <NavLink to="/workflows" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Workflow Engine
              </>
            )}
          </NavLink>

          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-8">Interoperability</div>
          <NavLink to="/interoperability" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Integration Centre
              </>
            )}
          </NavLink>

          <NavLink to="/exceptions" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Exception Centre
              </>
            )}
          </NavLink>

          <NavLink to="/audit" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Audit Security Log
              </>
            )}
          </NavLink>

          <div className="px-4 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 mt-8">System</div>
          <NavLink to="/architecture" className={navClass}>
            {({ isActive }) => (
              <>
                <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Platform Architecture
              </>
            )}
          </NavLink>

          {user?.role === 'admin' && (
            <NavLink to="/demo" className={navClass}>
              {({ isActive }) => (
                <>
                  <svg className={iconClass({ isActive })} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Demo Controls
                </>
              )}
            </NavLink>
          )}
        </nav>
      </div>
      
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
        >
          <svg className="mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
