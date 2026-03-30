import { useFoodData } from '../hooks/useFoodData'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import LineChartCard from '../components/charts/LineChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatKcal } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function BMR() {
  const { rows, avgBMR, isLoading, allData } = useFoodData()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const avgRealistic = avg(rows.map((r) => r.realistic_rounding))

  const chartData = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    bmr: r.assumption_bmr,
    realistic: r.realistic_rounding,
  }))

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Avg Assumption BMR" value={formatKcal(avgBMR ? Math.round(avgBMR) : null)} icon="🧬" color="text-violet-400" />
        <MetricCard label="Avg Realistic Rounding" value={formatKcal(avgRealistic ? Math.round(avgRealistic) : null)} icon="🎯" color="text-purple-400" />
      </div>
      <LineChartCard
        title="BMR vs Realistic Rounding"
        data={chartData}
        series={[
          { key: 'bmr', label: 'Assumption BMR', color: CHART_COLORS.bmr },
          { key: 'realistic', label: 'Realistic Rounding', color: CHART_COLORS.realistic },
        ]}
      />
      <div className="card text-sm text-slate-400 leading-relaxed">
        <p className="font-medium text-slate-300 mb-1">💡 What's the difference?</p>
        <p><strong className="text-slate-200">Assumption BMR</strong> is your estimated basal metabolic rate based on standard formulas (age, weight, height, sex). It represents calories burned at complete rest.</p>
        <p className="mt-2"><strong className="text-slate-200">Realistic Rounding</strong> is a practical adjusted figure that accounts for rounding and real-world variability, giving a more actionable daily target.</p>
      </div>
    </div>
  )
}
