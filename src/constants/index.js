export const CHART_COLORS = {
  intake: '#38bdf8',
  deficit: '#4ade80',
  surplus: '#f87171',
  carbs: '#fbbf24',
  protein: '#60a5fa',
  fats: '#fb7185',
  bmr: '#a78bfa',
  movement: '#34d399',
  realistic: '#c084fc',
  weight: '#2dd4bf',
  mood: '#fb923c',
  total: '#94a3b8',
}

export const METRIC_OPTIONS = [
  { value: 'total_kcal', label: 'Total kcal (burned)' },
  { value: 'kcal_movement', label: 'Kcal Movement' },
  { value: 'assumption_bmr', label: 'Assumption BMR' },
  { value: 'total_caloric_intake', label: 'Caloric Intake' },
  { value: 'carbs_g', label: 'Carbs (g)' },
  { value: 'proteins_g', label: 'Proteins (g)' },
  { value: 'fats_g', label: 'Fats (g)' },
  { value: 'adj_deficit', label: 'Deficit / Surplus (adjusted)' },
  { value: 'raw_deficit', label: 'Deficit / Surplus (raw)' },
  { value: 'weight_kg', label: 'Weight (kg)' },
  { value: 'energy_mood', label: 'Energy / Mood (1-10)' },
]

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/intake', label: 'Caloric Intake', icon: '🍽️' },
  { path: '/burned', label: 'Calories Burned', icon: '🔥' },
  { path: '/bmr', label: 'BMR & Movement', icon: '🧬' },
  { path: '/macros', label: 'Macros', icon: '⚖️' },
  { path: '/exercise', label: 'Exercise', icon: '🏃' },
  { path: '/deficit', label: 'Deficit / Surplus', icon: '📉' },
  { path: '/correlation', label: 'Correlation', icon: '🔗' },
  { path: '/analysis', label: 'Analysis & Tips', icon: '💡' },
  { path: '/ai-analysis', label: 'AI Analysis', icon: '🤖' },
  { path: '/food-log', label: 'Food Log', icon: '🥗' },
  { path: '/upload', label: 'Upload CSV', icon: '📤' },
]

export const DATE_RANGES = [
  { value: '1w', label: '1 Week' },
  { value: '2w', label: '2 Weeks' },
  { value: '1m', label: '1 Month' },
  { value: 'custom', label: 'Custom' },
]
