import { useFoodData } from '../hooks/useFoodData'
import { useWeeklyStats } from '../hooks/useWeeklyStats'
import { useData } from '../context/DataContext'
import { Link } from 'react-router-dom'
import MetricCard from '../components/ui/MetricCard'
import AreaChartCard from '../components/charts/AreaChartCard'
import LineChartCard from '../components/charts/LineChartCard'
import PieChartCard from '../components/charts/PieChartCard'
import BarChartCard from '../components/charts/BarChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatKcal, formatDeficit, deficitColor } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'

export default function Dashboard() {
  const { avgIntake, avgAdjDeficit, exerciseDays, totalCarbs, totalProtein, totalFats, rows, isLoading, allData } = useFoodData()
  const { calculatedBMR } = useData()
  const weeklyStats = useWeeklyStats()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const intakeTrend = weeklyStats.map((w) => ({ date: w.week, avgIntake: w.avgIntake ? Math.round(w.avgIntake) : null }))
  const deficitTrend = weeklyStats.map((w) => {
    const weekRows = allData.filter((r) => r.week_label === w.week)
    const adjAvg = weekRows.length
      ? Math.round(weekRows.reduce((s, r) => s + (r.adj_deficit ?? 0), 0) / weekRows.length)
      : null
    return { date: w.week, avgAdjDeficit: adjAvg }
  })
  const exerciseTrend = weeklyStats.map((w) => ({ date: w.week, exerciseDays: w.exerciseDays }))

  const macroPie = [
    { name: 'Carbs', value: totalCarbs, color: CHART_COLORS.carbs },
    { name: 'Protein', value: totalProtein, color: CHART_COLORS.protein },
    { name: 'Fats', value: totalFats, color: CHART_COLORS.fats },
  ].filter((m) => m.value > 0)

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Avg Daily Intake"
          value={formatKcal(avgIntake ? Math.round(avgIntake) : null)}
          icon="🍽️"
          color="text-sky-400"
        />
        <MetricCard
          label="Avg Daily Deficit"
          value={formatDeficit(avgAdjDeficit ? Math.round(avgAdjDeficit) : null)}
          icon="📉"
          color={deficitColor(avgAdjDeficit)}
          sub={avgAdjDeficit != null && avgAdjDeficit > 0 ? 'On track ✓' : 'Surplus'}
        />
        <MetricCard
          label="Exercise Days"
          value={exerciseDays}
          icon="🏃"
          color="text-emerald-400"
          sub="this week"
        />
        <MetricCard
          label="True BMR"
          value={calculatedBMR ? formatKcal(calculatedBMR) : '—'}
          icon="🧬"
          color="text-violet-400"
          sub={calculatedBMR ? 'Mifflin–St Jeor' : <Link to="/bmr" className="text-emerald-400 underline">Set up →</Link>}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AreaChartCard
          title="Weekly Avg Intake Trend"
          data={intakeTrend}
          series={[{ key: 'avgIntake', label: 'Avg Intake (kcal)', color: CHART_COLORS.intake }]}
        />
        <LineChartCard
          title="Weekly Avg Deficit Trend (adjusted)"
          data={deficitTrend}
          series={[{ key: 'avgAdjDeficit', label: 'Avg Deficit adj. (kcal)', color: CHART_COLORS.deficit }]}
          referenceY={0}
        />
        <PieChartCard
          title="Macro Balance (current week)"
          data={macroPie}
        />
        <BarChartCard
          title="Exercise Days by Week"
          data={exerciseTrend}
          series={[{ key: 'exerciseDays', label: 'Exercise Days', color: CHART_COLORS.movement }]}
        />
      </div>
    </div>
  )
}
