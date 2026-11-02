import { NavLink } from 'react-router-dom';

const links = [
  { label: 'Overview', to: '/superadmin/dashboard' },
  { label: 'Users', to: '/superadmin/users' },
  { label: 'Owners', to: '/superadmin/owners' },
  { label: 'Tractors', to: '/superadmin/tractors' },
  { label: 'Bookings', to: '/superadmin/bookings' },
  { label: 'Analytics', to: '/superadmin/analytics' },
  { label: 'Complaints', to: '/superadmin/complaints' },
  { label: 'Activity Logs', to: '/superadmin/activity-logs' },
  { label: 'Settings', to: '/superadmin/settings' },
  { label: 'Profile', to: '/superadmin/profile' },
];

const SuperAdminSidebar = ({ mobileOpen, setMobileOpen }) => {
  return (
    <>
      <aside className={`${mobileOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-200 bg-slate-950 text-slate-100 transition-transform duration-200 lg:static lg:translate-x-0`}>
        <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
          <div>
            <p className="text-sm uppercase tracking-[0.22em] text-emerald-400">Super Admin</p>
            <h1 className="text-xl font-bold">TractorRental</h1>
          </div>
          <button
            className="rounded-md border border-slate-700 p-2 text-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="space-y-2 p-4">
          {links.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {mobileOpen && (
        <button
          aria-label="Close sidebar"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
};

export default SuperAdminSidebar;
