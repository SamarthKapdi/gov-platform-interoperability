import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await login(username, password);
      navigate('/record');
    } catch (err) {
      setError('Invalid credentials or server unavailable.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-900">
      
      {/* Visual / Branding Side */}
      <div className="md:w-1/2 flex flex-col justify-center p-12 text-white border-r border-slate-800 relative overflow-hidden">
        {/* Subtle Background pattern */}
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        
        <div className="relative z-10 max-w-lg">
          <div className="w-16 h-16 bg-amber-500 rounded-lg flex items-center justify-center font-extrabold text-slate-900 text-3xl mb-8 shadow-lg">
            M
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
            MAHA-SETU
          </h1>
          <h2 className="text-xl md:text-2xl text-slate-300 font-light mb-12">
            One interoperability layer.<br />
            Many government systems.<br />
            <span className="text-amber-400 font-semibold">One citizen experience.</span>
          </h2>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 text-center">Interoperability Flow</h3>
            
            <div className="flex flex-col items-center space-y-4">
              <div className="bg-white text-slate-900 px-6 py-2 rounded-full font-bold text-sm shadow-md">
                You (Citizen)
              </div>
              <div className="h-6 border-l-2 border-dashed border-amber-500"></div>
              <div className="bg-amber-500 text-slate-900 px-8 py-3 rounded-lg font-bold shadow-lg w-full text-center">
                MAHA-SETU Platform
              </div>
              <div className="h-6 border-l-2 border-dashed border-slate-600"></div>
              <div className="flex space-x-4 w-full justify-center">
                <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-mono border border-slate-600">DEPT A</div>
                <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-mono border border-slate-600">DEPT B</div>
                <div className="bg-slate-700 text-slate-300 px-4 py-2 rounded text-xs font-mono border border-slate-600">DEPT C</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Login Side */}
      <div className="md:w-1/2 flex items-center justify-center bg-stone-50 p-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-slate-200">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900">
              Citizen Access
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Sign in to view your unified Golden Record and manage your cross-department consent.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-4">
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-bold text-slate-700 mb-1">Citizen Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50 transition-colors"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="appearance-none relative block w-full px-4 py-3 border border-slate-300 placeholder-slate-400 text-slate-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-50 transition-colors"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-lg text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-70 transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Authenticating...' : 'Secure Sign In'}
              </button>
            </div>
            
            <div className="text-center mt-4 pt-4 border-t border-slate-100">
              <Link to="/register" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Don't have an account? Register here
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
