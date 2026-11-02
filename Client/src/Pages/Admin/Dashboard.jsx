import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  Briefcase,
  Tractor,
  ShieldCheck,
  CalendarCheck,
  BarChart3,
  User,
  LogOut,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  MapPin,
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

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `₹${num.toLocaleString('en-IN')}`;
};

const AdminDashboard = () => {
  const { axios, logout, user: currentAdmin } = useAppContext();
  const navigate = useNavigate();

  // Navigation tab
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Platform Data
  const [stats, setStats] = useState({
    totalUsers: 0,
    farmers: 0,
    owners: 0,
    totalTractors: 0,
    approvedTractors: 0,
    pendingTractors: 0,
    rejectedTractors: 0,
    totalBookings: 0,
    pendingBookings: 0,
    completedBookings: 0,
    platformRevenue: 0,
  });
  const [users, setUsers] = useState([]);
  const [tractors, setTractors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userPage, setUserPage] = useState(1);
  const usersPerPage = 10;

  const [tractorSearch, setTractorSearch] = useState('');
  const [tractorStatusFilter, setTractorStatusFilter] = useState('all');
  const [tractorPage, setTractorPage] = useState(1);
  const tractorsPerPage = 10;

  const [bookingSearch, setBookingSearch] = useState('');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');
  const [bookingSort, setBookingSort] = useState('newest');
  const [bookingPage, setBookingPage] = useState(1);
  const bookingsPerPage = 10;

  // Verification workflow modals
  const [approveConfirmTractor, setApproveConfirmTractor] = useState(null);
  const [rejectTractorTarget, setRejectTractorTarget] = useState(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [isProcessingVerification, setIsProcessingVerification] = useState(false);

  // User suspension & reactivation modal state
  const [userActionModal, setUserActionModal] = useState(null); // { user, action: 'suspend' | 'activate' }
  const [suspensionReasonInput, setSuspensionReasonInput] = useState('');
  const [isProcessingUserAction, setIsProcessingUserAction] = useState(false);

  // Inspect detail modals
  const [inspectUser, setInspectUser] = useState(null);
  const [inspectTractor, setInspectTractor] = useState(null);
  const [inspectBooking, setInspectBooking] = useState(null);

  // Fetch full Admin data directly from MongoDB
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [dashRes, usersRes, tractorsRes, bookingsRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/users'),
        axios.get('/api/admin/tractors'),
        axios.get('/api/admin/bookings'),
      ]);

      if (dashRes.data.success && dashRes.data.stats) {
        setStats(dashRes.data.stats);
      }
      if (usersRes.data.success && Array.isArray(usersRes.data.users)) {
        setUsers(usersRes.data.users);
      }
      if (tractorsRes.data.success && Array.isArray(tractorsRes.data.tractors)) {
        setTractors(tractorsRes.data.tractors);
      }
      if (bookingsRes.data.success && Array.isArray(bookingsRes.data.bookings)) {
        setBookings(bookingsRes.data.bookings);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to load platform data.');
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Approval workflow
  const handleApproveTractor = async () => {
    if (!approveConfirmTractor) return;
    setIsProcessingVerification(true);
    try {
      const { data } = await axios.patch(
        `/api/admin/tractors/${approveConfirmTractor._id}/verify`,
        { status: 'approved' }
      );
      if (data.success) {
        toast.success(`Tractor "${approveConfirmTractor.brand} ${approveConfirmTractor.model}" approved! It is now live for farmers.`);
        setApproveConfirmTractor(null);
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Approval failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve tractor.');
    } finally {
      setIsProcessingVerification(false);
    }
  };

  // Rejection workflow
  const handleRejectTractor = async (e) => {
    e.preventDefault();
    if (!rejectTractorTarget) return;
    if (!rejectionReasonInput.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    setIsProcessingVerification(true);
    try {
      const { data } = await axios.patch(
        `/api/admin/tractors/${rejectTractorTarget._id}/verify`,
        {
          status: 'rejected',
          rejectionReason: rejectionReasonInput.trim(),
        }
      );
      if (data.success) {
        toast.success(`Tractor marked as rejected. Reason recorded for the owner.`);
        setRejectTractorTarget(null);
        setRejectionReasonInput('');
        fetchDashboardData();
      } else {
        toast.error(data.message || 'Rejection failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject tractor.');
    } finally {
      setIsProcessingVerification(false);
    }
  };

  // User suspension modal initiators
  const handleToggleUserStatus = (userObj) => {
    if (!userObj) return;
    const isSuspended = userObj.isSuspended || userObj.accountStatus === 'Suspended';
    setUserActionModal({ user: userObj, action: isSuspended ? 'activate' : 'suspend' });
    setSuspensionReasonInput('');
  };

  const handleConfirmUserAction = async () => {
    if (!userActionModal) return;
    const { user: userObj, action } = userActionModal;
    const nextStatus = action === 'suspend' ? 'Suspended' : 'Active';
    setIsProcessingUserAction(true);

    try {
      const { data } = await axios.patch(`/api/admin/users/${userObj._id}/status`, {
        accountStatus: nextStatus,
        reason: action === 'suspend' ? suspensionReasonInput : '',
      });
      if (data.success) {
        toast.success(
          action === 'suspend'
            ? `Account "${userObj.name}" suspended across the entire platform.`
            : `Account "${userObj.name}" reactivated successfully.`
        );
        setUserActionModal(null);
        setSuspensionReasonInput('');
        fetchDashboardData();
        if (inspectUser && inspectUser._id === userObj._id) {
          setInspectUser(data.user);
        }
      } else {
        toast.error(data.message || 'Status update failed.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update user status.');
    } finally {
      setIsProcessingUserAction(false);
    }
  };

  const handleResolveBookingReview = async (bookingId) => {
    try {
      const { data } = await axios.patch(`/api/admin/bookings/${bookingId}/review`, {
        adminReviewRequired: false,
        adminReviewNote: `Review verified and resolved by Admin ${currentAdmin?.name || ''}`.trim(),
      });
      if (data.success) {
        toast.success('Booking review marked as resolved.');
        fetchDashboardData();
        if (inspectBooking && inspectBooking._id === bookingId) {
          setInspectBooking({ ...inspectBooking, adminReviewRequired: false });
        }
      } else {
        toast.error(data.message || 'Failed to update review status.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update review status.');
    }
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = userSearch.toLowerCase().trim();
      const matchesQuery =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      const role = String(u.role || 'farmer').toLowerCase();
      const matchesRole =
        userRoleFilter === 'all' ||
        (userRoleFilter === 'farmer' && (role === 'farmer' || role === 'user' || role === 'customer')) ||
        (userRoleFilter === 'owner' && role === 'owner') ||
        (userRoleFilter === 'admin' && role === 'admin');

      return matchesQuery && matchesRole;
    });
  }, [users, userSearch, userRoleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * usersPerPage;
    return filteredUsers.slice(start, start + usersPerPage);
  }, [filteredUsers, userPage]);

  const totalUserPages = Math.ceil(filteredUsers.length / usersPerPage) || 1;

  // Filtered Farmers only
  const farmersList = useMemo(() => {
    return users.filter((u) => ['farmer', 'user', 'customer'].includes(String(u.role || '').toLowerCase()));
  }, [users]);

  // Filtered Owners only
  const ownersList = useMemo(() => {
    return users.filter((u) => String(u.role || '').toLowerCase() === 'owner');
  }, [users]);

  // Filtered Tractors
  const filteredTractors = useMemo(() => {
    return tractors.filter((t) => {
      const q = tractorSearch.toLowerCase().trim();
      const ownerName = typeof t.owner === 'object' ? t.owner?.name || '' : '';
      const matchesQuery =
        !q ||
        (t.brand && t.brand.toLowerCase().includes(q)) ||
        (t.model && t.model.toLowerCase().includes(q)) ||
        (t.location && t.location.toLowerCase().includes(q)) ||
        ownerName.toLowerCase().includes(q);

      const status = String(t.status || 'pending').toLowerCase();
      const matchesStatus =
        tractorStatusFilter === 'all' || status === tractorStatusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });
  }, [tractors, tractorSearch, tractorStatusFilter]);

  const paginatedTractors = useMemo(() => {
    const start = (tractorPage - 1) * tractorsPerPage;
    return filteredTractors.slice(start, start + tractorsPerPage);
  }, [filteredTractors, tractorPage]);

  const totalTractorPages = Math.ceil(filteredTractors.length / tractorsPerPage) || 1;

  // Pending Tractors queue
  const pendingTractorsQueue = useMemo(() => {
    return tractors.filter((t) => String(t.status || '').toLowerCase() === 'pending');
  }, [tractors]);

  // Filtered Bookings
  const filteredBookings = useMemo(() => {
    let list = bookings.filter((b) => {
      const q = bookingSearch.toLowerCase().trim();
      const tractorName = b.tractor
        ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim().toLowerCase()
        : '';
      const farmerName = (b.user?.name || '').toLowerCase();
      const ownerName = (b.owner?.name || '').toLowerCase();
      const bId = String(b._id || '').toLowerCase();

      const matchesQuery =
        !q ||
        bId.includes(q) ||
        tractorName.includes(q) ||
        farmerName.includes(q) ||
        ownerName.includes(q);

      const status = String(b.status || '').toLowerCase();
      const matchesStatus =
        bookingStatusFilter === 'all' || status === bookingStatusFilter.toLowerCase();

      return matchesQuery && matchesStatus;
    });

    if (bookingSort === 'amount-high') {
      list.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (bookingSort === 'amount-low') {
      list.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else {
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    return list;
  }, [bookings, bookingSearch, bookingStatusFilter, bookingSort]);

  const paginatedBookings = useMemo(() => {
    const start = (bookingPage - 1) * bookingsPerPage;
    return filteredBookings.slice(start, start + bookingsPerPage);
  }, [filteredBookings, bookingPage]);

  const totalBookingPages = Math.ceil(filteredBookings.length / bookingsPerPage) || 1;

  // Monthly trends calculated from actual MongoDB records
  const monthlyTrends = useMemo(() => {
    const map = {};
    bookings.forEach((b) => {
      const date = new Date(b.createdAt);
      if (!Number.isNaN(date.getTime())) {
        const key = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        if (!map[key]) map[key] = { bookings: 0, revenue: 0 };
        map[key].bookings += 1;
        if (b.status === 'completed' || b.paymentDetails?.amountPaid) {
          map[key].revenue += Number(b.paymentDetails?.amountPaid) || Number(b.price || 0);
        }
      }
    });
    return Object.entries(map).map(([month, data]) => ({ month, ...data }));
  }, [bookings]);

  // Sidebar navigation items
  const navItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users, badge: users.length },
    { id: 'farmers', label: 'Farmer Management', icon: UserCheck, badge: stats.farmers },
    { id: 'owners', label: 'Owner Management', icon: Briefcase, badge: stats.owners },
    { id: 'tractors', label: 'Tractor Management', icon: Tractor, badge: tractors.length },
    {
      id: 'verification',
      label: 'Tractor Verification',
      icon: ShieldCheck,
      badge: stats.pendingTractors > 0 ? stats.pendingTractors : null,
      badgeColor: 'bg-amber-100 text-amber-800',
    },
    { id: 'bookings', label: 'Booking Management', icon: CalendarCheck, badge: bookings.length },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'profile', label: 'Admin Profile', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row antialiased">
      {/* Mobile Header */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-700 text-white font-bold">
              <ShieldCheck size={18} />
            </div>
            <span className="font-bold text-slate-900 text-sm">Platform Admin</span>
          </div>
        </div>
        <button
          onClick={fetchDashboardData}
          className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          title="Refresh Data"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </header>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Admin Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 md:z-20 h-screen flex flex-col justify-between border-r border-slate-200 bg-white transition-all duration-300 shadow-sm ${
          sidebarCollapsed ? 'md:w-20' : 'md:w-64'
        } ${
          mobileMenuOpen ? 'w-72 translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="flex items-center justify-between border-b border-slate-100 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-700 to-teal-800 text-white shadow-md shadow-emerald-700/20">
                <ShieldCheck size={22} />
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0">
                  <h1 className="text-base font-bold text-slate-900 truncate">TractorRental</h1>
                  <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">
                    Admin Console
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

          {/* Current Admin badge */}
          <div className="p-3 border-b border-slate-100">
            <div
              className={`flex items-center gap-3 rounded-xl bg-emerald-50/60 border border-emerald-100 p-2.5 ${
                sidebarCollapsed ? 'justify-center p-2' : ''
              }`}
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-700 font-bold text-white text-xs">
                A
              </div>
              {!sidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">
                    {currentAdmin?.name || 'Administrator'}
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold truncate">
                    Superuser Access
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Navigation items */}
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
                  className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-700/20'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                  title={item.label}
                >
                  <Icon size={17} className="shrink-0" />
                  {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge !== undefined && item.badge !== null && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        isActive
                          ? 'bg-white text-emerald-800'
                          : item.badgeColor || 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {sidebarCollapsed && item.badge > 0 && (
                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Logout */}
        <div className="border-t border-slate-100 p-3 space-y-1">
          <button
            onClick={() => {
              logout();
              navigate('/admin/login');
            }}
            className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors ${
              sidebarCollapsed ? 'justify-center px-2' : ''
            }`}
            title="Logout"
          >
            <LogOut size={16} className="shrink-0" />
            {!sidebarCollapsed && <span>Admin Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Admin Workspace */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* ========================================================
              TAB 1: DASHBOARD OVERVIEW
          ======================================================== */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                <div>
                  <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                    Platform Management Console
                  </span>
                  <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    Platform Overview
                  </h1>
                  <p className="mt-1 text-xs text-slate-500">
                    Live system statistics fetched directly from MongoDB across users, fleet machinery, and bookings.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchDashboardData}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition-colors"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh Platform Stats
                  </button>
                </div>
              </div>

              {/* Pending Verification Priority Alert */}
              {stats.pendingTractors > 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 sm:p-5 flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">
                        {stats.pendingTractors} Tractor Submission
                        {stats.pendingTractors === 1 ? '' : 's'} Awaiting Verification
                      </h3>
                      <p className="text-xs text-amber-700 mt-0.5">
                        Tractor owners have submitted machinery that requires your review and approval before becoming bookable by farmers.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('verification')}
                    className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 shrink-0 shadow-xs"
                  >
                    Review Queue &rarr;
                  </button>
                </div>
              )}

              {/* 11 Platform Statistics Grid from MongoDB */}
              <div>
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                  Live MongoDB Platform Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Total Users */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Users</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalUsers}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Platform registrations</p>
                  </div>

                  {/* Farmers */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Farmers</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-emerald-700">{stats.farmers}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Customer accounts</p>
                  </div>

                  {/* Tractor Owners */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Tractor Owners</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-blue-700">{stats.owners}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Equipment fleet partners</p>
                  </div>

                  {/* Total Tractors */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Tractors</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalTractors}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Registered units</p>
                  </div>

                  {/* Pending Tractors */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Tractors</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.pendingTractors}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Awaiting verification</p>
                  </div>

                  {/* Approved Tractors */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Approved Tractors</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-teal-700">{stats.approvedTractors}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Verified & live in catalog</p>
                  </div>

                  {/* Rejected Tractors */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Rejected Tractors</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-rose-600">{stats.rejectedTractors}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Failed compliance checks</p>
                  </div>

                  {/* Total Bookings */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Bookings</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalBookings}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Platform rental orders</p>
                  </div>

                  {/* Pending Bookings */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Pending Bookings</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-amber-600">{stats.pendingBookings}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Awaiting owner response</p>
                  </div>

                  {/* Completed Bookings */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Completed Bookings</span>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold text-teal-700">{stats.completedBookings}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Successfully finished</p>
                  </div>

                  {/* Platform Revenue */}
                  <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-700 to-teal-800 p-5 text-white shadow-sm col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                        Platform Revenue (Real Paid Data)
                      </span>
                      <TrendingUp size={18} />
                    </div>
                    <p className="mt-2 text-2xl sm:text-3xl font-extrabold">
                      {formatCurrency(stats.platformRevenue || 0)}
                    </p>
                    <p className="text-[11px] text-emerald-100 mt-1">
                      Calculated strictly from completed and paid booking records in MongoDB
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Jump Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Recent Registered Users</h3>
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      View All Users &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {users.slice(0, 5).map((u) => (
                      <div key={u._id} className="py-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[11px] text-slate-500">{u.email}</p>
                        </div>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold capitalize text-slate-700">
                          {u.role || 'farmer'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-slate-900 text-sm">Pending Verification Queue</h3>
                    <button
                      onClick={() => setActiveTab('verification')}
                      className="text-xs font-bold text-emerald-700 hover:underline"
                    >
                      Open Queue ({pendingTractorsQueue.length}) &rarr;
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 text-xs">
                    {pendingTractorsQueue.length > 0 ? (
                      pendingTractorsQueue.slice(0, 5).map((t) => (
                        <div key={t._id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-900">{t.brand} {t.model}</p>
                            <p className="text-[11px] text-slate-500">
                              Hub: {t.location} · {formatCurrency(t.pricePerDay)}/day
                            </p>
                          </div>
                          <span className="rounded-full bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 text-[10px] font-bold">
                            Pending
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="py-6 text-center text-slate-400">
                        No tractors currently waiting for verification.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: USER MANAGEMENT
          ======================================================== */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage all registered platform accounts with status authorization
                  </p>
                </div>
                <div className="text-xs font-semibold text-slate-500">
                  Total Users: {filteredUsers.length}
                </div>
              </div>

              {/* Filters Bar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search name, email, phone..."
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      setUserPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Roles' },
                    { id: 'farmer', label: 'Farmers' },
                    { id: 'owner', label: 'Tractor Owners' },
                    { id: 'admin', label: 'Administrators' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setUserRoleFilter(f.id);
                        setUserPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                        userRoleFilter === f.id
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Users Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedUsers.length > 0 ? (
                        paginatedUsers.map((u) => {
                          const isSuspended = u.isSuspended || u.accountStatus === 'Suspended';
                          return (
                            <tr key={u._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                <div>{u.name || 'Unnamed User'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {u._id}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-slate-800">{u.email}</div>
                                <div className="text-[11px] text-slate-500">{u.phone || '—'}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                    u.role === 'admin'
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : u.role === 'owner'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {u.role || 'farmer'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {formatDate(u.createdAt)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    isSuspended
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  {isSuspended ? 'Suspended' : 'Active'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => setInspectUser(u)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg"
                                    title="View User Details"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {u.role !== 'admin' && (
                                    <button
                                      onClick={() => handleToggleUserStatus(u)}
                                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                        isSuspended
                                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                          : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      }`}
                                    >
                                      {isSuspended ? 'Activate' : 'Suspend'}
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No users found matching your search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalUserPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Page {userPage} of {totalUserPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={userPage <= 1}
                        onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Prev
                      </button>
                      <button
                        disabled={userPage >= totalUserPages}
                        onClick={() => setUserPage((p) => Math.min(totalUserPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: FARMER MANAGEMENT
          ======================================================== */}
          {activeTab === 'farmers' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Farmer Account Management</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Directory of all farmers registered for hiring agricultural machinery ({farmersList.length})
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        <th className="py-3 px-4">Farmer Name</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4">Phone</th>
                        <th className="py-3 px-4">Registered Date</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {farmersList.map((f) => {
                        const isSuspended = f.isSuspended || f.accountStatus === 'Suspended';
                        return (
                          <tr key={f._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{f.name}</td>
                            <td className="py-3.5 px-4 text-slate-600">{f.email}</td>
                            <td className="py-3.5 px-4 text-slate-600">{f.phone || '—'}</td>
                            <td className="py-3.5 px-4 text-slate-500">{formatDate(f.createdAt)}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isSuspended
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleUserStatus(f)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                  isSuspended
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: OWNER MANAGEMENT
          ======================================================== */}
          {activeTab === 'owners' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Tractor Owner Fleet Partners</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Directory of equipment partners managing tractor machinery ({ownersList.length})
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        <th className="py-3 px-4">Owner Name</th>
                        <th className="py-3 px-4">Email Address</th>
                        <th className="py-3 px-4">Contact Phone</th>
                        <th className="py-3 px-4">Tractors In Fleet</th>
                        <th className="py-3 px-4">Account Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {ownersList.map((o) => {
                        const isSuspended = o.isSuspended || o.accountStatus === 'Suspended';
                        const ownerTractorCount = tractors.filter((t) => {
                          const ownerId = typeof t.owner === 'object' ? t.owner?._id : t.owner;
                          return String(ownerId) === String(o._id);
                        }).length;

                        return (
                          <tr key={o._id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-slate-900">{o.name}</td>
                            <td className="py-3.5 px-4 text-slate-600">{o.email}</td>
                            <td className="py-3.5 px-4 text-slate-600">{o.phone || '—'}</td>
                            <td className="py-3.5 px-4">
                              <span className="font-bold text-slate-800">{ownerTractorCount}</span> units
                            </td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                  isSuspended
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {isSuspended ? 'Suspended' : 'Active'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleToggleUserStatus(o)}
                                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-colors ${
                                  isSuspended
                                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                    : 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                }`}
                              >
                                {isSuspended ? 'Activate' : 'Suspend'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 5: TRACTOR MANAGEMENT
          ======================================================== */}
          {activeTab === 'tractors' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Tractor Fleet Management</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Every tractor registered on the platform across all owners ({tractors.length})
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search brand, model, location, owner..."
                    value={tractorSearch}
                    onChange={(e) => {
                      setTractorSearch(e.target.value);
                      setTractorPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {[
                    { id: 'all', label: 'All Statuses' },
                    { id: 'pending', label: 'Pending' },
                    { id: 'approved', label: 'Approved' },
                    { id: 'rejected', label: 'Rejected' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => {
                        setTractorStatusFilter(f.id);
                        setTractorPage(1);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap ${
                        tractorStatusFilter === f.id
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Tractors Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        <th className="py-3 px-4">Tractor Machinery</th>
                        <th className="py-3 px-4">Registered Owner</th>
                        <th className="py-3 px-4">Dispatch Hub</th>
                        <th className="py-3 px-4">Daily Price</th>
                        <th className="py-3 px-4">Reg. Date</th>
                        <th className="py-3 px-4">Verification Status</th>
                        <th className="py-3 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedTractors.length > 0 ? (
                        paginatedTractors.map((t) => {
                          const ownerName = typeof t.owner === 'object' ? t.owner?.name : 'Owner';
                          const status = String(t.status || 'pending').toLowerCase();

                          return (
                            <tr key={t._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={t.image}
                                    alt={t.brand}
                                    className="h-10 w-14 rounded-lg object-cover border border-slate-200 bg-slate-100 shrink-0"
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';
                                    }}
                                  />
                                  <div>
                                    <span className="font-bold text-slate-900 block">
                                      {t.brand} {t.model}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                      {t.horsepower || 45} HP · {t.year || 2023}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800">
                                {ownerName || '—'}
                              </td>
                              <td className="py-3.5 px-4 text-slate-600">
                                <div className="flex items-center gap-1">
                                  <MapPin size={11} className="text-slate-400" />
                                  <span>{t.location}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4 font-bold text-slate-900">
                                {formatCurrency(t.pricePerDay)}/day
                              </td>
                              <td className="py-3.5 px-4 text-slate-500">
                                {formatDate(t.createdAt)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                    status === 'approved'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : status === 'rejected'
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                  }`}
                                >
                                  {t.status || 'pending'}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => setInspectTractor(t)}
                                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg"
                                    title="View Specs"
                                  >
                                    <Eye size={13} />
                                  </button>
                                  {status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => setApproveConfirmTractor(t)}
                                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs"
                                      >
                                        Approve
                                      </button>
                                      <button
                                        onClick={() => {
                                          setRejectTractorTarget(t);
                                          setRejectionReasonInput('');
                                        }}
                                        className="px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No tractors match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalTractorPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Page {tractorPage} of {totalTractorPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={tractorPage <= 1}
                        onClick={() => setTractorPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Prev
                      </button>
                      <button
                        disabled={tractorPage >= totalTractorPages}
                        onClick={() => setTractorPage((p) => Math.min(totalTractorPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 6: TRACTOR VERIFICATION SYSTEM (CORE ADMIN WORKFLOW)
          ======================================================== */}
          {activeTab === 'verification' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">
                    Tractor Verification Submissions
                  </h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Review and verify submitted tractors. Approved units become immediately bookable by farmers.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-800">
                  <Clock size={14} /> {pendingTractorsQueue.length} Pending Submission
                  {pendingTractorsQueue.length === 1 ? '' : 's'}
                </div>
              </div>

              {pendingTractorsQueue.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {pendingTractorsQueue.map((t) => {
                    const ownerName = typeof t.owner === 'object' ? t.owner?.name : 'Fleet Partner';
                    const ownerPhone = typeof t.owner === 'object' ? t.owner?.phone : '';
                    const ownerEmail = typeof t.owner === 'object' ? t.owner?.email : '';

                    return (
                      <div
                        key={t._id}
                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4 hover:border-slate-300 transition-colors"
                      >
                        {/* Image preview */}
                        <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                          <img
                            src={t.image}
                            alt={t.brand}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src =
                                'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          <span className="absolute top-2.5 left-2.5 rounded-full bg-amber-500 text-white px-2.5 py-0.5 text-[10px] font-bold shadow-xs">
                            Pending Review
                          </span>
                        </div>

                        {/* Details */}
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-lg font-bold text-slate-900">
                                {t.brand} {t.model}
                              </h3>
                              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={12} className="text-slate-400" />
                                <span>{t.location}</span>
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-base font-extrabold text-slate-900">
                                {formatCurrency(t.pricePerDay)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">per day</span>
                            </div>
                          </div>

                          {/* Technical specifications */}
                          <div className="mt-3 grid grid-cols-4 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block">HP</span>
                              <span className="font-bold text-slate-800">{t.horsepower || 45} HP</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Year</span>
                              <span className="font-bold text-slate-800">{t.year || 2023}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Trans.</span>
                              <span className="font-bold text-slate-800 truncate block">
                                {t.transmission?.split(' ')[0] || 'Manual'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block">Fuel</span>
                              <span className="font-bold text-slate-800 truncate block">
                                {t.fuelType?.split(' ')[0] || 'Diesel'}
                              </span>
                            </div>
                          </div>

                          {/* Owner details */}
                          <div className="mt-3 p-3 rounded-xl border border-slate-100 bg-slate-50/70 text-xs space-y-1">
                            <span className="font-bold text-slate-700 block">Owner Information</span>
                            <div className="flex justify-between text-slate-600">
                              <span>Name:</span>
                              <span className="font-semibold text-slate-900">{ownerName}</span>
                            </div>
                            {ownerPhone && (
                              <div className="flex justify-between text-slate-600">
                                <span>Phone:</span>
                                <span>{ownerPhone}</span>
                              </div>
                            )}
                            {ownerEmail && (
                              <div className="flex justify-between text-slate-600">
                                <span>Email:</span>
                                <span className="truncate max-w-[200px]">{ownerEmail}</span>
                              </div>
                            )}
                          </div>

                          {/* Description */}
                          <p className="mt-3 text-xs text-slate-600 line-clamp-2">
                            {t.description || 'No description provided.'}
                          </p>
                        </div>

                        {/* Verification Action Buttons */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                          <button
                            onClick={() => setInspectTractor(t)}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900"
                          >
                            <Eye size={13} /> Full Specs
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setRejectTractorTarget(t);
                                setRejectionReasonInput('');
                              }}
                              className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors"
                            >
                              Reject Submission
                            </button>
                            <button
                              onClick={() => setApproveConfirmTractor(t)}
                              className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-xs transition-colors"
                            >
                              Approve Tractor
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white py-14 px-4 text-center">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600 mb-3" />
                  <h3 className="text-base font-bold text-slate-900">All tractor submissions verified</h3>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                    There are no pending tractor submissions awaiting review. You will receive notifications when owners register new machinery.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 7: BOOKING MANAGEMENT
          ======================================================== */}
          {activeTab === 'bookings' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Platform Booking Management</h1>
                  <p className="text-xs text-slate-500 mt-1">
                    Audited list of all rental reservations across farmers and tractor owners ({bookings.length})
                  </p>
                </div>
              </div>

              {/* Toolbar */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative w-full sm:w-80">
                  <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search booking ID, farmer, tractor..."
                    value={bookingSearch}
                    onChange={(e) => {
                      setBookingSearch(e.target.value);
                      setBookingPage(1);
                    }}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-700 focus:bg-white"
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={bookingStatusFilter}
                    onChange={(e) => {
                      setBookingStatusFilter(e.target.value);
                      setBookingPage(1);
                    }}
                    className="rounded-xl border border-slate-300 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-emerald-700"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="rejected">Rejected</option>
                  </select>

                  <select
                    value={bookingSort}
                    onChange={(e) => setBookingSort(e.target.value)}
                    className="rounded-xl border border-slate-300 bg-slate-50 py-1.5 px-3 text-xs outline-none focus:border-emerald-700"
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="amount-high">Amount: High to Low</option>
                    <option value="amount-low">Amount: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Bookings Table */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                        <th className="py-3 px-4">Booking ID</th>
                        <th className="py-3 px-4">Farmer Details</th>
                        <th className="py-3 px-4">Owner Details</th>
                        <th className="py-3 px-4">Tractor Machinery</th>
                        <th className="py-3 px-4">Rental Duration</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {paginatedBookings.length > 0 ? (
                        paginatedBookings.map((b) => {
                          const tractorName = b.tractor
                            ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                            : 'Tractor';
                          const status = String(b.status || '').toLowerCase();

                          return (
                            <tr key={b._id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                                #{String(b._id).slice(-6).toUpperCase()}
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{b.user?.name || 'Farmer'}</div>
                                <div className="text-[10px] text-slate-400">{b.user?.email || '—'}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-900">{b.owner?.name || 'Owner'}</div>
                                <div className="text-[10px] text-slate-400">{b.owner?.email || '—'}</div>
                              </td>
                              <td className="py-3.5 px-4 font-medium text-slate-800">{tractorName}</td>
                              <td className="py-3.5 px-4 text-slate-600">
                                {formatDate(b.startDate)} to {formatDate(b.endDate)}
                              </td>
                              <td className="py-3.5 px-4 font-extrabold text-slate-900">
                                {formatCurrency(b.price)}
                              </td>
                              <td className="py-3.5 px-4">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${
                                    status === 'completed'
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : status === 'confirmed'
                                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                      : status === 'pending'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border border-rose-200'
                                  }`}
                                >
                                  {b.status}
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right">
                                <button
                                  onClick={() => setInspectBooking(b)}
                                  className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg"
                                  title="Inspect Booking"
                                >
                                  <Eye size={13} />
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="py-12 text-center text-slate-400">
                            No bookings match your filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalBookingPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs text-slate-500">
                    <span>
                      Page {bookingPage} of {totalBookingPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        disabled={bookingPage <= 1}
                        onClick={() => setBookingPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Prev
                      </button>
                      <button
                        disabled={bookingPage >= totalBookingPages}
                        onClick={() => setBookingPage((p) => Math.min(totalBookingPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 8: REPORTS & ANALYTICS
          ======================================================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Platform Reports & Analytics</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Meaningful operational insights derived strictly from actual MongoDB records
                </p>
              </div>

              {/* Analytical Charts / Progress Rows */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* User Role Distribution */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">User Role Distribution</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Farmers</span>
                        <span>{stats.farmers} ({Math.round((stats.farmers / (stats.totalUsers || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-emerald-600 rounded-full"
                          style={{ width: `${(stats.farmers / (stats.totalUsers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Tractor Owners</span>
                        <span>{stats.owners} ({Math.round((stats.owners / (stats.totalUsers || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full"
                          style={{ width: `${(stats.owners / (stats.totalUsers || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Administrators</span>
                        <span>
                          {stats.totalUsers - stats.farmers - stats.owners} (
                          {Math.round(((stats.totalUsers - stats.farmers - stats.owners) / (stats.totalUsers || 1)) * 100)}%)
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full"
                          style={{
                            width: `${((stats.totalUsers - stats.farmers - stats.owners) / (stats.totalUsers || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tractor Verification Breakdown */}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Tractor Fleet Verification Statistics</h3>
                  <div className="space-y-3 text-xs">
                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Approved & Live</span>
                        <span>{stats.approvedTractors} ({Math.round((stats.approvedTractors / (stats.totalTractors || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-teal-600 rounded-full"
                          style={{ width: `${(stats.approvedTractors / (stats.totalTractors || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Pending Verification</span>
                        <span>{stats.pendingTractors} ({Math.round((stats.pendingTractors / (stats.totalTractors || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-500 rounded-full"
                          style={{ width: `${(stats.pendingTractors / (stats.totalTractors || 1)) * 100}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between font-semibold mb-1">
                        <span>Rejected Submissions</span>
                        <span>{stats.rejectedTractors} ({Math.round((stats.rejectedTractors / (stats.totalTractors || 1)) * 100)}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-rose-600 rounded-full"
                          style={{ width: `${(stats.rejectedTractors / (stats.totalTractors || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monthly Volume Bars (if real data exists) */}
              {monthlyTrends.length > 0 && (
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs space-y-3">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Monthly Booking Volume & Revenue Trends
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {monthlyTrends.map((t) => (
                      <div key={t.month} className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                        <span className="text-xs font-bold text-slate-500 block">{t.month}</span>
                        <span className="text-lg font-extrabold text-slate-900 block mt-1">
                          {t.bookings} Booking{t.bookings === 1 ? '' : 's'}
                        </span>
                        <span className="text-xs font-extrabold text-emerald-700 block mt-0.5">
                          {formatCurrency(t.revenue)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 9: ADMIN PROFILE
          ======================================================== */}
          {activeTab === 'profile' && (
            <div className="space-y-6 max-w-2xl">
              <div className="border-b border-slate-200 pb-4">
                <h1 className="text-2xl font-bold text-slate-900">Administrator Credentials</h1>
                <p className="text-xs text-slate-500 mt-1">
                  Platform administration profile and security credentials
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-4 text-xs">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-700 font-bold text-white text-base">
                    A
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      {currentAdmin?.name || 'System Administrator'}
                    </h2>
                    <span className="inline-flex rounded-full bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 text-[10px] font-bold">
                      Platform Admin Role
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                      Admin Email
                    </span>
                    <span className="font-semibold text-slate-800 text-sm">
                      {currentAdmin?.email || 'admin@tractorental.in'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                      Authentication Protocol
                    </span>
                    <span className="font-semibold text-slate-800">
                      JSON Web Token (JWT) with HMAC SHA-256 Signature
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block">
                      Database Host
                    </span>
                    <span className="font-semibold text-slate-800">
                      MongoDB Atlas Production Cluster
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================
          CONFIRMATION MODAL: USER SUSPEND / REACTIVATE
      ======================================================== */}
      {userActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-full mx-auto ${
              userActionModal.action === 'suspend' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {userActionModal.action === 'suspend' ? <XCircle size={24} /> : <CheckCircle2 size={24} />}
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">
                {userActionModal.action === 'suspend' ? 'Suspend Account?' : 'Reactivate Account?'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {userActionModal.user?.name || 'This user'}
                <span className="font-medium text-slate-700"> ({userActionModal.user?.email || '—'})</span>
              </p>
            </div>

            {userActionModal.action === 'suspend' && (
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-wide text-slate-500">
                  Optional suspension reason
                </label>
                <textarea
                  rows={3}
                  value={suspensionReasonInput}
                  onChange={(e) => setSuspensionReasonInput(e.target.value)}
                  placeholder="e.g. Policy violation or account review required..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-rose-600 focus:bg-white"
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setUserActionModal(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingUserAction}
                onClick={handleConfirmUserAction}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold text-white disabled:opacity-50 ${
                  userActionModal.action === 'suspend' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {isProcessingUserAction
                  ? userActionModal.action === 'suspend'
                    ? 'Suspending...'
                    : 'Reactivating...'
                  : userActionModal.action === 'suspend'
                    ? 'Confirm Suspend'
                    : 'Confirm Reactivate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CONFIRMATION MODAL: APPROVE TRACTOR
      ======================================================== */}
      {approveConfirmTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
              <CheckCircle2 size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Approve Tractor Submission?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to approve{' '}
                <span className="font-bold text-slate-800">
                  {approveConfirmTractor.brand} {approveConfirmTractor.model}
                </span>
                ? This will update MongoDB verification status to <span className="font-bold text-emerald-700">approved</span> and make it immediately visible to farmers.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveConfirmTractor(null)}
                className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isProcessingVerification}
                onClick={handleApproveTractor}
                className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {isProcessingVerification ? 'Approving...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          REJECTION MODAL: REASON REQUIRED
      ======================================================== */}
      {rejectTractorTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-700 mx-auto">
              <XCircle size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Reject Tractor Submission</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please enter a rejection reason. The owner will see this reason in their dashboard to correct the submission.
              </p>
            </div>

            <form onSubmit={handleRejectTractor} className="space-y-3">
              <textarea
                rows={3}
                required
                placeholder="e.g. Unclear RC document photo, daily rental price inconsistent with market rate..."
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:border-rose-600 focus:bg-white"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectTractorTarget(null)}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingVerification || !rejectionReasonInput.trim()}
                  className="flex-1 rounded-xl bg-rose-600 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50"
                >
                  {isProcessingVerification ? 'Rejecting...' : 'Submit Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          INSPECT TRACTOR MODAL
      ======================================================== */}
      {inspectTractor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectTractor(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="aspect-16/9 rounded-xl overflow-hidden bg-slate-100 mb-4">
              <img
                src={inspectTractor.image}
                alt={inspectTractor.brand}
                className="h-full w-full object-cover"
              />
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {inspectTractor.brand} {inspectTractor.model}
            </h3>

            <div className="mt-4 grid grid-cols-2 gap-3 text-xs rounded-xl bg-slate-50 p-4 border border-slate-100">
              <div>
                <span className="text-slate-400 block text-[10px]">Horsepower</span>
                <span className="font-bold text-slate-800">{inspectTractor.horsepower || 45} HP</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Daily Rate</span>
                <span className="font-bold text-emerald-700">{formatCurrency(inspectTractor.pricePerDay)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Hub Location</span>
                <span className="font-bold text-slate-800">{inspectTractor.location}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Verification Status</span>
                <span className="font-bold capitalize">{inspectTractor.status || 'pending'}</span>
              </div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Description</h4>
              <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                {inspectTractor.description || 'No description provided.'}
              </p>
            </div>

            {inspectTractor.rejectionReason && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                <span className="font-bold block">Rejection Reason:</span>
                {inspectTractor.rejectionReason}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectTractor(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INSPECT BOOKING MODAL
      ======================================================== */}
      {inspectBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setInspectBooking(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <span className="text-xs font-mono font-bold text-slate-400">
              #{String(inspectBooking._id).slice(-6).toUpperCase()}
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1">Platform Rental Record</h3>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer:</span>
                <span className="font-bold text-slate-900">{inspectBooking.user?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tractor Owner:</span>
                <span className="font-bold text-slate-900">{inspectBooking.owner?.name || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Equipment:</span>
                <span className="font-bold text-slate-900">
                  {inspectBooking.tractor?.brand} {inspectBooking.tractor?.model}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Duration:</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(inspectBooking.startDate)} to {formatDate(inspectBooking.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(inspectBooking.price)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold capitalize">{inspectBooking.status}</span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {inspectBooking.adminReviewRequired && (
                <button
                  type="button"
                  onClick={() => handleResolveBookingReview(inspectBooking._id)}
                  className="rounded-xl bg-amber-600 px-4 py-2 text-xs font-bold text-white hover:bg-amber-700 transition-colors"
                >
                  Resolve Review Flag
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectBooking(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          INSPECT USER MODAL
      ======================================================== */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setInspectUser(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-900">User Account Information</h3>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Full Name:</span>
                <span className="font-bold text-slate-900">{inspectUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="font-medium text-slate-800">{inspectUser.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Phone:</span>
                <span className="font-medium text-slate-800">{inspectUser.phone || '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Assigned Role:</span>
                <span className="font-bold capitalize text-slate-900">{inspectUser.role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Joined Date:</span>
                <span className="font-medium text-slate-800">{formatDate(inspectUser.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Account Status:</span>
                <span
                  className={`font-bold ${
                    inspectUser.isSuspended || inspectUser.accountStatus === 'Suspended'
                      ? 'text-rose-600'
                      : 'text-emerald-700'
                  }`}
                >
                  {inspectUser.isSuspended || inspectUser.accountStatus === 'Suspended'
                    ? 'Suspended'
                    : 'Active'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setInspectUser(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
