import { useEffect, useMemo, useRef, useState } from 'react'
import { useAppContext } from '../../context/AppContext'
import { EQUIPMENT_CATEGORIES, EQUIPMENT_TYPES, HORSEPOWER_CATEGORIES, RENTAL_PRICE_UNITS } from '../../constants/equipment'
import { getLocations } from '../../api/locationApi'
import SearchableSelect from '../../Components/SearchableSelect'
import Title from '../../Components/owner/Title'
import toast from 'react-hot-toast'
import { Clock, Edit3, LocateFixed, MapPin, Plus, RefreshCw, Upload, X } from 'lucide-react'

const fieldClass = (hasError = false) =>
  `min-h-11 w-full rounded-xl border bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-900 outline-none transition focus:bg-white ${
    hasError ? 'border-rose-400 focus:border-rose-500' : 'border-slate-300 focus:border-emerald-600'
  }`

const EquipmentField = ({ label, name, id, value, onChange, error, required, ...props }) => {
  const inputId = id || name
  return (
    <div className="min-w-0">
      <label htmlFor={inputId} className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      <input
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        aria-invalid={Boolean(error)}
        className={fieldClass(Boolean(error))}
        {...props}
      />
      {error && <p className="mt-1 text-xs font-medium text-rose-600">{error}</p>}
    </div>
  )
}

const EquipmentToggle = ({ id, label, value, onChange }) => (
  <fieldset className="min-w-0">
    <legend className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">{label}</legend>
    <div className="grid min-h-11 grid-cols-2 rounded-xl border border-slate-300 bg-slate-50 p-1" role="radiogroup" aria-label={label}>
      {[{ label: 'No', value: false }, { label: 'Yes', value: true }].map((option) => (
        <button
          key={option.label}
          id={`${id}-${option.label.toLowerCase()}`}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`min-h-9 rounded-lg px-3 text-sm font-semibold transition ${
            value === option.value ? 'bg-white text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  </fieldset>
)

const DEFAULT_INDIAN_STATES = [
  { _id: 'up', name: 'Uttar Pradesh' },
  { _id: 'pb', name: 'Punjab' },
  { _id: 'hr', name: 'Haryana' },
  { _id: 'rj', name: 'Rajasthan' },
  { _id: 'mp', name: 'Madhya Pradesh' },
  { _id: 'mh', name: 'Maharashtra' },
  { _id: 'gj', name: 'Gujarat' },
  { _id: 'br', name: 'Bihar' },
  { _id: 'wb', name: 'West Bengal' },
  { _id: 'ka', name: 'Karnataka' },
  { _id: 'ap', name: 'Andhra Pradesh' },
  { _id: 'ts', name: 'Telangana' },
  { _id: 'tn', name: 'Tamil Nadu' },
  { _id: 'kl', name: 'Kerala' },
  { _id: 'od', name: 'Odisha' },
  { _id: 'cg', name: 'Chhattisgarh' },
  { _id: 'jh', name: 'Jharkhand' },
  { _id: 'uk', name: 'Uttarakhand' },
  { _id: 'hp', name: 'Himachal Pradesh' },
  { _id: 'as', name: 'Assam' },
  { _id: 'jk', name: 'Jammu and Kashmir' },
  { _id: 'dl', name: 'Delhi' },
  { _id: 'ga', name: 'Goa' },
]

const AddTractor = () => {
  const { axios, currency = '₹', navigate } = useAppContext()
  const [photos, setPhotos] = useState([])
  const previewUrls = useRef(new Set())

  const [equipment, setEquipment] = useState({
    category: '',
    type: '',
    customType: '',
    brand: '',
    model: '',
    horsepower: '',
    specification: '',
    manufacturingYear: String(new Date().getFullYear()),
    rentalPrice: '',
    priceUnit: 'Per Day',
    operatorIncluded: false,
    fuelIncluded: false,
    description: '',
  })

  const [location, setLocation] = useState({
    manualMode: false,
    stateId: '',
    stateName: '',
    otherState: false,
    districtId: '',
    districtName: '',
    otherDistrict: false,
    blockId: '',
    blockName: '',
    otherBlock: false,
    villageId: '',
    villageName: '',
    otherVillage: false,
    pincode: '',
    address: '',
    latitude: '',
    longitude: '',
  })

  const [states, setStates] = useState([])
  const [districts, setDistricts] = useState([])
  const [blocks, setBlocks] = useState([])
  const [villages, setVillages] = useState([])
  const [loadingLocation, setLoadingLocation] = useState({ states: false, districts: false, blocks: false, villages: false })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [gettingLocation, setGettingLocation] = useState(false)

  const currentYear = new Date().getFullYear()
  const horsepowerApplies = HORSEPOWER_CATEGORIES.has(equipment.category)

  const typeOptions = useMemo(() => {
    const list = EQUIPMENT_TYPES[equipment.category] || []
    return [
      ...list.map((name) => ({ name, value: name })),
      { name: 'Other / Custom Type', value: 'Other' },
    ]
  }, [equipment.category])

  const stateOptions = useMemo(() => {
    const base = states.length ? states : DEFAULT_INDIAN_STATES
    return [...base, { _id: '__other__', name: 'Other / Enter State Manually' }]
  }, [states])

  const districtOptions = useMemo(() => {
    return [...districts, { _id: '__other__', name: 'Other / Enter District Manually' }]
  }, [districts])

  const blockOptions = useMemo(() => {
    return [...blocks, { _id: '__other__', name: 'Other / Enter Block Manually' }]
  }, [blocks])

  const villageOptions = useMemo(() => {
    return [...villages, { _id: '__other__', name: 'Other / Not listed' }]
  }, [villages])

  // Cleanup object URLs on unmount
  useEffect(() => () => {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // Fetch States
  useEffect(() => {
    let active = true
    setLoadingLocation((current) => ({ ...current, states: true }))
    getLocations(axios, 'states')
      .then((data) => {
        if (active && Array.isArray(data) && data.length) {
          setStates(data)
        } else if (active) {
          setStates(DEFAULT_INDIAN_STATES)
        }
      })
      .catch(() => {
        if (active) setStates(DEFAULT_INDIAN_STATES)
      })
      .finally(() => {
        if (active) setLoadingLocation((current) => ({ ...current, states: false }))
      })
    return () => { active = false }
  }, [axios])

  // Fetch Districts when stateId changes
  useEffect(() => {
    if (!location.stateId || location.stateId === '__other__' || location.manualMode) {
      setDistricts([])
      return undefined
    }
    let active = true
    setLoadingLocation((current) => ({ ...current, districts: true }))
    getLocations(axios, 'districts', location.stateId)
      .then((data) => {
        if (active) setDistricts(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (active) setDistricts([])
      })
      .finally(() => {
        if (active) setLoadingLocation((current) => ({ ...current, districts: false }))
      })
    return () => { active = false }
  }, [axios, location.stateId, location.manualMode])

  // Fetch Blocks when districtId changes
  useEffect(() => {
    if (!location.districtId || location.districtId === '__other__' || location.manualMode) {
      setBlocks([])
      return undefined
    }
    let active = true
    setLoadingLocation((current) => ({ ...current, blocks: true }))
    getLocations(axios, 'blocks', location.districtId)
      .then((data) => {
        if (active) {
          const list = Array.isArray(data) ? data : []
          setBlocks(list)
          if (!list.length) {
            setLocation((c) => ({ ...c, otherBlock: true }))
          }
        }
      })
      .catch(() => {
        if (active) {
          setBlocks([])
          setLocation((c) => ({ ...c, otherBlock: true }))
        }
      })
      .finally(() => {
        if (active) setLoadingLocation((current) => ({ ...current, blocks: false }))
      })
    return () => { active = false }
  }, [axios, location.districtId, location.manualMode])

  // Fetch Villages when blockId changes
  useEffect(() => {
    if (!location.blockId || location.blockId === '__other__' || location.manualMode) {
      setVillages([])
      return undefined
    }
    let active = true
    setLoadingLocation((current) => ({ ...current, villages: true }))
    getLocations(axios, 'villages', location.blockId)
      .then((data) => {
        if (active) {
          const list = Array.isArray(data) ? data : []
          setVillages(list)
          if (!list.length) {
            setLocation((c) => ({ ...c, otherVillage: true }))
          }
        }
      })
      .catch(() => {
        if (active) {
          setVillages([])
          setLocation((c) => ({ ...c, otherVillage: true }))
        }
      })
      .finally(() => {
        if (active) setLoadingLocation((current) => ({ ...current, villages: false }))
      })
    return () => { active = false }
  }, [axios, location.blockId, location.manualMode])

  const handleEquipmentChange = (event) => {
    const { name, value } = event.target
    setEquipment((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: '' }))
  }

  const handlePhotoChange = (event) => {
    const selected = [...(event.target.files || [])]
    const remaining = Math.max(0, 5 - photos.length)
    const accepted = selected.slice(0, remaining).filter((file) => file.type.startsWith('image/'))

    if (selected.length > remaining) {
      toast.error('You can upload a maximum of 5 photos.')
    }
    if (selected.length && !accepted.length) {
      toast.error('Please select valid image files (JPG, PNG, WebP).')
      return
    }
    if (!accepted.length) return

    const nextPhotos = accepted.map((file) => {
      const preview = URL.createObjectURL(file)
      previewUrls.current.add(preview)
      return { file, preview }
    })
    setPhotos((current) => [...current, ...nextPhotos])
    setErrors((current) => ({ ...current, photos: '' }))
    event.target.value = ''
  }

  const removePhoto = (index) => {
    setPhotos((current) => {
      const photo = current[index]
      if (photo) {
        URL.revokeObjectURL(photo.preview)
        previewUrls.current.delete(photo.preview)
      }
      return current.filter((_, photoIndex) => photoIndex !== index)
    })
  }

  const updateLocation = (changes, cleared = []) => {
    setLocation((current) => ({
      ...current,
      ...changes,
      ...Object.fromEntries(cleared.map((key) => [key, ''])),
    }))
    setErrors((current) => ({
      ...current,
      ...Object.fromEntries(cleared.map((key) => [key, ''])),
    }))
  }

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Location services are not available in this browser.')
      return
    }
    setGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation((current) => ({
          ...current,
          latitude: String(coords.latitude),
          longitude: String(coords.longitude),
        }))
        setGettingLocation(false)
        toast.success('Coordinates pinned to equipment listing.')
      },
      () => {
        setGettingLocation(false)
        toast.error('Could not access GPS coordinates. Check browser permissions.')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    )
  }

  const validate = () => {
    const nextErrors = {}
    if (!photos.length) nextErrors.photos = 'Upload at least one equipment photo.'
    if (!equipment.category) nextErrors.category = 'Choose an equipment category.'
    if (!equipment.type) nextErrors.type = 'Choose an equipment type.'
    if (equipment.type === 'Other' && !equipment.customType.trim()) {
      nextErrors.customType = 'Specify the custom equipment type.'
    }
    if (!equipment.brand.trim()) nextErrors.brand = 'Enter manufacturer or brand.'
    if (!equipment.model.trim()) nextErrors.model = 'Enter model name or series.'

    const year = Number(equipment.manufacturingYear)
    if (!Number.isInteger(year) || year < 1980 || year > currentYear) {
      nextErrors.manufacturingYear = `Enter a year from 1980 to ${currentYear}.`
    }

    const price = Number(equipment.rentalPrice)
    if (!Number.isFinite(price) || price <= 0) {
      nextErrors.rentalPrice = 'Enter a valid price greater than 0.'
    }

    if (horsepowerApplies && equipment.horsepower) {
      const hp = Number(equipment.horsepower)
      if (Number.isNaN(hp) || hp <= 0) {
        nextErrors.horsepower = 'Horsepower must be a positive number.'
      }
    }

    if (location.manualMode) {
      if (!location.stateName.trim()) nextErrors.stateName = 'State is required.'
      if (!location.districtName.trim()) nextErrors.districtName = 'District is required.'
      if (!location.blockName.trim() && !location.villageName.trim()) {
        nextErrors.villageName = 'Enter village or tehsil name.'
      }
    } else {
      const hasState = location.stateId && location.stateId !== '__other__' ? location.stateId : location.stateName.trim()
      if (!hasState) nextErrors.stateId = 'Choose a state or enter manually.'

      const hasDistrict = location.districtId && location.districtId !== '__other__' ? location.districtId : location.districtName.trim()
      if (!hasDistrict) nextErrors.districtId = 'Choose a district or enter manually.'

      if (location.otherState && !location.stateName.trim()) nextErrors.stateName = 'Enter state name.'
      if (location.otherDistrict && !location.districtName.trim()) nextErrors.districtName = 'Enter district name.'
      if (location.otherBlock && !location.blockName.trim() && !location.villageName.trim()) {
        nextErrors.blockName = 'Enter block / tehsil name.'
      }
      if (location.otherVillage && !location.villageName.trim() && !location.blockName.trim()) {
        nextErrors.villageName = 'Enter village name.'
      }
    }

    if (location.pincode && !/^\d{6}$/.test(location.pincode.trim())) {
      nextErrors.pincode = 'Pincode must be exactly 6 digits.'
    }

    setErrors(nextErrors)

    if (Object.keys(nextErrors).length) {
      const firstError = Object.keys(nextErrors)[0]
      const el = document.getElementById(firstError) || document.querySelector(`[name="${firstError}"]`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus?.({ preventScroll: true })
      toast.error('Please fix the highlighted fields.')
      return false
    }
    return true
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault()
    if (isLoading || !validate()) return
    setIsLoading(true)

    const finalCategory = equipment.category
    const finalType = equipment.type === 'Other' ? (equipment.customType.trim() || 'Custom Equipment') : equipment.type

    const finalStateName = location.manualMode || location.otherState
      ? location.stateName.trim()
      : (states.find((s) => String(s._id) === String(location.stateId))?.name || location.stateName.trim())

    const finalDistrictName = location.manualMode || location.otherDistrict
      ? location.districtName.trim()
      : (districts.find((d) => String(d._id) === String(location.districtId))?.name || location.districtName.trim())

    const finalBlockName = location.manualMode || location.otherBlock
      ? location.blockName.trim()
      : (blocks.find((b) => String(b._id) === String(location.blockId))?.name || location.blockName.trim())

    const finalVillageName = location.manualMode || location.otherVillage
      ? location.villageName.trim()
      : (villages.find((v) => String(v._id) === String(location.villageId))?.name || location.villageName.trim())

    const equipmentData = {
      category: finalCategory,
      type: finalType,
      customType: equipment.type === 'Other' ? equipment.customType.trim() : '',
      brand: equipment.brand.trim(),
      model: equipment.model.trim(),
      horsepower: horsepowerApplies && equipment.horsepower ? Number(equipment.horsepower) : undefined,
      specification: equipment.specification.trim(),
      manufacturingYear: Number(equipment.manufacturingYear),
      rentalPrice: Number(equipment.rentalPrice),
      priceUnit: equipment.priceUnit,
      operatorIncluded: Boolean(equipment.operatorIncluded),
      fuelIncluded: Boolean(equipment.fuelIncluded),
      description: equipment.description.trim(),
      country: 'India',
      stateId: location.manualMode || location.otherState || location.stateId === '__other__' ? '' : location.stateId,
      stateName: finalStateName,
      districtId: location.manualMode || location.otherDistrict || location.districtId === '__other__' ? '' : location.districtId,
      districtName: finalDistrictName,
      blockId: location.manualMode || location.otherBlock || location.blockId === '__other__' ? '' : location.blockId,
      blockName: finalBlockName,
      villageId: location.manualMode || location.otherVillage || location.villageId === '__other__' ? '' : location.villageId,
      villageName: finalVillageName,
      pincode: location.pincode.trim(),
      address: location.address.trim(),
      latitude: location.latitude,
      longitude: location.longitude,
    }

    const formData = new FormData()
    formData.append('equipmentData', JSON.stringify(equipmentData))
    photos.forEach(({ file }) => formData.append('images', file))

    try {
      const { data } = await axios.post('/api/owner/add-tractor', formData)
      if (!data.success) throw new Error(data.message || 'Unable to submit equipment.')

      toast.success(data.message || 'Equipment listed successfully for admin verification!')
      photos.forEach(({ preview }) => URL.revokeObjectURL(preview))
      previewUrls.current.clear()
      setPhotos([])
      setTimeout(() => navigate('/owner/manage-tractor'), 1000)
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Equipment listing failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 antialiased">
      <Title
        title="Add Equipment"
        subtitle="Register agricultural equipment for farmers to discover and hire. New listings go live upon admin approval."
      />

      {/* Notice Banner */}
      <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 shadow-xs">
        <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
        <div className="min-w-0 text-xs leading-relaxed text-amber-900">
          <span className="font-bold">Verification Process Notice:</span> Every submission is placed in{' '}
          <span className="font-semibold text-amber-800">Pending Verification</span> to protect farmers. After admin
          approval, it appears live across marketplace search and booking.
        </div>
      </div>

      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:p-6 lg:p-8">
        <form noValidate onSubmit={onSubmitHandler} className="space-y-8">
          {/* Section 1: Equipment Photos */}
          <section className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Equipment Photos <span className="text-rose-500">*</span>
              <span className="ml-2 font-medium normal-case tracking-normal text-slate-400">
                1 to 5 photos · The first photo will be used as the primary cover
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {photos.map((photo, index) => (
                <div
                  key={photo.preview}
                  className="relative aspect-[4/3] overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                >
                  <img src={photo.preview} alt={`Equipment ${index + 1}`} className="h-full w-full object-cover" />
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold text-white shadow-xs">
                      Cover
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    aria-label={`Remove photo ${index + 1}`}
                    className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white/95 text-rose-600 shadow hover:bg-rose-50 transition"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {photos.length < 5 && (
                <label
                  htmlFor="equipment-photos"
                  className="flex aspect-[4/3] w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 text-center transition hover:border-emerald-600 hover:bg-emerald-50/40"
                >
                  <span className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                    <Upload className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-bold text-slate-800">Add Photo</span>
                  <span className="mt-0.5 text-[10px] text-slate-400">{photos.length}/5 selected</span>
                  <input
                    id="equipment-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    hidden
                    onChange={handlePhotoChange}
                  />
                </label>
              )}
            </div>
            {errors.photos && (
              <p id="photos" tabIndex={-1} className="mt-1 text-xs font-medium text-rose-600">
                {errors.photos}
              </p>
            )}
          </section>

          {/* Section 2: Category & Classification */}
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 border-b pb-2">
              1. Equipment Category & Type
            </h2>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <SearchableSelect
                id="category"
                label="Equipment Category"
                options={EQUIPMENT_CATEGORIES.map((name) => ({ name, value: name }))}
                value={equipment.category}
                required
                error={errors.category}
                placeholder="Choose equipment category"
                optionLabel={(option) => option.name}
                optionValue={(option) => option.value}
                onChange={(option) => {
                  setEquipment((current) => ({
                    ...current,
                    category: option.value || '',
                    type: '',
                    customType: '',
                    horsepower: '',
                  }))
                  setErrors((current) => ({ ...current, category: '', type: '', customType: '' }))
                }}
              />

              <SearchableSelect
                id="type"
                label="Equipment Type"
                options={typeOptions}
                value={equipment.type}
                required
                disabled={!equipment.category}
                error={errors.type}
                placeholder={equipment.category ? 'Choose machinery type' : 'Choose category first'}
                optionLabel={(option) => option.name}
                optionValue={(option) => option.value}
                onChange={(option) => {
                  setEquipment((current) => ({ ...current, type: option.value || '' }))
                  setErrors((current) => ({ ...current, type: '' }))
                }}
              />
            </div>

            {equipment.type === 'Other' && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/30 p-3 sm:p-4">
                <EquipmentField
                  id="customType"
                  label="Specify Custom Equipment / Attachment Name"
                  name="customType"
                  value={equipment.customType}
                  onChange={handleEquipmentChange}
                  error={errors.customType}
                  required
                  placeholder="e.g. Laser Leveller with Dual Mast, Orchard Rotavator"
                />
              </div>
            )}
          </section>

          {/* Section 3: Technical & Commercial Specifications */}
          <section className="space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 border-b pb-2">
              2. Machinery Details & Pricing
            </h2>
            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <EquipmentField
                label="Manufacturer / Brand"
                name="brand"
                value={equipment.brand}
                onChange={handleEquipmentChange}
                error={errors.brand}
                required
                placeholder="e.g. Mahindra, Swaraj, John Deere, Sonalika"
              />
              <EquipmentField
                label="Model Name / Series"
                name="model"
                value={equipment.model}
                onChange={handleEquipmentChange}
                error={errors.model}
                required
                placeholder="e.g. 575 DI, 744 FE, 5310, Tiger 55"
              />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {horsepowerApplies && (
                <EquipmentField
                  label="Horsepower (HP)"
                  name="horsepower"
                  type="number"
                  min="1"
                  step="1"
                  value={equipment.horsepower}
                  onChange={handleEquipmentChange}
                  error={errors.horsepower}
                  placeholder="e.g. 50 HP"
                />
              )}
              <EquipmentField
                label="Manufacturing Year"
                name="manufacturingYear"
                type="number"
                min="1980"
                max={currentYear}
                value={equipment.manufacturingYear}
                onChange={handleEquipmentChange}
                error={errors.manufacturingYear}
                required
              />
              <EquipmentField
                label="Capacity / Attachments"
                name="specification"
                value={equipment.specification}
                onChange={handleEquipmentChange}
                placeholder="e.g. 9 tyne, 7 feet width, 4WD"
              />
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[1fr_11rem]">
                <EquipmentField
                  label={`Rental Price (${currency})`}
                  name="rentalPrice"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={equipment.rentalPrice}
                  onChange={handleEquipmentChange}
                  error={errors.rentalPrice}
                  required
                  placeholder="e.g. 1500"
                />
                <div className="min-w-0">
                  <label htmlFor="priceUnit" className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Unit <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="priceUnit"
                    name="priceUnit"
                    value={equipment.priceUnit}
                    onChange={handleEquipmentChange}
                    className={fieldClass(Boolean(errors.priceUnit))}
                  >
                    {RENTAL_PRICE_UNITS.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                <EquipmentToggle
                  id="operatorIncluded"
                  label="Operator / Driver Included?"
                  value={equipment.operatorIncluded}
                  onChange={(val) => setEquipment((c) => ({ ...c, operatorIncluded: val }))}
                />
                <EquipmentToggle
                  id="fuelIncluded"
                  label="Fuel Included in Rate?"
                  value={equipment.fuelIncluded}
                  onChange={(val) => setEquipment((c) => ({ ...c, fuelIncluded: val }))}
                />
              </div>
            </div>
          </section>

          {/* Section 4: Operational Location */}
          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-800">
                  3. Equipment Location
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Allows nearby farmers to discover and hire this equipment accurately.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setLocation((c) => ({
                      ...c,
                      manualMode: !c.manualMode,
                      otherState: !c.manualMode,
                      otherDistrict: !c.manualMode,
                      otherBlock: !c.manualMode,
                      otherVillage: !c.manualMode,
                    }))
                  }
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  {location.manualMode ? 'Switch to Directory Dropdown' : 'Enter Location Manually'}
                </button>
                <button
                  type="button"
                  onClick={handleCurrentLocation}
                  disabled={gettingLocation}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-bold text-emerald-800 hover:bg-emerald-100 transition disabled:opacity-60"
                >
                  {gettingLocation ? (
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LocateFixed className="h-3.5 w-3.5" />
                  )}
                  Pin GPS Coordinates
                </button>
              </div>
            </div>

            {location.manualMode ? (
              /* Direct Manual Entry Mode */
              <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <EquipmentField
                    label="State"
                    name="stateName"
                    value={location.stateName}
                    onChange={(e) => updateLocation({ stateName: e.target.value })}
                    error={errors.stateName}
                    required
                    placeholder="e.g. Uttar Pradesh, Punjab, Haryana"
                  />
                  <EquipmentField
                    label="District"
                    name="districtName"
                    value={location.districtName}
                    onChange={(e) => updateLocation({ districtName: e.target.value })}
                    error={errors.districtName}
                    required
                    placeholder="e.g. Varanasi, Ludhiana, Karnal"
                  />
                  <EquipmentField
                    label="Block / Tehsil"
                    name="blockName"
                    value={location.blockName}
                    onChange={(e) => updateLocation({ blockName: e.target.value })}
                    error={errors.blockName}
                    placeholder="e.g. Pindra, Jagraon, Nilokheri"
                  />
                  <EquipmentField
                    label="Village / Town"
                    name="villageName"
                    value={location.villageName}
                    onChange={(e) => updateLocation({ villageName: e.target.value })}
                    error={errors.villageName}
                    placeholder="e.g. Babatpur, Mullanpur"
                  />
                  <EquipmentField
                    label="Pincode"
                    name="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={location.pincode}
                    onChange={(e) => updateLocation({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    error={errors.pincode}
                    placeholder="6-digit pincode"
                  />
                  <EquipmentField
                    label="Nearby Landmark / Street"
                    name="address"
                    value={location.address}
                    onChange={(e) => updateLocation({ address: e.target.value })}
                    placeholder="e.g. Near Kisan Mandi, GT Road"
                  />
                </div>
              </div>
            ) : (
              /* Cascade Dropdown Mode */
              <div className="space-y-4">
                <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Country</label>
                    <input disabled value="India" className={`${fieldClass()} cursor-not-allowed text-slate-500`} />
                  </div>

                  <SearchableSelect
                    id="stateId"
                    label="State"
                    options={stateOptions}
                    value={location.otherState ? '__other__' : location.stateId}
                    required
                    loading={loadingLocation.states}
                    error={errors.stateId}
                    placeholder="Select State"
                    onChange={(option) => {
                      const isOther = option._id === '__other__'
                      updateLocation(
                        {
                          stateId: isOther ? '' : option._id,
                          stateName: isOther ? '' : option.name,
                          otherState: isOther,
                          otherDistrict: isOther,
                          otherBlock: isOther,
                          otherVillage: isOther,
                        },
                        ['districtId', 'districtName', 'blockId', 'blockName', 'villageId', 'villageName'],
                      )
                    }}
                  />

                  <SearchableSelect
                    id="districtId"
                    label="District"
                    options={districtOptions}
                    value={location.otherDistrict ? '__other__' : location.districtId}
                    required
                    disabled={!location.stateId && !location.otherState}
                    loading={loadingLocation.districts}
                    error={errors.districtId}
                    placeholder={location.stateId ? 'Select District' : 'Choose State first'}
                    onChange={(option) => {
                      const isOther = option._id === '__other__'
                      updateLocation(
                        {
                          districtId: isOther ? '' : option._id,
                          districtName: isOther ? '' : option.name,
                          otherDistrict: isOther,
                          otherBlock: isOther,
                          otherVillage: isOther,
                        },
                        ['blockId', 'blockName', 'villageId', 'villageName'],
                      )
                    }}
                  />

                  <SearchableSelect
                    id="blockId"
                    label="Block / Tehsil"
                    options={blockOptions}
                    value={location.otherBlock ? '__other__' : location.blockId}
                    disabled={(!location.districtId && !location.otherDistrict) || location.otherBlock}
                    loading={loadingLocation.blocks}
                    error={errors.blockId}
                    placeholder={location.districtId ? 'Select Block' : 'Choose District first'}
                    onChange={(option) => {
                      const isOther = option._id === '__other__'
                      updateLocation(
                        {
                          blockId: isOther ? '' : option._id,
                          blockName: isOther ? '' : option.name,
                          otherBlock: isOther,
                          otherVillage: isOther,
                        },
                        ['villageId', 'villageName'],
                      )
                    }}
                  />

                  <SearchableSelect
                    id="villageId"
                    label="Village"
                    options={villageOptions}
                    value={location.otherVillage ? '__other__' : location.villageId}
                    disabled={(!location.blockId && !location.otherBlock) || location.otherVillage}
                    loading={loadingLocation.villages}
                    error={errors.villageId}
                    placeholder={location.blockId ? 'Select Village' : 'Choose Block first'}
                    onChange={(option) => {
                      const isOther = option._id === '__other__'
                      updateLocation({
                        villageId: isOther ? '' : option._id,
                        villageName: isOther ? '' : option.name,
                        otherVillage: isOther,
                      })
                    }}
                  />

                  <EquipmentField
                    label="Pincode"
                    name="pincode"
                    inputMode="numeric"
                    maxLength={6}
                    value={location.pincode}
                    onChange={(e) => updateLocation({ pincode: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    error={errors.pincode}
                    placeholder="6-digit pincode"
                  />
                </div>

                {/* Conditional custom inputs if "Other" is chosen at any level */}
                {(location.otherState || location.otherDistrict || location.otherBlock || location.otherVillage) && (
                  <div className="grid min-w-0 grid-cols-1 gap-4 rounded-xl border border-amber-200 bg-amber-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    {location.otherState && (
                      <EquipmentField
                        label="State Name"
                        name="stateName"
                        value={location.stateName}
                        onChange={(e) => updateLocation({ stateName: e.target.value })}
                        error={errors.stateName}
                        required
                        placeholder="Enter State Name"
                      />
                    )}
                    {location.otherDistrict && (
                      <EquipmentField
                        label="District Name"
                        name="districtName"
                        value={location.districtName}
                        onChange={(e) => updateLocation({ districtName: e.target.value })}
                        error={errors.districtName}
                        required
                        placeholder="Enter District Name"
                      />
                    )}
                    {location.otherBlock && (
                      <EquipmentField
                        label="Block / Tehsil Name"
                        name="blockName"
                        value={location.blockName}
                        onChange={(e) => updateLocation({ blockName: e.target.value })}
                        error={errors.blockName}
                        placeholder="Enter Block / Tehsil Name"
                      />
                    )}
                    {location.otherVillage && (
                      <EquipmentField
                        label="Village Name"
                        name="villageName"
                        value={location.villageName}
                        onChange={(e) => updateLocation({ villageName: e.target.value })}
                        error={errors.villageName}
                        placeholder="Enter Village Name"
                      />
                    )}
                  </div>
                )}

                <EquipmentField
                  label="Address / Landmark (Optional)"
                  name="address"
                  value={location.address}
                  onChange={(e) => updateLocation({ address: e.target.value })}
                  placeholder="e.g. Near Primary School, Canal Road"
                />
              </div>
            )}

            {(location.latitude || location.longitude) && (
              <p className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
                <MapPin className="h-4 w-4 shrink-0" /> GPS coordinates pinned:{' '}
                {Number(location.latitude).toFixed(5)}, {Number(location.longitude).toFixed(5)}
              </p>
            )}
          </section>

          {/* Section 5: Description & Features */}
          <section className="space-y-2">
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Description <span className="font-medium normal-case tracking-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={500}
              value={equipment.description}
              onChange={handleEquipmentChange}
              placeholder="Describe condition, available attachments, suitable crops (e.g. wheat sowing, paddy puddling), or specific driver notes…"
              className={`${fieldClass()} min-h-24 resize-y leading-relaxed`}
            />
            <p className="mt-1 text-right text-xs text-slate-400">{equipment.description.length}/500</p>
          </section>

          {/* Form Actions Footer */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs leading-relaxed text-slate-500">
              Fields marked with <span className="font-bold text-rose-500">*</span> are required. Your equipment will be
              sent to admin for swift verification.
            </span>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" /> Submitting Equipment…
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Submit Equipment for Verification
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddTractor
