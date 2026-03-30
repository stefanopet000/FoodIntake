import { useFoodData } from '../hooks/useFoodData'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard from '../components/charts/BarChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'

export default function Exercise() {
  const { rows, exerciseDays, exerciseBreakdown, isLoading, allData } = useFoodData()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const mostCommon = Object.entries(exerciseBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || '—'

  // Frequency by type
  const freqData = Object.entries(exerciseBreakdown).map(([type, count]) => ({
    date: type,
    count,
  }))

  // Avg kcal by exercise type
  const byType = {}
  rows.forEach((r) => {
    const t = r.exercise_type || 'Unknown'
    if (!byType[t]) byType[t] = []
    byType[t].push(r.total_kcal)
  })
  const kcalByType = Object.entries(byType).map(([type, vals]) => ({
    date: type,
    avgKcal: Math.round(avg(vals) || 0),
  }))

  // Weekly heatmap
  const heatmapRows = rows.map((r) => ({
    day: r.day || formatDateLabel(r.date),
    isExercise: r.exercise_type && r.exercise_type.toLowerCase() !== 'rest',
    type: r.exercise_type,
  }))

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Exercise Days" value={exerciseDays} icon="🏃" color="text-emerald-400" sub="this period" />
        <MetricCard label="Most Common" value={mostCommon} icon="🏆" color="text-amber-400" />
      </div>

      <BarChartCard
        title="Exercise Frequency by Type"
        data={freqData}
        series={[{ key: 'count', label: 'Days', color: CHART_COLORS.movement }]}
      />
      <BarChartCard
        title="Avg Calories Burned by Exercise Type"
        data={kcalByType}
        series={[{ key: 'avgKcal', label: 'Avg kcal', color: CHART_COLORS.intake }]}
      />

      {/* Exercise/Rest Heatmap */}
      <div className="card">
        <h3 className="text-sm font-semibold text-slate-300 mb-4">Activity Overview</h3>
        <div className="flex flex-wrap gap-2">
          {heatmapRows.map((r, i) => (
            <div
              key={i}
              title={`${r.day}: ${r.type || 'Rest'}`}
              className={`flex flex-col items-center justify-center w-16 h-16 rounded-xl text-xs font-medium ${
                r.isExercise
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-slate-700/50 text-slate-500 border border-slate-700'
              }`}
            >
              <span className="text-lg">{r.isExercise ? '🏃' : '😴'}</span>
              <span className="mt-1 text-center leading-tight px-1 truncate w-full text-center">
                {r.day?.slice(0, 3)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
