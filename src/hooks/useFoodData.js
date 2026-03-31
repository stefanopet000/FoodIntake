import { useMemo } from 'react'
import { useData } from '../context/DataContext'
import { avg, sum } from '../utils/statisticsHelpers'
import { sortByDate } from '../utils/dateHelpers'

export function useFoodData() {
  const { filteredData, allData, isLoading, error } = useData()

  return useMemo(() => {
    const rows = sortByDate(filteredData)
    const totalDays = rows.length
    const exerciseDays = rows.filter(
      (r) => r.exercise_type && r.exercise_type.toLowerCase() !== 'rest'
    ).length
    const restDays = totalDays - exerciseDays

    const avgIntake         = avg(rows.map((r) => r.total_caloric_intake))
    const avgDeficit        = avg(rows.map((r) => r.raw_deficit))       // raw deficit (total kcal − intake)
    const avgAdjDeficit     = avg(rows.map((r) => r.adj_deficit))       // adjusted (−20% movement)
    const avgTotalBurned    = avg(rows.map((r) => r.adj_total_burned))  // adjusted total burned
    const avgBMR            = avg(rows.map((r) => r.assumption_bmr))
    const avgBasicMovement  = avg(rows.map((r) => r.basic_movement))
    const avgAdjMovement    = avg(rows.map((r) => r.adj_movement))
    const avgWeight         = avg(rows.map((r) => r.weight_kg))
    const avgMood = avg(rows.map((r) => r.energy_mood))

    const totalCarbs = sum(rows.map((r) => r.carbs_g))
    const totalProtein = sum(rows.map((r) => r.proteins_g))
    const totalFats = sum(rows.map((r) => r.fats_g))
    const totalMacroG = totalCarbs + totalProtein + totalFats

    const exerciseBreakdown = rows.reduce((acc, r) => {
      const t = r.exercise_type || 'Unknown'
      acc[t] = (acc[t] || 0) + 1
      return acc
    }, {})

    return {
      rows,
      allData,
      totalDays,
      exerciseDays,
      restDays,
      avgIntake,
      avgDeficit,
      avgAdjDeficit,
      avgTotalBurned,
      avgBMR,
      avgBasicMovement,
      avgAdjMovement,
      avgWeight,
      avgMood,
      totalCarbs,
      totalProtein,
      totalFats,
      totalMacroG,
      exerciseBreakdown,
      isLoading,
      error,
    }
  }, [filteredData, allData, isLoading, error])
}
