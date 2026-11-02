import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Tractor,
  CalendarCheck,
  History,
  User,
  Bell,
  LogOut,
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  ArrowRight,
  Menu,
  X,
  FileText,
  ShieldCheck,
  Phone,
  Mail,
  RefreshCw,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Check,
  ShieldAlert,
  Shield,
  Award
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAppContext } from '../../context/AppContext';
import InvoiceModal from '../../Components/InvoiceModal';
import SosBreakdownModal from '../../Components/SosBreakdownModal';

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

const FarmerDashboard = () => {
  const { user, setUser, axios, logout, currency = '₹' } = useAppContext();
  const navigate = useNavigate();

  // Navigation tab: 'dashboard' | 'browse' | 'bookings' | 'history' | 'profile' | 'notifications'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Data states
  const [bookings, setBookings] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [loadingTractors, setLoadingTractors] = useState(true);

  // Search & filter states for Browse Tractors
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [maxPrice, setMaxPrice] = useState(10000);
  const [sortBy, setSortBy] = useState('recommended');

  // Modals
  const [selectedTractorDetails, setSelectedTractorDetails] = useState(null);
  const [bookingTractor, setBookingTractor] = useState(null);
  const [bookingStartDate, setBookingStartDate] = useState('');
  const [bookingEndDate, setBookingEndDate] = useState('');
  const [includeDriver, setIncludeDriver] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // Invoice modal
  const [invoiceBooking, setInvoiceBooking] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // SOS modal & Escrow state
  const [sosBooking, setSosBooking] = useState(null);
  const [isSosOpen, setIsSosOpen] = useState(false);

  const handleReleaseEscrow = async (bookingId) => {
    if (!window.confirm('Confirm that field work has been completed? This will release the escrow funds to the tractor owner.')) return;
    try {
      const { data } = await axios.post('/api/booking/release-escrow', { bookingId });
      if (data.success) {
        toast.success('Escrow payout released successfully to tractor owner!');
        fetchBookings();
      } else {
        toast.error(data.message || 'Could not release escrow');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to release escrow');
    }
  };

  // Profile edit state
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Read notification state
  const [readNotifications, setReadNotifications] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('farmer_read_notifs') || '[]');
    } catch {
      return [];
    }
  });

  // Fetch farmer's actual bookings from MongoDB
  const fetchBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const { data } = await axios.get('/api/booking/user');
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load bookings.');
      setBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  }, [axios]);

  // Fetch approved & available tractors from MongoDB
  const fetchTractors = useCallback(async () => {
    setLoadingTractors(true);
    try {
      const { data } = await axios.get('/api/user/tractors');
      if (data.success && Array.isArray(data.tractors)) {
        setTractors(data.tractors);
      } else {
        setTractors([]);
      }
    } catch {
      setTractors([]);
    } finally {
      setLoadingTractors(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchBookings();
    fetchTractors();
  }, [fetchBookings, fetchTractors]);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Derived booking counts
  const counts = useMemo(() => {
    const total = bookings.length;
    const active = bookings.filter((b) =>
      ['pending', 'confirmed'].includes(String(b.status || '').toLowerCase())
    ).length;
    const pending = bookings.filter(
      (b) => String(b.status || '').toLowerCase() === 'pending'
    ).length;
    const completed = bookings.filter(
      (b) => String(b.status || '').toLowerCase() === 'completed'
    ).length;
    const cancelled = bookings.filter((b) =>
      ['cancelled', 'rejected'].includes(String(b.status || '').toLowerCase())
    ).length;
    const totalSpent = bookings
      .filter((b) => b.status === 'completed')
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);

    return { total, active, pending, completed, cancelled, totalSpent };
  }, [bookings]);

  // Recent bookings (first 5)
  const recentBookings = useMemo(() => bookings.slice(0, 5), [bookings]);

  // Filtered tractors for Browse Tractors tab
  const locationsList = useMemo(() => {
    const locs = new Set();
    tractors.forEach((t) => {
      if (t.location) locs.add(t.location.trim());
    });
    return Array.from(locs).sort();
  }, [tractors]);

  const categoriesList = useMemo(() => {
    const cats = new Set();
    tractors.forEach((t) => {
      if (t.brand) cats.add(t.brand.trim());
      if (t.category) cats.add(t.category.trim());
    });
    return Array.from(cats).sort();
  }, [tractors]);

  const filteredTractors = useMemo(() => {
    let list = tractors.filter((t) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (t.brand && t.brand.toLowerCase().includes(q)) ||
        (t.model && t.model.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        (t.category && t.category.toLowerCase().includes(q));

      const matchesLocation =
        selectedLocation === 'all' ||
        (t.location && t.location.toLowerCase() === selectedLocation.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        (t.brand && t.brand.toLowerCase() === selectedCategory.toLowerCase()) ||
        (t.category && t.category.toLowerCase() === selectedCategory.toLowerCase());

      const matchesPrice = !t.pricePerDay || Number(t.pricePerDay) <= maxPrice;

      return matchesSearch && matchesLocation && matchesCategory && matchesPrice;
    });

    if (sortBy === 'price-low') {
      list.sort((a, b) => Number(a.pricePerDay || 0) - Number(b.pricePerDay || 0));
    } else if (sortBy === 'price-high') {
      list.sort((a, b) => Number(b.pricePerDay || 0) - Number(a.pricePerDay || 0));
    } else if (sortBy === 'availability') {
      list.sort((a, b) => (b.isAvailable ? 1 : 0) - (a.isAvailable ? 1 : 0));
    }

    return list;
  }, [tractors, searchQuery, selectedLocation, selectedCategory, maxPrice, sortBy]);

  // Dynamic notifications based on real bookings
  const notifications = useMemo(() => {
    const notifs = [];
    bookings.forEach((b) => {
      const tractorName = b.tractor
        ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
        : 'Tractor';
      const status = String(b.status || '').toLowerCase();

      if (status === 'pending') {
        notifs.push({
          id: `pending-${b._id}`,
          title: 'Booking Request Awaiting Owner',
          message: `Your booking for ${tractorName} (${formatDate(b.startDate)} to ${formatDate(
            b.endDate
          )}) is awaiting approval.`,
          time: formatDate(b.createdAt),
          type: 'warning',
        });
      } else if (status === 'confirmed') {
        notifs.push({
          id: `confirmed-${b._id}`,
          title: 'Booking Confirmed!',
          message: `Great news! Owner confirmed your rental of ${tractorName}. Dispatch starts ${formatDate(
            b.startDate
          )}.`,
          time: formatDate(b.updatedAt || b.createdAt),
          type: 'success',
        });
      } else if (status === 'completed') {
        notifs.push({
          id: `completed-${b._id}`,
          title: 'Rental Completed',
          message: `Rental of ${tractorName} has completed. Tax invoice is available for download.`,
          time: formatDate(b.updatedAt || b.createdAt),
          type: 'info',
        });
      } else if (status === 'rejected') {
        notifs.push({
          id: `rejected-${b._id}`,
          title: 'Booking Request Declined',
          message: `Owner was unable to accept your booking for ${tractorName}. You can browse other available tractors.`,
          time: formatDate(b.updatedAt || b.createdAt),
          type: 'danger',
        });
      }
    });
    return notifs;
  }, [bookings]);

  const unreadCount = notifications.filter((n) => !readNotifications.includes(n.id)).length;

  const markAllNotificationsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotifications(allIds);
    localStorage.setItem('farmer_read_notifs', JSON.stringify(allIds));
    toast.success('All notifications marked as read.');
  };

  // Cancel booking handler
  const handleCancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      'Are you sure you want to cancel this booking reservation?'
    );
    if (!confirmCancel) return;

    try {
      const { data } = await axios.post('/api/booking/change-status', {
        bookingId,
        status: 'cancelled',
      });
      if (data.success) {
        toast.success('Booking cancelled successfully.');
        fetchBookings();
      } else {
        toast.error(data.message || 'Unable to cancel booking.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to cancel booking.');
    }
  };

  // Open booking modal
  const openBookingModal = (tractor) => {
    setBookingTractor(tractor);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 3);

    setBookingStartDate(tomorrow.toISOString().split('T')[0]);
    setBookingEndDate(dayAfter.toISOString().split('T')[0]);
    setIncludeDriver(false);
  };

  // Calculate booking days & total
  const bookingEstimate = useMemo(() => {
    if (!bookingTractor || !bookingStartDate || !bookingEndDate) {
      return { days: 0, baseCost: 0, driverCost: 0, total: 0 };
    }
    const start = new Date(bookingStartDate);
    const end = new Date(bookingEndDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return { days: 0, baseCost: 0, driverCost: 0, total: 0 };
    }
    const diffDays = Math.max(1, Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)));
    const baseCost = diffDays * Number(bookingTractor.pricePerDay || 0);
    const driverCost = includeDriver ? diffDays * 500 : 0;
    return { days: diffDays, baseCost, driverCost, total: baseCost + driverCost };
  }, [bookingTractor, bookingStartDate, bookingEndDate, includeDriver]);

  // Submit booking handler
  const handleCreateBooking = async (e) => {
    e.preventDefault();
    if (!bookingTractor || !bookingStartDate || !bookingEndDate) {
      toast.error('Please select both start and end dates.');
      return;
    }
    if (bookingEstimate.days <= 0) {
      toast.error('Return date must be after pickup date.');
      return;
    }

    setIsSubmittingBooking(true);
    try {
      const { data } = await axios.post('/api/booking/create', {
        tractorId: bookingTractor._id,
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        price: bookingEstimate.total,
        includeDriver,
      });

      if (data.success) {
        toast.success('Booking requested! Awaiting owner confirmation.');
        setBookingTractor(null);
        fetchBookings();
        setActiveTab('bookings');
      } else {
        toast.error(data.message || 'Unable to create booking.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Booking creation failed.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Update profile handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      toast.error('Name cannot be empty.');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const { data } = await axios.put('/api/user/profile', {
        name: profileName.trim(),
        phone: profilePhone.trim(),
      });
      if (data.success && data.user) {
        setUser(data.user);
        toast.success('Profile updated successfully.');
      } else {
        toast.error(data.message || 'Unable to update profile.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Profile update failed.');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Nav items list
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'browse', label: 'Browse Tractors', icon: Tractor },
    {
      id: 'bookings',
      label: 'My Bookings',
      icon: CalendarCheck,
      badge: counts.active > 0 ? counts.active : null,
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    { id: 'history', label: 'Booking History', icon: History },
    { id: 'profile', label: 'My Profile', icon: User },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
      badgeColor: 'bg-rose-100 text-rose-700',
    },
  ];

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
          <CheckCircle2 size={12} /> Confirmed
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700 border border-blue-200">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200">
          <Clock size={12} /> Pending Approval
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
          <AlertCircle size={12} /> Rejected
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Invoice modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={invoiceBooking}
      />

      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white font-bold">
              <Tractor size={18} />
            </div>
            <span className="font-bold text-slate-900 text-sm">Farmer Portal</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('notifications')}
            className="relative rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen flex flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 shadow-sm ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Logo Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/20">
                <Tractor size={20} />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 truncate">TractorRental</h1>
                  <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                    Farmer Portal
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
            </button>
          </div>

          {/* Farmer Card */}
          <div className="p-3 border-b border-slate-100">
            <div
              className={`flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 ${
                sidebarCollapsed ? 'justify-center p-2' : ''
              }`}
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'F'}
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user?.name || 'Farmer Member'}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.email || '—'}</p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={item.label}
                >
                  <Icon size={18} className="shrink-0" />
                  {!sidebarCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                        isActive ? 'bg-white text-emerald-800' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {sidebarCollapsed && item.badge && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Logout"
          >
            <LogOut size={18} className="shrink-0" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-6xl space-y-6">
          {/* ========================================================
              VIEW 1: DASHBOARD OVERVIEW
          ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Welcome Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white p-6 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Farmer Workspace
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''}!
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">
                    Manage your tractor bookings, field dispatch schedule, and equipment reservations.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2.5">
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 shadow-sm transition-all"
                  >
                    <Tractor size={16} /> Browse Tractors
                  </button>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all"
                  >
                    <CalendarCheck size={16} /> My Bookings
                  </button>
                </div>
              </div>

              {/* Statistics Metric Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-emerald-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Total Bookings
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                      <CalendarDays size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-slate-900">
                    {loadingBookings ? '—' : counts.total}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">All-time reservations</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-blue-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Active Bookings
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                      <Clock size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-blue-700">
                    {loadingBookings ? '—' : counts.active}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Pending & confirmed rentals</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-amber-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Pending Approval
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                      <AlertCircle size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-amber-600">
                    {loadingBookings ? '—' : counts.pending}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Awaiting owner confirmation</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Completed
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <CheckCircle2 size={20} />
                    </div>
                  </div>
                  <p className="mt-3 text-2xl sm:text-3xl font-extrabold text-teal-700">
                    {loadingBookings ? '—' : counts.completed}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">Successfully closed rentals</p>
                </div>
              </div>

              {/* Recent Booking History Section */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-100 p-5">
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Recent Booking Activity</h2>
                    <p className="text-xs text-slate-500">
                      Latest tractor rental requests from your account
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('bookings')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    View All ({counts.total}) <ArrowRight size={14} />
                  </button>
                </div>

                {loadingBookings ? (
                  <div className="p-6 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                    ))}
                  </div>
                ) : recentBookings.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {recentBookings.map((b) => {
                      const tractorName = b.tractor
                        ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                        : 'Agricultural Tractor';
                      const tractorImg =
                        b.tractor?.image ||
                        'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';

                      return (
                        <div
                          key={b._id}
                          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:px-6 hover:bg-slate-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={tractorImg}
                              alt={tractorName}
                              className="h-12 w-16 shrink-0 rounded-lg object-cover bg-slate-100 border border-slate-200"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-sm truncate">
                                {tractorName}
                              </p>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {formatDate(b.startDate)} to {formatDate(b.endDate)}
                                {b.owner?.name && (
                                  <span className="text-slate-400"> · Owner: {b.owner.name}</span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-extrabold text-slate-900">
                                {formatCurrency(b.price, currency)}
                              </p>
                              <p className="text-[10px] text-slate-400">Total Rental</p>
                            </div>
                            <div>{statusBadge(b.status)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <Tractor className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                    <h3 className="text-sm font-bold text-slate-800">No bookings recorded yet</h3>
                    <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                      Explore available tractors in your district and submit your first rental
                      request.
                    </p>
                    <button
                      onClick={() => setActiveTab('browse')}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                    >
                      <Tractor size={14} /> Browse Catalog
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 2: BROWSE TRACTORS (CATALOG & BOOKING)
          ======================================================== */}
          {activeTab === 'browse' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Browse Available Tractors</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Verified agricultural equipment ready for booking in your area
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Showing {filteredTractors.length} approved tractor
                  {filteredTractors.length === 1 ? '' : 's'}
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* Search input */}
                  <div className="relative">
                    <Search
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search tractor name, brand, location..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  {/* Location Filter */}
                  <div>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="all">All Locations ({locationsList.length})</option>
                      {locationsList.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand / Category Filter */}
                  <div>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="all">All Brands / Categories</option>
                      {categoriesList.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort By */}
                  <div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 px-3 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                    >
                      <option value="recommended">Sort: Recommended</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="availability">Availability First</option>
                    </select>
                  </div>
                </div>

                {/* Price range indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal size={14} />
                    <span>Max daily rate:</span>
                    <span className="font-bold text-slate-900">{formatCurrency(maxPrice, currency)}</span>
                  </div>
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="250"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-40 sm:w-60 accent-emerald-600"
                  />
                </div>
              </div>

              {/* Tractors Grid */}
              {loadingTractors ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-72 animate-pulse rounded-2xl bg-white border border-slate-200" />
                  ))}
                </div>
              ) : filteredTractors.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredTractors.map((tractor) => {
                    const brandModel = `${tractor.brand || ''} ${tractor.model || ''}`.trim();
                    const dailyRate = tractor.pricePerDay || 1500;
                    const hp = tractor.horsepower || 45;

                    return (
                      <div
                        key={tractor._id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white shadow-xs hover:shadow-md transition-shadow overflow-hidden group"
                      >
                        {/* Image & Badges */}
                        <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                          <img
                            src={tractor.image}
                            alt={brandModel}
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 text-white px-2 py-0.5 text-[10px] font-bold backdrop-blur-xs">
                              <ShieldCheck size={11} /> Approved
                            </span>
                            {tractor.isAvailable ? (
                              <span className="rounded-full bg-white/95 text-emerald-800 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold">
                                Available Now
                              </span>
                            ) : (
                              <span className="rounded-full bg-slate-900/80 text-white px-2 py-0.5 text-[10px] font-bold">
                                In Field
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="font-bold text-slate-900 text-base">{brandModel}</h3>
                                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                  <MapPin size={12} className="text-slate-400" />
                                  <span>{tractor.location || 'Uttar Pradesh'}</span>
                                </p>
                              </div>
                              <div className="text-right">
                                <span className="text-base font-extrabold text-emerald-700">
                                  {formatCurrency(dailyRate, currency)}
                                </span>
                                <span className="text-[10px] text-slate-400 block">/ day</span>
                              </div>
                            </div>

                            {/* Specs row */}
                            <div className="mt-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2 text-center text-[11px] text-slate-600">
                              <div>
                                <span className="block text-slate-400 text-[10px]">HP</span>
                                <span className="font-bold text-slate-800">{hp} HP</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px]">Year</span>
                                <span className="font-bold text-slate-800">{tractor.year || 2023}</span>
                              </div>
                              <div>
                                <span className="block text-slate-400 text-[10px]">Fuel</span>
                                <span className="font-bold text-slate-800 truncate block">
                                  {tractor.fuelType ? tractor.fuelType.split(' ')[0] : 'Diesel'}
                                </span>
                              </div>
                            </div>

                            {/* Owner info */}
                            {tractor.owner && (
                              <p className="mt-2 text-xs text-slate-500 truncate">
                                Owner:{' '}
                                <span className="font-medium text-slate-700">
                                  {typeof tractor.owner === 'object' ? tractor.owner.name : 'Verified Owner'}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                            <button
                              onClick={() => setSelectedTractorDetails(tractor)}
                              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors inline-flex items-center justify-center gap-1"
                            >
                              <Eye size={13} /> View Details
                            </button>
                            <button
                              disabled={!tractor.isAvailable}
                              onClick={() => openBookingModal(tractor)}
                              className={`flex-1 rounded-xl py-2 text-xs font-bold transition-colors inline-flex items-center justify-center gap-1 ${
                                tractor.isAvailable
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              }`}
                            >
                              <Calendar size={13} /> Book Now
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white py-14 px-4 text-center">
                  <Tractor className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No tractors match your filter</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search keyword, location, or price slider to see more machinery.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedLocation('all');
                      setSelectedCategory('all');
                      setMaxPrice(10000);
                    }}
                    className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VIEW 3: MY BOOKINGS (ACTIVE & PENDING)
          ======================================================== */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">My Equipment Bookings</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Live overview of all active, confirmed, and awaiting reservation requests
                  </p>
                </div>
                <button
                  onClick={fetchBookings}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
                >
                  <RefreshCw size={13} /> Refresh
                </button>
              </div>

              {loadingBookings ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-28 animate-pulse rounded-2xl bg-white border border-slate-200" />
                  ))}
                </div>
              ) : bookings.length > 0 ? (
                <div className="space-y-4">
                  {bookings.map((b) => {
                    const tractorName = b.tractor
                      ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                      : 'Agricultural Tractor';
                    const tractorImg =
                      b.tractor?.image ||
                      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';
                    const canCancel = ['pending', 'confirmed'].includes(
                      String(b.status || '').toLowerCase()
                    );

                    return (
                      <div
                        key={b._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-400">
                              Booking #{String(b._id).slice(-6).toUpperCase()}
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-500">
                              Booked on {formatDate(b.createdAt)}
                            </span>

                            {b.isChcCertified && (
                              <span className="text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                <Award size={11} /> CHC Subsidized
                              </span>
                            )}

                            {b.insuranceIncluded && (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                                <Shield size={11} /> Insured
                              </span>
                            )}

                            {b.escrowStatus === 'released' ? (
                              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded flex items-center gap-1">
                                <ShieldCheck size={11} /> Escrow Released
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock size={11} /> Escrow Protected
                              </span>
                            )}
                          </div>
                          <div>{statusBadge(b.status)}</div>
                        </div>

                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={tractorImg}
                              alt={tractorName}
                              className="h-16 w-20 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                            />
                            <div>
                              <h3 className="font-bold text-slate-900 text-base">{tractorName}</h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
                                <MapPin size={13} className="text-slate-400" />
                                <span>{b.tractor?.location || 'Assigned District Hub'}</span>
                              </p>
                              {b.owner?.name && (
                                <p className="text-xs text-slate-600 mt-1">
                                  Owner: <span className="font-semibold">{b.owner.name}</span>
                                  {b.owner.phone && (
                                    <span className="text-slate-400"> · Contact: {b.owner.phone}</span>
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:text-right">
                            <div>
                              <span className="text-[11px] text-slate-400 block">Pickup Date</span>
                              <span className="text-xs font-bold text-slate-800">
                                {formatDate(b.startDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-[11px] text-slate-400 block">Return Date</span>
                              <span className="text-xs font-bold text-slate-800">
                                {formatDate(b.endDate)}
                              </span>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                              <span className="text-[11px] text-slate-400 block">Total Rental</span>
                              <span className="text-base font-extrabold text-emerald-700">
                                {formatCurrency(b.price, currency)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs text-slate-500">
                            {b.includeDriver && (
                              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold mr-3">
                                <Check size={12} /> Driver Included
                              </span>
                            )}
                            {b.implements?.length > 0 && (
                              <span className="text-slate-500">
                                Implements: {b.implements.join(', ')}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Escrow Release Button */}
                            {b.escrowStatus !== 'released' && b.status === 'confirmed' && (
                              <button
                                onClick={() => handleReleaseEscrow(b._id)}
                                className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                                title="Confirm completion to release escrow payment"
                              >
                                <CheckCircle2 size={13} /> Confirm & Release Escrow
                              </button>
                            )}

                            {/* Emergency Field SOS Button */}
                            <button
                              onClick={() => {
                                setSosBooking(b);
                                setIsSosOpen(true);
                              }}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 cursor-pointer"
                              title="Request emergency mobile mechanic to field"
                            >
                              <ShieldAlert size={13} /> 🚨 Field SOS
                            </button>

                            {b.status === 'completed' && (
                              <button
                                onClick={() => {
                                  setInvoiceBooking(b);
                                  setIsInvoiceOpen(true);
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100"
                              >
                                <FileText size={13} /> View Invoice
                              </button>
                            )}

                            {canCancel && (
                              <button
                                onClick={() => handleCancelBooking(b._id)}
                                className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                              >
                                <XCircle size={13} /> Cancel Reservation
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white py-14 px-4 text-center">
                  <CalendarDays className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No active bookings</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    You have no active bookings right now. Ready to hire machinery for plowing,
                    sowing, or harvesting?
                  </p>
                  <button
                    onClick={() => setActiveTab('browse')}
                    className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Browse Available Tractors
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              VIEW 4: BOOKING HISTORY
          ======================================================== */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Rental History & Receipts</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Complete record of your past completed and cancelled tractor rentals
                </p>
              </div>

              {/* History Summary */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Completed Rentals
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts.completed}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Cancelled / Declined
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-slate-900">{counts.cancelled}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Total Rental Expense
                  </span>
                  <p className="mt-1 text-2xl font-extrabold text-emerald-700">
                    {formatCurrency(counts.totalSpent, currency)}
                  </p>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Tractor</th>
                        <th className="py-3 px-4">Rental Duration</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Receipt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {bookings.filter((b) =>
                        ['completed', 'cancelled', 'rejected'].includes(
                          String(b.status || '').toLowerCase()
                        )
                      ).length > 0 ? (
                        bookings
                          .filter((b) =>
                            ['completed', 'cancelled', 'rejected'].includes(
                              String(b.status || '').toLowerCase()
                            )
                          )
                          .map((b) => {
                            const tractorName = b.tractor
                              ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                              : 'Tractor';
                            return (
                              <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                                  #{String(b._id).slice(-6).toUpperCase()}
                                </td>
                                <td className="py-3.5 px-4 font-bold text-slate-900">
                                  {tractorName}
                                </td>
                                <td className="py-3.5 px-4 text-slate-600">
                                  {formatDate(b.startDate)} – {formatDate(b.endDate)}
                                </td>
                                <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                  {formatCurrency(b.price, currency)}
                                </td>
                                <td className="py-3.5 px-4">{statusBadge(b.status)}</td>
                                <td className="py-3.5 px-4 text-right">
                                  <button
                                    onClick={() => {
                                      setInvoiceBooking(b);
                                      setIsInvoiceOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  >
                                    <FileText size={12} /> Tax Invoice
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-10 text-center text-slate-400">
                            No past rental records found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 5: MY PROFILE
          ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-3xl">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Farmer Profile & Settings</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your personal details, contact number, and rental activity
                </p>
              </div>

              {/* Profile Overview Card */}
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl font-bold text-white shadow-md shadow-emerald-500/20 shrink-0">
                    {user?.name ? user.name[0].toUpperCase() : 'F'}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{user?.name || 'Farmer'}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 border border-emerald-200">
                        <ShieldCheck size={12} /> Verified Farmer
                      </span>
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        Member since {formatDate(user?.createdAt || new Date())}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleUpdateProfile} className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        required
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="text"
                          value={profilePhone}
                          onChange={(e) => setProfilePhone(e.target.value)}
                          placeholder="e.g. 9876543210"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-emerald-600 focus:bg-white"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Registered Email (Read-only)
                      </label>
                      <div className="relative">
                        <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full rounded-xl border border-slate-200 bg-slate-100 py-2 pl-9 pr-3 text-sm text-slate-500 cursor-not-allowed"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-sm transition-all disabled:opacity-50"
                    >
                      {isUpdatingProfile ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" /> Saving...
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ========================================================
              VIEW 6: NOTIFICATIONS
          ======================================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 max-w-3xl">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Real-time status updates on your tractor reservations
                  </p>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsRead}
                    className="text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {notifications.length > 0 ? (
                <div className="space-y-3">
                  {notifications.map((notif) => {
                    const isRead = readNotifications.includes(notif.id);
                    return (
                      <div
                        key={notif.id}
                        className={`rounded-2xl border p-4 shadow-xs transition-colors flex items-start gap-3.5 ${
                          isRead
                            ? 'border-slate-200 bg-white'
                            : 'border-emerald-200 bg-emerald-50/50'
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold ${
                            notif.type === 'success'
                              ? 'bg-emerald-100 text-emerald-700'
                              : notif.type === 'warning'
                              ? 'bg-amber-100 text-amber-700'
                              : notif.type === 'danger'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          <Bell size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-900 truncate">
                              {notif.title}
                            </h3>
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {notif.message}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white py-14 px-4 text-center">
                  <Bell className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">No notifications</h3>
                  <p className="mt-1 text-xs text-slate-500">
                    You're all caught up! Updates regarding your bookings will appear here.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          MODAL: TRACTOR DETAILS
      ======================================================== */}
      {selectedTractorDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedTractorDetails(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 mb-4">
              <img
                src={selectedTractorDetails.image}
                alt={selectedTractorDetails.brand}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedTractorDetails.brand} {selectedTractorDetails.model}
                </h3>
                <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                  <MapPin size={13} className="text-slate-400" />
                  <span>{selectedTractorDetails.location}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-xl font-extrabold text-emerald-700">
                  {formatCurrency(selectedTractorDetails.pricePerDay, currency)}
                </span>
                <span className="text-xs text-slate-400 block">per day</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 rounded-xl bg-slate-50 p-3 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Horsepower</span>
                <span className="font-bold text-slate-800">
                  {selectedTractorDetails.horsepower || 45} HP
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Manufacturing Year</span>
                <span className="font-bold text-slate-800">
                  {selectedTractorDetails.year || 2023}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Transmission</span>
                <span className="font-bold text-slate-800">
                  {selectedTractorDetails.transmission || 'Manual'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Fuel Type</span>
                <span className="font-bold text-slate-800">
                  {selectedTractorDetails.fuelType || 'Diesel'}
                </span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Equipment Description
              </h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {selectedTractorDetails.description || 'Verified agricultural tractor for field work.'}
              </p>
            </div>

            {selectedTractorDetails.owner && (
              <div className="mt-4 p-3 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Owner Details</span>
                  <span className="font-bold text-slate-800">
                    {typeof selectedTractorDetails.owner === 'object'
                      ? selectedTractorDetails.owner.name
                      : 'Verified Partner'}
                  </span>
                </div>
                <span className="rounded-full bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 text-[10px]">
                  Verified Owner
                </span>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedTractorDetails(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
              {selectedTractorDetails.isAvailable && (
                <button
                  onClick={() => {
                    const t = selectedTractorDetails;
                    setSelectedTractorDetails(null);
                    openBookingModal(t);
                  }}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                >
                  Book This Tractor
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: BOOKING REQUEST FORM
      ======================================================== */}
      {bookingTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setBookingTractor(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900">
              Book {bookingTractor.brand} {bookingTractor.model}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Select rental dates. Owner will review and confirm your reservation.
            </p>

            <form onSubmit={handleCreateBooking} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pickup Date (Start)
                  </label>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Return Date (End)
                  </label>
                  <input
                    type="date"
                    min={bookingStartDate || new Date().toISOString().split('T')[0]}
                    value={bookingEndDate}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs outline-none focus:border-emerald-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Include driver option */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer hover:bg-slate-100/70 transition-colors">
                <input
                  type="checkbox"
                  checked={includeDriver}
                  onChange={(e) => setIncludeDriver(e.target.checked)}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Include Professional Operator</span>
                  <span className="text-slate-500">Expert driver assistance (+₹500/day)</span>
                </div>
              </label>

              {/* Cost Summary Box */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Rental Duration</span>
                  <span className="font-bold text-slate-900">
                    {bookingEstimate.days} Day{bookingEstimate.days === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Daily Tractor Rate</span>
                  <span>{formatCurrency(bookingTractor.pricePerDay, currency)} / day</span>
                </div>
                {includeDriver && (
                  <div className="flex justify-between text-slate-600">
                    <span>Operator Fee ({bookingEstimate.days} days)</span>
                    <span>{formatCurrency(bookingEstimate.driverCost, currency)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200 flex justify-between text-sm font-extrabold text-emerald-900">
                  <span>Estimated Total</span>
                  <span>{formatCurrency(bookingEstimate.total, currency)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingTractor(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingBooking || bookingEstimate.days <= 0}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {isSubmittingBooking ? 'Submitting...' : 'Confirm & Request Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOS Breakdown Mechanic Modal */}
      <SosBreakdownModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        booking={sosBooking}
        onSosDispatched={() => fetchBookings()}
      />
    </div>
  );
};

export default FarmerDashboard;
