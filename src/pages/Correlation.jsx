import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { useCorrelation } from '../hooks/useCorrelation'
import { fetchDateRange } from '../services/dataService'
import DualAxisChartCard from '../components/charts/DualAxisChartCard'
import DateRangeSelector from '../components/ui/DateRangeSelector'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import EmptyState from '../components/ui/EmptyState'
import { interpretCorrelation } from '../utils/statisticsHelpers'
import { getRangeStart, sortByDate } from '../utils/dateHelpers'
import { METRIC_OPTIONS } from '../constants'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'

export default function Correlation() {
  const { allData, isLoading } = useData()
  const navigate = useNavigate()

  const [metricA, setMetricA] = useState('total_caloric_intake')
  const [metricB, setMetricB] = useState('adj_deficit')
  const [range, setRange] = useState('1m')
  const [customStart, setCustomStart] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [customEnd, setCustomEnd] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showTrend, setShowTrend] = useState(false)

  const filteredData = useMemo(() => {
    let start, end
    if (range === 'custom') {
      start = customStart
      end = customEnd
    } else {
      start = getRangeStart(range)
      end = format(new Date(), 'yyyy-MM-dd')
    }
    return sortByDate(
      start ? allData.filter((r) => r.date >= start && r.date <= end) : allData
    )
  }, [allData, range, customStart, customEnd])

  const { chartData, pearsonR } = useCorrelation(filteredData, metricA, metricB)
  const interpretation = interpretCorrelation(pearsonR)

  const labelA = METRIC_OPTIONS.find((m) => m.value === metricA)?.label || metricA
  const labelB = METRIC_OPTIONS.find((m) => m.value === metricB)?.label || metricB

  if (isLoading) return <LoadingSpinner />
  if (allData.length === 0) return <EmptyState />

  function handleAIInsight() {
    navigate('/ai-analysis', {
      state: {
        context: 'correlation',
        metricA: labelA,
        metricB: labelB,
        pearsonR,
        interpretation: interpretation.description,
        data: filteredData,
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-slate-600">Correlation Explorer</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Metric A (left axis)</label>
            <select className="input w-full text-sm" value={metricA} onChange={(e) => setMetricA(e.target.value)}>
              {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Metric B (right axis)</label>
            <select className="input w-full text-sm" value={metricB} onChange={(e) => setMetricB(e.target.value)}>
              {METRIC_OPTIONS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>
        <DateRangeSelector
          value={range}
          onChange={setRange}
          customStart={customStart}
          customEnd={customEnd}
          onCustomChange={(field, val) => field === 'start' ? setCustomStart(val) : setCustomEnd(val)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showTrend}
            onChange={(e) => setShowTrend(e.target.checked)}
            className="accent-emerald-500"
          />
          Show trend lines
        </label>
      </div>

      {/* Chart */}
      {chartData.length > 0 ? (
        <DualAxisChartCard
          title={`${labelA} vs ${labelB}`}
          data={chartData}
          metricA={metricA}
          metricB={metricB}
          labelA={labelA}
          labelB={labelB}
          showTrend={showTrend}
        />
      ) : (
        <div className="card text-center text-slate-400 py-10">
          No overlapping data for both metrics in this date range
        </div>
      )}

      {/* Correlation Result */}
      {pearsonR !== null && (
        <div className="card space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-600">Correlation Analysis</h3>
            <span className={`text-sm font-bold ${interpretation.color}`}>
              {interpretation.label}
            </span>
          </div>
          <div className="text-3xl font-bold text-slate-800">
            r = {pearsonR.toFixed(3)}
          </div>
          <p className="text-sm text-slate-400">{interpretation.description}</p>
          <p className="text-xs text-slate-500">
            Based on {chartData.length} data points · Pearson correlation coefficient
          </p>
          <button onClick={handleAIInsight} className="btn-primary text-sm mt-2">
            🤖 Ask AI to interpret this
          </button>
        </div>
      )}
    </div>
  )
}
