import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    mobile: '',
    aadhaar: '',
    dob: '',
    gender: '',
    address: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          role: 'citizen'
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Registration failed');
      }

      // Automatically login after successful registration
      await login(formData.username, formData.password);
      navigate('/tracker');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "mt-1 appearance-none block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm";

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          Create Citizen Account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          MAHA-SETU Citizen Services
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-200">
          {error && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                className={inputClass}
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>

            {/* Aadhaar Number */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Aadhaar Number <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                maxLength={12}
                pattern="[0-9]{12}"
                placeholder="xxxx xxxx xxxx"
                className={inputClass}
                value={formData.aadhaar}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 12);
                  setFormData({...formData, aadhaar: val});
                }}
              />
              <p className="mt-1 text-xs text-slate-500">12-digit Aadhaar number</p>
            </div>

            {/* Date of Birth */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Date of Birth <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                className={inputClass}
                value={formData.dob}
                onChange={e => setFormData({...formData, dob: e.target.value})}
              />
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Gender <span className="text-red-500">*</span></label>
              <select
                required
                className={inputClass}
                value={formData.gender}
                onChange={e => setFormData({...formData, gender: e.target.value})}
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Mobile */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Mobile Number <span className="text-red-500">*</span></label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 sm:text-sm">+91</span>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  pattern="[0-9]{10}"
                  placeholder="9876543210"
                  className="appearance-none block w-full px-3 py-2 border border-slate-300 rounded-r-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.mobile}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setFormData({...formData, mobile: val});
                  }}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                className={inputClass}
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Address</label>
              <textarea
                rows={2}
                placeholder="House/Flat No, Street, City, State, PIN"
                className={inputClass}
                value={formData.address}
                onChange={e => setFormData({...formData, address: e.target.value})}
              />
            </div>

            <hr className="border-slate-200" />

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Username <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                placeholder="Choose a username"
                className={inputClass}
                value={formData.username}
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700">Password <span className="text-red-500">*</span></label>
              <input
                type="password"
                required
                minLength={6}
                placeholder="Minimum 6 characters"
                className={inputClass}
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <Link to="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                Already have an account? Log in
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
