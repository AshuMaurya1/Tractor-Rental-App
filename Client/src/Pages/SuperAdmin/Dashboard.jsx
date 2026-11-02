import { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';

const cardStyles = 'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm';

const SuperAdminDashboard = () => {
  const { token, axios } = useAppContext();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await axios.get('/api/superadmin/dashboard');
        setDashboard(response.data.dashboard);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboard();
  }, [axios, token]);

  if (loading) return <div className="text-slate-600">Loading dashboard…</div>;
  if (!dashboard) return <div className="text-red-600">Unable to load dashboard.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-600">Control Center</p>
          <h1 className="text-3xl font-bold text-slate-900">Platform Overview</h1>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={cardStyles}>
          <p className="text-sm text-slate-500">Total Users</p>
          <h3 className="mt-2 text-3xl font-bold">{dashboard.totalUsers}</h3>
        </div>
        <div className={cardStyles}>
          <p className="text-sm text-slate-500">Total Owners</p>
          <h3 className="mt-2 text-3xl font-bold">{dashboard.totalOwners}</h3>
        </div>
        <div className={cardStyles}>
          <p className="text-sm text-slate-500">Total Tractors</p>
          <h3 className="mt-2 text-3xl font-bold">{dashboard.totalTractors}</h3>
        </div>
        <div className={cardStyles}>
          <p className="text-sm text-slate-500">Revenue</p>
          <h3 className="mt-2 text-3xl font-bold">₹{dashboard.totalRevenue}</h3>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Booking Summary</h2>
          <div className="space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><span>Active</span><strong className="text-slate-900">{dashboard.activeBookings}</strong></div>
            <div className="flex justify-between"><span>Pending</span><strong className="text-slate-900">{dashboard.pendingBookings}</strong></div>
            <div className="flex justify-between"><span>Completed</span><strong className="text-slate-900">{dashboard.completedBookings}</strong></div>
            <div className="flex justify-between"><span>Cancelled</span><strong className="text-slate-900">{dashboard.cancelledBookings}</strong></div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
          <div className="space-y-3 text-sm text-slate-600">
            {dashboard.recentActivity?.length ? dashboard.recentActivity.map((log) => (
              <div key={log._id} className="border-b border-slate-100 pb-2 last:border-none last:pb-0">
                <p className="font-medium text-slate-800">{log.action}</p>
                <p>{log.admin?.name || 'System'} • {new Date(log.timestamp).toLocaleString()}</p>
              </div>
            )) : <p>No activity yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
