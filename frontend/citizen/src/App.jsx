import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Login from './pages/Login';
import Register from './pages/Register';
import Tracker from './pages/Tracker';
import Consent from './pages/Consent';
import GoldenRecord from './pages/GoldenRecord';
import SubmitApplication from './pages/SubmitApplication';
import Notifications from './pages/Notifications';
import Navbar from './components/Navbar';
import { useAuth } from './hooks/useAuth';

import Landing from './pages/Landing';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-stone-50 font-sans text-slate-900">
      <Navbar />
      <div className="container mx-auto max-w-6xl p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/tracker" element={<ProtectedRoute><Tracker /></ProtectedRoute>} />
          <Route path="/consent" element={<ProtectedRoute><Consent /></ProtectedRoute>} />
          <Route path="/record" element={<ProtectedRoute><GoldenRecord /></ProtectedRoute>} />
          <Route path="/submit" element={<ProtectedRoute><SubmitApplication /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
