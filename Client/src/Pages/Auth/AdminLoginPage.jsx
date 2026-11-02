import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';

const AdminLoginPage = () => {
  const { axios, setToken, setUser } = useAppContext();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post('/api/admin/login', { email, password });
      if (!data.success) throw new Error(data.message || 'Admin login failed');

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success('Admin login successful!');
      navigate('/admin/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Admin access denied');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-800 bg-slate-900 p-8 text-white shadow-2xl shadow-slate-950/50">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <p className="text-center text-xs uppercase tracking-[0.25em] text-emerald-400">Secure access</p>
        <h1 className="mt-4 text-center text-3xl font-bold">Admin Login</h1>
        <p className="mt-2 text-center text-sm text-slate-400">Use your environment-configured administrator credentials.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white outline-none transition focus:border-emerald-500" placeholder="admin@tractorental.in" />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-11 text-white outline-none transition focus:border-emerald-500" placeholder="Enter password" />
              <button type="button" onClick={() => setShowPassword((p) => !p)} className="absolute right-3 top-3 text-slate-400">
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300">
            {loading ? 'Authenticating...' : 'Login to Admin Panel'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLoginPage;
