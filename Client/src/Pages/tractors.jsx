import { useCallback, useEffect, useState, useMemo } from "react";
import { toast } from "react-hot-toast";
import CarCards from "../Components/CarCards";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { ArrowRight, CheckCircle2, MapPin, Search, SlidersHorizontal, Sparkles, Tractor, RotateCcw, Star } from "lucide-react";
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES } from "../constants/equipment";
import { getLocations } from "../api/locationApi";
import SearchableSelect from "../Components/SearchableSelect";
import VoiceSearchButton from "../Components/VoiceSearchButton";

const Tractors = () => {
  const [searchParams] = useSearchParams();
  const pickupLocation = searchParams.get('pickupLocation');
  const pickupDate = searchParams.get('pickupDate');
  const returnDate = searchParams.get('returnDate');

  const { tractors, axios, language = 'en', t, currency = '₹' } = useAppContext();
  const isSearchData = Boolean(pickupLocation && pickupDate && returnDate);
  const searchQueryParam = searchParams.get('search') || '';
  const [availableTractors, setAvailableTractors] = useState([]);
  const [input, setInput] = useState(searchQueryParam);
  const [selectedBrand, setSelectedBrand] = useState("all");
  const [onlyChc, setOnlyChc] = useState(false);
  const [filters, setFilters] = useState({ category: '', type: '', stateId: '', districtId: '', blockId: '', villageId: '', minPrice: '', maxPrice: '' });
  const [locationOptions, setLocationOptions] = useState({ states: [], districts: [], blocks: [], villages: [] });
  const [locationLoading, setLocationLoading] = useState({ states: false, districts: false, blocks: false, villages: false });

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
          toast(language === 'hi' ? "सभी क्षेत्रीय फ्लीट ट्रैक्टर दिखाए जा रहे हैं" : "Showing all regional fleet tractors");
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

  useEffect(() => {
    let active = true;
    setLocationLoading((current) => ({ ...current, states: true }));
    getLocations(axios, 'states')
      .then((states) => { if (active) setLocationOptions((current) => ({ ...current, states })); })
      .catch(() => {})
      .finally(() => { if (active) setLocationLoading((current) => ({ ...current, states: false })); });
    return () => { active = false; };
  }, [axios]);

  useEffect(() => {
    if (!filters.stateId) { setLocationOptions((current) => ({ ...current, districts: [] })); return undefined; }
    let active = true;
    setLocationLoading((current) => ({ ...current, districts: true }));
    getLocations(axios, 'districts', filters.stateId)
      .then((districts) => { if (active) setLocationOptions((current) => ({ ...current, districts })); })
      .catch(() => { if (active) setLocationOptions((current) => ({ ...current, districts: [] })); })
      .finally(() => { if (active) setLocationLoading((current) => ({ ...current, districts: false })); });
    return () => { active = false; };
  }, [axios, filters.stateId]);

  useEffect(() => {
    if (!filters.districtId) { setLocationOptions((current) => ({ ...current, blocks: [] })); return undefined; }
    let active = true;
    setLocationLoading((current) => ({ ...current, blocks: true }));
    getLocations(axios, 'blocks', filters.districtId)
      .then((blocks) => { if (active) setLocationOptions((current) => ({ ...current, blocks })); })
      .catch(() => { if (active) setLocationOptions((current) => ({ ...current, blocks: [] })); })
      .finally(() => { if (active) setLocationLoading((current) => ({ ...current, blocks: false })); });
    return () => { active = false; };
  }, [axios, filters.districtId]);

  useEffect(() => {
    if (!filters.blockId) { setLocationOptions((current) => ({ ...current, villages: [] })); return undefined; }
    let active = true;
    setLocationLoading((current) => ({ ...current, villages: true }));
    getLocations(axios, 'villages', filters.blockId)
      .then((villages) => { if (active) setLocationOptions((current) => ({ ...current, villages })); })
      .catch(() => { if (active) setLocationOptions((current) => ({ ...current, villages: [] })); })
      .finally(() => { if (active) setLocationLoading((current) => ({ ...current, villages: false })); });
    return () => { active = false; };
  }, [axios, filters.blockId]);

  const brands = ["all", "Mahindra", "Massey Ferguson", "Swaraj", "John Deere", "Sonalika", "ACE"];

  const displayedTractors = useMemo(() => {
    const list = availableTractors;
    const query = input.trim().toLowerCase();

    return list.filter((tractor) => {
      const matchesBrand = selectedBrand === "all" ||
        (tractor.brand || "").toLowerCase().includes(selectedBrand.toLowerCase());

      const matchesSearch = !query || [
        tractor.brand,
        tractor.model,
        tractor.category,
        tractor.type,
        tractor.transmission,
        tractor.fuelType,
        tractor.location,
        tractor.stateName,
        tractor.districtName,
        tractor.blockName,
        tractor.villageName,
      ].some((value) => value?.toLowerCase().includes(query));

      const price = Number(tractor.rentalPrice ?? tractor.pricePerDay ?? 0);
      const matchesEquipment = !filters.category || tractor.category === filters.category;
      const matchesType = !filters.type || tractor.type === filters.type;
      const matchesState = !filters.stateId || String(tractor.stateId) === filters.stateId;
      const matchesDistrict = !filters.districtId || String(tractor.districtId) === filters.districtId;
      const matchesBlock = !filters.blockId || String(tractor.blockId) === filters.blockId;
      const matchesVillage = !filters.villageId || String(tractor.villageId) === filters.villageId;
      const matchesMinPrice = !filters.minPrice || price >= Number(filters.minPrice);
      const matchesMaxPrice = !filters.maxPrice || price <= Number(filters.maxPrice);
      const matchesChc = !onlyChc || tractor.isChcCertified !== false;

      return matchesBrand && matchesSearch && matchesEquipment && matchesType && matchesState && matchesDistrict && matchesBlock && matchesVillage && matchesMinPrice && matchesMaxPrice && matchesChc;
    });
  }, [availableTractors, input, selectedBrand, filters, onlyChc]);

  const stats = [
    { label: language === 'hi' ? 'वेरिफ़ाइड मशीनें' : 'Verified machines', value: '2,500+' },
    { label: language === 'hi' ? 'जिला कवरेज' : 'District coverage', value: '18+' },
    { label: language === 'hi' ? 'सुविधा' : 'Support', value: '24/7' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f7fb] pb-20 antialiased">
      <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[30px] border border-[#e7ebf0] bg-[radial-gradient(circle_at_top_left,_rgba(22,163,74,0.10),_transparent_25%),linear-gradient(135deg,#ffffff_0%,#f7fafc_100%)] shadow-[0_24px_55px_rgba(15,23,42,0.08)]">
          <div className="grid gap-8 px-5 py-6 sm:px-8 lg:grid-cols-[1.2fr_0.8fr] lg:px-10 lg:py-10">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-700">
                <Sparkles className="h-3.5 w-3.5" />
                {language === 'hi' ? 'प्रमाणित फील्ड इक्विपमेंट' : 'Verified field equipment'}
              </div>

              <h1 className="max-w-[620px] text-3xl font-black leading-[1] tracking-[-0.06em] text-slate-900 sm:text-4xl lg:text-5xl">
                {language === 'hi' ? 'हर खेत के लिए सही ट्रैक्टर चुनें' : 'Choose the right tractor for every field'}
              </h1>

              <p className="mt-4 max-w-[600px] text-sm leading-7 text-slate-600 sm:text-base">
                {language === 'hi'
                  ? 'सत्यापित ट्रैक्टर, स्पष्ट किराया, और बेहतर फील्ड सपोर्ट के साथ अपनी खेती की ज़रूरतों के अनुसार सही मशीन खोजें।'
                  : 'Find verified tractors, transparent daily pricing, and field-ready support for planting, harvesting, and seasonal operations.'}
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => window.scrollTo({ top: document.body.scrollHeight * 0.3, behavior: 'smooth' })}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  {language === 'hi' ? 'किराया देखें' : 'Browse Rentals'}
                  <ArrowRight className="h-4 w-4" />
                </button>

                <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  {language === 'hi' ? 'प्रीमियम सपोर्ट' : 'Premium support'}
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
                      {language === 'hi' ? 'सदस्यता' : 'Fleet status'}
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
                  placeholder={language === 'hi' ? "ब्रांड, मॉडल, जिला..." : "Brand, model, district or specs..."}
                  className="w-full border-0 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {input && (
                  <button
                    type="button"
                    onClick={() => setInput("")}
                    className="ml-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
                  >
                    Clear
                  </button>
                )}
                <VoiceSearchButton onResult={(text) => setInput(text)} className="ml-1" />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOnlyChc(!onlyChc)}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all ${
                    onlyChc
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span>🏛️ {language === 'hi' ? 'CHC सरकारी फ्लीट' : 'CHC Subsidized Fleet'}</span>
                </button>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                  <MapPin className="h-4 w-4 text-emerald-600" />
                  <span>{pickupLocation || (language === 'hi' ? 'सभी क्षेत्र' : 'All regions')}</span>
                </div>
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

          <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SearchableSelect
              id="market-category"
              label="Equipment Category"
              options={EQUIPMENT_CATEGORIES.map((name) => ({ name, value: name }))}
              value={filters.category}
              placeholder="All categories"
              optionLabel={(option) => option.name}
              optionValue={(option) => option.value}
              onChange={(option) => setFilters((current) => ({ ...current, category: option.value, type: '' }))}
            />
            <SearchableSelect
              id="market-type"
              label="Equipment Type"
              options={(EQUIPMENT_TYPES[filters.category] || []).map((name) => ({ name, value: name }))}
              value={filters.type}
              disabled={!filters.category}
              placeholder={filters.category ? 'All types' : 'Choose a category first'}
              optionLabel={(option) => option.name}
              optionValue={(option) => option.value}
              onChange={(option) => setFilters((current) => ({ ...current, type: option.value }))}
            />
            <SearchableSelect id="market-state" label="State" options={locationOptions.states} value={filters.stateId} loading={locationLoading.states} placeholder="All states" onChange={(option) => setFilters((current) => ({ ...current, stateId: option._id, districtId: '', blockId: '', villageId: '' }))} />
            <SearchableSelect id="market-district" label="District" options={locationOptions.districts} value={filters.districtId} disabled={!filters.stateId} loading={locationLoading.districts} placeholder="All districts" onChange={(option) => setFilters((current) => ({ ...current, districtId: option._id, blockId: '', villageId: '' }))} />
            <SearchableSelect id="market-block" label="Block / Tehsil" options={locationOptions.blocks} value={filters.blockId} disabled={!filters.districtId} loading={locationLoading.blocks} placeholder="All blocks" onChange={(option) => setFilters((current) => ({ ...current, blockId: option._id, villageId: '' }))} />
            <SearchableSelect id="market-village" label="Village" options={locationOptions.villages} value={filters.villageId} disabled={!filters.blockId} loading={locationLoading.villages} placeholder="All villages" onChange={(option) => setFilters((current) => ({ ...current, villageId: option._id }))} />
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Price Range ({currency})</label>
              <div className="grid grid-cols-2 gap-2">
                <input type="number" min="0" value={filters.minPrice} onChange={(event) => setFilters((current) => ({ ...current, minPrice: event.target.value }))} placeholder="Minimum" aria-label="Minimum rental price" className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-600 focus:bg-white" />
                <input type="number" min="0" value={filters.maxPrice} onChange={(event) => setFilters((current) => ({ ...current, maxPrice: event.target.value }))} placeholder="Maximum" aria-label="Maximum rental price" className="min-h-11 min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm outline-none focus:border-emerald-600 focus:bg-white" />
              </div>
            </div>
            <button type="button" onClick={() => { setFilters({ category: '', type: '', stateId: '', districtId: '', blockId: '', villageId: '', minPrice: '', maxPrice: '' }); setInput(''); setSelectedBrand('all') }} className="min-h-11 self-end rounded-xl border border-slate-200 px-4 text-xs font-bold text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800">Reset equipment filters</button>
          </div>
        </section>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-slate-600">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <p className="text-sm font-semibold">
              {language === 'hi' ? 'उपलब्ध ट्रैक्टर' : 'Available tractors'}
              <span className="ml-2 font-black text-slate-900">{displayedTractors.length}</span>
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
            <CheckCircle2 className="h-3.5 w-3.5" />
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
              onClick={() => { setInput(""); setSelectedBrand("all"); }}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <RotateCcw className="h-4 w-4" />
              {language === 'hi' ? 'फिल्टर रीसेट करें' : 'Reset filters'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tractors;
