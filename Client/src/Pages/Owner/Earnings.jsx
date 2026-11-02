import { useCallback, useEffect, useMemo, useState } from 'react';
import Title from '../../Components/owner/Title';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'react-hot-toast';
import {
  TrendingUp,
  Receipt,
  FileText,
  Clock,
  RefreshCw,
} from 'lucide-react';
import InvoiceModal from '../../Components/InvoiceModal';

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

const OwnerEarnings = () => {
  const { axios, currency = '₹', language = 'en' } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invoice modal
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  const fetchEarningsData = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/booking/owner');
      if (data.success && Array.isArray(data.bookings)) {
        setBookings(data.bookings);
      } else {
        setBookings([]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Unable to fetch financial data.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchEarningsData();
  }, [fetchEarningsData]);

  // Actual paid / completed transactions from MongoDB
  const revenueBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        b.status === 'completed' ||
        (b.paymentDetails && Number(b.paymentDetails.amountPaid) > 0)
    );
  }, [bookings]);

  // Real statistics
  const totalRevenue = useMemo(() => {
    return revenueBookings.reduce(
      (sum, b) =>
        sum +
        (Number(b.paymentDetails?.amountPaid) ||
          (b.status === 'completed' ? Number(b.price || 0) : 0)),
      0
    );
  }, [revenueBookings]);

  const pendingRevenue = useMemo(() => {
    return bookings
      .filter((b) => b.status === 'confirmed' || b.status === 'pending')
      .reduce((sum, b) => sum + (Number(b.price) || 0), 0);
  }, [bookings]);

  // Group by Month if real records exist
  const monthlyEarnings = useMemo(() => {
    const map = {};
    revenueBookings.forEach((b) => {
      const date = new Date(b.createdAt || b.startDate);
      if (!Number.isNaN(date.getTime())) {
        const key = date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const amount =
          Number(b.paymentDetails?.amountPaid) ||
          (b.status === 'completed' ? Number(b.price || 0) : 0);
        map[key] = (map[key] || 0) + amount;
      }
    });
    return Object.entries(map).map(([month, total]) => ({ month, total }));
  }, [revenueBookings]);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 antialiased">
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={selectedInvoice}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
        <Title
          title={language === 'hi' ? 'राजस्व व आय विवरण' : 'Earnings & Revenue Operations'}
          subtitle={
            language === 'hi'
              ? 'वास्तविक पूर्ण हुए किराए से प्राप्त आय व लेन-देन इतिहास।'
              : 'Actual revenue calculated strictly from completed & paid customer transactions in MongoDB.'
          }
        />
        <button
          onClick={fetchEarningsData}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors self-start sm:self-auto"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Finances
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Earned */}
        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 text-white shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Total Realized Earnings
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 text-white backdrop-blur-xs">
              <TrendingUp size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold">
            {loading ? '—' : formatCurrency(totalRevenue, currency)}
          </p>
          <p className="mt-1 text-xs text-emerald-100">From completed / paid bookings</p>
        </div>

        {/* Pipeline Revenue */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Pipeline / Booked Value
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <Clock size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {loading ? '—' : formatCurrency(pendingRevenue, currency)}
          </p>
          <p className="mt-1 text-xs text-slate-400">Scheduled active & pending rentals</p>
        </div>

        {/* Paid Transactions Count */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Paid Transactions
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Receipt size={18} />
            </div>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-teal-700">
            {loading ? '—' : revenueBookings.length}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total settled rentals</p>
        </div>
      </div>

      {/* Monthly Revenue Breakdown (if real data exists) */}
      {monthlyEarnings.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3">Monthly Settlement Breakdown</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {monthlyEarnings.map((item) => (
              <div
                key={item.month}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center"
              >
                <span className="text-xs font-semibold text-slate-500 block">{item.month}</span>
                <span className="text-base font-extrabold text-emerald-700 block mt-1">
                  {formatCurrency(item.total, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking-Wise Earnings Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="text-base font-bold text-slate-900">Booking-Wise Revenue & Transactions</h2>
          <p className="text-xs text-slate-500">
            Audit trail of completed payments and individual booking earnings
          </p>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : revenueBookings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50">
                  <th className="py-3 px-4">Transaction / Booking</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Tractor Machinery</th>
                  <th className="py-3 px-4">Rental Period</th>
                  <th className="py-3 px-4">Amount Paid</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {revenueBookings.map((b) => {
                  const tractorName = b.tractor
                    ? `${b.tractor.brand || ''} ${b.tractor.model || ''}`.trim()
                    : 'Tractor';
                  const amount =
                    Number(b.paymentDetails?.amountPaid) ||
                    (b.status === 'completed' ? Number(b.price || 0) : 0);

                  return (
                    <tr key={b._id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-slate-900 block">
                          #{String(b._id).slice(-6).toUpperCase()}
                        </span>
                        {b.paymentDetails?.txnId && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            Txn: {b.paymentDetails.txnId}
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {b.user?.name || 'Farmer'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-800">{tractorName}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {formatDate(b.startDate)} – {formatDate(b.endDate)}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm">
                        {formatCurrency(amount, currency)}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">
                          Settled
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedInvoice(b);
                            setIsInvoiceOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <FileText size={12} /> Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 px-4 text-center text-slate-400">
            <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-900">No completed earnings yet</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Earnings and transaction receipts appear here once bookings are marked completed or
              payments are recorded.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OwnerEarnings;
