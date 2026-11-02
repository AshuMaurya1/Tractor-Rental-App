import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
  CalendarDays,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatCurrency = (amount, currency = '₹') => {
  const num = Number(amount || 0);
  return `${currency}${num.toLocaleString('en-IN')}`;
};

const OwnerDashboard = () => {
  const { axios, user, currency = '₹' } = useAppContext();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/owner/dashboard');
      if (data.success && data.dashboardData) {
        setSummary(data.dashboardData);
      } else {
        setSummary(null);
        toast.error(data.message || 'Unable to load owner dashboard statistics.');
      }
    } catch (error) {
      setSummary(null);
      toast.error(error.response?.data?.message || 'Unable to load owner dashboard.');
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  // Quick accept / reject booking action
  const handleBookingAction = async (bookingId, status) => {
    setActionLoadingId(bookingId);
    try {
      const { data } = await axios.post('/api/booking/change-status', {
        bookingId,
        status,
      });
      if (data.success) {
        toast.success(`Booking ${status === 'confirmed' ? 'accepted' : status} successfully!`);
        fetchDashboard();
      } else {
        toast.error(data.message || 'Unable to update booking status.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const stats = summary || {};

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 antialiased">
      {/* Welcome & Quick Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 via-teal-50/40 to-white p-6 shadow-xs">
        <div>
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            Owner Fleet Console
          </span>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Monitor equipment utilization, incoming farmer requests, and actual rental revenues.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to="/owner/add-tractor"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
          >
            <Plus size={16} /> Add Equipment
          </Link>
          <Link
            to="/owner/manage-booking"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
          >
            <CalendarDays size={16} /> Manage Bookings
          </Link>
          <button
            onClick={fetchDashboard}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
            title="Refresh Live Statistics"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Rejection Alert if owner has rejected tractors */}
      {stats.rejectedTractors > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50/70 p-4 sm:p-5 flex items-start gap-3.5">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-rose-900">
              Attention: {stats.rejectedTractors} tractor submission
              {stats.rejectedTractors === 1 ? ' was' : 's were'} rejected by Admin
            </h3>
            <p className="mt-0.5 text-xs text-rose-700">
              Please review the Admin rejection reasons under My Tractors and update your listing
              details.
            </p>
          </div>
          <Link
            to="/owner/manage-tractor"
            className="shrink-0 text-xs font-bold text-rose-800 hover:underline"
          >
            Review Listings &rarr;
          </Link>
        </div>
      )}

      {/* Platform Real Statistics Grid */}
      <div>
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
          Real MongoDB Fleet & Business Metrics
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {/* Total Tractors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Tractors
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Tractor size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '—' : stats.totalTractor || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Total registered in fleet</p>
          </div>

          {/* Approved Tractors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-teal-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Approved Tractors
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-teal-700">
              {loading ? '—' : stats.approvedTractors || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Live for public booking</p>
          </div>

          {/* Pending Verification */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Verification
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600">
              {loading ? '—' : stats.pendingTractors || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Under Admin review</p>
          </div>

          {/* Rejected Tractors */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-rose-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rejected Tractors
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <XCircle size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-rose-600">
              {loading ? '—' : stats.rejectedTractors || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Requires correction</p>
          </div>

          {/* Total Bookings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Bookings
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <CalendarDays size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
              {loading ? '—' : stats.totalBooking || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">All customer requests</p>
          </div>

          {/* Pending Booking Requests */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-amber-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Requests
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Clock size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600">
              {loading ? '—' : stats.pendingBooking || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Awaiting your approval</p>
          </div>

          {/* Approved / Confirmed Bookings */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Confirmed Bookings
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {loading ? '—' : stats.confirmedBooking || 0}
            </p>
            <p className="mt-1 text-xs text-slate-400">Scheduled / in operation</p>
          </div>

          {/* Total Earnings from MongoDB */}
          <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Total Real Earnings
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
                <TrendingUp size={18} />
              </div>
            </div>
            <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-white">
              {loading ? '—' : formatCurrency(stats.totalEarnings || 0, currency)}
            </p>
            <p className="mt-1 text-xs text-emerald-100">From completed / paid rentals</p>
          </div>
        </div>
      </div>

      {/* Recent Booking Requests Section */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Booking Requests</h2>
            <p className="text-xs text-slate-500">
              Latest rental requests received across your tractors
            </p>
          </div>
          <Link
            to="/owner/manage-booking"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
          >
            All Bookings ({stats.totalBooking || 0}) <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : stats.recentBooking?.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentBooking.map((booking) => {
              const tractorName = booking.tractor
                ? `${booking.tractor.brand || ''} ${booking.tractor.model || ''}`.trim()
                : 'Tractor';
              const farmerName = booking.user?.name || 'Farmer';
              const isPending = String(booking.status || '').toLowerCase() === 'pending';

              return (
                <div
                  key={booking._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <img
                      src={
                        booking.tractor?.image ||
                        'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80'
                      }
                      alt={tractorName}
                      className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-200"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">
                        {farmerName} · {tractorName}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatDate(booking.startDate)} to {formatDate(booking.endDate)}
                        {booking.user?.phone && (
                          <span className="text-slate-400"> · Phone: {booking.user.phone}</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-extrabold text-slate-900">
                        {formatCurrency(booking.price, currency)}
                      </p>
                      <span className="capitalize text-[11px] font-semibold text-slate-500">
                        {booking.status}
                      </span>
                    </div>

                    {isPending ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={actionLoadingId === booking._id}
                          onClick={() => handleBookingAction(booking._id, 'confirmed')}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          disabled={actionLoadingId === booking._id}
                          onClick={() => handleBookingAction(booking._id, 'rejected')}
                          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">
                        {booking.status}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 px-4 text-center">
            <CalendarDays className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-sm font-bold text-slate-800">No incoming booking requests yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              When farmers request your tractors for field work, they will appear here for your
              approval.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerDashboard;
