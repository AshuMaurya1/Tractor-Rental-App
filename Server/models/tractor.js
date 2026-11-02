import mongoose from 'mongoose'
const { ObjectId } = mongoose.Schema.Types

const tractorSchema = new mongoose.Schema({
  // `owner` and the legacy tractor fields remain for existing booking/admin code.
  owner: { type: ObjectId, ref: 'User', required: true },
  ownerId: { type: ObjectId, ref: 'User', index: true },
  brand: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  image: { type: String, default: '' },
  images: { type: [String], default: [] },
  year: { type: Number, required: true },
  manufacturingYear: { type: Number },
  category: { type: String, required: true, default: 'Tractors', index: true },
  type: { type: String, default: '' },
  customType: { type: String, default: '' },
  seatingCapacity: { type: Number, default: 1 },
  fuelType: { type: String, default: '' },
  transmission: { type: String, default: '' },
  horsepower: { type: Number, min: 0 },
  specification: { type: String, default: '' },
  pricePerDay: { type: Number, required: true, min: 0 },
  rentalPrice: { type: Number, min: 0 },
  ratePerAcre: { type: Number, default: 850, min: 0 },
  ratePerHour: { type: Number, default: 550, min: 0 },
  isChcCertified: { type: Boolean, default: true },
  telematics: {
    type: Object,
    default: () => ({
      hourMeter: 1240.5,
      fuelLevel: 82,
      engineStatus: 'Active',
      batteryHealth: 98,
      lastCoordinates: { lat: 24.685, lng: 83.065 }
    })
  },
  priceUnit: { type: String, enum: ['Per Day', 'Per Hour', 'Per Acre', 'Per Bigha', 'Per Quintal'], default: 'Per Day' },
  operatorIncluded: { type: Boolean, default: false },
  fuelIncluded: { type: Boolean, default: false },
  location: { type: String, default: '' },
  country: { type: String, default: 'India' },
  stateId: { type: ObjectId, ref: 'Location', index: true },
  districtId: { type: ObjectId, ref: 'Location', index: true },
  blockId: { type: ObjectId, ref: 'Location', index: true },
  villageId: { type: ObjectId, ref: 'Location', index: true },
  state: { type: String, default: '', index: true },
  district: { type: String, default: '', index: true },
  block: { type: String, default: '', index: true },
  village: { type: String, default: '' },
  stateName: { type: String, default: '' },
  districtName: { type: String, default: '' },
  blockName: { type: String, default: '' },
  villageName: { type: String, default: '' },
  pincode: { type: String, default: '', match: /^$|^\d{6}$/ },
  address: { type: String, default: '' },
  latitude: { type: Number },
  longitude: { type: Number },
  description: { type: String, default: '', maxlength: 500 },
  isAvailable: { type: Boolean, default: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String, default: '' },
  verifiedBy: { type: ObjectId, ref: 'User', default: null },
  verifiedAt: { type: Date, default: null },
}, { timestamps: true })

tractorSchema.index({ category: 1, type: 1, stateId: 1, districtId: 1, blockId: 1, villageId: 1 })

const Tractor = mongoose.models.Tractor || mongoose.model('Tractor', tractorSchema)
export default Tractor
