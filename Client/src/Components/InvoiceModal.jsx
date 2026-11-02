import { Printer, X, Tractor, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const InvoiceModal = ({ isOpen, onClose, booking }) => {
  const { currency = '₹' } = useAppContext();

  if (!isOpen || !booking) return null;

  const invoiceNo = `INV-UP-2026-${String(booking._id || booking.id || '98234').slice(-6).toUpperCase()}`;
  const issueDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const tractorName = booking.tractorModel || `${booking.tractor?.brand || "Mahindra"} ${booking.tractor?.model || "DI 275"}`;
  const days = booking.totalDays || 4;
  const price = booking.totalAmount || booking.price || 4800;
  const baseRate = Math.round(price / days);

  const customerName = booking.customerName || booking.user?.name || "Rameshwar Yadav";
  const customerPhone = booking.customerPhone || booking.user?.phone || "+91 98765 43210";
  const customerLocation = booking.tractor?.location || "Sonbhadra Agri Hub, Uttar Pradesh";

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs antialiased overflow-y-auto print:p-0 print:bg-white print:static">
      
      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-300 p-6 sm:p-8 antialiased my-6 print:shadow-none print:border-none print:m-0 print:p-4 print:max-w-none">
        
        {/* Actions bar (Hidden in print) */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-bold text-slate-800">Agri-Machinery Tax Invoice & Rental Receipt</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-md text-xs font-bold transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* INVOICE CONTENT (Printable Area) */}
        <div id="printable-invoice" className="space-y-5 text-slate-800 text-xs">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-blue-700 text-white flex items-center justify-center font-bold">
                  <Tractor className="w-4 h-4" />
                </div>
                <h1 className="text-lg font-extrabold tracking-tight text-slate-900">TractorRental India Pvt Ltd</h1>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Custom Hiring Center (CHC) Agri Equipment Hub
              </p>
              <p className="text-[10px] text-slate-500">
                GSTIN: 09AAACT2026A1Z5 • State Code: 09 (Uttar Pradesh)
              </p>
            </div>

            <div className="sm:text-right">
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-300 text-[10px] font-bold rounded uppercase">
                Payment Confirmed
              </span>
              <p className="font-mono font-bold text-slate-900 text-xs mt-1.5">{invoiceNo}</p>
              <p className="text-[11px] text-slate-500">Date: {issueDate}</p>
            </div>
          </div>

          {/* Billed To / Farmer Info */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Renter (Farmer / Operator)
              </span>
              <p className="font-bold text-xs text-slate-900">{customerName}</p>
              <p className="text-slate-600 mt-0.5">{customerPhone}</p>
              <p className="text-slate-500 text-[11px]">Field Hub: {customerLocation}</p>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-0.5">
                Rental Period
              </span>
              <p className="font-bold text-slate-800">{days} Days Total</p>
              <p className="text-slate-500 text-[11px]">
                {booking.startDate ? String(booking.startDate).split('T')[0] : '2026-10-26'} → {booking.endDate ? String(booking.endDate).split('T')[0] : '2026-10-30'}
              </p>
            </div>
          </div>

          {/* Itemized Table */}
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">SAC Code</th>
                  <th className="py-2.5 px-3 text-center">Days</th>
                  <th className="py-2.5 px-3 text-right">Daily Rate</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 px-3">
                    <p className="font-bold text-slate-800">{tractorName}</p>
                    <p className="text-[10px] text-slate-500">Field tractor rental with regular operational inspection</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">9986</td>
                  <td className="py-2.5 px-3 text-center">{days}</td>
                  <td className="py-2.5 px-3 text-right">{currency}{baseRate.toLocaleString()}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-slate-800">{currency}{price.toLocaleString()}</td>
                </tr>

                <tr>
                  <td className="py-2.5 px-3">
                    <p className="font-medium text-slate-800">Agricultural Field Delivery & Transit</p>
                    <p className="text-[10px] text-slate-500">Direct tractor dispatch to farm</p>
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">9986</td>
                  <td className="py-2.5 px-3 text-center">1</td>
                  <td className="py-2.5 px-3 text-right">Free</td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-700">₹0.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Breakdown */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pt-2">
            <div className="text-[10px] text-slate-500 space-y-1 max-w-xs">
              <p className="font-bold text-slate-700 uppercase">GST Exemption Note:</p>
              <p>
                Services relating to agricultural operations and farm machinery leasing are exempt from GST under SAC Code 9986 (Notification No. 12/2017 - Central Tax (Rate)).
              </p>
            </div>

            <div className="w-full sm:w-60 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-medium text-slate-800">{currency}{price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (0%):</span>
                <span className="font-medium text-slate-800">₹0.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (0%):</span>
                <span className="font-medium text-slate-800">₹0.00</span>
              </div>
              <div className="border-t border-slate-200 pt-1.5 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-700 font-extrabold">{currency}{price.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Signatures & Seal */}
          <div className="pt-6 border-t border-slate-200 flex items-end justify-between">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded border-2 border-dashed border-emerald-600/40 flex flex-col items-center justify-center text-center p-1">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span className="text-[7px] font-bold text-emerald-800 uppercase tracking-tighter">VERIFIED CHC</span>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-700">Computer-Generated Agri Tax Invoice</p>
                <p className="text-[9px] text-slate-400">Valid without physical ink signature under IT Act 2000</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-xs text-slate-800">For TractorRental India</p>
              <p className="text-[10px] text-slate-500 mt-1">Authorized CHC Dispatch Officer</p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default InvoiceModal;
