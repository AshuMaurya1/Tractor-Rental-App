import mongoose from 'mongoose'

const locationSchema = new mongoose.Schema({
  level: { type: String, enum: ['state', 'district', 'block', 'village'], required: true },
  name: { type: String, required: true, trim: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Location', default: null },
  lgdCode: { type: String, default: '' },
}, { timestamps: false, versionKey: false })

locationSchema.index({ level: 1, parentId: 1, name: 1 }, { unique: true })
locationSchema.index({ parentId: 1 })
locationSchema.index({ level: 1, lgdCode: 1 }, { sparse: true })

const Location = mongoose.model('Location', locationSchema)
export default Location
