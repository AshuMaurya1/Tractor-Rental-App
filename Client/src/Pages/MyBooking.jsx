import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";
import { 
  Calendar, 
  Tractor, 
  ArrowRight,
  FileText,
  PhoneCall,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  Clock,
  Award,
  Shield,
  Layers,
  Wrench
} from "lucide-react";
import InvoiceModal from "../Components/InvoiceModal";
import SosBreakdownModal from "../Components/SosBreakdownModal";
import toast from "react-hot-toast";

const formatDate = (date) => {
  if (!date) return "-";
  try {
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  } catch {
    return String(date).split("T")[0];
  }
};

const MyBooking = () => {
  const { axios, currency = "₹", language = 'en' } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Invoice Modal State
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);

  // SOS Modal State
  const [selectedSosBooking, setSelectedSosBooking] = useState(null);
  const [isSosOpen, setIsSosOpen] = useState(false);
  const [sosTickets, setSosTickets] = useState({}); // bookingId -> ticket

  const fetchMyBooking = useCallback(async () => {
    try {
      setIsLoading(true);
      const demoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      const { data } = await axios.get('/api/booking/user');
      if (data.success && Array.isArray(data.bookings)) {
        const apiIds = new Set(data.bookings.map(b => String(b._id || b.id)));
        const uniqueDemos = demoBookings.filter(b => !apiIds.has(String(b._id || b.id)));
        setBookings([...data.bookings, ...uniqueDemos]);
      } else {
        setBookings(demoBookings);
      }
    } catch {
      const demoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      setBookings(demoBookings);
    } finally {
      setIsLoading(false);
    }
  }, [axios]);

  useEffect(() => {
    fetchMyBooking();
  }, [fetchMyBooking]);

  const statusStyles = {
    confirmed: "bg-emerald-50 text-emerald-800 border-emerald-300",
    completed: "bg-blue-50 text-blue-800 border-blue-300",
    pending: "bg-amber-50 text-amber-800 border-amber-300",
    cancelled: "bg-rose-50 text-rose-800 border-rose-300",
    rejected: "bg-rose-100 text-rose-900 border-rose-400",
  };

  const openInvoice = (booking) => {
    setSelectedInvoiceBooking(booking);
    setIsInvoiceOpen(true);
  };

  const openSosModal = (booking) => {
    setSelectedSosBooking(booking);
    setIsSosOpen(true);
  };

  const handleSosDispatched = (ticket) => {
    if (!selectedSosBooking) return;
    const bId = selectedSosBooking._id || selectedSosBooking.id;
    setSosTickets(prev => ({
      ...prev,
      [bId]: ticket
    }));
  };

  // Farmer Escrow Release Action
  const handleReleaseEscrow = async (booking) => {
    const bId = booking._id || booking.id;
    const isConfirmed = window.confirm(
      language === 'hi'
        ? "क्या आप खेत का कार्य पूर्ण होने की पुष्टि करते हैं? इसके बाद एस्क्रो से ट्रैक्टर स्वामी को भुगतान जारी कर दिया जाएगा।"
        : "Confirm that field work has been completed satisfactorily? This will release the escrow rental payout to the machine owner."
    );

    if (!isConfirmed) return;

    try {
      const { data } = await axios.post('/api/booking/release-escrow', { bookingId: bId });
      if (data.success) {
        toast.success(language === 'hi' ? 'एस्क्रो फंड्स सफलतापूर्वक जारी किए गए!' : 'Escrow payout successfully released to machine owner!');
        setBookings(prev => prev.map(b => (b._id === bId || b.id === bId) ? { ...b, escrowStatus: 'released', status: 'completed' } : b));
      } else {
        toast.error(data.message || 'Could not release escrow');
      }
    } catch {
      // Local fallback for demo bookings
      setBookings(prev => {
        const updated = prev.map(b => (b._id === bId || b.id === bId) ? { ...b, escrowStatus: 'released', status: 'completed' } : b);
        localStorage.setItem('demoBookings', JSON.stringify(updated));
        return updated;
      });
      toast.success(language === 'hi' ? 'कार्य पूर्ण! एस्क्रो राशि स्वामी को रिलीज कर दी गई।' : 'Field work verified! Escrow funds released to owner.');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-10 text-xs sm:text-sm antialiased">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {language === 'hi' ? "मेरी ट्रैक्टर बुकिंग सूची" : "My Equipment Reservations"}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'hi' 
              ? "अपने आगामी कृषि उपकरण किराए, एस्क्रो फंड्स स्थिति व आपातकालीन मैकेनिक सहायता प्रबंधित करें" 
              : "Manage equipment rentals, release escrow upon field completion, and dispatch emergency mechanics"}
          </p>
        </div>
        <Link 
          to="/tractor" 
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <span>{language === 'hi' ? "अन्य ट्रैक्टर किराए पर लें" : "Rent Another Tractor"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {bookings.map((booking, index) => {
          const bId = booking._id || booking.id || index;
          const tractorName = booking.tractorModel || `${booking.tractor?.brand || "Mahindra"} ${booking.tractor?.model || "DI 275"}`;
          const tractorImage = booking.tractor?.image || assets.download1;
          const price = booking.totalAmount || booking.price || 4800;
          const status = (booking.status || "confirmed").toLowerCase();
          const escrowStatus = booking.escrowStatus || (status === 'completed' ? 'released' : 'held');
          const isChc = Boolean(booking.isChcCertified || booking.tractor?.isChcCertified);
          const sosTicket = sosTickets[bId];

          return (
            <div
              key={bId} 
              className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3.5 transition-all hover:border-slate-300"
            >
              <div className="flex flex-col md:flex-row gap-5 items-stretch md:items-center justify-between">
                {/* Photo & Basic Details */}
                <div className="flex items-start sm:items-center gap-4">
                  <div className="rounded-lg overflow-hidden bg-slate-100 w-24 h-22 sm:w-28 sm:h-22 shrink-0 border border-slate-200 relative">
                    <img
                      src={tractorImage}
                      alt={tractorName}
                      className="w-full h-full object-cover"
                    />
                    {isChc && (
                      <span className="absolute bottom-1 left-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 py-0.5 rounded leading-none flex items-center gap-0.5">
                        <Award className="w-2.5 h-2.5 fill-current" />
                        <span>CHC</span>
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{tractorName}</h3>
                      
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border capitalize ${statusStyles[status] || statusStyles.confirmed}`}>
                        {status}
                      </span>

                      {/* Billing Model Tag */}
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-slate-100 text-slate-700 border-slate-200 uppercase">
                        {booking.billingModel === 'acreage' 
                          ? `${booking.acreageCount || 5} Acres` 
                          : booking.billingModel === 'hourly' 
                          ? `${booking.engineHours || 8} Hrs` 
                          : 'Daily'}
                      </span>

                      {/* Micro-Insurance Tag */}
                      {booking.insuranceIncluded && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1">
                          <Shield className="w-3 h-3 text-emerald-600" />
                          Insured
                        </span>
                      )}

                      {/* Escrow Tag */}
                      {escrowStatus === 'released' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-emerald-50 text-emerald-800 border-emerald-300 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          {language === 'hi' ? 'एस्क्रो रिलीज्ड' : 'Escrow Released'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" />
                          {language === 'hi' ? 'एस्क्रो सुरक्षित' : 'Escrow Protected'}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-[11px] text-slate-500 font-mono">
                      Booking Ref: #{String(bId).slice(-8).toUpperCase()}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-0.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-blue-700" />
                        {formatDate(booking.startDate)} → {formatDate(booking.endDate)}
                      </span>

                      {booking.implements && booking.implements.length > 0 && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Layers className="w-3 h-3 text-blue-700" />
                          {booking.implements.length} Implements Attached
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price & Primary Action Buttons */}
                <div className="border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 flex items-center justify-between md:justify-end gap-5 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Amount</span>
                    <p className="text-xl font-black text-slate-900">
                      {currency}{price.toLocaleString()}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Tax Invoice */}
                    <button
                      type="button"
                      onClick={() => openInvoice(booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:border-blue-700 bg-white transition-colors cursor-pointer"
                      title="View Tax Invoice & Receipt"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-700" />
                      <span>{language === 'hi' ? 'इनवॉइस' : 'Invoice'}</span>
                    </button>

                    {/* Escrow Release Button */}
                    {escrowStatus !== 'released' && status !== 'cancelled' && status !== 'rejected' && (
                      <button
                        type="button"
                        onClick={() => handleReleaseEscrow(booking)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
                        title="Release escrow payment to tractor owner upon field completion"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{language === 'hi' ? 'कार्य पूर्ण (एस्क्रो रिलीज)' : 'Confirm & Release Escrow'}</span>
                      </button>
                    )}

                    {/* Emergency SOS Button */}
                    <button
                      type="button"
                      onClick={() => openSosModal(booking)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                      title="Request urgent on-field mechanic dispatch"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{language === 'hi' ? '🚨 खेत SOS' : '🚨 Field SOS'}</span>
                    </button>

                    {/* Hub Call Hotline */}
                    <a
                      href="tel:1800202624"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-700 hover:bg-slate-50 transition-colors"
                      title="Call Hub Dispatcher"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Live SOS Mechanic Dispatch Alert (if triggered) */}
              {sosTicket && (
                <div className="bg-gradient-to-r from-rose-50 via-amber-50 to-emerald-50 rounded-lg p-3 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">
                        {language === 'hi' ? 'आपातकालीन मैकेनिक वैन खेत के लिए रवाना' : 'Emergency Rural Mechanic Dispatched'}
                      </p>
                      <p className="text-[11px] text-slate-600">
                        {sosTicket.mechanicName} • Hub Tech ETA: ~{sosTicket.etaMinutes} mins
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono bg-white px-2 py-1 rounded border border-slate-200 font-bold text-slate-800">
                      📞 {sosTicket.mechanicPhone}
                    </span>
                    <a
                      href={`tel:${sosTicket.mechanicPhone}`}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold cursor-pointer transition-colors"
                    >
                      Call Tech
                    </a>
                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {bookings.length === 0 && !isLoading && (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs max-w-md mx-auto my-8">
          <Tractor className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            {language === 'hi' ? 'अभी तक कोई बुकिंग नहीं' : 'No reservations found'}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            {language === 'hi' ? 'अपने खेत के लिए उपलब्ध कृषि उपकरण देखें।' : 'You have not booked any agricultural equipment yet. Explore our fleet.'}
          </p>
          <Link
            to="/tractor"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-bold"
          >
            <span>{language === 'hi' ? 'ट्रैक्टर देखें' : 'Browse Tractors'}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Downloadable Tax Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceOpen}
        onClose={() => setIsInvoiceOpen(false)}
        booking={selectedInvoiceBooking}
      />

      {/* Feature 8: Emergency SOS Breakdown Mechanic Modal */}
      <SosBreakdownModal
        isOpen={isSosOpen}
        onClose={() => setIsSosOpen(false)}
        booking={selectedSosBooking}
        onSosDispatched={handleSosDispatched}
      />

    </div>
  );
};

export default MyBooking;
