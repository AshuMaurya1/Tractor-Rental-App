import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, CircleDollarSign, MapPin, Search, SlidersHorizontal, Sparkles, Star, Tractor } from 'lucide-react';
import CarCards from '../Components/CarCards';
import { useAppContext } from '../context/AppContext';

const ExploreTractors = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get('pickupLocation');
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');

  const { tractors, axios, language = 'en', t } = useAppContext();
  const isSearchData = Boolean(pickupLocation && pickupDate && returnDate);

  const [availableTractors, setAvailableTractors] = useState([]);
  const [input, setInput] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');

  const searchTractorsAvailability = useCallback(async () => {
    try {
      const { data } = await axios.post('/api/booking/check-availability', {
        location: pickupLocation,
        startDate: pickupDate,
        endDate: returnDate,
      });

      if (data.success) {
        setAvailableTractors(data.availableTractors || []);
        if (data.availableTractors?.length === 0) {
          toast(language === 'hi' ? 'सभी क्षेत्रीय ट्रैक्टर दिखाए जा रहे हैं' : 'Showing regional fleet tractors');
        }
      } else {
        setAvailableTractors([]);
      }
    } catch {
      setAvailableTractors([]);
    }
  }, [axios, pickupLocation, pickupDate, returnDate, language]);

  useEffect(() => {
    if (isSearchData) {
      searchTractorsAvailability();
    } else {
      setAvailableTractors((tractors || []).filter((tractor) => tractor.status === 'approved' || !tractor.status));
    }
  }, [isSearchData, searchTractorsAvailability, tractors]);

  const brands = ['all', 'Mahindra', 'Massey Ferguson', 'Swaraj', 'John Deere', 'Sonalika', 'ACE'];

  const displayedTractors = useMemo(() => {
    const list = availableTractors;
    const query = input.trim().toLowerCase();

    return list.filter((tractor) => {
      const matchesBrand = selectedBrand === 'all' || (tractor.brand || '').toLowerCase().includes(selectedBrand.toLowerCase());
      const matchesSearch = !query || [
        tractor.brand,
        tractor.model,
        tractor.category,
        tractor.transmission,
        tractor.fuelType,
        tractor.location,
      ].some((value) => value?.toLowerCase().includes(query));

      return matchesBrand && matchesSearch;
    });
  }, [availableTractors, input, selectedBrand]);

  const stats = [
    { label: language === 'hi' ? 'प्रमाणित ट्रैक्टर' : 'Verified tractors', value: '2,500+' },
    { label: language === 'hi' ? 'जिला कवरेज' : 'District reach', value: '18+' },
    { label: language === 'hi' ? 'औसत किराया' : 'Average rate', value: '₹1,400/day' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-20 antialiased">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[#e7ebf0] bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.10),_transparent_25%),linear-gradient(135deg,#ffffff_0%,#f7fafc_100%)] shadow-[0_24px_55px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {language === 'hi' ? 'प्रीमियम फील्ड एसेट' : 'Premium field assets'}
              </div>

              <h1 className="max-w-[620px] text-3xl font-black leading-[1] tracking-[-0.06em] text-slate-900 sm:text-4xl lg:text-5xl">
                {language === 'hi' ? 'अपना अगला ट्रैक्टर अभी चुनें' : 'Find the right tractor for your next job'}
              </h1>

              <p className="mt-4 max-w-[600px] text-sm leading-7 text-slate-600 sm:text-base">
                {language === 'hi'
                  ? 'प्रमाणित कृषि मशीनरी, स्पष्ट किराया और खेत-तैयारी सहायता के साथ अपने क्षेत्र की आवश्यकता के लिए सही ट्रैक्टर देखें।'
                  : 'Compare verified farm machinery, check daily rental pricing, and book the right tractor for your crop cycle or seasonal demand.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <a href="#tractor-list" className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800">
                  {language === 'hi' ? 'किराया देखें' : 'Browse tractors'}
                  <ArrowRight className="h-4 w-4" />
                </a>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {language === 'hi' ? 'फ्लाइट सपोर्ट' : 'Fleet support'}
                </div>
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-2xl font-black tracking-[-0.06em] text-slate-900">{item.value}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_18px_35px_rgba(15,23,42,0.08)]">
                <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-50 p-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                      {language === 'hi' ? 'समीक्षा' : 'Fleet status'}
                    </p>
                    <p className="mt-1 text-lg font-black text-slate-900">{displayedTractors.length}+ ready</p>
                  </div>
                  <div className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
                    Live
                  </div>
                </div>

                <div className="rounded-[22px] bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-3">
                  <img
                    src="https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?auto=format&fit=crop&w=900&q=80"
                    alt="Tractor field"
                    className="h-60 w-full rounded-[18px] object-cover"
                  />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {[
                    ['55 HP', 'Power'],
                    ['Daily', 'Rental'],
                    ['24/7', 'Support'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-center">
                      <div className="text-base font-black tracking-[-0.05em] text-slate-900">{value}</div>
                      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">{label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_35px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-slate-700">
              <SlidersHorizontal className="h-4 w-4 text-slate-500" />
              <span className="text-sm font-semibold">{language === 'hi' ? 'फिल्टर & सर्च' : 'Filter & Search'}</span>
            </div>

            <div className="flex flex-1 flex-col gap-3 lg:max-w-[980px] lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-1 items-center rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 focus-within:border-slate-400 focus-within:bg-white">
                <Search className="mr-2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={language === 'hi' ? 'ब्रांड, मॉडल, जिला...' : 'Brand, model, district or specs...'}
                  className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput('')}
                    className="ml-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <span>{pickupLocation || (language === 'hi' ? 'सभी क्षेत्र' : 'All regions')}</span>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-2">
            {brands.map((brand) => (
              <button
                type="button"
                key={brand}
                onClick={() => setSelectedBrand(brand)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition ${
                  selectedBrand === brand
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {brand === 'all' ? t('allMakes') : brand}
              </button>
            ))}
          </div>
        </section>

        <div id="tractor-list" className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <p className="text-sm font-semibold">
              {language === 'hi' ? 'उपलब्ध ट्रैक्टर' : 'Available tractors'}
              <span className="ml-2 font-black text-slate-900">{displayedTractors.length}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <CircleDollarSign className="h-3.5 w-3.5" />
            {t('payInRupees')}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {displayedTractors.map((tractor, index) => (
            <CarCards key={tractor._id || tractor.id || index} tractor={tractor} />
          ))}
        </div>

        {displayedTractors.length === 0 && (
          <div className="mx-auto my-10 max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-sm">
            <Tractor className="mx-auto mb-4 h-12 w-12 text-slate-300" />
            <h3 className="text-lg font-black tracking-[-0.04em] text-slate-900">
              {language === 'hi' ? 'कोई मेल खाता ट्रैक्टर नहीं मिला' : 'No matching tractors found'}
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {language === 'hi'
                ? 'कृपया ब्रांड या फ़िल्टर बदलें और फिर से खोजें।'
                : 'Try adjusting the filter or resetting the search to discover more equipment.'}
            </p>
            <button
              type="button"
              onClick={() => { setInput(''); setSelectedBrand('all'); }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Search className="h-4 w-4" />
              {language === 'hi' ? 'फिल्टर रीसेट करें' : 'Reset filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreTractors;
