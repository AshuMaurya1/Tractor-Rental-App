import { assets } from '../assets/assets'
import { Link } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ArrowRight, ShieldCheck, Tractor } from 'lucide-react'

const Banner = () => {
  const { currency = "₹", language = 'en' } = useAppContext();

  return (
    <section className='my-12 max-w-7xl mx-4 sm:mx-6 lg:mx-auto antialiased'>
      <div className='bg-slate-900 rounded-xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-8 border border-slate-800 shadow-sm'>
        
        <div className='max-w-xl text-left space-y-3.5'>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
            <Tractor className="w-3.5 h-3.5 text-blue-400" />
            <span>{language === 'hi' ? 'कस्टम हायरिंग पार्टनर प्रोग्राम' : 'Custom Hiring Partner Program'}</span>
          </div>

          <h2 className='text-2xl sm:text-3xl font-extrabold tracking-tight leading-snug'>
            {language === 'hi' 
              ? 'क्या आपके पास कृषि ट्रैक्टर या उपकरण हैं?' 
              : 'Do You Own an Agricultural Tractor or Implements?'}
          </h2>

          <p className='text-xs sm:text-sm text-slate-300 leading-relaxed'>
            {language === 'hi'
              ? `अपने खाली पड़े ट्रैक्टर को लिस्ट करके मौसमी जुताई व कटाई के दौरान प्रति माह ${currency}35,000 से ${currency}80,000 तक अतिरिक्त आय कमाएं।`
              : `Monetize your idle farm machinery during seasonal field operations. Earn between ${currency}35,000 to ${currency}80,000/month with zero hassle and verified renters.`}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 
              <span>{language === 'hi' ? 'सत्यापित किसान किराएदार' : 'Verified Farmer Renters'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" /> 
              <span>{language === 'hi' ? 'दैनिक बैंक भुगतान' : 'Guaranteed Daily Bank Payouts'}</span>
            </span>
          </div>

          <div className="pt-2">
            <Link to='/owner/add-tractor'>
              <button 
                type="button"
                className='inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-colors cursor-pointer'
              >
                <span>{language === 'hi' ? 'अपना ट्रैक्टर लिस्ट करें' : 'List Your Machinery'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>

        <div className='shrink-0 w-full md:w-auto flex justify-center'>
          <img 
            src={assets.Banner1} 
            alt="Agricultural Tractor Fleet" 
            className='max-h-52 rounded-lg object-cover border border-slate-700' 
          />
        </div>

      </div>
    </section>
  )
}

export default Banner
