import { useBMR } from '../hooks/useBMR'
import { useData } from '../context/DataContext'
import MetricCard from '../components/ui/MetricCard'
import LineChartCard from '../components/charts/LineChartCard'
import BarChartCard from '../components/charts/BarChartCard'
import WeekSelector from '../components/ui/WeekSelector'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { formatKcal } from '../utils/formatters'
import { avg } from '../utils/statisticsHelpers'
import { CHART_COLORS } from '../constants'
import { formatDateLabel } from '../utils/dateHelpers'
import { sortByDate } from '../utils/dateHelpers'

export default function BMR() {
  const { profile, updateProfile, calculatedBMR, isComplete } = useBMR()
  const { filteredData, allData, isLoading } = useData()

  const rows = sortByDate(filteredData)

  // Basic Movement (NEAT) = total_kcal - kcal_movement - calculatedBMR
  const neatRows = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    bmr: calculatedBMR,
    // Use adjusted values (−20%) for movement display
    neat: r.adj_neat ?? (r.basic_movement != null ? Math.round(r.basic_movement * 0.8) : null),
    exercise: r.adj_movement ?? (r.kcal_movement != null ? Math.round(r.kcal_movement * 0.8) : null),
    total: r.adj_total_burned ?? r.total_kcal,
  }))

  const avgNEAT = avg(neatRows.map((r) => r.neat))
  const avgExercise = avg(neatRows.map((r) => r.exercise))

  // Assumption BMR from CSV vs calculated — for comparison chart
  const comparisonData = rows.map((r) => ({
    date: r.day || formatDateLabel(r.date),
    csv_base: r.assumption_bmr,   // old variable "BMR" from CSV
    true_bmr: calculatedBMR,
    neat: neatRows.find((n) => n.date === (r.day || formatDateLabel(r.date)))?.neat,
  }))

  return (
    <div className="space-y-6">
      {/* BMR Calculator Card */}
      <div className="card space-y-5">
        <div>
          <h2 className="text-base font-semibold text-slate-800">Mifflin–St Jeor BMR Calculator</h2>
          <p className="text-sm text-slate-400 mt-0.5">
            Your true Basal Metabolic Rate — calories burned at complete rest. Enter once, used across all calculations.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {/* Sex */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Biological sex</label>
            <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
              {['male', 'female'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateProfile('sex', s)}
                  className={`flex-1 py-1.5 rounded-md text-sm font-medium capitalize transition-colors ${
                    profile.sex === s
                      ? 'bg-emerald-600 text-white'
                      : 'text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Age */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Age (years)</label>
            <input
              type="number"
              min="10"
              max="100"
              placeholder="e.g. 30"
              className="input w-full"
              value={profile.age}
              onChange={(e) => updateProfile('age', e.target.value)}
            />
          </div>

          {/* Weight */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Weight (kg)</label>
            <input
              type="number"
              min="30"
              max="300"
              step="0.1"
              placeholder="e.g. 80"
              className="input w-full"
              value={profile.weight}
              onChange={(e) => updateProfile('weight', e.target.value)}
            />
          </div>

          {/* Height */}
          <div>
            <label className="text-xs text-slate-400 mb-1.5 block">Height (cm)</label>
            <input
              type="number"
              min="100"
              max="250"
              placeholder="e.g. 178"
              className="input w-full"
              value={profile.height}
              onChange={(e) => updateProfile('height', e.target.value)}
            />
          </div>
        </div>

        {/* Formula display */}
        <div className="bg-slate-100 rounded-xl p-4 text-sm font-mono text-slate-400 space-y-1">
          <p className="text-xs text-slate-500 mb-2 font-sans">Mifflin–St Jeor formula:</p>
          <p>BMR = (10 × weight) + (6.25 × height) − (5 × age) {profile.sex === 'female' ? '− 161' : '+ 5'}</p>
          {isComplete && (
            <p className="text-emerald-400 font-semibold mt-2 font-sans text-base">
              = {formatKcal(calculatedBMR)}
            </p>
          )}
          {!isComplete && (
            <p className="text-slate-500 mt-2 font-sans">Fill in all fields to calculate ↑</p>
          )}
        </div>

        {isComplete && (
          <div className="text-xs text-slate-500">
            ✓ Saved automatically — used across all pages. Update anytime as your weight changes.
          </div>
        )}
      </div>

      {/* Only show breakdown if we have data + BMR */}
      {isComplete && allData.length > 0 && (
        <>
          <WeekSelector />

          {isLoading ? <LoadingSpinner /> : (
            <>
              {/* Metric Cards */}
              <div className="grid grid-cols-3 gap-4">
                <MetricCard
                  label="True BMR"
                  value={formatKcal(calculatedBMR)}
                  icon="🧬"
                  color="text-violet-400"
                  sub="Mifflin–St Jeor"
                />
                <MetricCard
                  label="Avg Basic Movement"
                  value={formatKcal(avgNEAT ? Math.round(avgNEAT) : null)}
                  icon="🚶"
                  color="text-teal-400"
                  sub="NEAT (non-exercise)"
                />
                <MetricCard
                  label="Avg Exercise Burn"
                  value={formatKcal(avgExercise ? Math.round(avgExercise) : null)}
                  icon="🏃"
                  color="text-emerald-400"
                  sub="tracked activity"
                />
              </div>

              {/* Calorie Breakdown stacked bar */}
              <BarChartCard
                title="Daily Calorie Breakdown: BMR + Basic Movement + Exercise"
                data={neatRows}
                stacked
                series={[
                  { key: 'bmr', label: 'True BMR', color: CHART_COLORS.bmr },
                  { key: 'neat', label: 'Basic Movement (NEAT)', color: CHART_COLORS.weight },
                  { key: 'exercise', label: 'Exercise', color: CHART_COLORS.movement },
                ]}
              />

              {/* Comparison: CSV base burn vs true BMR */}
              <LineChartCard
                title="CSV Base Burn vs True BMR — the gap is your Basic Movement (NEAT)"
                data={comparisonData}
                series={[
                  { key: 'csv_base', label: 'CSV Base Burn (total − exercise)', color: CHART_COLORS.realistic },
                  { key: 'true_bmr', label: 'True BMR (constant)', color: CHART_COLORS.bmr },
                  { key: 'neat', label: 'Basic Movement / NEAT', color: CHART_COLORS.weight },
                ]}
              />
            </>
          )}
        </>
      )}

      {isComplete && allData.length === 0 && (
        <div className="card text-center text-slate-400 py-10">
          Upload your CSV data to see the BMR breakdown.
        </div>
      )}
    </div>
  )
}
