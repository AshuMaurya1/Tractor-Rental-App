const metricCard = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

const PageShell = ({ title, description, children }) => (
  <div className="space-y-6">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Super Admin</p>
      <h1 className="mt-2 text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
    {children}
  </div>
);

export const UsersPage = () => (
  <PageShell title="Users" description="Review member sign-ins, account health, and restrictions.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={metricCard}><p className="text-sm text-slate-500">Active Users</p><h3 className="mt-2 text-3xl font-bold text-slate-900">1,284</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Suspended</p><h3 className="mt-2 text-3xl font-bold text-slate-900">14</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">New This Month</p><h3 className="mt-2 text-3xl font-bold text-slate-900">192</h3></div>
    </div>
  </PageShell>
);

export const OwnersPage = () => (
  <PageShell title="Owners" description="Verify fleet owners, approve listings, and monitor performance.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={metricCard}><p className="text-sm text-slate-500">Verified Owners</p><h3 className="mt-2 text-3xl font-bold text-slate-900">326</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Pending Approvals</p><h3 className="mt-2 text-3xl font-bold text-slate-900">11</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Fleet Listings</p><h3 className="mt-2 text-3xl font-bold text-slate-900">734</h3></div>
    </div>
  </PageShell>
);

export const TractorsPage = () => (
  <PageShell title="Tractors" description="Check inventory quality, status, and availability rules.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={metricCard}><p className="text-sm text-slate-500">Available</p><h3 className="mt-2 text-3xl font-bold text-slate-900">408</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Under Maintenance</p><h3 className="mt-2 text-3xl font-bold text-slate-900">19</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Flagged</p><h3 className="mt-2 text-3xl font-bold text-slate-900">7</h3></div>
    </div>
  </PageShell>
);

export const BookingsPage = () => (
  <PageShell title="Bookings" description="Track bookings, review disputes, and reconcile refund actions.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={metricCard}><p className="text-sm text-slate-500">Open Bookings</p><h3 className="mt-2 text-3xl font-bold text-slate-900">246</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Confirmed</p><h3 className="mt-2 text-3xl font-bold text-slate-900">183</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Cancelled</p><h3 className="mt-2 text-3xl font-bold text-slate-900">42</h3></div>
    </div>
  </PageShell>
);

export const AnalyticsPage = () => (
  <PageShell title="Analytics" description="Revenue, conversion, and platform efficiency insights.">
    <div className="grid gap-4 md:grid-cols-4">
      <div className={metricCard}><p className="text-sm text-slate-500">Gross Revenue</p><h3 className="mt-2 text-3xl font-bold text-slate-900">₹24.8L</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Completed Orders</p><h3 className="mt-2 text-3xl font-bold text-slate-900">1,763</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Conversion</p><h3 className="mt-2 text-3xl font-bold text-slate-900">28.4%</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Avg Booking</p><h3 className="mt-2 text-3xl font-bold text-slate-900">₹1,412</h3></div>
    </div>
  </PageShell>
);

export const ComplaintsPage = () => (
  <PageShell title="Complaints" description="Review escalations and resolve issues across the marketplace.">
    <div className="grid gap-4 md:grid-cols-3">
      <div className={metricCard}><p className="text-sm text-slate-500">Open</p><h3 className="mt-2 text-3xl font-bold text-slate-900">19</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">In Progress</p><h3 className="mt-2 text-3xl font-bold text-slate-900">8</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Resolved</p><h3 className="mt-2 text-3xl font-bold text-slate-900">64</h3></div>
    </div>
  </PageShell>
);

export const ActivityLogsPage = () => (
  <PageShell title="Activity Logs" description="Audit all platform actions and admin decisions.">
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <ul className="space-y-3 text-sm text-slate-600">
        <li className="border-b border-slate-100 pb-3"><strong className="text-slate-900">System Administrator</strong> updated platform fee policy.</li>
        <li className="border-b border-slate-100 pb-3"><strong className="text-slate-900">Fleet Owner</strong> approved a tractor listing update.</li>
        <li className="border-b border-slate-100 pb-3"><strong className="text-slate-900">Customer</strong> reported a booking issue and it was resolved.</li>
        <li><strong className="text-slate-900">Admin</strong> suspended a flagged account.</li>
      </ul>
    </div>
  </PageShell>
);

export const SettingsPage = () => (
  <PageShell title="Settings" description="Adjust commissions, service policy, and marketplace preferences.">
    <div className="grid gap-4 md:grid-cols-2">
      <div className={metricCard}><p className="text-sm text-slate-500">Commission Rate</p><h3 className="mt-2 text-3xl font-bold text-slate-900">6%</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Maintenance Mode</p><h3 className="mt-2 text-3xl font-bold text-slate-900">Off</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Support Email</p><h3 className="mt-2 text-3xl font-bold text-slate-900">support@tractorental.in</h3></div>
      <div className={metricCard}><p className="text-sm text-slate-500">Featured Limit</p><h3 className="mt-2 text-3xl font-bold text-slate-900">12</h3></div>
    </div>
  </PageShell>
);

export const ProfilePage = () => (
  <PageShell title="Profile" description="Manage the super admin identity and access preferences.">
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-slate-500">Name</p>
      <h3 className="mt-1 text-2xl font-bold text-slate-900">System Administrator</h3>
      <p className="mt-4 text-slate-600">Role: Super Admin</p>
      <p className="mt-1 text-slate-600">Access: Full platform control</p>
    </div>
  </PageShell>
);
