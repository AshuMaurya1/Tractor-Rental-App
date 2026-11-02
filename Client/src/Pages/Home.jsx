import Hero from '../Components/Hero';
import FeatureSection from '../Components/FeatureSection';
import Banner from '../Components/Banner';
import Testimonial from '../Components/Testimonial';
import NewLetter from '../Components/NewLetter';
import { useAppContext } from '../context/AppContext';
import { ShieldCheck, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Home = () => {
  const { language = 'en' } = useAppContext();

  const benefits = [
    {
      title: language === 'hi' ? 'सत्यापित कृषि उपकरण' : 'Verified Equipment',
      text: language === 'hi'
        ? 'प्रत्येक ट्रैक्टर और उपकरण को लिस्ट करने से पहले सुरक्षा और खेत प्रदर्शन के लिए जांचा जाता है।'
        : 'Every tractor and implement is inspected for field readiness, PTO power, and safety before listing.',
      icon: ShieldCheck,
    },
    {
      title: language === 'hi' ? 'सीधे खेत तक डिलीवरी' : 'Fast On-Field Delivery',
      text: language === 'hi'
        ? 'निकटतम हब से मशीन बुक करें और बिना किसी परेशानी के सीधे अपने खेत में डिलीवरी पाएं।'
        : 'Book reliable machines quickly with optional field dispatch and driver operator support.',
      icon: MapPin,
    },
    {
      title: language === 'hi' ? 'पारदर्शी दैनिक दरें' : 'Transparent Daily Rates',
      text: language === 'hi'
        ? 'बिना किसी छिपी लागत या अग्रिम अमानत के भारतीय रुपयों (₹) में स्पष्ट दैनिक दरें।'
        : 'Clear daily and seasonal rates in Indian Rupees (₹) with zero hidden security deposit requirements.',
      icon: CheckCircle2,
    },
  ];

  const steps = [
    {
      step: '1',
      title: language === 'hi' ? 'खोजें व तुलना करें' : 'Browse & Filter Machinery',
      desc: language === 'hi'
        ? 'अश्वशक्ति (HP), मॉडल, उपकरण और अपने जिले के अनुसार सही ट्रैक्टर चुनें।'
        : 'Select verified tractors by horsepower, category, implement attachments, and district hub.',
    },
    {
      step: '2',
      title: language === 'hi' ? 'तारीख व डिलीवरी चुनें' : 'Choose Schedule & Implements',
      desc: language === 'hi'
        ? 'जुताई व कटाई की तारीखें चुनें और रोटावेटर, ट्रॉली या ड्राइवर ऐड-ऑन जोड़ें।'
        : 'Select rental duration and customize attachments such as rotavators, harrows, and operators.',
    },
    {
      step: '3',
      title: language === 'hi' ? 'खेत पर जुताई शुरू करें' : 'Confirm & Start Farming',
      desc: language === 'hi'
        ? 'यूपीआई या डिलीवरी पर भुगतान करें और अपने डैशबोर्ड से रियल-टाइम स्टेटस ट्रैक करें।'
        : 'Complete your reservation safely with UPI or Cash on Delivery and track status from your dashboard.',
    },
  ];

  return (
    <div className='min-h-screen bg-slate-50 antialiased'>
      {/* Interactive Hero with District Selector & Date Search */}
      <Hero />

      {/* Live Featured Tractor Machinery Catalog from API */}
      <FeatureSection />

      {/* Why Choose TractorRental Benefits */}
      <section className='border-y border-slate-200 bg-white px-4 py-16 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='text-center'>
            <p className='text-xs font-bold uppercase tracking-[0.22em] text-blue-700'>
              {language === 'hi' ? 'किसान हमारा चयन क्यों करते हैं' : 'Why Farmers Choose Us'}
            </p>
            <h2 className='mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl'>
              {language === 'hi' ? 'सरल, सुरक्षित व किफायती कृषि उपकरण किराया' : 'Simple farm equipment rental, done properly.'}
            </h2>
          </div>

          <div className='mt-10 grid gap-6 md:grid-cols-3'>
            {benefits.map(({ title, text, icon: Icon }) => (
              <div key={title} className='rounded-2xl border border-slate-200 bg-slate-50/70 p-6 shadow-xs transition hover:border-blue-200 hover:bg-white'>
                <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700'>
                  <Icon className='h-6 w-6' />
                </div>
                <h3 className='text-lg font-bold text-slate-900'>{title}</h3>
                <p className='mt-2 text-xs leading-relaxed text-slate-600'>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet Partner Program Banner */}
      <Banner />

      {/* 3-Step Rental Process */}
      <section className='px-4 py-16 sm:px-6 lg:px-8 bg-slate-50'>
        <div className='mx-auto max-w-7xl'>
          <div className='text-center'>
            <p className='text-xs font-bold uppercase tracking-[0.22em] text-blue-700'>
              {language === 'hi' ? 'प्रक्रिया कैसे काम करती है' : 'How It Works'}
            </p>
            <h2 className='mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl'>
              {language === 'hi' ? 'खोज से कटाई तक केवल 3 आसान चरण' : 'From search to harvest in three simple steps.'}
            </h2>
          </div>

          <div className='mt-10 grid gap-6 md:grid-cols-3'>
            {steps.map(({ step, title, desc }) => (
              <div key={step} className='relative rounded-2xl border border-slate-200 bg-white p-6 shadow-xs'>
                <div className='mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white'>
                  {step}
                </div>
                <h3 className='text-base font-bold text-slate-900'>{title}</h3>
                <p className='mt-2 text-xs leading-relaxed text-slate-600'>{desc}</p>
              </div>
            ))}
          </div>

          <div className='mt-10 flex justify-center'>
            <Link
              to='/tractor'
              className='inline-flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition hover:bg-blue-800'
            >
              <span>{language === 'hi' ? 'उपलब्ध फ्लीट ब्राउज़ करें' : 'Browse Available Fleet'}</span>
              <ArrowRight className='h-4 w-4' />
            </Link>
          </div>
        </div>
      </section>

      {/* Verified Farmer Testimonials */}
      <Testimonial />

      {/* Seasonal Alert Newsletter */}
      <NewLetter />
    </div>
  );
};

export default Home;
