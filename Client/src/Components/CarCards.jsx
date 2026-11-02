import { useNavigate } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import { Fuel, Gauge, MapPin, CheckCircle, Clock } from 'lucide-react'

const CarCards = ({ tractor }) => {
  const { currency = '₹', language = 'en' } = useAppContext()
  const navigate = useNavigate()
  const price = tractor.rentalPrice ?? tractor.pricePerDay ?? 0
  const equipmentType = tractor.type || tractor.category || 'Agricultural equipment'
  const equipmentLocation = [tractor.villageName, tractor.blockName, tractor.districtName, tractor.stateName]
    .filter(Boolean)
    .join(', ') || tractor.location || 'Location not specified'

  return (
    <div
      onClick={() => { navigate(`/tractor-details/${tractor._id || tractor.id}`); window.scrollTo(0, 0) }}
      className="flex cursor-pointer flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all hover:border-emerald-300 hover:shadow-sm"
    >
      <div className="relative h-48 overflow-hidden border-b border-slate-100 bg-slate-100">
        <img src={tractor.images?.[0] || tractor.image} alt={`${tractor.brand} ${tractor.model}`} className="h-full w-full object-cover" />
        {tractor.isAvailable ? (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded bg-emerald-700 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <CheckCircle className="h-3 w-3" /><span>{language === 'hi' ? 'उपलब्ध है' : 'Available'}</span>
          </span>
        ) : (
          <span className="absolute left-2.5 top-2.5 flex items-center gap-1 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
            <Clock className="h-3 w-3" /><span>{language === 'hi' ? 'खेत पर चल रहा है' : 'In Field Use'}</span>
          </span>
        )}
        {tractor.isChcCertified !== false && (
          <span className="absolute right-2.5 top-2.5 flex items-center gap-1 rounded bg-blue-700/90 backdrop-blur-xs px-2 py-0.5 text-[9px] font-bold text-white shadow-xs">
            CHC Fleet
          </span>
        )}
        <div className="absolute bottom-2.5 right-2.5 rounded bg-slate-900/90 px-2.5 py-1 text-white shadow-xs">
          <span className="text-sm font-bold">{currency}{price}</span>
          <span className="text-[10px] font-medium text-slate-300"> / {tractor.priceUnit || 'Per Day'}</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 transition-colors hover:text-emerald-700">{tractor.brand} {tractor.model}</h3>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            {equipmentType} · {tractor.manufacturingYear || tractor.year}
          </p>
          <div className="mt-3.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
            <div className="flex min-w-0 items-center gap-1.5">
              <Fuel className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{tractor.specification || (tractor.horsepower ? `${tractor.horsepower} HP` : tractor.fuelType || 'Equipment')}</span>
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{tractor.operatorIncluded ? 'Operator included' : tractor.transmission || 'Flexible rental'}</span>
            </div>
            <div className="col-span-2 flex items-start gap-1.5 pt-0.5 text-[11px] text-slate-500">
              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="line-clamp-2">{equipmentLocation}</span>
            </div>
          </div>
        </div>
        <button type="button" className="mt-4 flex w-full items-center justify-center rounded-lg bg-emerald-700 px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-emerald-800">
          {language === 'hi' ? 'किराए पर लें' : 'Book Equipment'}
        </button>
      </div>
    </div>
  )
}

export default CarCards
