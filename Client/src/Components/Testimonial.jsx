import { Star } from 'lucide-react';
import { assets } from '../assets/assets';
import { useAppContext } from '../context/AppContext';

const Testimonial = () => {
  const { language = 'en' } = useAppContext();

  const testimonials = [
    {
      name: "Rameshwar Yadav",
      location: "Sonbhadra, Uttar Pradesh",
      role: language === 'hi' ? "गेहूं व धान किसान (18 एकड़)" : "Wheat & Paddy Farmer (18 Acres)",
      image: assets.user1,
      rating: 5,
      review: language === 'hi'
        ? "हमने 18 एकड़ खेत की जुताई के लिए महिंद्रा अर्जुन 585 किराए पर लिया था। ट्रैक्टर समय पर सीधे खेत तक पहुंचा। भारतीय रुपयों में पारदर्शी दरें और बिना किसी अग्रिम अमानत के काम हुआ।"
        : "Rented a Mahindra Arjun 585 for our 18-acre field plowing. The machinery arrived directly at our farm on time. Transparent pricing in Indian Rupees with zero deposit hassle."
    },
    {
      name: "Balwant Singh",
      location: "Gorakhpur, Uttar Pradesh",
      role: language === 'hi' ? "फ्लीट मालिक (3 ट्रैक्टर)" : "Custom Hiring Fleet Owner (3 Tractors)",
      image: assets.user2,
      rating: 5,
      review: language === 'hi'
        ? "हमारे स्वराज और जॉन डियर ट्रैक्टर खाली समय में किराए पर देकर हमें हर सीजन में ₹65,000 की अतिरिक्त आमदनी होती है। भुगतान सीधे बैंक खाते में आता है।"
        : "Listing our Swaraj and John Deere machinery during idle weeks generates over ₹65,000 extra income every harvest season. Payouts are credited directly to our bank account."
    },
    {
      name: "Suresh Maurya",
      location: "Varanasi, Uttar Pradesh",
      role: language === 'hi' ? "सब्जी व नकदी फसल उत्पादक" : "Cash Crop & Vegetable Cultivator",
      image: assets.user3,
      rating: 5,
      review: language === 'hi'
        ? "मोबाइल से बुकिंग बहुत आसान रही। मैसी फर्ग्यूसन ट्रैक्टर और रोटावेटर की मदद से हमारी जुताई का काम आधे समय में पूरा हो गया।"
        : "Booking via phone was seamless. The Massey Ferguson tractor with rotavator attachment helped us complete our pre-sowing plowing in half the usual time."
    }
  ];

  return (
    <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 antialiased">
      
      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
          {language === 'hi' ? 'किसान व फ्लीट मालिकों के अनुभव' : 'Verified Farmer & Fleet Owner Feedback'}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {language === 'hi'
            ? 'जानें कि उत्तर प्रदेश के सैकड़ों किसान और फ्लीट मालिक TractorRental पर क्यों भरोसा करते हैं।'
            : 'Operational feedback from agricultural contractors and cultivators across Uttar Pradesh.'}
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
        {testimonials.map((testimonial, index) => (
          <div
            key={index}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Star Rating */}
              <div className="flex items-center gap-1 mb-3 text-amber-500">
                {Array(5).fill(0).map((_, i) => (
                  <Star key={i} className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                ))}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed italic">
                "{testimonial.review}"
              </p>
            </div>

            <div className="flex items-center gap-3 mt-5 pt-3 border-t border-slate-100">
              <img
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
                src={testimonial.image}
                alt={testimonial.name}
              />
              <div>
                <p className="text-xs font-bold text-slate-900">{testimonial.name}</p>
                <p className="text-[11px] text-blue-700 font-medium">{testimonial.role}</p>
                <p className="text-[10px] text-slate-400">{testimonial.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
};

export default Testimonial;
