import React from 'react'
import { useAppContext } from '../context/AppContext'
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { X, Mail, Lock, User, Tractor } from 'lucide-react';

const Login = () => {
  const { setShowLogin, setToken, setUser, axios, language = 'en', authMode, setAuthMode, setIsOwner } = useAppContext();
  const navigate = useNavigate();
  const [state, setState] = React.useState(authMode || "login");
  const [role, setRole] = React.useState('farmer');

  React.useEffect(() => {
    setState(authMode || "login");
  }, [authMode]);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const onsubmitHandler = async (event) => {
    event.preventDefault();
    if (isLoading) return;

    if (state === 'register') {
      if (!name || !email || !phone || !password || !confirmPassword) {
        toast.error('Please fill in all signup fields.');
        return;
      }
      if (password.length < 6) {
        toast.error('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const requestBody = state === 'register'
        ? { name, email, phone, password, confirmPassword, role }
        : { email, password };

      const { data } = await axios.post(`/api/user/${state}`, requestBody);
      if (data.success) {
        const authToken = data.token;
        const userData = data.user || { role: 'farmer', name };

        setToken(authToken);
        setUser(userData);
        localStorage.setItem('token', authToken);

        const userRole = String(userData.role || '').toLowerCase();
        const normalizedRole = ['user', 'customer'].includes(userRole) ? 'farmer' : userRole;
        const isOwnerUser = normalizedRole === 'owner';
        const isAdminUser = normalizedRole === 'admin';

        setIsOwner(isOwnerUser);
        localStorage.setItem('isOwner', String(isOwnerUser));

        setShowLogin(false);
        toast.success(`Welcome ${userData.name || 'User'}!`);
        navigate(isAdminUser ? '/admin/dashboard' : isOwnerUser ? '/owner/dashboard' : '/farmer/dashboard');
      } else {
        toast.error(data.message || 'Authentication failed');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={() => {
        setShowLogin(false);
        setAuthMode('login');
      }} 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs antialiased"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="relative w-full max-w-sm bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-7"
      >
        {/* Close Button */}
        <button 
          type="button"
          onClick={() => {
            setShowLogin(false);
            setAuthMode('login');
          }} 
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-5">
          <div className="w-10 h-10 rounded-lg bg-blue-700 text-white flex items-center justify-center mx-auto mb-2.5">
            <Tractor className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {state === "login" 
              ? (language === 'hi' ? 'लॉग इन करें' : 'Sign In to TractorRental') 
              : (language === 'hi' ? 'नया खाता बनाएं' : 'Create Farmer Account')}
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {state === "login" 
              ? (language === 'hi' ? 'बुकिंग व फ्लीट प्रबंधित करने के लिए क्रेडेंशियल्स दर्ज करें' : 'Enter your credentials to manage bookings & fleets') 
              : (language === 'hi' ? 'ट्रैक्टर किराए पर लेने या लिस्ट करने के लिए साइन अप करें' : 'Register to reserve or list agricultural equipment')}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onsubmitHandler} className="space-y-3.5">
          
          {state === "register" && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'पूरा नाम' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    onChange={(e) => setName(e.target.value)} 
                    value={name} 
                    placeholder="e.g. Rameshwar Yadav" 
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white" 
                    type="text" 
                    required 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'अकाउंट प्रकार' : 'Account Type'}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['farmer', 'owner'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setRole(option)}
                      className={`rounded-lg border px-2 py-2 text-xs font-medium transition ${
                        role === option ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      {option === 'farmer' ? (language === 'hi' ? 'किसान' : 'Farmer') : (language === 'hi' ? 'ट्रैक्टर मालिक' : 'Tractor Owner')}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'hi' ? 'फोन नंबर' : 'Phone Number'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    onChange={(e) => setPhone(e.target.value)}
                    value={phone}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                    type="tel"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'ईमेल पता' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                onChange={(e) => setEmail(e.target.value)} 
                value={email} 
                placeholder="farmer@example.com" 
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white" 
                type="email" 
                required 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'hi' ? 'पासवर्ड' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                onChange={(e) => setPassword(e.target.value)} 
                value={password} 
                placeholder="••••••••" 
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white" 
                type="password" 
                required 
              />
            </div>
          </div>

          {state === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'पासवर्ड की पुष्टि' : 'Confirm Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  value={confirmPassword}
                  placeholder="Repeat password"
                  className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-blue-700 focus:bg-white"
                  type="password"
                  required
                />
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer mt-2"
          >
            {isLoading 
              ? "Please wait..." 
              : state === "login" 
                ? (language === 'hi' ? 'लॉग इन' : 'Sign In') 
                : (language === 'hi' ? 'खाता बनाएं' : 'Create Account')}
          </button>
        </form>

        {/* Toggle between Login and Register */}
        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          {state === "login" ? (
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'खाता नहीं है?' : "Don't have an account?"}{" "}
              <button 
                type="button"
                onClick={() => {
                  setState("register");
                  setAuthMode("register");
                }} 
                className="text-blue-700 font-bold hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'साइन अप करें' : 'Register now'}
              </button>
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              {language === 'hi' ? 'पहले से खाता है?' : "Already have an account?"}{" "}
              <button 
                type="button"
                onClick={() => {
                  setState("login");
                  setAuthMode("login");
                }} 
                className="text-blue-700 font-bold hover:underline cursor-pointer"
              >
                {language === 'hi' ? 'लॉग इन करें' : 'Sign in here'}
              </button>
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
