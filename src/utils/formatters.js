export function formatKcal(val) {
  if (val == null) return '—'
  return `${Number(val).toLocaleString()} kcal`
}

export function formatGrams(val) {
  if (val == null) return '—'
  return `${Number(val).toFixed(1)} g`
}

export function formatPercent(val) {
  if (val == null) return '—'
  return `${Number(val).toFixed(1)}%`
}

export function formatDeficit(val) {
  if (val == null) return '—'
  const n = Number(val)
  if (n > 0) return `+${n.toLocaleString()} kcal`
  return `${n.toLocaleString()} kcal`
}

export function formatWeight(val) {
  if (val == null) return '—'
  return `${Number(val).toFixed(1)} kg`
}

export function formatMood(val) {
  if (val == null) return '—'
  return `${val}/10`
}

export function deficitColor(val) {
  if (val == null) return 'text-slate-400'
  return Number(val) <= 0 ? 'text-emerald-400' : 'text-red-400'
}
