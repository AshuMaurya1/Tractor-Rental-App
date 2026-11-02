export const EQUIPMENT_TYPES = {
  Tractors: [
    'Mini Tractor', 'Utility Tractor', 'Orchard Tractor', 'Row-Crop Tractor', 'Crawler Tractor',
  ],
  'Tillage & Land Preparation': [
    'Rotavator', 'Cultivator', 'MB Plough', 'Disc Plough', 'Disc Harrow',
    'Laser Land Leveller', 'Power Tiller', 'Subsoiler', 'Ridger', 'Bund Former',
  ],
  Harvesting: [
    'Combine Harvester', 'Paddy Harvester', 'Reaper', 'Reaper Binder',
    'Sugarcane Harvester', 'Potato Digger', 'Groundnut Digger', 'Cotton Picker',
  ],
  'Threshing & Post-Harvest': [
    'Thresher', 'Paddy Thresher', 'Maize Sheller', 'Winnowing Machine', 'Straw Reaper',
    'Baler', 'Straw Chopper', 'Mulcher', 'Rice Mill (Mobile)', 'Dryer',
  ],
  'Loading & Transport': [
    'Trolley / Trailer', 'Tipping Trailer', 'Loader', 'JCB / Backhoe Loader',
    'Dumper', 'Pickup / Mini Truck',
  ],
  'Fodder & Dairy': [
    'Chaff Cutter', 'Fodder Harvester', 'Fodder Baler', 'Milking Machine', 'Silage Machine',
  ],
  'Irrigation & Water Management': [
    'Diesel Water Pump', 'Electric Water Pump', 'Sprinkler Set', 'Drip Irrigation Pump',
  ],
}

export const EQUIPMENT_CATEGORIES = Object.keys(EQUIPMENT_TYPES)

export const HORSEPOWER_CATEGORIES = new Set([
  'Tractors',
  'Tillage & Land Preparation',
  'Harvesting',
  'Irrigation & Water Management',
  'Loading & Transport',
])

export const RENTAL_PRICE_UNITS = ['Per Day', 'Per Hour', 'Per Acre', 'Per Bigha', 'Per Quintal']
