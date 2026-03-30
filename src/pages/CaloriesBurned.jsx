import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard from '../components/charts/BarChartCard'
import AreaChartCard from '../components/charts/AreaChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatKcal } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function CaloriesBurned() {
  const { rows, isLoading, allData } = useFoodData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const avgTotal = avg(rows.map((r) => r.total_kcal))
  const avgMovement = avg(rows.map((r) => r.kcal_movement))

  const dailyBurned = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    total: r.total_kcal,
    movement: r.kcal_movement,
  }))

  const movementTrend = weeklyStats.map((w) => ({
    date: w.week,
    avgMovement: w.avgIntake ? null : null, // recompute per week
  }))

  // movement trend by week from allData
  const weekMovementTrend = weeklyStats.map((w) => {
    const weekRows = allData.filter((r) => r.week_label === w.week)
    const avgMov = avg(weekRows.map((r) => r.kcal_movement))
    return { date: w.week, avgMovement: avgMov ? Math.round(avgMov) : null }
  })

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Avg Total Burned" value={formatKcal(avgTotal ? Math.round(avgTotal) : null)} icon="🔥" color="text-red-400" />
        <MetricCard label="Avg Movement" value={formatKcal(avgMovement ? Math.round(avgMovement) : null)} icon="🚴" color="text-emerald-400" />
      </div>
      <BarChartCard
        title="Total kcal vs Movement kcal (daily)"
        data={dailyBurned}
        series={[
          { key: 'total', label: 'Total Burned', color: CHART_COLORS.surplus },
          { key: 'movement', label: 'Movement', color: CHART_COLORS.movement },
        ]}
      />
      <AreaChartCard
        title="Movement Calories Trend (weekly)"
        data={weekMovementTrend}
        series={[{ key: 'avgMovement', label: 'Avg Movement kcal', color: CHART_COLORS.movement }]}
      />
    </div>
  )
}
