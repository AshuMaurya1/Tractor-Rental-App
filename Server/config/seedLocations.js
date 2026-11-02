import fs from 'node:fs/promises';
import Location from '../models/Location.js';

export async function seedLocationsData() {
  try {
    const seedUrl = new URL('../seeds/location-sample.json', import.meta.url);
    const rawData = await fs.readFile(seedUrl, 'utf8');
    const seed = JSON.parse(rawData);

    for (const stateData of seed) {
      const state = await Location.findOneAndUpdate(
        { level: 'state', name: stateData.state, parentId: null },
        { $set: { lgdCode: String(stateData.stateCode || '') } },
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
      );

      for (const districtData of (stateData.districts || [])) {
        const district = await Location.findOneAndUpdate(
          { level: 'district', name: districtData.name, parentId: state._id },
          { $set: { lgdCode: String(districtData.code || '') } },
          { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        for (const blockData of (districtData.blocks || [])) {
          const block = await Location.findOneAndUpdate(
            { level: 'block', name: blockData.name, parentId: district._id },
            { $set: { lgdCode: String(blockData.code || '') } },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
          );

          for (const villageData of (blockData.villages || [])) {
            await Location.findOneAndUpdate(
              { level: 'village', name: villageData.name, parentId: block._id },
              { $set: { lgdCode: String(villageData.code || '') } },
              { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );
          }
        }
      }
    }
    console.log('Location directory successfully populated with Indian states and districts.');
  } catch (error) {
    console.error('Location seeding failed:', error.message);
  }
}

export async function ensureLocationsSeeded() {
  try {
    const stateCount = await Location.countDocuments({ level: 'state' });
    if (stateCount < 15) {
      console.log(`Seeding location directory (found ${stateCount} states)...`);
      await seedLocationsData();
    }
  } catch (error) {
    console.warn('Location check failed:', error.message);
  }
}

export default ensureLocationsSeeded;
