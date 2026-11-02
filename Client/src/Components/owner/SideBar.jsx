import { useCallback, useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAppContext } from '../../context/AppContext'
import {
  Bell,
  CalendarCheck,
  LayoutDashboard,
  PlusCircle,
  Tractor,
  TrendingUp,
  User,
  UserRound,
  X,
} from 'lucide-react'

const SideBar = ({ mobileOpen = false, setMobileOpen }) => {
  const { user, axios } = useAppContext()
  const location = useLocation()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    let mounted = true
    let notificationIds = []
    const syncReadCount = () => {
      try {
        const readIds = JSON.parse(localStorage.getItem('owner_read_notifs') || '[]')
        setUnreadCount(notificationIds.filter((id) => !readIds.includes(id)).length)
      } catch {
        setUnreadCount(notificationIds.length)
      }
    }

    Promise.all([axios.get('/api/booking/owner'), axios.get('/api/owner/tractors')])
      .then(([bookingsResponse, tractorsResponse]) => {
        if (!mounted) return
        const bookings = bookingsResponse.data?.bookings || []
        const tractors = tractorsResponse.data?.tractors || []
        setPendingCount(bookings.filter((booking) => booking.status === 'pending').length)
        notificationIds = [
          ...tractors
            .filter((tractor) => ['approved', 'rejected', 'pending'].includes(tractor.status))
            .map((tractor) => `tractor-${tractor.status}-${tractor._id}`),
          ...bookings
            .filter((booking) => ['pending', 'confirmed', 'completed'].includes(booking.status))
            .map((booking) => `booking-${booking.status}-${booking._id}`),
        ]
        syncReadCount()
      })
      .catch(() => {})

    window.addEventListener('owner-notifications-read', syncReadCount)
    window.addEventListener('storage', syncReadCount)
    return () => {
      mounted = false
      window.removeEventListener('owner-notifications-read', syncReadCount)
      window.removeEventListener('storage', syncReadCount)
    }
  }, [axios])

  const closeMobile = useCallback(() => setMobileOpen?.(false), [setMobileOpen])

  useEffect(() => { setMobileOpen?.(false) }, [location.pathname, setMobileOpen])

  useEffect(() => {
    if (!mobileOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event) => {
      if (event.key === 'Escape') closeMobile()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [mobileOpen, closeMobile])

  const navItems = [
    { name: 'Dashboard', path: '/owner', icon: LayoutDashboard, exact: true },
    { name: 'Add Equipment', path: '/owner/add-tractor', icon: PlusCircle },
    { name: 'Manage Equipment', path: '/owner/manage-tractor', icon: Tractor },
    { name: 'Manage Bookings', path: '/owner/manage-booking', icon: CalendarCheck, badge: pendingCount },
    { name: 'Earnings', path: '/owner/earnings', icon: TrendingUp },
    { name: 'My Profile', path: '/owner/profile', icon: User },
    { name: 'Notifications', path: '/owner/notifications', icon: Bell, badge: unreadCount },
  ]

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation menu"
          onClick={closeMobile}
          className="fixed inset-x-0 bottom-0 top-[76px] z-30 bg-slate-950/40 md:hidden"
        />
      )}

      <aside
        className={`fixed left-0 top-[76px] z-40 flex h-[calc(100dvh-76px)] w-72 max-w-[85vw] -translate-x-full flex-col overflow-hidden border-r border-emerald-100 bg-white text-slate-800 shadow-xl transition-transform duration-300 md:sticky md:top-[76px] md:h-[calc(100dvh-76px)] md:w-[4.5rem] md:max-w-none md:translate-x-0 md:shadow-none lg:w-[17rem] ${mobileOpen ? 'translate-x-0' : ''}`}
      >
        <div className="flex shrink-0 flex-col items-center border-b border-emerald-100 px-3 py-3 lg:py-4">
          <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-100 bg-emerald-50 text-emerald-700 lg:h-14 lg:w-14">
            {user?.image ? (
              <img src={user.image} alt={user?.name || 'Owner'} className="h-full w-full object-cover" />
            ) : (
              <UserRound className="h-6 w-6 lg:h-7 lg:w-7" />
            )}
          </div>
          <p className="mt-2 hidden max-w-full truncate text-sm font-bold text-slate-900 lg:block">
            {user?.name || 'Owner'}
          </p>
          <span className="hidden text-xs font-medium text-slate-500 lg:block">Owner account</span>
          <button
            type="button"
            onClick={closeMobile}
            aria-label="Close navigation menu"
            className="absolute right-3 top-3 flex h-11 w-11 items-center justify-center rounded-xl text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700 md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Owner dashboard" className="owner-sidebar-nav min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 py-3 lg:px-3 lg:py-4">
          <div className="space-y-1">
            {navItems.map(({ name, path, icon: Icon, exact, badge }) => (
              <NavLink
                key={path}
                to={path}
                end={exact}
                onClick={closeMobile}
                title={name}
                aria-label={name}
                className={({ isActive }) => {
                  const active = path === '/owner'
                    ? location.pathname === '/owner' || location.pathname === '/owner/dashboard'
                    : isActive
                  return `group relative flex min-h-12 items-center justify-center gap-3 rounded-xl px-2 py-3 text-base font-medium transition-colors lg:justify-start lg:px-3 ${active ? 'bg-[#e6f1ec] text-emerald-800' : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'}`
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="hidden min-w-0 flex-1 truncate lg:block">{name}</span>
                {badge > 0 && <span className="hidden rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-800 lg:inline">{badge}</span>}
                {(path === '/owner'
                  ? location.pathname === '/owner' || location.pathname === '/owner/dashboard'
                  : location.pathname === path) && (
                  <span aria-hidden="true" className="absolute bottom-2 right-0 top-2 w-1 rounded-l-full bg-emerald-600" />
                )}
              </NavLink>
            ))}
          </div>
        </nav>

      </aside>
    </>
  )
}

export default SideBar
