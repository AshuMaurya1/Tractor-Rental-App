const locationCache = new Map()

export const clearLocationCache = () => locationCache.clear()

export async function getLocations(axios, level, parentId = '') {
  const key = `${level}:${parentId}`
  if (locationCache.has(key)) return locationCache.get(key)

  const params = parentId ? { parentId } : undefined
  const { data } = await axios.get(`/api/locations/${level}`, { params })
  if (!data.success || !Array.isArray(data.locations)) {
    throw new Error(data.message || 'Unable to load location options')
  }

  locationCache.set(key, data.locations)
  return data.locations
}
