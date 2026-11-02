import dotenv from 'dotenv'
import path from 'node:path'
import mongoose from 'mongoose'
import connectDB from '../config/db.js'
import Tractor from '../models/tractor.js'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

try {
  await connectDB()
  const result = await Tractor.collection.updateMany(
    { category: { $nin: ['Tractors', 'Tillage & Land Preparation', 'Harvesting', 'Threshing & Post-Harvest', 'Loading & Transport', 'Fodder & Dairy', 'Irrigation & Water Management'] } },
    [{ $set: {
      category: 'Tractors',
      type: { $ifNull: ['$type', 'Utility Tractor'] },
      manufacturingYear: { $ifNull: ['$manufacturingYear', '$year'] },
      rentalPrice: { $ifNull: ['$rentalPrice', '$pricePerDay'] },
      priceUnit: { $ifNull: ['$priceUnit', 'Per Day'] },
      ownerId: { $ifNull: ['$ownerId', '$owner'] },
      images: {
        $cond: [
          { $gt: [{ $size: { $ifNull: ['$images', []] } }, 0] },
          '$images',
          { $cond: [{ $ne: [{ $ifNull: ['$image', ''] }, ''] }, ['$image'], []] },
        ],
      },
    } }],
  )
  console.log(`Migrated ${result.modifiedCount} legacy tractor records to category "Tractors".`)
} catch (error) {
  console.error(`Tractor migration failed: ${error.message}`)
  process.exitCode = 1
} finally {
  await mongoose.disconnect()
}
