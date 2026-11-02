import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Tractor } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';

const SignupPage = () => {
  const { axios, setToken, setUser, setIsOwner } = useAppContext();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'farmer',
    acceptTerms: false,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.acceptTerms) {
      toast.error('Please accept the terms and conditions.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post('/api/user/register', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        confirmPassword: form.confirmPassword,
        role: form.role,
      });

      if (!data.success) throw new Error(data.message || 'Registration failed');

      const userData = data.user || { role: form.role, name: form.name };
      const isOwnerRole = form.role === 'owner';
      localStorage.setItem('token', data.token);
      localStorage.setItem('isOwner', String(isOwnerRole));
      setToken(data.token);
      setIsOwner(isOwnerRole);
      setUser(userData);
      toast.success('Registration successful! Welcome to TractorRental.');
      navigate(isOwnerRole ? '/owner/dashboard' : '/farmer/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10 text-slate-800">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-xl">
        <div className="grid lg:grid-cols-[1.1fr_1.3fr]">
          <div className="hidden bg-gradient-to-br from-emerald-800 via-emerald-700 to-green-500 p-10 text-white lg:flex lg:flex-col lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2">
                <Tractor className="h-5 w-5" />
                <span className="font-semibold">TractorRental India</span>
              </div>
              <h1 className="mt-10 text-4xl font-bold leading-tight">Build your farm network.</h1>
              <p className="mt-4 max-w-sm text-emerald-100">Create a trusted marketplace account to hire or lease tractors with confidence.</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.2em] text-emerald-100">Trusted support</p>
              <p className="mt-3 text-lg font-semibold">Fast onboarding for farmers and fleet owners.</p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-600">Create account</p>
                <h2 className="mt-2 text-3xl font-bold">Join TractorRental</h2>
              </div>
              <Link to="/login" className="text-sm font-medium text-emerald-700 hover:underline">Sign in</Link>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Account type</label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {['farmer', 'owner'].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, role: option }))}
                        className={`rounded-xl border px-4 py-3 text-left font-medium transition ${form.role === option ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'}`}
                      >
                        {option === 'farmer' ? 'Farmer' : 'Tractor Owner'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Full name</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" placeholder="Your full name" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" placeholder="you@example.com" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input name="phone" type="tel" value={form.phone} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" placeholder="9876543210" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" placeholder="Minimum 6 characters" />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">Confirm Password</label>
                  <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} required className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:border-emerald-500 focus:bg-white" placeholder="Repeat password" />
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-slate-600">
                <input type="checkbox" name="acceptTerms" checked={form.acceptTerms} onChange={handleChange} className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />
                <span>I agree to the terms and conditions and confirm that my information is accurate.</span>
              </label>

              <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
