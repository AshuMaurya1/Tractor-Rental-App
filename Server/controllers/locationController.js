import mongoose from 'mongoose'
import Location from '../models/Location.js'

const listChildren = async (level, parentId, parentName) => {
  const filter = { level }
  if (level === 'state') {
    filter.parentId = null
    return filter
  }
  const identifier = parentId || parentName
  if (!identifier) return null

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    filter.parentId = identifier
    return filter
  }

  // Resolve parent by name if parentId is a name string
  const parentLevel = level === 'district' ? 'state' : level === 'block' ? 'district' : 'village'
  const parent = await Location.findOne({ name: new RegExp(`^${identifier.trim()}$`, 'i'), level: parentLevel }).lean()
  if (parent) {
    filter.parentId = parent._id
    return filter
  }

  return null
}

const getLocations = (level) => async (req, res) => {
  try {
    const parentIdentifier = req.query.parentId || req.query.parentName || req.query.state || req.query.district || req.query.block
    const filter = await listChildren(level, parentIdentifier)
    if (!filter) return res.status(400).json({ success: false, message: 'A valid parent identifier is required.' })
    const locations = await Location.find(filter).select('_id name lgdCode').sort({ name: 1 }).lean()
    res.set('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
    return res.json({ success: true, locations })
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message })
  }
}

export const getStates = getLocations('state')
export const getDistricts = getLocations('district')
export const getBlocks = getLocations('block')
export const getVillages = getLocations('village')
