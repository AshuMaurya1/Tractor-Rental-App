import { useState, useEffect } from 'react';
import { 
  X, 
  QrCode, 
  CreditCard, 
  Truck, 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'react-hot-toast';

const PaymentModal = ({ isOpen, onClose, onPaymentSuccess, bookingDetails }) => {
  const { currency = '₹', language = 'en' } = useAppContext();

  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'cod'
  const [paymentOption, setPaymentOption] = useState('advance'); // 'advance' | 'full'
  const [copiedUPI, setCopiedUPI] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(599); // 10 minutes

  // Countdown timer for UPI session
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const total = bookingDetails?.totalAmount || 2500;
  const advanceAmount = Math.round(total * 0.15); // 15% advance token
  const payableAmount = paymentMethod === 'cod' ? 0 : paymentOption === 'advance' ? advanceAmount : total;
  const balanceDue = total - payableAmount;

  const minutes = Math.floor(countdown / 60);
  const seconds = String(countdown % 60).padStart(2, '0');

  const copyUPI = () => {
    navigator.clipboard.writeText('tractorrental.pay@icici');
    setCopiedUPI(true);
    toast.success('UPI VPA copied: tractorrental.pay@icici');
    setTimeout(() => setCopiedUPI(false), 2000);
  };

  const handleSimulatePayment = () => {
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      const txnId = `TXN-AGRI-${Math.floor(10000000 + Math.random() * 90000000)}`;

      setTimeout(() => {
        onPaymentSuccess({
          txnId,
          paymentMethod,
          paymentOption,
          amountPaid: payableAmount,
          balanceDue,
          paidAt: new Date().toISOString()
        });
      }, 1400);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/50 backdrop-blur-xs antialiased">
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg border border-slate-200 p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
        
        {/* Close Button */}
        {!isProcessing && !isSuccess && (
          <button 
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {isSuccess ? (
          /* Payment Success Confirmation */
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900">
                {language === 'hi' ? 'बुकिंग व भुगतान सत्यापित!' : 'Booking & Payment Verified!'}
              </h3>
              <p className="text-xs text-slate-600 mt-1 max-w-xs mx-auto">
                {language === 'hi'
                  ? `आपका ट्रैक्टर आरक्षण पक्का हो गया है। राशि: ${currency}${payableAmount.toLocaleString()}`
                  : `Your machinery reservation has been secured. Amount paid: ${currency}${payableAmount.toLocaleString()}`}
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 max-w-xs mx-auto text-xs text-left space-y-1.5">
              <div className="flex justify-between text-slate-600">
                <span>Transaction Ref:</span>
                <span className="font-mono font-bold text-slate-900">TXN-AGRI-847291</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Payment Mode:</span>
                <span className="font-bold text-blue-700 uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Balance Due at Field:</span>
                <span className="font-bold text-slate-900">{currency}{balanceDue.toLocaleString()}</span>
              </div>
            </div>

            <p className="text-xs text-emerald-700 font-medium flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Direct field dispatch initiated. Redirecting to reservations...</span>
            </p>
          </div>
        ) : (
          /* Payment Form Screen */
          <div className="space-y-4">
            
            {/* Header */}
            <div className="pb-3 border-b border-slate-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-600" />
                  <span>256-Bit SSL Secured Checkout</span>
                </span>
                <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>{minutes}:{seconds}</span>
                </span>
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {language === 'hi' ? 'ट्रैक्टर किराया पुष्टि एवं भुगतान' : 'Confirm Tractor Rental & Payment'}
              </h3>
              <p className="text-xs text-slate-500">
                {bookingDetails?.tractor?.brand} {bookingDetails?.tractor?.model} • {bookingDetails?.days || 1} {language === 'hi' ? 'दिन का किराया' : 'Days Rental'}
              </p>
            </div>

            {/* Advance Deposit vs Full Payment Options */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setPaymentOption('advance')}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  paymentOption === 'advance'
                    ? 'border-blue-700 bg-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
                  Most Popular
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  15% Advance ({currency}{advanceAmount})
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Pay {currency}{balanceDue} on field delivery
                </span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentOption('full')}
                className={`p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                  paymentOption === 'full'
                    ? 'border-blue-700 bg-blue-50/60'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Zero Balance
                </span>
                <span className="text-sm font-bold text-slate-900 block mt-0.5">
                  Full 100% ({currency}{total})
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  No field cash handling needed
                </span>
              </button>
            </div>

            {/* Payment Method Tabs */}
            <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'upi' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'card' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Card / NetBanking</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('cod')}
                className={`flex-1 py-1.5 rounded-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  paymentMethod === 'cod' ? 'bg-white text-blue-700 font-bold shadow-xs' : 'hover:text-slate-900'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Pay on Field</span>
              </button>
            </div>

            {/* Tab 1: UPI QR Content */}
            {paymentMethod === 'upi' && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-3">
                <div className="relative w-40 h-40 bg-white p-2.5 rounded-lg mx-auto border border-slate-200 flex flex-col items-center justify-center">
                  <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100" fill="currentColor">
                    <rect x="0" y="0" width="30" height="30" rx="3" fill="currentColor" />
                    <rect x="5" y="5" width="20" height="20" rx="2" fill="white" />
                    <rect x="9" y="9" width="12" height="12" rx="1" fill="currentColor" />
                    
                    <rect x="70" y="0" width="30" height="30" rx="3" fill="currentColor" />
                    <rect x="75" y="5" width="20" height="20" rx="2" fill="white" />
                    <rect x="79" y="9" width="12" height="12" rx="1" fill="currentColor" />
                    
                    <rect x="0" y="70" width="30" height="30" rx="3" fill="currentColor" />
                    <rect x="5" y="75" width="20" height="20" rx="2" fill="white" />
                    <rect x="9" y="79" width="12" height="12" rx="1" fill="currentColor" />

                    <circle cx="50" cy="50" r="10" fill="#1d4ed8" />
                    <text x="45" y="54" fontSize="10" fontWeight="bold" fill="white">₹</text>

                    <rect x="36" y="8" width="6" height="6" />
                    <rect x="48" y="8" width="6" height="6" />
                    <rect x="36" y="20" width="6" height="6" />
                    <rect x="48" y="20" width="6" height="6" />
                    <rect x="8" y="36" width="6" height="6" />
                    <rect x="20" y="36" width="6" height="6" />
                    <rect x="8" y="48" width="6" height="6" />
                    <rect x="20" y="48" width="6" height="6" />
                    <rect x="72" y="72" width="6" height="6" />
                    <rect x="84" y="72" width="6" height="6" />
                    <rect x="72" y="84" width="6" height="6" />
                    <rect x="84" y="84" width="6" height="6" />
                  </svg>
                </div>

                <div className="flex items-center justify-center gap-2 text-xs">
                  <span className="text-slate-500 font-mono bg-white px-2.5 py-1 rounded border border-slate-200">
                    tractorrental.pay@icici
                  </span>
                  <button
                    type="button"
                    onClick={copyUPI}
                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copiedUPI ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <p className="text-[11px] text-slate-500">
                  Scan using PhonePe, Google Pay, Paytm, BHIM, or any UPI App
                </p>
              </div>
            )}

            {/* Tab 2: Card / NetBanking */}
            {paymentMethod === 'card' && (
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Card / Kisan Credit Card Number</label>
                  <input
                    type="text"
                    defaultValue="4321 •••• •••• 9812"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-blue-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Expiry</label>
                    <input
                      type="text"
                      defaultValue="08/29"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-blue-700"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">CVV</label>
                    <input
                      type="password"
                      defaultValue="•••"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md font-mono text-xs focus:outline-none focus:border-blue-700"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Cash on Delivery */}
            {paymentMethod === 'cod' && (
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-2 text-slate-600">
                <p className="font-bold text-slate-900">Zero Advance Required</p>
                <p>
                  Our verified tractor operator will arrive at your specified field hub. Inspect the machinery, test the PTO and implements, and pay <strong className="text-slate-900">{currency}{total.toLocaleString()}</strong> in cash or UPI directly upon field handover.
                </p>
              </div>
            )}

            {/* Order Summary Line */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs font-semibold">
              <span className="text-slate-600">Amount Due Now:</span>
              <span className="text-base font-black text-blue-700">
                {currency}{payableAmount.toLocaleString()}
              </span>
            </div>

            {/* Submit Action */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleSimulatePayment}
              className="w-full py-2.5 px-4 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Verifying Payment...</span>
                </>
              ) : (
                <>
                  <span>
                    {paymentMethod === 'cod' 
                      ? 'Confirm Cash on Delivery Booking' 
                      : `Pay ${currency}${payableAmount.toLocaleString()} via ${paymentMethod.toUpperCase()}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>
        )}

      </div>
    </div>
  );
};

export default PaymentModal;
