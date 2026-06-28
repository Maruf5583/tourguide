export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://localhost:44389'

export const BEST_SEASON = {
  1: 'Winter',
  2: 'Spring',
  3: 'Summer',
  4: 'Monsoon',
}

export const PLACE_CATEGORY = {
  1: 'Beach',
  2: 'Hill',
  3: 'Forest',
  4: 'Historical',
  5: 'Religious',
  6: 'Wetland',
}

export const PLACE_CATEGORY_LABELS = Object.entries(PLACE_CATEGORY).map(([id, name]) => ({
  id: Number(id),
  name,
}))