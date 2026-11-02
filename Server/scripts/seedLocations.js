import dotenv from 'dotenv'
import fs from 'node:fs/promises'
import path from 'node:path'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Location from '../models/Location.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const seed = JSON.parse(await fs.readFile(new URL('../seeds/location-sample.json', import.meta.url), 'utf8'))

async function upsert(level, name, parentId, lgdCode = '') {
  return Location.findOneAndUpdate(
    { level, name, parentId: parentId || null },
    { $set: { lgdCode: String(lgdCode || '') } },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  )
}

try {
  await connectDB()
  for (const stateData of seed) {
    const state = await upsert('state', stateData.state, null, stateData.stateCode)
    for (const districtData of stateData.districts) {
      const district = await upsert('district', districtData.name, state._id, districtData.code)
      for (const blockData of districtData.blocks) {
        const block = await upsert('block', blockData.name, district._id, blockData.code)
        for (const villageData of blockData.villages) {
          await upsert('village', villageData.name, block._id, villageData.code)
        }
      }
    }
  }
  console.log('Sample locations seeded for Uttar Pradesh and Punjab.')
} catch (error) {
  console.error(`Location seed failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
