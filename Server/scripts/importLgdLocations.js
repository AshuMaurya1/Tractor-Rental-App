import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Location from '../models/Location.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: npm run locations:import -- path/to/lgd-locations.csv')
  process.exit(1)
}

function parseCsvLine(line) {
  const values = []
  let value = ''
  let quoted = false
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index]
    if (char === '"' && line[index + 1] === '"' && quoted) { value += '"'; index += 1 }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { values.push(value.trim()); value = '' }
    else value += char
  }
  values.push(value.trim())
  return values
}

const normalizeHeader = (header) => header.toLowerCase().replace(/[^a-z0-9]/g, '')
const columns = {
  state: ['state', 'statename'],
  district: ['district', 'districtname'],
  block: ['block', 'blockname', 'subdistrict', 'subdistrictname', 'tehsil', 'tehsilname'],
  village: ['village', 'villagename'],
  stateCode: ['statecode', 'statelgdcode'],
  districtCode: ['districtcode', 'districtlgdcode'],
  blockCode: ['blockcode', 'blocklgdcode', 'subdistrictcode', 'tehsilcode'],
  villageCode: ['villagecode', 'villagelgdcode'],
}

const tree = new Map()
const csv = await fs.readFile(path.resolve(filePath), 'utf8')
const lines = csv.replace(/^\uFEFF/, '').split(/\r?\n/).filter((line) => line.trim())
const headers = parseCsvLine(lines.shift()).map(normalizeHeader)
const findColumn = (names) => headers.findIndex((header) => names.includes(header))
const indexes = Object.fromEntries(Object.entries(columns).map(([key, names]) => [key, findColumn(names)]))

for (const line of lines) {
  const row = parseCsvLine(line)
  const value = (key) => indexes[key] >= 0 ? (row[indexes[key]] || '').trim() : ''
  const stateName = value('state')
  const districtName = value('district')
  const blockName = value('block')
  const villageName = value('village')
  if (!stateName || !districtName || !blockName || !villageName) continue

  if (!tree.has(stateName)) tree.set(stateName, { name: stateName, code: value('stateCode'), districts: new Map() })
  const state = tree.get(stateName)
  if (!state.districts.has(districtName)) state.districts.set(districtName, { name: districtName, code: value('districtCode'), blocks: new Map() })
  const district = state.districts.get(districtName)
  if (!district.blocks.has(blockName)) district.blocks.set(blockName, { name: blockName, code: value('blockCode'), villages: new Map() })
  const block = district.blocks.get(blockName)
  if (!block.villages.has(villageName)) block.villages.set(villageName, { name: villageName, code: value('villageCode') })
}

const chunks = (items, size = 500) => {
  const result = []
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size))
  return result
}

async function upsertChildren(level, parentId, records) {
  const operations = [...records.values()].map((record) => ({
    updateOne: {
      filter: { level, parentId, name: record.name },
      update: { $set: { lgdCode: record.code || '' } },
      upsert: true,
    },
  }))
  for (const batch of chunks(operations)) await Location.bulkWrite(batch, { ordered: false })
}

try {
  if (!tree.size) throw new Error('No complete state/district/block/village rows found in CSV headers.')
  await connectDB()
  for (const stateData of tree.values()) {
    const stateMap = new Map([[stateData.name, stateData]])
    await upsertChildren('state', null, stateMap)
    const state = await Location.findOne({ level: 'state', parentId: null, name: stateData.name }).lean()
    for (const districtData of stateData.districts.values()) {
      const districtMap = new Map([[districtData.name, districtData]])
      await upsertChildren('district', state._id, districtMap)
      const district = await Location.findOne({ level: 'district', parentId: state._id, name: districtData.name }).lean()
      for (const blockData of districtData.blocks.values()) {
        const blockMap = new Map([[blockData.name, blockData]])
        await upsertChildren('block', district._id, blockMap)
        const block = await Location.findOne({ level: 'block', parentId: district._id, name: blockData.name }).lean()
        await upsertChildren('village', block._id, blockData.villages)
      }
    }
  }
  console.log(`Imported LGD location rows for ${tree.size} states.`)
} catch (error) {
  console.error(`LGD location import failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
