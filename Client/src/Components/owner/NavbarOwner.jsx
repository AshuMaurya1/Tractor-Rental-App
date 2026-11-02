import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import {
  ArrowLeft,
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Tractor,
  UserRound,
} from 'lucide-react'

const NavbarOwner = ({ mobileSidebarOpen = false, setMobileSidebarOpen }) => {
  const { user, language = 'en', toggleLanguage, logout, t } = useAppContext()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    if (!userMenuOpen) return undefined
    const onPointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setUserMenuOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setUserMenuOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [userMenuOpen])

  return (
    <header className="sticky top-0 z-50 h-[76px] w-full shrink-0 border-b border-slate-200 bg-white shadow-sm">
      <div className="flex h-full w-full items-center justify-between gap-2 px-2 sm:px-4 lg:px-7">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setMobileSidebarOpen?.(!mobileSidebarOpen)}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 md:hidden"
            aria-label={mobileSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileSidebarOpen}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/owner" className="flex min-w-0 items-center gap-2.5 sm:gap-3" aria-label="TractorHub Owner Portal">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-sm sm:h-11 sm:w-11">
              <Tractor className="h-6 w-6" />
            </span>
            <span className="block min-w-0">
              <span className="block whitespace-nowrap text-sm font-extrabold leading-tight tracking-tight text-slate-900 sm:text-lg">
                Tractor<span className="text-emerald-700">Hub</span>
              </span>
              <span className="mt-0.5 hidden text-[10px] font-bold uppercase tracking-[0.2em] text-orange-500 sm:block lg:text-[11px]">
                Owner Portal
              </span>
            </span>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2 lg:gap-4">
          <Link
            to="/"
            title={t?.('customerView') || 'View Customer Marketplace'}
            aria-label="View Customer Marketplace"
            className="hidden h-11 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800 md:inline-flex lg:px-3"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden lg:inline">View Customer Marketplace</span>
          </Link>

          <Link
            to="/owner/notifications"
            className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-600 ring-2 ring-white" />
          </Link>

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((open) => !open)}
              className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-emerald-100 bg-white p-0.5 transition hover:border-emerald-300 hover:bg-emerald-50 sm:w-auto sm:gap-2 sm:pl-1.5 sm:pr-3"
              aria-label="Open owner account menu"
              aria-expanded={userMenuOpen}
            >
              {user?.image ? (
                <img src={user.image} alt="" className="h-9 w-9 rounded-full object-cover" />
              ) : (
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <UserRound className="h-5 w-5" />
                </span>
              )}
              <span className="absolute bottom-0.5 right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500 sm:static sm:h-2 sm:w-2 sm:border-0" />
              <span className="hidden max-w-36 truncate text-sm font-semibold text-slate-800 lg:block">
                {user?.name || 'Owner'}
              </span>
              <ChevronDown className="hidden h-4 w-4 text-slate-400 sm:block" />
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-full z-[60] mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl">
                <Link
                  to="/owner/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <UserRound className="h-4 w-4" /> My Profile
                </Link>
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-800"
                >
                  <Globe className="h-4 w-4" />
                  {language === 'en' ? 'Language · हिन्दी' : 'Language · English'}
                </button>
                <div className="my-1 border-t border-slate-100" />
                <button
                  type="button"
                  onClick={() => { setUserMenuOpen(false); logout() }}
                  className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-slate-700 transition hover:bg-rose-50 hover:text-rose-700"
                >
                  <LogOut className="h-4 w-4" /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default NavbarOwner
