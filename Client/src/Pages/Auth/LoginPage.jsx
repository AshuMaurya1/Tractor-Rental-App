import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Tractor } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const { axios, setToken, setUser, setShowLogin, setIsOwner } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('/api/user/login', { email, password });
      if (!data.success) throw new Error(data.message || 'Invalid login attempt');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      const user = data.user || { role: 'farmer' };
      setUser(user);
      toast.success(`Welcome back, ${user.name || 'User'}!`);

      const normalizedRole = ['user', 'customer'].includes(String(user.role || '').toLowerCase()) ? 'farmer' : String(user.role || '').toLowerCase();
      const isOwnerRole = normalizedRole === 'owner';
      setIsOwner(isOwnerRole);
      localStorage.setItem('isOwner', String(isOwnerRole));

      if (normalizedRole === 'admin') navigate('/admin/dashboard');
      else if (isOwnerRole) navigate('/owner/dashboard');
      else navigate('/farmer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Login failed');
    } finally {
      setLoading(false);
      setShowLogin(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-xl lg:grid-cols-2">
        <div className="hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm">
              <Tractor className="h-5 w-5" />
              <span className="font-semibold">TractorRental India</span>
            </div>
            <h1 className="mt-10 text-4xl font-bold leading-tight">Powering smarter rural mobility.</h1>
            <p className="mt-5 max-w-md text-emerald-50/90">Manage rentals, connect farmers, and run a trusted agricultural fleet platform with confidence.</p>
          </div>
          <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">Customer trust</p>
            <p className="mt-3 text-2xl font-bold">4.9/5</p>
            <p className="mt-1 text-sm text-emerald-100/80">Rural fleet experience across India</p>
          </div>
        </div>

        <div className="p-6 sm:p-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-emerald-600">Welcome back</p>
              <h2 className="mt-2 text-3xl font-bold">Sign in</h2>
            </div>
            <Link to="/signup" className="text-sm font-medium text-emerald-700 hover:underline">Create account</Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Email address</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-emerald-500 focus:bg-white" placeholder="you@example.com" />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-11 outline-none transition focus:border-emerald-500 focus:bg-white" placeholder="Enter password" />
                <button type="button" onClick={() => setShowPassword((prev) => !prev)} className="absolute right-3 top-3 text-slate-500">
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-slate-600">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                Remember me
              </label>
              <button type="button" className="font-medium text-emerald-700 hover:underline">Forgot password?</button>
            </div>

            <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
              {loading ? 'Signing in...' : 'Login'}
            </button>

            <div className="pt-2 text-center text-sm text-slate-600">
              Need admin access? <Link to="/admin/login" className="font-semibold text-emerald-700 hover:underline">Admin Login</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
