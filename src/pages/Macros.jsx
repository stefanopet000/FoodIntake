import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import PieChartCard from '../components/charts/PieChartCard'
import AreaChartCard from '../components/charts/AreaChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatGrams } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'

export default function Macros() {
  const { rows, isLoading, allData, totalCarbs, totalProtein, totalFats } = useFoodData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const avgCarbs = avg(rows.map((r) => r.carbs_g))
  const avgProtein = avg(rows.map((r) => r.proteins_g))
  const avgFats = avg(rows.map((r) => r.fats_g))

  const macroPie = [
    { name: 'Carbs', value: totalCarbs, color: CHART_COLORS.carbs },
    { name: 'Protein', value: totalProtein, color: CHART_COLORS.protein },
    { name: 'Fats', value: totalFats, color: CHART_COLORS.fats },
  ].filter((m) => m.value > 0)

  const macroTrend = weeklyStats.map((w) => ({
    date: w.week,
    carbs: w.avgCarbs ? Math.round(w.avgCarbs) : null,
    protein: w.avgProtein ? Math.round(w.avgProtein) : null,
    fats: w.avgFats ? Math.round(w.avgFats) : null,
  }))

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-3 gap-4">
        <MetricCard label="Avg Carbs" value={formatGrams(avgCarbs ? avgCarbs.toFixed(1) : null)} icon="🌾" color="text-amber-400" />
        <MetricCard label="Avg Protein" value={formatGrams(avgProtein ? avgProtein.toFixed(1) : null)} icon="🥩" color="text-blue-400" />
        <MetricCard label="Avg Fats" value={formatGrams(avgFats ? avgFats.toFixed(1) : null)} icon="🫒" color="text-rose-400" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PieChartCard title="Macro Split (current week)" data={macroPie} />
        <AreaChartCard
          title="Macro Trends (weekly avg)"
          data={macroTrend}
          series={[
            { key: 'carbs', label: 'Carbs (g)', color: CHART_COLORS.carbs },
            { key: 'protein', label: 'Protein (g)', color: CHART_COLORS.protein },
            { key: 'fats', label: 'Fats (g)', color: CHART_COLORS.fats },
          ]}
        />
      </div>
    </div>
  )
}
