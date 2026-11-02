import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { toast } from 'react-hot-toast'
import { Tractor, Menu, X, Globe, Search, Bell } from 'lucide-react'
import VoiceSearchButton from './VoiceSearchButton'

const Navbar = () => {
  const { setShowLogin, setToken, setUser, user, logout, isOwner, axios, setIsOwner, language, toggleLanguage, t } = useAppContext();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [navSearch, setNavSearch] = useState('');
  const navigate = useNavigate();
  const effectiveIsOwner = Boolean(isOwner || user?.role === 'owner');

  const menuLinks = [
    { name: t('home'), path: '/' },
    { name: t('allTractors'), path: '/tractor' },
    { name: effectiveIsOwner ? t('ownerDashboard') : user ? 'Dashboard' : t('myReservations'), path: effectiveIsOwner ? '/owner' : user ? '/customer' : '/mybooking' }
  ];

  const handleNavSearch = (e, voiceQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const query = voiceQuery !== null ? voiceQuery : navSearch;
    if (query && query.trim()) {
      navigate(`/tractor?search=${encodeURIComponent(query.trim())}`);
      setNavSearch('');
    }
  };

  const changeRole = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }

    try {
      const { data } = await axios.post('/api/owner/change-role');
      if (data.success) {
        if (data.token) {
          setToken(data.token);
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          setUser(data.user);
        }
        setIsOwner(true);
        localStorage.setItem('isOwner', 'true');
        toast.success(data.message || (language === 'hi' ? "आप अब फ्लीट पार्टनर बन गए हैं!" : "You are now registered as a Tractor Fleet Partner!"));
        navigate('/owner');
      } else {
        toast.error(data.message || 'Unable to change role');
      }
    } catch (error) {
      const message = error.response?.data?.message || (language === 'hi'
        ? 'मालिक प्रोफ़ाइल सक्रिय नहीं हो सकी। कृपया फिर से प्रयास करें।'
        : 'Owner access could not be enabled. Please try again.');
      toast.error(message);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl shadow-[0_10px_25px_rgba(15,23,42,0.04)]">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 md:hidden"
            aria-label="Toggle Navigation"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link to="/" className="flex items-center gap-3 rounded-xl px-1 py-1 transition-transform duration-200 hover:scale-[1.01]">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 shadow-[0_12px_30px_rgba(37,99,235,0.35)] ring-4 ring-blue-100">
              <Tractor className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black leading-none tracking-[-0.04em] text-slate-900">
                TractorRental
              </span>
              <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-blue-700">
                {language === 'hi' ? 'कृषक किराया पोर्टल' : 'Farmer Rental Portal'}
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-1 rounded-full border border-slate-200 bg-slate-50/80 p-1.5 shadow-inner shadow-slate-200/60 md:flex">
          {menuLinks.map((link) => {
            const isActive = location.pathname === link.path

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20'
                    : 'text-slate-600 hover:bg-white hover:text-slate-900'
                }`}
              >
                {link.name}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <form
            onSubmit={handleNavSearch}
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 pl-3 pr-1 py-1 shadow-sm md:flex focus-within:border-blue-500 focus-within:bg-white transition"
          >
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <input
              type="text"
              value={navSearch}
              onChange={(e) => setNavSearch(e.target.value)}
              placeholder={language === 'hi' ? 'खोजें (जैसे महिंद्रा)...' : 'Search tractor, hub...'}
              className="w-28 border-0 bg-transparent text-xs text-slate-700 placeholder:text-slate-400 focus:outline-none lg:w-44"
            />
            <VoiceSearchButton
              onResult={(transcript) => handleNavSearch(null, transcript)}
              className="p-1"
            />
          </form>

          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50"
            title="Switch Language / भाषा बदलें"
          >
            <Globe className="h-3.5 w-3.5 text-slate-500" />
            <span className="hidden sm:inline">{language === 'en' ? 'हिन्दी' : 'English'}</span>
            <span className="sm:hidden">{language === 'en' ? 'हि' : 'EN'}</span>
          </button>

          <Link
            to="/"
            className="hidden items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 lg:flex"
          >
            <span>{t('customerView')}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3.5 w-3.5">
              <path d="M14 4h6v6" />
              <path d="M10 14L20 4" />
              <path d="M20 14v6H4V4h6" />
            </svg>
          </Link>

          <div className="relative">
            <button
              type="button"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
          </div>

          {user ? (
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1.5 shadow-sm">
              <img
                src={user?.image || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80'}
                alt={user?.name || 'Owner'}
                className="h-9 w-9 rounded-full border border-slate-200 object-cover"
              />
              <div className="hidden text-left xl:flex xl:flex-col">
                <span className="max-w-[120px] truncate text-[11px] font-bold leading-tight text-slate-900">
                  {user?.name || 'Farmer'}
                </span>
                <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Verified</span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLogin(true)}
              className="rounded-full bg-gradient-to-r from-blue-700 to-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)] transition-transform hover:-translate-y-0.5"
            >
              {t('login')}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="space-y-3 border-t border-slate-200 bg-white px-4 pb-6 pt-4 md:hidden">
          <div className="flex flex-col space-y-2">
            {menuLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setOpen(false)}
                className={`rounded-xl px-3 py-2.5 text-sm font-semibold ${
                  location.pathname === link.path ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
            {!user && (
              <button
                type="button"
                onClick={() => { setOpen(false); setShowLogin(true); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-700"
              >
                {t('login')}
              </button>
            )}
            <button
              type="button"
              onClick={() => { setOpen(false); effectiveIsOwner ? navigate('/owner') : user ? navigate('/customer') : changeRole(); }}
              className="rounded-xl bg-gradient-to-r from-blue-700 to-indigo-600 px-3 py-2.5 text-sm font-semibold text-white"
            >
              {effectiveIsOwner ? t('ownerDashboard') : user ? 'Customer Dashboard' : t('listTractor')}
            </button>
            {user && (
              <button
                type="button"
                onClick={() => { setOpen(false); logout(); }}
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm font-semibold text-rose-700"
              >
                {t('logout')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
export default Navbar;
