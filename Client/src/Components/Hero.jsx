import { useState } from 'react'
import { assets, cityList } from '../assets/assets'
import { useAppContext } from '../context/AppContext'
import { ArrowRight, Calendar, Check, Clock, MapPin, Search, Star, Tractor } from 'lucide-react'

const Hero = () => {
  const [pickupLocation, setPickupLocation] = useState('')
  const { pickupDate, setPickupDate, returnDate, setReturnDate, navigate, currency = '₹', language = 'en' } = useAppContext()

  const handleSearch = (e) => {
    e.preventDefault()
    const searchParams = new URLSearchParams({
      pickupLocation,
      pickupDate,
      returnDate,
    })
    navigate(`/tractor?${searchParams.toString()}`)
  }

  return (
    <section className='relative min-h-[72vh] overflow-hidden bg-[#f7f2ea]'>
      <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(120,119,198,0.08),transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,197,94,0.08),transparent_32%)]' />

      <div className='relative mx-auto flex min-h-[72vh] max-w-[1260px] items-center px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10'>
        <div className='grid w-full items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]'>
          <div className='space-y-7'>
            <div className='inline-flex items-center gap-2 rounded-full border border-[#d9c4a4] bg-[#fffaf4] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-[#214d38] shadow-sm backdrop-blur-sm'>
              <Tractor className='h-3.5 w-3.5 text-[#b66a1f]' />
              {language === 'hi' ? 'उत्तर प्रदेश कृषि किराया' : 'Helping farmers move faster'}
            </div>

            <div className='space-y-4'>
              <h1 className='max-w-[620px] text-[3rem] font-black leading-[0.9] tracking-[-0.06em] text-[#1f2a1a] sm:text-[4rem] lg:text-[5.1rem]'>
                Need a tractor?
                <span className='block text-[#295a40]'>We’ll help you book it quickly.</span>
              </h1>

              <p className='max-w-[600px] text-base leading-7 text-slate-600 sm:text-lg'>
                {language === 'hi'
                  ? 'सत्यापित कृषि ट्रैक्टर, रोटावेटर और हार्वेस्टर किराए पर लें। भरोसेमंद दरें, तुरंत उपलब्धता और खेत तक डिलीवरी।'
                  : 'From plowing to harvest, get the right tractor for your field with simple pricing, verified machines, and support from people who understand farming.'}
              </p>
            </div>

            <div className='flex flex-wrap items-center gap-3 text-sm text-slate-700'>
              {[
                'No deposit',
                'Daily pricing',
                'Verified equipment',
              ].map((item) => (
                <div key={item} className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm'>
                  <Check className='h-4 w-4 text-emerald-600' />
                  <span className='font-medium'>{item}</span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSearch} className='max-w-[660px] rounded-[26px] border border-slate-200 bg-white p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)] sm:p-5'>
              <div className='grid grid-cols-1 gap-3.5 sm:grid-cols-3'>
                <div>
                  <label className='mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
                    {language === 'hi' ? 'डिलीवरी हब' : 'Delivery hub'}
                  </label>
                  <div className='relative'>
                    <MapPin className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
                    <select
                      value={pickupLocation}
                      onChange={(e) => setPickupLocation(e.target.value)}
                      className='w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-2 text-sm text-slate-800 outline-none transition focus:border-blue-600'
                    >
                      <option value=''>{language === 'hi' ? 'जिला चुनें' : 'Select district'}</option>
                      {cityList.map((city) => (
                        <option value={city.name} key={city.name}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor='pickup-date' className='mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
                    {language === 'hi' ? 'किराया शुरू' : 'Rental start'}
                  </label>
                  <div className='relative'>
                    <Calendar className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
                    <input
                      id='pickup-date'
                      type='date'
                      value={pickupDate}
                      onChange={(e) => setPickupDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-2 text-sm text-slate-800 outline-none transition focus:border-blue-600'
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor='return-date' className='mb-1.5 block text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500'>
                    {language === 'hi' ? 'किराया समाप्त' : 'Rental end'}
                  </label>
                  <div className='relative'>
                    <Clock className='absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
                    <input
                      id='return-date'
                      type='date'
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      className='w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-2 text-sm text-slate-800 outline-none transition focus:border-blue-600'
                      required
                    />
                  </div>
                </div>
              </div>

              <button
                type='submit'
                className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f4d3a] px-5 py-3 text-[13px] font-bold uppercase tracking-[0.08em] text-white transition-colors hover:bg-[#163f2d]'
              >
                <Search className='h-4 w-4' />
                {language === 'hi' ? 'ट्रैक्टर खोजें' : 'Find my tractor'}
              </button>
            </form>

            <div className='flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:gap-6'>
              <div className='flex items-center gap-2 text-sm font-medium text-slate-700'>
                <Star className='h-4 w-4 fill-amber-400 text-amber-400' />
                4.9/5 farmers rating
              </div>
              <div className='text-sm font-medium text-slate-700'>2,500+ seasonal bookings</div>
            </div>
          </div>

          <div className='relative'>
            <div className='rounded-[30px] border border-slate-200 bg-white p-3 shadow-[0_20px_50px_rgba(15,23,42,0.12)] sm:p-4'>
              <div className='relative overflow-hidden rounded-[24px] border border-slate-200 bg-[#dfe5de]'>
                <img
                  src={assets.Ace || assets.download2}
                  alt='ACE 60HP tractor'
                  className='h-[320px] w-full object-cover sm:h-[360px]'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/0 to-transparent' />

                <div className='absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-700 shadow-sm'>
                  Ready to dispatch
                </div>
                <div className='absolute right-4 top-4 rounded-full bg-emerald-500 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-white shadow-sm'>
                  Live inventory
                </div>
              </div>

              <div className='p-4 sm:p-5'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500'>ACE 60HP Heavy Duty 4WD</p>
                    <p className='mt-2 text-sm text-slate-600'>Perfect for plowing, rotavator work, and haulage across field operations.</p>
                  </div>
                  <div className='text-right'>
                    <div className='text-2xl font-black text-slate-900'>{currency}1,800</div>
                    <div className='text-[11px] text-slate-500'>per day</div>
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-3 gap-2'>
                  {[
                    ['Power', '60 HP'],
                    ['PTO', '540 Dual'],
                    ['Hub', 'Sonbhadra'],
                  ].map(([label, value]) => (
                    <div key={label} className='rounded-xl border border-slate-200 bg-slate-50 p-2.5 text-center'>
                      <div className='text-[10px] uppercase tracking-[0.12em] text-slate-400'>{label}</div>
                      <div className='mt-1 text-sm font-bold text-slate-800'>{value}</div>
                    </div>
                  ))}
                </div>

                <button
                  type='button'
                  onClick={() => navigate('/tractor')}
                  className='mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-[12px] font-bold uppercase tracking-[0.08em] text-slate-800 transition-colors hover:bg-slate-200'
                >
                  {language === 'hi' ? 'सभी 24+ ट्रैक्टर देखें' : 'View all 24+ tractors'}
                  <ArrowRight className='h-3.5 w-3.5' />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
