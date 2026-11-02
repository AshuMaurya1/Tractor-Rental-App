import CarCards from './CarCards'
import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { ArrowRight } from 'lucide-react'

const FeatureSection = () => {
  const navigate = useNavigate()
  const { tractors, language = 'en', t } = useAppContext()

  const listToDisplay = (tractors || []).filter((tractor) => tractor.status === 'approved' || !tractor.status)

  return (
    <section className='px-4 py-16 sm:px-6 lg:px-8 max-w-7xl mx-auto antialiased'>
      <div className='flex flex-col gap-4 pb-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.22em] text-blue-700'>Featured tractors</p>
          <h2 className='mt-2 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl'>
            {t('featuredTitle')}
          </h2>
          <p className='mt-2 max-w-2xl text-sm text-slate-500'>
            {t('featuredSubtitle')}
          </p>
        </div>

        <button
          type='button'
          onClick={() => {
            navigate('/tractor')
            window.scrollTo(0, 0)
          }}
          className='inline-flex items-center gap-2 self-start rounded-full border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-50 sm:self-auto'
        >
          <span>{language === 'hi' ? 'सभी 24+ ट्रैक्टर देखें' : 'View All 24+ Tractors'}</span>
          <ArrowRight className='h-4 w-4' />
        </button>
      </div>

      <div className='mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
        {listToDisplay.slice(0, 6).map((tractor) => (
          <CarCards key={tractor._id || tractor.id} tractor={tractor} />
        ))}
      </div>
    </section>
  )
}

export default FeatureSection
