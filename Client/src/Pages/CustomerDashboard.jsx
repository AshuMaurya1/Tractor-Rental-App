import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Bell,
  CalendarRange,
  CheckCircle2,
  Clock3,
  FileText,
  MapPin,
  ShieldCheck,
  Tractor,
  UserCircle2,
  Wallet,
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const formatDate = (value) => {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return value;
  }
};

const CustomerDashboard = () => {
  const { user, axios, tractors, currency = '₹' } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/booking/user');
        if (data.success) {
          setBookings(data.bookings || []);
        }
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchBookings();
  }, [axios, user]);

  const totalSpent = useMemo(
    () => bookings.reduce((sum, booking) => sum + Number(booking.price || 0), 0),
    [bookings]
  );

  const activeBookings = bookings.filter((booking) =>
    ['confirmed', 'pending'].includes((booking.status || '').toLowerCase())
  );

  const recentBookings = bookings.slice(0, 3);
  const suggestedTractors = tractors.slice(0, 3);

  const currentBooking = bookings[0] || {};
  const statusSteps = [
    { label: 'Booked', done: true, time: currentBooking ? formatDate(currentBooking.startDate) : 'Awaiting' },
    { label: 'Approved', done: !!currentBooking.status && !['cancelled'].includes((currentBooking.status || '').toLowerCase()), time: '2h ago' },
    { label: 'Ready', done: ['confirmed', 'completed'].includes((currentBooking.status || '').toLowerCase()), time: 'Today' },
    { label: 'Delivered', done: ['completed'].includes((currentBooking.status || '').toLowerCase()), time: 'Schedule' },
  ];

  const notifications = [
    { title: 'Pickup reminder', text: 'Your Mahindra DI 275 is scheduled for field dispatch tomorrow morning.', time: '12 min ago', tone: 'emerald' },
    { title: 'Invoice issued', text: 'Rental invoice for invoice #INV-UP-2026-24891 has been generated.', time: '1 day ago', tone: 'sky' },
    { title: 'Support update', text: 'Your agronomist team confirmed a field-ready technician for your plot.', time: '2 days ago', tone: 'amber' },
  ];

  const invoiceHistory = bookings.slice(0, 3).map((booking) => ({
    id: booking._id || booking.id || 'INV-2026-0001',
    title: booking.tractor?.brand ? `${booking.tractor.brand} ${booking.tractor.model || 'tractor'}` : 'Tractor rental',
    date: formatDate(booking.startDate),
    amount: `${currency}${Number(booking.price || 0).toLocaleString()}`,
    status: booking.status || 'confirmed',
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 antialiased">
      {!user ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
          <Tractor className="mx-auto h-12 w-12 text-blue-700 mb-4" />
          <h1 className="text-2xl font-bold text-slate-900">Customer account required</h1>
          <p className="mt-2 text-sm text-slate-500">Please sign in to view your personalized customer dashboard.</p>
          <Link
            to="/"
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Go to home <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <>
          <section className="mb-8 overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-white to-sky-50 shadow-sm">
            <div className="flex flex-col gap-5 px-6 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700">Customer dashboard</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                  Welcome back, {user.name || 'Farmer'}
                </h1>
                <p className="mt-2 max-w-xl text-sm text-slate-600">
                  Track your rentals, manage upcoming bookings, and keep your farm operations moving smoothly.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link
                  to="/tractor"
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  Browse tractors <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/mybooking"
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700"
                >
                  My bookings
                </Link>
              </div>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total bookings</p>
                <CalendarRange className="h-4 w-4 text-blue-700" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{bookings.length}</div>
              <p className="mt-2 text-xs text-slate-500">All reservations created</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Active</p>
                <Clock3 className="h-4 w-4 text-amber-600" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{activeBookings.length}</div>
              <p className="mt-2 text-xs text-slate-500">Current and pending rentals</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total spend</p>
                <Wallet className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">{currency}{totalSpent.toLocaleString()}</div>
              <p className="mt-2 text-xs text-slate-500">Estimated rental value</p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Support</p>
                <ShieldCheck className="h-4 w-4 text-sky-600" />
              </div>
              <div className="mt-4 text-3xl font-black text-slate-900">24/7</div>
              <p className="mt-2 text-xs text-slate-500">Field assistance available</p>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Profile overview</h2>
                <UserCircle2 className="h-5 w-5 text-blue-700" />
              </div>

              <div className="mt-5 flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 text-lg font-black text-white">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'F'}
                </div>
                <div>
                  <div className="text-base font-bold text-slate-900">{user.name || 'Farmer Profile'}</div>
                  <div className="text-xs text-slate-500">Verified customer • {user.email || 'farmer@tractorrental.in'}</div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Farm region</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Uttar Pradesh</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Member since</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">2024</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Preferred crops</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Wheat, Sugarcane</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">Support tier</p>
                  <p className="mt-2 text-sm font-semibold text-slate-800">Priority</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Order tracking</h2>
                <Clock3 className="h-5 w-5 text-emerald-600" />
              </div>

              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-emerald-700">Current status</p>
                    <p className="mt-1 text-xl font-black text-slate-900">{(currentBooking.status || 'Confirmed').toUpperCase()}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">Live</span>
                </div>
              </div>

              <div className="mt-5 space-y-4">
                {statusSteps.map((step, index) => (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-6 w-6 items-center justify-center rounded-full ${step.done ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                        {step.done ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
                      </div>
                      {index < statusSteps.length - 1 && <div className="mt-1 h-8 w-px bg-slate-200" />}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className={`text-sm font-semibold ${step.done ? 'text-slate-900' : 'text-slate-500'}`}>{step.label}</p>
                        <span className="text-[11px] text-slate-500">{step.time}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
                <Bell className="h-5 w-5 text-amber-600" />
              </div>

              <div className="mt-4 space-y-3">
                {notifications.map((item) => (
                  <div key={item.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            item.tone === 'emerald' ? 'bg-emerald-500' :
                            item.tone === 'sky' ? 'bg-sky-500' : 'bg-amber-500'
                          }`} />
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-600">{item.text}</p>
                      </div>
                      <span className="text-[10px] text-slate-500 whitespace-nowrap">{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Invoice history</h2>
                <FileText className="h-5 w-5 text-sky-600" />
              </div>

              <div className="mt-4 space-y-3">
                {invoiceHistory.length > 0 ? invoiceHistory.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{invoice.title}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{invoice.date} • {invoice.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-slate-900">{invoice.amount}</p>
                      <Link to="/mybooking" className="mt-1 inline-block text-[10px] font-semibold text-blue-700 hover:underline">View</Link>
                    </div>
                  </div>
                )) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-500">No invoice history yet.</div>
                )}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900">Recent rentals</h2>
                <Link to="/mybooking" className="text-xs font-semibold text-blue-700 hover:underline">View all</Link>
              </div>

              {loading ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">Loading your booking history…</div>
              ) : recentBookings.length > 0 ? (
                <div className="space-y-3">
                  {recentBookings.map((booking) => {
                    const tractor = booking.tractor || {};
                    const status = (booking.status || 'confirmed').toLowerCase();
                    const statusMap = {
                      confirmed: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
                      pending: 'text-amber-700 bg-amber-50 border border-amber-200',
                      cancelled: 'text-rose-700 bg-rose-50 border border-rose-200',
                      completed: 'text-sky-700 bg-sky-50 border border-sky-200',
                    };

                    return (
                      <div key={booking._id || booking.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <img
                              src={tractor.image || 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80'}
                              alt={tractor.brand || 'Tractor'}
                              className="h-14 w-14 rounded-lg object-cover"
                            />
                            <div>
                              <div className="font-bold text-slate-900">
                                {tractor.brand || 'Mahindra'} {tractor.model || 'DI 275'}
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                                <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {tractor.location || 'Uttar Pradesh'}</span>
                                <span>•</span>
                                <span>{formatDate(booking.startDate)} to {formatDate(booking.endDate)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${statusMap[status] || 'text-slate-700 bg-slate-200 border border-slate-200'}`}>
                              {status}
                            </span>
                            <div className="mt-2 text-lg font-black text-slate-900">{currency}{Number(booking.price || 0).toLocaleString()}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
                  You have no bookings yet. Start by choosing a tractor from the fleet.
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Quick actions</h2>
                <div className="mt-4 space-y-3">
                  <Link to="/tractor" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    <span>Browse fleet</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/mybooking" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    <span>Open bookings</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link to="/" className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 hover:border-blue-300 hover:text-blue-700">
                    <span>Back to home</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-bold text-slate-900">Why farmers choose us</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Verified equipment and on-time dispatch.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Transparent pricing with no hidden charges.</li>
                  <li className="flex items-start gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600" /> Support for field-ready seasonal rentals.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">Recommended for you</h2>
              <Link to="/tractor" className="text-xs font-semibold text-blue-700 hover:underline">See more</Link>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {suggestedTractors.map((tractor) => (
                <div key={tractor._id || tractor.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <img src={tractor.image} alt={`${tractor.brand} ${tractor.model}`} className="h-44 w-full object-cover" />
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{tractor.brand} {tractor.model}</h3>
                        <p className="mt-1 text-xs text-slate-500">{tractor.category || 'Agriculture'} • {tractor.year || '2024'}</p>
                      </div>
                      <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">Available</span>
                    </div>

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" /> {tractor.location || 'Uttar Pradesh'}
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-slate-400">Daily rate</p>
                        <div className="text-xl font-black text-slate-900">{currency}{tractor.pricePerDay || tractor.price || 1800}</div>
                      </div>
                      <Link
                        to={`/tractor-details/${tractor._id || tractor.id}`}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-800"
                      >
                        Book <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default CustomerDashboard;
