import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard from '../components/charts/BarChartCard'
import LineChartCard from '../components/charts/LineChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDeficit, deficitColor } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function DeficitSurplus() {
  const { rows, avgDeficit, isLoading, allData } = useFoodData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const daysInSurplus = rows.filter((r) => (r.deficit ?? 0) > 0).length

  const dailyDeficit = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    deficit: r.deficit,
  }))

  // Cumulative deficit
  let cumulative = 0
  const cumulativeData = allData.map((r) => {
    cumulative += r.deficit ?? 0
    return { date: formatDateLabel(r.date), cumulative }
  })

  const weeklyTotals = weeklyStats.map((w) => {
    const weekRows = allData.filter((r) => r.week_label === w.week)
    const total = weekRows.reduce((s, r) => s + (r.deficit ?? 0), 0)
    return { date: w.week, total }
  })

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Avg Daily Deficit"
          value={formatDeficit(avgDeficit ? Math.round(avgDeficit) : null)}
          icon="📉"
          color={deficitColor(avgDeficit)}
        />
        <MetricCard
          label="Days in Surplus"
          value={daysInSurplus}
          icon="⬆️"
          color={daysInSurplus > 0 ? 'text-red-400' : 'text-emerald-400'}
        />
        <MetricCard
          label="Cumulative Deficit"
          value={formatDeficit(cumulativeData[cumulativeData.length - 1]?.cumulative)}
          icon="📊"
          color="text-slate-200"
        />
      </div>
      <BarChartCard
        title="Daily Deficit / Surplus"
        data={dailyDeficit}
        series={[{ key: 'deficit', label: 'Deficit (kcal)', color: CHART_COLORS.deficit }]}
        colorByValue
        referenceY={0}
      />
      <LineChartCard
        title="Cumulative Deficit Over Time"
        data={cumulativeData}
        series={[{ key: 'cumulative', label: 'Cumulative (kcal)', color: CHART_COLORS.deficit }]}
        referenceY={0}
      />
      <BarChartCard
        title="Weekly Total Deficit"
        data={weeklyTotals}
        series={[{ key: 'total', label: 'Total Deficit (kcal)', color: CHART_COLORS.bmr }]}
        colorByValue
        referenceY={0}
      />
    </div>
  )
}
