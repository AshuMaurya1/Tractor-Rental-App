import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import Title from "../../Components/owner/Title";
import { useAppContext } from "../../context/AppContext";
import { 
  CalendarCheck, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText,
  Phone,
  MapPin,
  X,
  Eye,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import InvoiceModal from "../../Components/InvoiceModal";

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

const formatCurrency = (amount, currency = "₹") => {
  const num = Number(amount || 0);
  return `${currency}${num.toLocaleString("en-IN")}`;
};

const ManageBooking = () => {
  const { currency = "₹", axios, language = 'en' } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Modals
  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null);
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchOwnerBookings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/booking/owner');
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      setBookings([]);
      toast.error(error.response?.data?.message || 'Unable to load booking requests.');
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchOwnerBookings();
  }, [fetchOwnerBookings]);

  const changeBookingStatus = async (bookingId, status) => {
    setActionLoadingId(bookingId);
    try {
      const { data } = await axios.post('/api/booking/change-status', { bookingId, status });
      if (data.success) {
        toast.success(data.message || `Booking marked as ${status}`);
        fetchOwnerBookings();
        if (selectedBookingDetails && selectedBookingDetails._id === bookingId) {
          setSelectedBookingDetails(prev => ({ ...prev, status }));
        }
      } else {
        toast.error(data.message || 'Unable to update booking status.');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to update this booking.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      const status = (b.status || "").toLowerCase();
      const matchesFilter = statusFilter === "all" || status === statusFilter.toLowerCase();
      
      const customer = (b.user?.name || "").toLowerCase();
      const tractor = `${b.tractor?.brand || ""} ${b.tractor?.model || ""}`.toLowerCase();
      const id = String(b._id || "").toLowerCase();
      const query = searchQuery.toLowerCase().trim();

      const matchesSearch = !query || customer.includes(query) || tractor.includes(query) || id.includes(query);
      return matchesFilter && matchesSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  const pendingCount = bookings.filter(b => (b.status || "").toLowerCase() === "pending").length;
  const confirmedCount = bookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;


  const totalEarnings = useMemo(() => {
    return bookings
      .filter(b => b.status === 'completed' || (b.paymentDetails && Number(b.paymentDetails.amountPaid) > 0))
      .reduce((sum, b) => sum + (Number(b.paymentDetails?.amountPaid) || (b.status === 'completed' ? Number(b.price || 0) : 0)), 0);
  }, [bookings]);

  const statusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    if (s === 'confirmed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-300">
          <CheckCircle2 size={12} /> Confirmed
        </span>
      );
    }
    if (s === 'completed') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-300">
          <CheckCircle2 size={12} /> Completed
        </span>
      );
    }
    if (s === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300">
          <Clock size={12} /> Pending Request
        </span>
      );
    }
    if (s === 'cancelled') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-300">
          <XCircle size={12} /> Cancelled
        </span>
      );
    }
    if (s === 'rejected') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-300">
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
    <div className="mx-auto w-full max-w-7xl space-y-6 antialiased">
      {/* Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={selectedInvoiceBooking}
      />

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <Title
          title={language === 'hi' ? "फ्लीट आरक्षण व बुकिंग प्रबंधन" : "Fleet Dispatch & Bookings"}
          subtitle={
            language === 'hi'
              ? "आने वाले किसान बुकिंग अनुरोधों को ट्रैक करें, स्वीकृति दें या निरस्त करें।"
              : "Review incoming farmer rental schedules, accept or reject requests, and view invoices."
          }
        />
        <button
          onClick={fetchOwnerBookings}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh Requests
        </button>
      </div>

      {/* Summary KPI Mini-Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Bookings</span>
            <p className="text-xl font-extrabold text-slate-900 mt-0.5">{bookings.length}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
            <CalendarCheck size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Pending Requests</span>
            <p className="text-xl font-extrabold text-amber-600 mt-0.5">{pendingCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
            <Clock size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Confirmed</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{confirmedCount}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 size={18} />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 flex items-center justify-between shadow-xs">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Real Earnings</span>
            <p className="text-xl font-extrabold text-emerald-700 mt-0.5">{formatCurrency(totalEarnings, currency)}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <TrendingUp size={18} />
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search farmer, tractor, booking ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-600 focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: "all", label: "All Requests" },
              { id: "pending", label: "Pending" },
              { id: "confirmed", label: "Confirmed" },
              { id: "completed", label: "Completed" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-colors whitespace-nowrap ${
                  statusFilter === f.id
                    ? "bg-slate-900 text-white font-bold"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bookings Table */}
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="py-3 px-3">Booking ID & Date</th>
                  <th className="py-3 px-3">Farmer Details</th>
                  <th className="py-3 px-3">Tractor Machinery</th>
                  <th className="py-3 px-3">Rental Dates</th>
                  <th className="py-3 px-3">Total Amount</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredBookings.map((b) => {
                  const tractorName = b.tractor
                    ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                    : 'Tractor';
                  const isPending = String(b.status || '').toLowerCase() === 'pending';
                  const isConfirmed = String(b.status || '').toLowerCase() === 'confirmed';

                  return (
                    <tr key={b._id} className="hover:bg-slate-50/80 transition-colors align-top">
                      {/* ID */}
                      <td className="py-3.5 px-3">
                        <span className="font-mono font-bold text-slate-900 block">
                          #{String(b._id).slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {formatDate(b.createdAt)}
                        </span>
                      </td>

                      {/* Farmer info */}
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-slate-900 text-sm">
                          {b.user?.name || "Farmer"}
                        </div>
                        {b.user?.phone && (
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone size={11} className="text-slate-400" />
                            <span>{b.user.phone}</span>
                          </div>
                        )}
                        {b.user?.email && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[150px]">
                            {b.user.email}
                          </div>
                        )}
                      </td>

                      {/* Tractor info */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={
                              b.tractor?.image ||
                              'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=600&q=80'
                            }
                            alt={tractorName}
                            className="h-10 w-12 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{tractorName}</span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-0.5">
                              <MapPin size={10} /> {b.tractor?.location || "Hub"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-3 font-medium">
                        <div className="text-slate-800">{formatDate(b.startDate)}</div>
                        <div className="text-[10px] text-slate-400">to {formatDate(b.endDate)}</div>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-3">
                        <span className="font-extrabold text-slate-900 text-sm block">
                          {formatCurrency(b.price, currency)}
                        </span>
                        {b.includeDriver && (
                          <span className="text-[10px] font-semibold text-emerald-700">
                            + Driver Included
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        {statusBadge(b.status)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => setSelectedBookingDetails(b)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
                            title="View Booking Details"
                          >
                            <Eye size={14} />
                          </button>

                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={actionLoadingId === b._id}
                                onClick={() => changeBookingStatus(b._id, 'confirmed')}
                                className="px-2.5 py-1 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                              >
                                Accept
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === b._id}
                                onClick={() => changeBookingStatus(b._id, 'rejected')}
                                className="px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isConfirmed && (
                            <button
                              type="button"
                              disabled={actionLoadingId === b._id}
                              onClick={() => changeBookingStatus(b._id, 'completed')}
                              className="px-2.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors disabled:opacity-50"
                            >
                              Mark Completed
                            </button>
                          )}

                          {b.status === 'completed' && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedInvoiceBooking(b);
                                setIsInvoiceOpen(true);
                              }}
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-lg"
                              title="Tax Invoice"
                            >
                              <FileText size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-slate-400">
            <CalendarCheck size={36} className="mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-sm text-slate-800">No bookings found</p>
            <p className="text-xs text-slate-500 mt-0.5">
              No booking requests match your selected search or filter.
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Modal */}
      {selectedBookingDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedBookingDetails(null)}
              className="absolute top-4 right-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Booking ID
              </span>
              <span className="font-mono font-bold text-slate-800">
                #{String(selectedBookingDetails._id).slice(-6).toUpperCase()}
              </span>
            </div>

            <h3 className="text-xl font-bold text-slate-900">
              {selectedBookingDetails.tractor
                ? `${selectedBookingDetails.tractor.brand || ''} ${selectedBookingDetails.tractor.model || ''}`
                : 'Tractor Rental Request'}
            </h3>

            <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Farmer / Customer:</span>
                <span className="font-bold text-slate-900">
                  {selectedBookingDetails.user?.name || "Renter"}
                </span>
              </div>
              {selectedBookingDetails.user?.phone && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Number:</span>
                  <span className="font-bold text-slate-900">{selectedBookingDetails.user.phone}</span>
                </div>
              )}
              {selectedBookingDetails.user?.email && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="font-bold text-slate-900">{selectedBookingDetails.user.email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Start / Pickup:</span>
                <span className="font-bold text-slate-900">
                  {formatDate(selectedBookingDetails.startDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">End / Return:</span>
                <span className="font-bold text-slate-900">
                  {formatDate(selectedBookingDetails.endDate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Rental Price:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  {formatCurrency(selectedBookingDetails.price, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Status:</span>
                <div>{statusBadge(selectedBookingDetails.status)}</div>
              </div>
            </div>

            {/* Payment Details if available */}
            {selectedBookingDetails.paymentDetails && Object.keys(selectedBookingDetails.paymentDetails).length > 0 && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs space-y-1.5">
                <span className="font-bold text-emerald-900 block">Payment Transaction Information</span>
                {selectedBookingDetails.paymentDetails.txnId && (
                  <div className="flex justify-between text-slate-700">
                    <span>Txn ID:</span>
                    <span className="font-mono font-bold">{selectedBookingDetails.paymentDetails.txnId}</span>
                  </div>
                )}
                {selectedBookingDetails.paymentDetails.amountPaid !== undefined && (
                  <div className="flex justify-between text-slate-700">
                    <span>Amount Paid:</span>
                    <span className="font-bold text-emerald-800">
                      {formatCurrency(selectedBookingDetails.paymentDetails.amountPaid, currency)}
                    </span>
                  </div>
                )}
                {selectedBookingDetails.paymentDetails.paymentMethod && (
                  <div className="flex justify-between text-slate-700">
                    <span>Method:</span>
                    <span className="uppercase font-semibold">{selectedBookingDetails.paymentDetails.paymentMethod}</span>
                  </div>
                )}
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedBookingDetails(null)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              {selectedBookingDetails.status === 'pending' && (
                <>
                  <button
                    onClick={() => changeBookingStatus(selectedBookingDetails._id, 'confirmed')}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700"
                  >
                    Accept Booking
                  </button>
                  <button
                    onClick={() => changeBookingStatus(selectedBookingDetails._id, 'rejected')}
                    className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
                  >
                    Reject Booking
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBooking;
