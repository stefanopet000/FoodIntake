import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import { useData } from '../context/DataContext'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard, { deficitCellColor } from '../components/charts/BarChartCard'
import LineChartCard from '../components/charts/LineChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatDeficit, deficitColor } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function DeficitSurplus() {
  const { rows, avgAdjDeficit, isLoading, allData } = useFoodData()
  const { calculatedBMR } = useData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  // Use adjusted deficit (−20% movement) as the primary figure
  const daysInSurplus = rows.filter((r) => (r.adj_deficit ?? r.raw_deficit ?? 0) < 0).length

  const dailyDeficit = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    adj_deficit: r.adj_deficit,
    raw_deficit: r.raw_deficit,
  }))

  // Cumulative using adjusted deficit
  let cumulative = 0
  const cumulativeData = allData.map((r) => {
    cumulative += r.adj_deficit ?? r.raw_deficit ?? 0
    return { date: formatDateLabel(r.date), cumulative: Math.round(cumulative) }
  })

  const weeklyTotals = weeklyStats.map((w) => {
    const weekRows = allData.filter((r) => r.week_label === w.week)
    const total = weekRows.reduce((s, r) => s + (r.adj_deficit ?? r.raw_deficit ?? 0), 0)
    return { date: w.week, total: Math.round(total) }
  })

  const adjLabel = calculatedBMR ? 'Adjusted (−20% movement, fixed BMR)' : 'Adjusted (total kcal × 0.8)'

  return (
    <div className="space-y-6">
      <WeekSelector />

      {/* Adjustment notice */}
      <div className="card bg-slate-50 flex items-start gap-3 text-sm">
        <span className="text-lg mt-0.5">⚙️</span>
        <div>
          <p className="text-slate-600 font-medium">Apple Watch correction applied</p>
          <p className="text-slate-400 text-xs mt-0.5">
            {calculatedBMR
              ? `Movement calories are reduced by 20%. BMR (${calculatedBMR.toLocaleString()} kcal) stays fixed. Adjusted total = BMR + (exercise + NEAT) × 0.8`
              : 'No BMR set — using flat 20% correction (total kcal × 0.8). Set your BMR on the BMR & Movement page for a more accurate breakdown.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <MetricCard
          label="Avg Adjusted Deficit"
          value={formatDeficit(avgAdjDeficit ? Math.round(avgAdjDeficit) : null)}
          icon="📉"
          color={deficitColor(avgAdjDeficit)}
          sub={adjLabel}
        />
        <MetricCard
          label="Days in Surplus"
          value={daysInSurplus}
          icon="⬆️"
          color={daysInSurplus > 0 ? 'text-red-400' : 'text-emerald-400'}
          sub="(adjusted)"
        />
        <MetricCard
          label="Cumulative Deficit"
          value={formatDeficit(cumulativeData[cumulativeData.length - 1]?.cumulative)}
          icon="📊"
          color="text-slate-700"
          sub="(adjusted, all time)"
        />
      </div>

      {/* Adjusted deficit with threshold color coding */}
      <BarChartCard
        title="Daily Deficit / Surplus (adjusted) — color coded by threshold"
        data={dailyDeficit}
        series={[{ key: 'adj_deficit', label: adjLabel, color: CHART_COLORS.deficit }]}
        getCellColor={deficitCellColor}
        referenceY={0}
      />

      {/* Color legend */}
      <div className="card flex flex-wrap gap-3 text-xs">
        {[
          { color: '#ef4444', label: 'Surplus > 200 kcal' },
          { color: '#f59e0b', label: 'Surplus 1–200 kcal' },
          { color: '#86efac', label: 'Deficit 0–100 kcal' },
          { color: '#16a34a', label: 'Deficit 100–500 kcal ✓' },
          { color: '#86efac', label: 'Deficit 500–750 kcal' },
          { color: '#f59e0b', label: 'Deficit 750–1000 kcal' },
          { color: '#ef4444', label: 'Deficit > 1000 kcal' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: item.color }} />
            <span className="text-slate-500">{item.label}</span>
          </div>
        ))}
      </div>

      {/* Raw vs adjusted comparison */}
      <BarChartCard
        title="Adjusted vs Raw deficit (impact of −20% correction)"
        data={dailyDeficit}
        series={[
          { key: 'adj_deficit', label: adjLabel, color: CHART_COLORS.deficit },
          { key: 'raw_deficit', label: 'Raw (total kcal − intake)', color: '#cbd5e1' },
        ]}
        referenceY={0}
      />

      <LineChartCard
        title="Cumulative Deficit Over Time (adjusted)"
        data={cumulativeData}
        series={[{ key: 'cumulative', label: 'Cumulative adjusted (kcal)', color: CHART_COLORS.deficit }]}
        referenceY={0}
      />

      <BarChartCard
        title="Weekly Total Deficit (adjusted)"
        data={weeklyTotals}
        series={[{ key: 'total', label: 'Weekly total (kcal)', color: CHART_COLORS.bmr }]}
        colorByValue
        referenceY={0}
      />
    </div>
  )
}
