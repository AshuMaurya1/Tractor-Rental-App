import { useCallback, useEffect, useMemo, useState } from 'react';
import Title from '../../Components/owner/Title';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import { Bell, CheckCircle2, Clock, XCircle, CalendarCheck } from 'lucide-react';

const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? '—'
    : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const OwnerNotifications = () => {
  const { axios, language = 'en' } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('owner_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookingsRes, tractorsRes] = await Promise.all([
        axios.get('/api/booking/owner'),
        axios.get('/api/owner/tractors'),
      ]);

      if (bookingsRes.data.success && Array.isArray(bookingsRes.data.bookings)) {
        setBookings(bookingsRes.data.bookings);
      }
      if (tractorsRes.data.success && Array.isArray(tractorsRes.data.tractors)) {
        setTractors(tractorsRes.data.tractors);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate dynamic live notifications from actual MongoDB data
  const notifications = useMemo(() => {
    const list = [];

    // Tractor verification status alerts
    tractors.forEach((t) => {
      const tractorName = `${t.brand || ''} ${t.model || ''}`.trim();
      if (t.status === 'approved') {
        list.push({
          id: `tractor-approved-${t._id}`,
          title: 'Tractor Verified & Approved!',
          message: `Your ${tractorName} has been approved by the Admin and is now visible in the public booking catalog.`,
          time: formatDate(t.verifiedAt || t.updatedAt || t.createdAt),
          type: 'success',
          icon: CheckCircle2,
        });
      } else if (t.status === 'rejected') {
        list.push({
          id: `tractor-rejected-${t._id}`,
          title: 'Tractor Submission Rejected',
          message: `Your ${tractorName} was not approved. Admin note: "${t.rejectionReason || 'Did not meet requirements'}"`,
          time: formatDate(t.updatedAt || t.createdAt),
          type: 'danger',
          icon: XCircle,
        });
      } else if (t.status === 'pending') {
        list.push({
          id: `tractor-pending-${t._id}`,
          title: 'Tractor Under Verification',
          message: `Submission for ${tractorName} is currently awaiting review by the platform verification officer.`,
          time: formatDate(t.createdAt),
          type: 'warning',
          icon: Clock,
        });
      }
    });

    // Booking alerts
    bookings.forEach((b) => {
      const tractorName = b.tractor
        ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
        : 'Tractor';
      const farmerName = b.user?.name || 'Farmer';

      if (b.status === 'pending') {
        list.push({
          id: `booking-pending-${b._id}`,
          title: 'New Booking Request Received',
          message: `${farmerName} requested to hire ${tractorName} from ${formatDate(
            b.startDate
          )} to ${formatDate(b.endDate)}. Action needed!`,
          time: formatDate(b.createdAt),
          type: 'warning',
          icon: CalendarCheck,
        });
      } else if (b.status === 'confirmed') {
        list.push({
          id: `booking-confirmed-${b._id}`,
          title: 'Booking Confirmed',
          message: `You confirmed rental of ${tractorName} for ${farmerName}. Schedule starts on ${formatDate(
            b.startDate
          )}.`,
          time: formatDate(b.updatedAt || b.createdAt),
          type: 'success',
          icon: CheckCircle2,
        });
      } else if (b.status === 'completed') {
        list.push({
          id: `booking-completed-${b._id}`,
          title: 'Rental Completed & Settled',
          message: `Rental of ${tractorName} with ${farmerName} has concluded.`,
          time: formatDate(b.updatedAt || b.createdAt),
          type: 'info',
          icon: CheckCircle2,
        });
      }
    });

    return list;
  }, [tractors, bookings]);

  const markAllRead = () => {
    const ids = notifications.map((n) => n.id);
    setReadIds(ids);
    localStorage.setItem('owner_read_notifs', JSON.stringify(ids));
    window.dispatchEvent(new Event('owner-notifications-read'));
    toast.success('All notifications marked as read.');
  };

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 antialiased">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <Title
          title={language === 'hi' ? 'सूचनाएं व अलर्ट' : 'Owner Notifications & Alerts'}
          subtitle={
            language === 'hi'
              ? 'आने वाले बुकिंग अनुरोध और ट्रैक्टर सत्यापन स्थिति अपडेट।'
              : 'Real-time updates regarding machinery approvals and incoming farmer rental requests.'
          }
        />
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs font-bold text-emerald-700 hover:underline self-start sm:self-auto"
          >
            Mark all read ({unreadCount})
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white border border-slate-200" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          notifications.map((n) => {
            const isRead = readIds.includes(n.id);
            const Icon = n.icon || Bell;

            return (
              <div
                key={n.id}
                className={`rounded-2xl border p-4 shadow-xs transition-colors flex items-start gap-3.5 ${
                  isRead ? 'border-slate-200 bg-white' : 'border-emerald-200 bg-emerald-50/40'
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                    n.type === 'success'
                      ? 'bg-emerald-100 text-emerald-700'
                      : n.type === 'warning'
                      ? 'bg-amber-100 text-amber-700'
                      : n.type === 'danger'
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-blue-100 text-blue-700'
                  }`}
                >
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{n.title}</h3>
                    <span className="text-[11px] text-slate-400 shrink-0">{n.time}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white py-14 px-4 text-center">
            <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-900">No notifications yet</h3>
            <p className="mt-1 text-xs text-slate-500">
              When tractors are verified or bookings are requested, alerts will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerNotifications;
