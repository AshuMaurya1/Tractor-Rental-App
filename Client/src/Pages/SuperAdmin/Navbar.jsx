const SuperAdminNavbar = ({ mobileOpen, setMobileOpen, logout }) => {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur-xl">
      <div className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-xl border border-slate-200 p-2 text-slate-700 lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            ☰
          </button>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Operations</p>
            <h2 className="text-lg font-semibold text-slate-800">Platform Console</h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:block">
            Secure Mode
          </div>
          <button
            onClick={logout}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default SuperAdminNavbar;
