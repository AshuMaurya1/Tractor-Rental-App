import { Link } from "react-router-dom";
import { Tractor, PhoneCall, Mail, MapPin } from "lucide-react";
import { useAppContext } from "../context/AppContext";

const Footer = () => {
  const { language = 'en' } = useAppContext();

  const handleFooterLinkClick = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
  };

  const linkSections = [
    {
      title: language === 'hi' ? "कृषि फ्लीट" : "Agri Fleet",
      links: [
        { label: language === 'hi' ? "मुख्य पृष्ठ" : "Home", href: "/" },
        { label: language === 'hi' ? "सभी ट्रैक्टर" : "All Tractors", href: "/tractor" },
        { label: language === 'hi' ? "मेरी बुकिंग" : "My Reservations", href: "/mybooking" },
        { label: language === 'hi' ? "मालिक डैशबोर्ड" : "Partner Dashboard", href: "/owner" },
      ],
    },
    {
      title: language === 'hi' ? "प्रमुख कृषि हब" : "Regional Hubs",
      links: [
        { label: "Sonbhadra Agri Hub", href: "/tractor" },
        { label: "Gorakhpur Fleet Center", href: "/tractor" },
        { label: "Varanasi Custom Hiring Hub", href: "/tractor" },
        { label: "Prayagraj Machinery Depot", href: "/tractor" },
      ],
    },
    {
      title: language === 'hi' ? "फ्लीट पार्टनर प्रोग्राम" : "Partner Program",
      links: [
        { label: language === 'hi' ? "ट्रैक्टर जोड़ें" : "List Your Tractor", href: "/owner/add-tractor" },
        { label: language === 'hi' ? "फ्लीट प्रबंधन" : "Manage Machinery", href: "/owner/manage-tractor" },
        { label: language === 'hi' ? "आय कैलकुलेटर" : "Earnings Calculator", href: "/owner" },
        { label: language === 'hi' ? "उपकरण बीमा सुरक्षा" : "Machine Safety Policy", href: "/" },
      ],
    },
  ];

  return (
    <footer className="bg-white border-t border-slate-200 mt-16 antialiased">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 pb-8 border-b border-slate-200">
          
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-3">
            <Link to='/' className='flex items-center gap-2.5'>
              <div className='h-8 w-8 rounded-lg bg-blue-700 flex items-center justify-center text-white shrink-0'>
                <Tractor className='w-4 h-4 text-white' />
              </div>
              <div className='flex flex-col'>
                <span className='text-base font-extrabold text-slate-900 tracking-tight leading-none'>
                  TractorRental
                </span>
                <span className='text-[10px] font-bold tracking-wider uppercase text-blue-700 mt-0.5'>
                  {language === 'hi' ? 'भारतीय कृषि यंत्र नेटवर्क' : 'India Agri Fleet'}
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
              Connecting farmers and Custom Hiring Centers (CHCs) with transparent, on-demand machinery rentals across India. Quality equipment, verified hosts, and transparent rates in Indian Rupees (₹).
            </p>

            <div className="space-y-1.5 text-xs text-slate-600 pt-1">
              <p className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
                <span>Farmer Support Helpline: 1800-2026-AGRI</span>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>support@tractorrental.in</span>
              </p>
              <p className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>Registered Office: Sonbhadra, Uttar Pradesh - 231216</span>
              </p>
            </div>
          </div>

          {/* Link Columns */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-3 gap-6">
            {linkSections.map((section, index) => (
              <div key={index}>
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-3">
                  {section.title}
                </h3>
                <ul className="space-y-2 text-xs text-slate-500">
                  {section.links.map((link, i) => (
                    <li key={i}>
                      <Link to={link.href} onClick={handleFooterLinkClick} className="hover:text-blue-700 transition-colors">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

        </div>

        {/* Bottom Credits & Legal */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
          <p>© 2026 TractorRental India Private Limited. All rights reserved.</p>
          <p>
            Agricultural Machinery Leasing exempted from GST under SAC Code 9986.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
