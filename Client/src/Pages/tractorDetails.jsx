import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../Components/Loader";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import { 
  ArrowLeft, 
  Users, 
  Fuel, 
  Gauge, 
  MapPin, 
  CheckCircle2, 
  ShieldCheck, 
  Calendar,
  Clock,
  UserCheck,
  Wrench,
  Check,
  Truck,
  Layers,
  Settings2,
  Sprout,
  ArrowRight,
  Shield,
  CloudSun,
  Droplets,
  Radio,
  Sparkles,
  MessageCircle,
  Award
} from "lucide-react";
import AvailabilityCalendar from "../Components/AvailabilityCalendar";
import PaymentModal from "../Components/PaymentModal";

const TractorDetails = () => {
  const { id } = useParams();
  const { 
    tractors, 
    currency = "₹", 
    axios, 
    pickupDate, 
    setPickupDate, 
    returnDate, 
    setReturnDate,
    language = "en",
    t,
    openAuthModal,
    token
  } = useAppContext();
  const navigate = useNavigate();

  const [individualTractor, setIndividualTractor] = useState(null);
  const tractor = tractors.find((item) => (item._id || item.id) === id) || individualTractor;

  useEffect(() => {
    if (!tractor && id) {
      axios.get(`/api/user/tractor/${id}`)
        .then(({ data }) => {
          if (data.success && data.tractor) {
            setIndividualTractor(data.tractor);
          }
        })
        .catch(() => {});
    }
  }, [id, tractor, axios]);

  // Multi-Model Billing State: 'daily' | 'acreage' | 'hourly'
  const [billingModel, setBillingModel] = useState('daily');
  const [acreageCount, setAcreageCount] = useState(5);
  const [engineHours, setEngineHours] = useState(8);

  // Micro-Insurance & Add-ons
  const [insuranceIncluded, setInsuranceIncluded] = useState(true);
  const [includeDriver, setIncludeDriver] = useState(false);
  const [selectedImplements, setSelectedImplements] = useState([]);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);

  const availableImplements = [
    { 
      id: "rotavator", 
      name: language === 'hi' ? "रोटावेटर (42-ब्लेड / 6 फीट)" : "Rotavator (42-Blades / 6ft)", 
      price: 450, 
      desc: language === 'hi' ? "गहरी मिट्टी जुताई व बीज तैयारी" : "Seedbed prep & stubble incorporation",
      icon: Layers 
    },
    { 
      id: "cultivator", 
      name: language === 'hi' ? "9-टाइन स्प्रिंग कल्टीवेटर" : "9-Tyne Spring Cultivator", 
      price: 300, 
      desc: language === 'hi' ? "प्राथमिक जुताई और खरपतवार नियंत्रण" : "Secondary tilling & weed aeration",
      icon: Sprout 
    },
    { 
      id: "trolley", 
      name: language === 'hi' ? "हैवी ड्यूटी 4-पहिया ट्रॉली" : "Heavy Duty 4-Wheel Trolley", 
      price: 600, 
      desc: language === 'hi' ? "अनाज व फसल परिवहन हेतु (8 टन)" : "Grain & crop haulage (8 Ton capacity)",
      icon: Truck 
    },
    { 
      id: "discHarrow", 
      name: language === 'hi' ? "14-डिस्क हैवी हैरो" : "Heavy Duty 14-Disc Harrow", 
      price: 350, 
      desc: language === 'hi' ? "कठोर मिट्टी व ढेलों को तोड़ना" : "Hardpan breaking & soil clod pulverization",
      icon: Settings2 
    },
  ];

  const toggleImplement = (implId) => {
    setSelectedImplements(prev => 
      prev.includes(implId) ? prev.filter(i => i !== implId) : [...prev, implId]
    );
  };

  const applyCombo = (comboType) => {
    if (comboType === 'sowing') {
      const sowingIds = ['rotavator', 'cultivator'];
      const allSelected = sowingIds.every(id => selectedImplements.includes(id));
      if (allSelected) {
        setSelectedImplements(prev => prev.filter(i => !sowingIds.includes(i)));
      } else {
        setSelectedImplements(prev => Array.from(new Set([...prev, ...sowingIds])));
      }
    } else if (comboType === 'harvest') {
      const harvestIds = ['trolley', 'discHarrow'];
      const allSelected = harvestIds.every(id => selectedImplements.includes(id));
      if (allSelected) {
        setSelectedImplements(prev => prev.filter(i => !harvestIds.includes(i)));
      } else {
        setSelectedImplements(prev => Array.from(new Set([...prev, ...harvestIds])));
      }
    }
  };

  const calculateDays = () => {
    if (!pickupDate || !returnDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const diffTime = Math.abs(end - start);
    return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  const days = calculateDays();

  // Multi-Model Unit Rates
  const dailyRate = Number(tractor?.pricePerDay) || Number(tractor?.price) || 1800;
  const acreRate = Number(tractor?.ratePerAcre) || 650;
  const hourRate = Number(tractor?.ratePerHour) || 380;

  // Base Tractor Cost
  let baseTractorCost = dailyRate * days;
  if (billingModel === 'acreage') {
    baseTractorCost = acreRate * acreageCount;
  } else if (billingModel === 'hourly') {
    baseTractorCost = hourRate * engineHours;
  }

  // Driver Cost
  let driverCost = 0;
  if (includeDriver) {
    if (billingModel === 'daily') driverCost = 500 * days;
    else if (billingModel === 'acreage') driverCost = 150 * acreageCount;
    else if (billingModel === 'hourly') driverCost = 60 * engineHours;
  }

  // Implements Cost
  const rawImplementsCost = selectedImplements.reduce((sum, implId) => {
    const found = availableImplements.find(i => i.id === implId);
    if (!found) return sum;
    if (billingModel === 'daily') return sum + (found.price * days);
    if (billingModel === 'acreage') return sum + Math.round(found.price * (acreageCount / 4));
    return sum + Math.round(found.price * (engineHours / 6));
  }, 0);

  // Implement Combo Discount (15% if 2 or more attachments selected)
  const isComboEligible = selectedImplements.length >= 2;
  const comboDiscountAmount = isComboEligible ? Math.round(rawImplementsCost * 0.15) : 0;
  const implementsCost = Math.max(0, rawImplementsCost - comboDiscountAmount);

  // Micro-Insurance Cost (₹99/day or ₹99 flat)
  const insuranceCost = insuranceIncluded ? (billingModel === 'daily' ? 99 * days : 99) : 0;

  // Grand Total
  const grandTotal = baseTractorCost + driverCost + implementsCost + insuranceCost;

  // Handle Calendar date selection
  const handleSelectCalendarDates = (start, end) => {
    setPickupDate(start);
    setReturnDate(end);
  };

  const onOpenCheckout = (e) => {
    e.preventDefault();
    if (!pickupDate || !returnDate) {
      toast.error(language === 'hi' ? 'कृपया प्रारंभ व वापसी की तारीख चुनें' : 'Please select pickup and return dates');
      return;
    }
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setIsPaymentOpen(false);

    const selectedTractorId = tractor?._id || tractor?.id || id;
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(String(selectedTractorId || ''));

    if (!token) {
      openAuthModal('login');
      toast.error(language === 'hi' ? 'बुकिंग शुरू करने के लिए लॉग इन करें' : 'Please log in to continue booking');
      return;
    }

    if (!isValidMongoId) {
      const demoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      const bookingRecord = {
        id: `demo-booking-${Date.now()}`,
        tractor: tractor || { brand: 'Mahindra', model: 'Arjun 605' },
        startDate: pickupDate,
        endDate: returnDate,
        price: grandTotal,
        billingModel,
        acreageCount: billingModel === 'acreage' ? acreageCount : 0,
        engineHours: billingModel === 'hourly' ? engineHours : 0,
        insuranceIncluded,
        insuranceAmount: insuranceCost,
        escrowStatus: 'held',
        isChcCertified: Boolean(tractor?.isChcCertified),
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('demoBookings', JSON.stringify([bookingRecord, ...demoBookings]));
      toast.success(language === 'hi' ? 'बुकिंग अनुरोध सफलतापूर्वक भेजा गया!' : 'Booking request sent successfully!');
      navigate('/mybooking');
      return;
    }

    try {
      const { data } = await axios.post('/api/booking/create', {
        tractorId: selectedTractorId,
        startDate: pickupDate,
        endDate: returnDate,
        price: grandTotal,
        billingModel,
        acreageCount: billingModel === 'acreage' ? acreageCount : 0,
        engineHours: billingModel === 'hourly' ? engineHours : 0,
        insuranceIncluded,
        comboDiscountPercent: isComboEligible ? 15 : 0,
        includeDriver,
        implements: selectedImplements,
        paymentDetails
      });

      if (data.success) {
        toast.success(language === 'hi' ? 'आरक्षण सफलतापूर्वक दर्ज हो गया!' : 'Reservation confirmed successfully!');
        navigate('/mybooking');
      } else {
        toast.error(data.message || (language === 'hi' ? 'आरक्षण पूरा नहीं हुआ' : 'Booking could not be completed'));
      }
    } catch {
      const demoBookings = JSON.parse(localStorage.getItem('demoBookings') || '[]');
      const bookingRecord = {
        id: `demo-booking-${Date.now()}`,
        tractor: tractor || { brand: 'Mahindra', model: 'Arjun 605' },
        startDate: pickupDate,
        endDate: returnDate,
        price: grandTotal,
        billingModel,
        insuranceIncluded,
        escrowStatus: 'held',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('demoBookings', JSON.stringify([bookingRecord, ...demoBookings]));
      toast.success(language === 'hi' ? 'बुकिंग अनुरोध सफलतापूर्वक भेजा गया!' : 'Booking request sent successfully (demo preview)!');
      navigate('/mybooking');
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Namaste! I am interested in renting the ${tractor?.brand || 'Tractor'} ${tractor?.model || ''} in ${tractor?.location || 'Agri Hub'}. Billing Model: ${billingModel.toUpperCase()} (Total: ₹${grandTotal}). Please share machinery availability.`
  );
  const whatsappUrl = `https://wa.me/919876543210?text=${whatsappMessage}`;

  const agriculturalFeatures = [
    language === 'hi' ? "उच्च टॉर्क कृषि इंजन (HP)" : "High Torque Agricultural Engine",
    language === 'hi' ? "हैवी ड्यूटी ड्यूल क्लच प्रणाली" : "Heavy Duty Dual Clutch System",
    language === 'hi' ? "मल्टी-स्पीड 540 रिवर्स पीटीओ" : "Multi-Speed 540 Reverse PTO",
    language === 'hi' ? "स्वचालित ड्राफ्ट व गहराई नियंत्रण" : "Automatic Draft & Depth Control (ADDC)",
    language === 'hi' ? "डिजिटल ऑवर मीटर व जीपीएस ट्रैकिंग" : "Digital Hour Meter & Field Telematics",
    language === 'hi' ? "डीलक्स ऑपरेटर सस्पेंशन सीट" : "Ergonomic Deluxe Operator Seat"
  ];

  return tractor ? (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 antialiased">
      
      {/* Back Button */}
      <button 
        type="button"
        className="inline-flex items-center gap-2 mb-6 text-xs font-semibold text-slate-600 hover:text-blue-700 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs transition-colors cursor-pointer" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="w-4 h-4" />
        <span>{language === 'hi' ? 'सभी ट्रैक्टरों पर वापस जाएं' : 'Back to All Tractors'}</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Left Column (8 Cols): Machinery Info, Specs, Telematics, Implements */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Photo with Functional Badges */}
          <div className="relative h-72 sm:h-96 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
            <img 
              src={tractor.image} 
              alt={`${tractor.brand} ${tractor.model}`}  
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 left-3 flex flex-wrap gap-2">
              <span className="bg-slate-900/90 text-white px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider">
                {tractor.category} • Year {tractor.year}
              </span>
              {tractor.isChcCertified && (
                <span className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded text-xs font-black uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Award className="w-3.5 h-3.5 text-slate-950 fill-current" />
                  <span>CHC / SMAM Subsidized</span>
                </span>
              )}
            </div>

            {tractor.isAvailable && (
              <div className="absolute top-3 right-3 bg-emerald-700 px-2.5 py-1 rounded text-xs font-bold text-white flex items-center gap-1.5 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>{t('availableNow')}</span>
              </div>
            )}
          </div>

          {/* Heading Info & Dynamic Rate Cards */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  {tractor.brand} {tractor.model}
                </h1>
                <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-700 shrink-0" />
                  <span>{tractor.location || "Uttar Pradesh Regional Agri Hub"}</span>
                </p>
              </div>

              <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                <span className="text-[11px] font-semibold uppercase text-slate-400 block">
                  {billingModel === 'daily' ? t('dailyRate') : billingModel === 'acreage' ? (language === 'hi' ? 'प्रति एकड़ दर' : 'Acreage Rate') : (language === 'hi' ? 'प्रति घंटा दर' : 'Hourly Rate')}
                </span>
                <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {currency}
                  {billingModel === 'daily' ? dailyRate : billingModel === 'acreage' ? acreRate : hourRate}
                  <span className="text-xs font-normal text-slate-500">
                    {billingModel === 'daily' ? ` ${t('perDay')}` : billingModel === 'acreage' ? (language === 'hi' ? ' / एकड़' : ' / acre') : (language === 'hi' ? ' / घंटा' : ' / hr')}
                  </span>
                </span>
              </div>
            </div>

            {/* Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-100">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <Users className="w-4 h-4 text-blue-700 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Operator</span>
                <span className="text-xs font-bold text-slate-800">{tractor.seatingCapacity} Driver</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <Fuel className="w-4 h-4 text-blue-700 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Fuel Type</span>
                <span className="text-xs font-bold text-slate-800">{tractor.fuelType}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <Gauge className="w-4 h-4 text-blue-700 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Transmission</span>
                <span className="text-xs font-bold text-slate-800">{tractor.transmission}</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg">
                <MapPin className="w-4 h-4 text-blue-700 mb-1" />
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">District Hub</span>
                <span className="text-xs font-bold text-slate-800 truncate block">{tractor.location}</span>
              </div>
            </div>
          </div>

          {/* Feature 1: Multi-Model Billing Selector (Daily, Acreage, Hourly) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-700" />
                  <span>{language === 'hi' ? 'किराया मॉडल चुनें (Multi-Model Billing)' : 'Select Flexible Rental Model'}</span>
                </h2>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                  {language === 'hi' ? 'किसान हितैषी मूल्य' : 'Farmer-Friendly Pricing'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {language === 'hi'
                  ? 'अपनी आवश्यकता अनुसार दिन, खेत रकबा (एकड़) अथवा इंजन घंटे के आधार पर भुगतान करें:'
                  : 'Pay exactly according to your field requirement: Full Day, Per Acre Tillage, or Engine Meter Hours:'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Daily Model */}
              <div
                onClick={() => setBillingModel('daily')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  billingModel === 'daily'
                    ? 'border-blue-700 bg-blue-50/70 ring-1 ring-blue-700'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-700" />
                    <span>{language === 'hi' ? 'दैनिक किराया' : 'Daily Rental'}</span>
                  </span>
                  {billingModel === 'daily' && <Check className="w-4 h-4 text-blue-700 stroke-[3]" />}
                </div>
                <p className="text-lg font-black text-slate-900">{currency}{dailyRate}<span className="text-xs font-normal text-slate-500"> / {language === 'hi' ? 'दिन' : 'day'}</span></p>
                <p className="text-[11px] text-slate-500 mt-1">{language === 'hi' ? 'बहु-दिवसीय खेत कार्य व ढुलाई हेतु' : 'Full 24-hr machine possession'}</p>
              </div>

              {/* Acreage Model */}
              <div
                onClick={() => setBillingModel('acreage')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  billingModel === 'acreage'
                    ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'hi' ? 'प्रति एकड़ जुताई' : 'Per Acre (रकबा)'}</span>
                  </span>
                  {billingModel === 'acreage' && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                </div>
                <p className="text-lg font-black text-slate-900">{currency}{acreRate}<span className="text-xs font-normal text-slate-500"> / {language === 'hi' ? 'एकड़' : 'acre'}</span></p>
                <p className="text-[11px] text-slate-500 mt-1">{language === 'hi' ? 'जितना खेत जोतें, केवल उतना भुगतान' : 'Pay strictly by land area ploughed'}</p>
              </div>

              {/* Hourly Model */}
              <div
                onClick={() => setBillingModel('hourly')}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  billingModel === 'hourly'
                    ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    <span>{language === 'hi' ? 'इंजन घंटे अनुसार' : 'Engine Hours'}</span>
                  </span>
                  {billingModel === 'hourly' && <Check className="w-4 h-4 text-indigo-600 stroke-[3]" />}
                </div>
                <p className="text-lg font-black text-slate-900">{currency}{hourRate}<span className="text-xs font-normal text-slate-500"> / {language === 'hi' ? 'घंटा' : 'hr'}</span></p>
                <p className="text-[11px] text-slate-500 mt-1">{language === 'hi' ? 'डिजिटल ऑवर मीटर के आधार पर' : 'Calibrated digital meter tracking'}</p>
              </div>
            </div>

            {/* Dynamic Slider/Counter for Acreage or Hourly */}
            {billingModel === 'acreage' && (
              <div className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'hi' ? 'खेत का क्षेत्रफल दर्ज करें (एकड़):' : 'Specify Farm Land Size (in Acres):'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'अनुमानित जुताई समय: ~1.2 घंटा प्रति एकड़' : 'Estimated completion: ~1.2 hours per acre'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAcreageCount(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-black text-base text-slate-900 min-w-[50px] text-center">
                    {acreageCount} {language === 'hi' ? 'एकड़' : 'Acres'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setAcreageCount(prev => Math.min(50, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {billingModel === 'hourly' && (
              <div className="bg-indigo-50/50 border border-indigo-200 rounded-lg p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">
                    {language === 'hi' ? 'आवश्यक इंजन कार्य घंटे दर्ज करें:' : 'Required Engine Working Hours:'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {language === 'hi' ? 'डिजिटल मीटर रीडिंग से सटीक सत्यापन' : 'Verified via IoT live hour telemetry'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEngineHours(prev => Math.max(1, prev - 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span className="font-black text-base text-slate-900 min-w-[50px] text-center">
                    {engineHours} {language === 'hi' ? 'घंटे' : 'Hours'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setEngineHours(prev => Math.min(100, prev + 1))}
                    className="w-8 h-8 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 font-bold text-slate-700 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Feature 2: Live Agronomic Weather & Soil Advisory Card */}
          <div className="bg-gradient-to-r from-amber-50/80 via-blue-50/60 to-emerald-50/80 border border-amber-200/80 rounded-xl p-5 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded border border-amber-300 inline-flex items-center gap-1">
                  <CloudSun className="w-3.5 h-3.5 text-amber-700" />
                  <span>{language === 'hi' ? 'क्षेत्रीय कृषि मौसम सलाहकार' : 'Field Weather & Tillage Advisory'}</span>
                </span>
                <h3 className="text-sm font-bold text-slate-900 pt-1">
                  {tractor.location || "Regional Hub"} • {language === 'hi' ? 'मौसम अनुकूल (Ideal Tillage Window)' : 'Weather Favorable (Clear Skies)'}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'hi' 
                    ? 'वर्तमान मिट्टी नमी 58% है जो रोटावेटर जुताई व रबी/खरीफ बुवाई के लिए पूर्णतः उपयुक्त है। आगामी 48 घंटों में बारिश की संभावना 10% से कम है।' 
                    : 'Soil moisture is at optimal 58% for seedbed rotary tillage and disc aeration. Rain probability < 10% for the next 48 hours.'}
                </p>
              </div>

              <div className="text-right shrink-0 bg-white/80 p-2.5 rounded-lg border border-slate-200">
                <span className="text-xs font-extrabold text-slate-800 block">29°C</span>
                <span className="text-[10px] font-semibold text-emerald-700 flex items-center justify-end gap-1 mt-0.5">
                  <Droplets className="w-3 h-3" /> 58% Moisture
                </span>
              </div>
            </div>
          </div>

          {/* Feature 3: Fleet Telematics & GPS Live Status Card */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                <span>{language === 'hi' ? 'मशीनरी टेलीमैटिक्स व लाइव स्थिति' : 'Fleet Telematics & Live Machine Health'}</span>
              </h2>
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Active & Calibrated</span>
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Digital Hour Meter</span>
                <span className="text-sm font-black text-slate-900 font-mono">
                  {tractor.telematics?.hourMeter || 1248} hrs
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Diesel Fuel Level</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${tractor.telematics?.fuelLevel || 82}%` }}></div>
                  </div>
                  <span className="text-xs font-black text-slate-800">{tractor.telematics?.fuelLevel || 82}%</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Battery Voltage</span>
                <span className="text-sm font-bold text-slate-900">12.8V (Healthy)</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-semibold uppercase text-slate-400 block">Dispatch Hub</span>
                <span className="text-sm font-bold text-slate-900 truncate block">Within 15 km field radius</span>
              </div>
            </div>
          </div>

          {/* Interactive Availability Calendar */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs">
            <div className="mb-4">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>{t('availabilityCalendar')}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'hi' 
                  ? 'कैलेंडर में सीधे क्लिक करके अपनी खेत जुताई व किराए की तारीखें चुनें।' 
                  : 'Click on calendar dates below to pick your rental start and completion period.'}
              </p>
            </div>
            
            <AvailabilityCalendar 
              pickupDate={pickupDate}
              returnDate={returnDate}
              onSelectDates={handleSelectCalendarDates}
              bookedDates={["2026-10-27", "2026-10-28"]}
            />
          </div>

          {/* Feature 4: Implements, Add-ons & Pre-packaged 15% Combos */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-blue-700" />
                  <span>{t('implementsAddons')}</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {language === 'hi' 
                    ? 'ट्रैक्टर के साथ आवश्यक कृषि उपकरण जोड़ें (कॉम्बो पैक पर 15% छूट):' 
                    : 'Bundle verified field attachments (Get 15% discount on combo packages):'}
                </p>
              </div>

              {/* Combo Quick Selectors */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => applyCombo('sowing')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  🌾 {language === 'hi' ? 'बुवाई कॉम्बो (15% छूट)' : 'Sowing Combo (-15%)'}
                </button>
                <button
                  type="button"
                  onClick={() => applyCombo('harvest')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-50 text-blue-800 border border-blue-300 hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  🚛 {language === 'hi' ? 'ढुलाई कॉम्बो (15% छूट)' : 'Haulage Combo (-15%)'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {availableImplements.map((impl) => {
                const isSelected = selectedImplements.includes(impl.id);
                const IconComponent = impl.icon;
                return (
                  <div
                    key={impl.id}
                    onClick={() => toggleImplement(impl.id)}
                    className={`p-3.5 rounded-lg border transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                      isSelected 
                        ? 'border-blue-700 bg-blue-50/60 ring-1 ring-blue-700/50' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className={`p-2 rounded-md ${isSelected ? 'bg-blue-700 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-xs">{impl.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{impl.desc}</p>
                        <p className="text-xs font-bold text-blue-700 mt-1">+{currency}{impl.price} {t('perDay')}</p>
                      </div>
                    </div>

                    <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 mt-0.5 ${
                      isSelected ? 'bg-blue-700 border-blue-700 text-white' : 'border-slate-300 bg-white'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Certified Driver Selector */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-xs sm:text-sm">{t('needDriver')}</h3>
                  <p className="text-[11px] text-slate-500">{t('driverDesc')}</p>
                  <span className="text-xs font-bold text-emerald-700 block mt-0.5">
                    {billingModel === 'daily' ? `+${currency}500 / day` : billingModel === 'acreage' ? `+${currency}150 / acre` : `+${currency}60 / hr`}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input 
                  type="checkbox" 
                  checked={includeDriver} 
                  onChange={e => setIncludeDriver(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-700"></div>
              </label>
            </div>

            {/* Feature 5: Field & Transit Micro-Insurance Protection */}
            <div className="p-3.5 bg-emerald-50/60 rounded-lg border border-emerald-200 flex items-center justify-between">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {language === 'hi' ? 'खेत एवं पारगमन सूक्ष्म-बीमा (Agri Micro-Insurance)' : 'Field & Transit Micro-Insurance'}
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase bg-emerald-200 text-emerald-900 px-1.5 py-0.5 rounded">
                      Zero Liability
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    {language === 'hi' 
                      ? 'टायर पंचर, हाइड्रोलिक लीकेज, डीजल संदूषण व अप्रत्याशित उपकरण खराबी पर पूर्ण कवरेज।' 
                      : 'Comprehensive coverage for tyre puncture, hydraulic burst, diesel contamination, and attachment wear.'}
                  </p>
                  <span className="text-xs font-bold text-emerald-800 block mt-1">
                    +{currency}{billingModel === 'daily' ? `99 × ${days} d` : '99 flat'}
                  </span>
                </div>
              </div>

              <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                <input 
                  type="checkbox" 
                  checked={insuranceIncluded} 
                  onChange={e => setInsuranceIncluded(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

          </div>

          {/* Tractor Technical Description */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-2">
            <h2 className="text-base font-bold text-slate-900">{t('tractorOverview')}</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {tractor.description || "The " + tractor.brand + " " + tractor.model + " is engineered for superior agricultural performance in Indian soil conditions. Built with high fuel efficiency, robust drawbar pull, and seamless compatibility with standard multi-crop agricultural implements."}
            </p>
          </div>

          {/* Machinery Equipment Checklist */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs space-y-3">
            <h2 className="text-base font-bold text-slate-900">{t('featuresEquipment')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {agriculturalFeatures.map((item) => (
                <div key={item} className="flex items-center gap-2 text-xs font-medium text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column (4 Cols): Sticky Booking & Cost Summary Box */}
        <div className="lg:col-span-4 bg-white rounded-xl p-5 sm:p-6 border border-slate-300 shadow-sm sticky top-24 space-y-5">
          <div className="flex items-baseline justify-between pb-3.5 border-b border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {billingModel.toUpperCase()} RENTAL RATE
              </span>
              <div className="text-2xl font-black text-slate-900">
                {currency}
                {billingModel === 'daily' ? dailyRate : billingModel === 'acreage' ? acreRate : hourRate}
                <span className="text-xs font-normal text-slate-500">
                  {billingModel === 'daily' ? ` ${t('perDay')}` : billingModel === 'acreage' ? ' / acre' : ' / hr'}
                </span>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              Verified Machine
            </span>
          </div>

          <form onSubmit={onOpenCheckout} className="space-y-4">
            
            {/* Start Date */}
            <div>
              <label htmlFor="Pickup-date" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-700" />
                <span>{t('pickupDate')}</span>
              </label>
              <input 
                id="Pickup-date"
                type="date" 
                value={pickupDate} 
                onChange={(e) => setPickupDate(e.target.value)} 
                min={new Date().toISOString().split('T')[0]} 
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-700 font-medium cursor-pointer"
                required 
              />
            </div>

            {/* End Date */}
            <div>
              <label htmlFor="return-date" className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-700" />
                <span>{t('returnDate')}</span>
              </label>
              <input 
                id="return-date"
                type="date" 
                value={returnDate} 
                onChange={(e) => setReturnDate(e.target.value)} 
                min={pickupDate || new Date().toISOString().split('T')[0]} 
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-700 font-medium cursor-pointer"
                required 
              />
            </div>

            {/* Real-Time Cost Breakdown */}
            <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>
                  Base Machine (
                  {billingModel === 'daily'
                    ? `${currency}${dailyRate} × ${days} d`
                    : billingModel === 'acreage'
                    ? `${currency}${acreRate} × ${acreageCount} ac`
                    : `${currency}${hourRate} × ${engineHours} hrs`}
                  )
                </span>
                <span className="font-semibold text-slate-900">{currency}{baseTractorCost}</span>
              </div>

              {includeDriver && (
                <div className="flex justify-between text-slate-600">
                  <span>Driver Assistance</span>
                  <span className="font-semibold text-slate-900">+{currency}{driverCost}</span>
                </div>
              )}

              {selectedImplements.length > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Attachments ({selectedImplements.length} items)</span>
                  <span className="font-semibold text-slate-900">+{currency}{rawImplementsCost}</span>
                </div>
              )}

              {comboDiscountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Implement Combo Bundle (-15%)</span>
                  <span>-{currency}{comboDiscountAmount}</span>
                </div>
              )}

              {insuranceIncluded && (
                <div className="flex justify-between text-slate-600">
                  <span>Agri Micro-Insurance</span>
                  <span className="font-semibold text-emerald-700">+{currency}{insuranceCost}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600">
                <span>Field Delivery & Transit</span>
                <span className="font-semibold text-emerald-700">FREE</span>
              </div>

              <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-sm text-slate-900">
                <span>Total Amount:</span>
                <span className="text-blue-700 font-black text-lg">{currency}{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Checkout / Pay CTA */}
            <button 
              type="submit"
              className="w-full py-3 px-4 bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs uppercase tracking-wider rounded-lg shadow-xs transition-colors cursor-pointer flex items-center justify-center gap-2 mt-2"
            >
              <span>{t('instantReserve')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Feature 6: WhatsApp Inquiry Hotline */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2 text-center"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{language === 'hi' ? 'व्हाट्सएप पर तुरंत पूछताछ करें' : 'WhatsApp Fleet Inquiry'}</span>
            </a>

            {/* Feature 7: Agri Escrow Guarantee Trust Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-lg p-2.5 text-center space-y-1">
              <p className="text-[11px] font-bold text-emerald-900 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 inline shrink-0" />
                <span>{language === 'hi' ? 'सुरक्षित कृषि एस्क्रो गारंटी' : 'Agri Escrow Guarantee'}</span>
              </p>
              <p className="text-[10px] text-emerald-800 leading-tight">
                {language === 'hi' 
                  ? 'भुगतान सुरक्षित एस्क्रो में रहता है। खेत कार्य सत्यापन के बाद ही राशि रिलीज होगी।'
                  : 'Funds remain locked in digital escrow until you verify field completion.'}
              </p>
            </div>

          </form>
        </div>

      </div>

      {/* Feature 3: Payment Gateway Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onPaymentSuccess={handlePaymentSuccess}
        bookingDetails={{
          tractor,
          days,
          totalAmount: grandTotal,
          pickupDate,
          returnDate,
          includeDriver,
          selectedImplements,
          billingModel,
          acreageCount,
          engineHours,
          insuranceIncluded,
          insuranceAmount: insuranceCost
        }}
      />
        
    </div>
  ) : <Loader />
}

export default TractorDetails;
