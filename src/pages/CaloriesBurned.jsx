import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import { useData } from '../context/DataContext'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard from '../components/charts/BarChartCard'
import LineChartCard from '../components/charts/LineChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatKcal } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function CaloriesBurned() {
  const { rows, avgTotalBurned, avgAdjMovement, isLoading, allData } = useFoodData()
  const { calculatedBMR } = useData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const dailyBurned = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    adj_total:    r.adj_total_burned,
    raw_total:    r.total_kcal,
    adj_movement: r.adj_movement,
    raw_movement: r.kcal_movement,
  }))

  const weekMovementTrend = weeklyStats.map((w) => {
    const weekRows = allData.filter((r) => r.week_label === w.week)
    const adjMov = avg(weekRows.map((r) => r.adj_movement ?? (r.kcal_movement ? r.kcal_movement * 0.8 : null)))
    return { date: w.week, adj_movement: adjMov ? Math.round(adjMov) : null }
  })

  return (
    <div className="space-y-6">
      <WeekSelector />

      <div className="card bg-slate-50 flex items-start gap-3 text-sm">
        <span className="text-lg mt-0.5">⚙️</span>
        <p className="text-slate-400 text-xs">
          All movement calories are reduced by <span className="text-slate-700 font-medium">20%</span> to correct for Apple Watch overestimation.
          {calculatedBMR ? ` BMR (${calculatedBMR.toLocaleString()} kcal) stays fixed.` : ' Set your BMR for a more precise breakdown.'}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Avg Total Burned (adj.)"
          value={formatKcal(avgTotalBurned ? Math.round(avgTotalBurned) : null)}
          icon="🔥"
          color="text-red-400"
          sub="−20% movement correction"
        />
        <MetricCard
          label="Avg Exercise (adj.)"
          value={formatKcal(avgAdjMovement ? Math.round(avgAdjMovement) : null)}
          icon="🚴"
          color="text-emerald-400"
          sub="exercise kcal × 0.8"
        />
      </div>

      <BarChartCard
        title="Total Burned: Adjusted vs Raw"
        data={dailyBurned}
        series={[
          { key: 'adj_total', label: 'Adjusted total', color: CHART_COLORS.deficit },
          { key: 'raw_total', label: 'Raw (Apple Watch)', color: CHART_COLORS.total },
        ]}
      />

      <BarChartCard
        title="Exercise Calories: Adjusted vs Raw"
        data={dailyBurned}
        series={[
          { key: 'adj_movement', label: 'Adjusted exercise', color: CHART_COLORS.movement },
          { key: 'raw_movement', label: 'Raw exercise', color: CHART_COLORS.total },
        ]}
      />

      <LineChartCard
        title="Adjusted Movement Trend (weekly avg)"
        data={weekMovementTrend}
        series={[{ key: 'adj_movement', label: 'Avg adjusted movement kcal', color: CHART_COLORS.movement }]}
      />
    </div>
  )
}
