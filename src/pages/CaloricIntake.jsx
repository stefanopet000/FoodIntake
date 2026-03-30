import { useFoodData } from '../hooks/useFoodData'
import WeekSelector from '../components/ui/WeekSelector'
import MetricCard from '../components/ui/MetricCard'
import BarChartCard from '../components/charts/BarChartCard'
import LineChartCard from '../components/charts/LineChartCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { formatKcal } from '../utils/formatters'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'
import { sum } from '../utils/statisticsHelpers'

export default function CaloricIntake() {
  const { rows, avgIntake, isLoading, allData } = useFoodData()

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  const dailyIntake = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    intake: r.total_caloric_intake,
  }))

  const intakeVsBurned = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    intake: r.total_caloric_intake,
    burned: r.total_kcal,
  }))

  const weeklyTotal = sum(rows.map((r) => r.total_caloric_intake))

  return (
    <div className="space-y-6">
      <WeekSelector />
      <div className="grid grid-cols-2 gap-4">
        <MetricCard label="Avg Daily Intake" value={formatKcal(avgIntake ? Math.round(avgIntake) : null)} icon="🍽️" color="text-sky-400" />
        <MetricCard label="Weekly Total" value={formatKcal(weeklyTotal)} icon="📊" color="text-slate-200" />
      </div>
      <BarChartCard
        title="Daily Caloric Intake"
        data={dailyIntake}
        series={[{ key: 'intake', label: 'Intake (kcal)', color: CHART_COLORS.intake }]}
      />
      <LineChartCard
        title="Intake vs Total Calories Burned"
        data={intakeVsBurned}
        series={[
          { key: 'intake', label: 'Intake', color: CHART_COLORS.intake },
          { key: 'burned', label: 'Burned', color: CHART_COLORS.surplus },
        ]}
      />
    </div>
  )
}
