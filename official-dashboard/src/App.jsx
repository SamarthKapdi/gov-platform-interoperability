import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Exceptions from './pages/Exceptions';
import AuditLog from './pages/AuditLog';
import Workflows from './pages/Workflows';

// Components
import Sidebar from './components/Sidebar';

const ProtectedLayout = () => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-gray-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  if (!user) return <Navigate to="/" replace />;
  if (user.role === 'citizen') return <Navigate to="/" replace />; // Extra check

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 relative flex flex-col">
        <header className="mb-6 flex justify-between items-end border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Official Dashboard</h1>
            <p className="text-sm text-gray-500">Government Interoperability Platform</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <div className="font-medium text-gray-800">{user.name || 'Official'}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')} • {user.departmentId || 'System'}</div>
            </div>
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-800 font-bold">
              {(user.name || 'O')[0].toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/search" element={<Search />} />
          <Route path="/exceptions" element={<Exceptions />} />
          <Route path="/audit" element={<AuditLog />} />
          <Route path="/workflows" element={<Workflows />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
