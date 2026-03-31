import { formatDateLabel } from './dateHelpers'

export function toChartData(rows, xKey = 'date', ...yKeys) {
  return rows.map((r) => {
    const point = { [xKey]: xKey === 'date' ? formatDateLabel(r[xKey]) : r[xKey] }
    yKeys.forEach((k) => (point[k] = r[k]))
    return point
  })
}

export function groupByWeek(allData) {
  const map = {}
  allData.forEach((r) => {
    const wl = r.week_label || 'Unknown'
    if (!map[wl]) map[wl] = []
    map[wl].push(r)
  })
  return map
}

export function weeklyAverages(allData) {
  const grouped = groupByWeek(allData)
  return Object.entries(grouped).map(([week, rows]) => {
    const avg = (key) => {
      const vals = rows.map((r) => r[key]).filter((v) => v != null)
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    }
    return {
      week,
      avgIntake: avg('total_caloric_intake'),
      avgDeficit: avg('adj_deficit'),
      avgBMR: avg('assumption_bmr'),
      avgCarbs: avg('carbs_g'),
      avgProtein: avg('proteins_g'),
      avgFats: avg('fats_g'),
      avgWeight: avg('weight_kg'),
      avgMood: avg('energy_mood'),
      exerciseDays: rows.filter(
        (r) => r.exercise_type && r.exercise_type.toLowerCase() !== 'rest'
      ).length,
    }
  })
}
