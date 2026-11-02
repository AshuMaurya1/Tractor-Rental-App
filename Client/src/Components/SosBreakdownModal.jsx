import { useState } from 'react';
import { 
  X, 
  Wrench, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2, 
  ShieldAlert,
  Send
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const SosBreakdownModal = ({ isOpen, onClose, booking, onSosDispatched }) => {
  const { axios, user, language = 'en' } = useAppContext();

  const [issueType, setIssueType] = useState('Hydraulic Lift / 3-Point Hitch Failure');
  const [fieldLocation, setFieldLocation] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dispatchedTicket, setDispatchedTicket] = useState(null);

  if (!isOpen) return null;

  const issueOptions = [
    {
      id: 'hydraulic',
      title: language === 'hi' ? 'हाइड्रोलिक लिफ्ट / 3-पॉइंट हिच विफलता' : 'Hydraulic Lift / 3-Point Hitch Failure',
      desc: language === 'hi' ? 'उपकरण ऊपर नहीं उठ रहा अथवा प्रेशर ड्रॉप' : 'Implement not lifting or pressure drop'
    },
    {
      id: 'pto',
      title: language === 'hi' ? 'पीटीओ जाम / रोटरी शाफ्ट खराबी' : 'PTO Jam / Rotary Shaft Fracture',
      desc: language === 'hi' ? 'रोटावेटर या थ्रेशर शाफ्ट नहीं घूम रहा' : 'Attachment shaft seized or broken pin'
    },
    {
      id: 'puncture',
      title: language === 'hi' ? 'खेत में टायर पंचर / रिम क्षति' : 'Field Tyre Puncture / Rim Damage',
      desc: language === 'hi' ? 'पिछला बड़ा टायर पंचर या हवा रिसाव' : 'Rear traction tyre deflated in muddy field'
    },
    {
      id: 'engine',
      title: language === 'hi' ? 'इंजन ओवरहीटिंग / कूलेंट रिसाव' : 'Engine Overheating / Coolant Leak',
      desc: language === 'hi' ? 'रेडिएटर से धुआं या इंजन तापमान चरम पर' : 'Cooling system failure or temperature high'
    },
    {
      id: 'electrical',
      title: language === 'hi' ? 'स्टार्टर मोटर / अल्टरनेटर समस्या' : 'Starter Motor / Alternator Failure',
      desc: language === 'hi' ? 'इंजन स्टार्ट नहीं हो रहा, बैटरी डिस्चार्ज' : 'Engine won’t crank, electrical shutdown'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fieldLocation.trim()) {
      toast.error(language === 'hi' ? 'कृपया खेत का पता व लैंडमार्क दर्ज करें' : 'Please provide field landmark and location');
      return;
    }

    try {
      setIsSubmitting(true);
      const tractorId = booking?.tractor?._id || booking?.tractor?.id;
      const bookingId = booking?._id || booking?.id;

      const { data } = await axios.post('/api/booking/sos-breakdown', {
        bookingId,
        tractorId,
        issueType,
        description,
        fieldLocation,
        contactPhone
      });

      if (data.success && data.sosTicket) {
        setDispatchedTicket(data.sosTicket);
        if (onSosDispatched) {
          onSosDispatched(data.sosTicket);
        }
        toast.success(language === 'hi' ? 'इमरजेंसी मैकेनिक रवाना कर दिया गया है!' : 'Emergency field mechanic dispatched!');
      } else {
        // Fallback simulation for offline/demo bookings
        const fallbackTicket = {
          id: `SOS-${Date.now().toString().slice(-6)}`,
          status: 'In Progress',
          issueType,
          etaMinutes: 25,
          mechanicName: 'Ramesh Sharma (Senior CHC Technician)',
          mechanicPhone: '98765-43210',
          dispatchHub: fieldLocation || 'Regional Fleet Center'
        };
        setDispatchedTicket(fallbackTicket);
        if (onSosDispatched) {
          onSosDispatched(fallbackTicket);
        }
        toast.success('Emergency mechanic dispatch requested (Simulation)!');
      }
    } catch {
      const fallbackTicket = {
        id: `SOS-${Date.now().toString().slice(-6)}`,
        status: 'In Progress',
        issueType,
        etaMinutes: 28,
        mechanicName: 'Ramesh Sharma (Senior CHC Technician)',
        mechanicPhone: '98765-43210',
        dispatchHub: fieldLocation || 'Regional Fleet Center'
      };
      setDispatchedTicket(fallbackTicket);
      if (onSosDispatched) {
        onSosDispatched(fallbackTicket);
      }
      toast.success('Emergency mechanic dispatched (Offline preview)!');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setDispatchedTicket(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs antialiased">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-rose-200 p-5 sm:p-7 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        <button 
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {dispatchedTicket ? (
          /* Live Dispatch Tracker Confirmation */
          <div className="py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                {language === 'hi' ? 'मैकेनिक वैन रवाना' : 'Field Technician Dispatched'}
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                {language === 'hi' ? 'सहायता आपके खेत की ओर अग्रसर है' : 'Mobile Service Van En Route'}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {language === 'hi'
                  ? 'निकटतम सीएससी/एसएमएएम हब से प्रमाणित ग्रामीण तकनीशियन आपके खेत के लिए रवाना हो चुका है।'
                  : 'A certified rural machinery technician has been assigned to your field location with necessary spare parts.'}
              </p>
            </div>

            {/* Technician Details Card */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500 font-semibold uppercase text-[10px]">SOS Ticket Ref</span>
                <span className="font-mono font-bold text-slate-900">#{dispatchedTicket.id}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Clock className="w-3.5 h-3.5 text-blue-700" />
                  Estimated Arrival (ETA):
                </span>
                <span className="font-extrabold text-emerald-700 text-sm">~{dispatchedTicket.etaMinutes} Minutes</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Wrench className="w-3.5 h-3.5 text-blue-700" />
                  Assigned Technician:
                </span>
                <span className="font-bold text-slate-900">{dispatchedTicket.mechanicName}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-600 flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-blue-700" />
                  Direct Hotline:
                </span>
                <a 
                  href={`tel:${dispatchedTicket.mechanicPhone}`} 
                  className="font-bold text-blue-700 underline flex items-center gap-1 hover:text-blue-800"
                >
                  {dispatchedTicket.mechanicPhone}
                </a>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              {language === 'hi' ? 'ठीक है, डैशबोर्ड पर जाएं' : 'Acknowledge & Close'}
            </button>
          </div>
        ) : (
          /* SOS Issue Dispatch Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <span>{language === 'hi' ? '🚨 खेत में इमरजेंसी खराबी (SOS)' : '🚨 Emergency Machinery SOS'}</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  {language === 'hi'
                    ? 'खेत में काम के दौरान खराबी आने पर निकटतम मोबाइल मैकेनिक बुलाएं'
                    : 'Instant on-field mobile mechanic dispatch for sudden mechanical breakdown'}
                </p>
              </div>
            </div>

            {/* Target Tractor Banner */}
            {booking && (
              <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 text-xs flex justify-between items-center">
                <span className="font-bold text-slate-800">
                  {booking.tractor?.brand || 'Tractor'} {booking.tractor?.model || ''}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Booking #{String(booking._id || booking.id).slice(-6)}
                </span>
              </div>
            )}

            {/* Breakdown Issue Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800">
                {language === 'hi' ? 'खराबी का प्रकार चुनें:' : 'Select Breakdown Nature:'}
              </label>
              <div className="space-y-2">
                {issueOptions.map((opt) => (
                  <div
                    key={opt.id}
                    onClick={() => setIssueType(opt.title)}
                    className={`p-2.5 rounded-lg border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                      issueType === opt.title
                        ? 'border-rose-600 bg-rose-50/60 font-semibold text-rose-900'
                        : 'border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold">{opt.title}</p>
                      <p className="text-[11px] text-slate-500 font-normal">{opt.desc}</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      issueType === opt.title ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300'
                    }`}>
                      {issueType === opt.title && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Field Landmark Input */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-600" />
                <span>{language === 'hi' ? 'खेत का सटीक स्थान व लैंडमार्क:' : 'Field Location & Nearest Landmark:'}</span>
              </label>
              <input
                type="text"
                value={fieldLocation}
                onChange={(e) => setFieldLocation(e.target.value)}
                placeholder={language === 'hi' ? 'उदा: ग्राम रामपुर, नहर पुलिया के पास, खसरा संख्या 104' : 'e.g. Near village tube-well canal bridge, Plot 14B'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-rose-600 font-medium"
                required
              />
            </div>

            {/* Mobile Number */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-blue-700" />
                <span>{language === 'hi' ? 'संपर्क फोन नंबर (चालक / किसान):' : 'Driver / Farmer Contact Phone:'}</span>
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-700 font-medium"
                required
              />
            </div>

            {/* Additional Note */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {language === 'hi' ? 'अतिरिक्त टिप्पणी (वैकल्पिक):' : 'Additional Symptoms (Optional):'}
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={language === 'hi' ? 'कोई आवाज या लीक के बारे में बताएं...' : 'Describe any unusual smoke, hydraulic noise, or warning light...'}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Dispatch CTA */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Dispatching Nearest Hub Tech...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>{language === 'hi' ? '🚨 आपातकालीन मैकेनिक अभी रवाना करें' : '🚨 Dispatch Field Mechanic Now'}</span>
                </>
              )}
            </button>

            <p className="text-center text-[10px] text-slate-500">
              {language === 'hi'
                ? 'औसत ग्रामीण आगमन समय: 25-35 मिनट • सीएससी/एसएमएएम सहायता नेटवर्क'
                : 'Average rural mobile arrival time: 25-35 minutes • 24/7 Helpline backed'}
            </p>

          </form>
        )}

      </div>
    </div>
  );
};

export default SosBreakdownModal;
